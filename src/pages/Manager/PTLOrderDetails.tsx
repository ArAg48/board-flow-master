import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PTLOrderDetail {
  id: string;
  ptl_order_number: string;
  board_type: string;
  quantity: number;
  status: string;
  created_at: string;
  verifier_initials?: string;
  verified_at?: string;
  verified_by?: string;
}

interface BoardData {
  id: string;
  qr_code: string;
  test_status: string;
  test_date: string;
  test_results: any;
  technician_id: string;
  profiles?: {
    full_name: string;
  };
}

const PTLOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ptlOrder, setPtlOrder] = useState<PTLOrderDetail | null>(null);
  const [boardData, setBoardData] = useState<BoardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, repaired: 0, pending: 0, totalTime: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadPTLOrderDetails();
      loadBoardData();
    }
  }, [id]);

  const loadPTLOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('ptl_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPtlOrder(data);
    } catch (error) {
      console.error('Error loading PTL order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load PTL order details',
        variant: 'destructive'
      });
    }
  };

  const loadBoardData = async () => {
    try {
      // Try to get board data directly first, as it should work for managers and we know data exists
      const { data: boardDataResult, error: boardError } = await supabase
        .from('board_data')
        .select(`
          id,
          qr_code,
          test_status,
          test_date,
          test_results,
          technician_id,
          profiles(full_name)
        `)
        .eq('ptl_order_id', id)
        .order('created_at', { ascending: false });

      // Log for debugging
      console.log('Board data query result:', { boardDataResult, boardError, ptlOrderId: id });

      if (boardError) {
        console.error('Error loading board data:', boardError);
        throw boardError;
      }
      
      // Check for repaired boards
      const { data: repairData } = await supabase
        .from('repair_entries')
        .select('qr_code, repair_status')
        .eq('ptl_order_id', id);
      
      const repairedBoards = new Set(
        (repairData || [])
          .filter(repair => repair.repair_status === 'completed')
          .map(repair => repair.qr_code)
      );
      
      // Transform the data to match BoardData interface
      const transformedData: BoardData[] = (boardDataResult || []).map((item: any) => ({
        id: item.id,
        qr_code: item.qr_code,
        test_status: repairedBoards.has(item.qr_code) ? 'repaired' : (item.test_status || 'pending'),
        test_date: item.test_date || '',
        test_results: item.test_results,
        technician_id: item.technician_id || '',
        profiles: item.profiles || undefined
      }));
      
      setBoardData(transformedData);

      // Calculate stats - use transformedData instead of raw data
      const total = transformedData?.length || 0;
      const passed = transformedData?.filter(b => b.test_status === 'pass').length || 0;
      const failed = transformedData?.filter(b => b.test_status === 'fail').length || 0;
      const repaired = transformedData?.filter(b => b.test_status === 'repaired').length || 0;
      const pending = transformedData?.filter(b => b.test_status === 'pending').length || 0;

      // Get timing data from ptl_order_progress to match the list view
      const { data: progressData, error: progressError } = await supabase
        .from('ptl_order_progress')
        .select('total_time_minutes, active_time_minutes')
        .eq('id', id)
        .single();

      if (progressError) {
        console.log('No progress data found for PTL order:', id);
      }

      const totalTime = progressData?.total_time_minutes || progressData?.active_time_minutes || 0;

      setStats({ total, passed, failed, repaired, pending, totalTime });
    } catch (error) {
      console.error('Error loading board data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load board data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'repaired':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800">Passed</Badge>;
      case 'fail':
        return <Badge variant="destructive">Failed</Badge>;
      case 'repaired':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Repaired</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ['QR Code', 'Status', 'Test Date', 'Technician', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...boardData.map(board => [
        board.qr_code,
        board.test_status,
        board.test_date ? new Date(board.test_date).toLocaleDateString() : 'N/A',
        board.profiles?.full_name || 'N/A',
        board.test_results ? JSON.stringify(board.test_results).replace(/,/g, ';') : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ptl-order-${ptlOrder?.ptl_order_number}-boards.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading PTL order details...</div>
      </div>
    );
  }

  if (!ptlOrder) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">PTL order not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">PTL Order {ptlOrder.ptl_order_number}</h1>
            <p className="text-muted-foreground">Individual board scan results</p>
          </div>
        </div>
        <Button onClick={exportToCSV} disabled={boardData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Scanned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.repaired}</div>
            <div className="text-sm text-muted-foreground">Repaired</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalTime > 0 ? `${Math.round(stats.totalTime)}` : '0'}
            </div>
            <div className="text-sm text-muted-foreground">Minutes</div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Card */}
      {ptlOrder.status === 'completed' && ptlOrder.verifier_initials && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
                <div className="text-sm text-muted-foreground mt-2">
                  Verified by: <span className="font-medium">{ptlOrder.verifier_initials}</span>
                </div>
                {ptlOrder.verified_at && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(ptlOrder.verified_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Board Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scanned Boards</CardTitle>
          <CardDescription>
            Individual test results for each board in this PTL order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {boardData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No boards have been scanned for this PTL order yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boardData.map((board) => (
                  <TableRow key={board.id}>
                    <TableCell className="font-mono">{board.qr_code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(board.test_status)}
                        {getStatusBadge(board.test_status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {board.test_date ? new Date(board.test_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{board.profiles?.full_name || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {board.test_results ? 
                        (typeof board.test_results === 'object' ? 
                          JSON.stringify(board.test_results) : 
                          String(board.test_results)
                        ) : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PTLOrderDetails;