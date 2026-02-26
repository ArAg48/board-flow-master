import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, CheckCircle, XCircle, Clock, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PTLOrderDetail {
  id: string;
  ptl_order_number: string;
  board_type: string;
  quantity: number;
  status: string;
  created_at: string;
  verifier_initials?: string;
  product_count_verified?: string;
  axxess_updater?: string;
  verified_at?: string;
  verified_by?: string;
  date_code?: string;
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
    cw_stamp?: string;
  };
}

const PTLOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ptlOrder, setPtlOrder] = useState<PTLOrderDetail | null>(null);
  const [boardData, setBoardData] = useState<BoardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, repaired: 0, pending: 0, totalTime: 0 });
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationData, setVerificationData] = useState({
    finalCount: '',
    productCountVerified: '',
    axxessUpdater: '',
    verifierInitials: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadPTLOrderDetails();
      loadBoardData();
    }
  }, [id]);

  // Add refresh on window focus to catch updates from other pages
  useEffect(() => {
    const handleFocus = () => {
      if (id) {
        loadPTLOrderDetails();
        loadBoardData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
      // 1) Fetch board_data
      const { data: baseRows, error: baseErr } = await supabase
        .from('board_data')
        .select('*')
        .eq('ptl_order_id', id)
        .order('created_at', { ascending: false });

      console.log('Board base fetch:', { baseRowsLength: baseRows?.length || 0, baseErr, ptlOrderId: id });

      if (baseErr) {
        console.error('Error fetching board data:', baseErr);
        throw baseErr;
      }

      let rows: any[] = baseRows || [];

      // 2) Fetch technician profiles separately
      const technicianIds = [...new Set(rows.map(r => r.technician_id).filter(Boolean))];
      const { data: technicians, error: techErr } = await supabase
        .from('profiles')
        .select('id, full_name, cw_stamp')
        .in('id', technicianIds);
      if (techErr) {
        console.error('Error fetching technicians:', techErr);
      }
      console.log('Technicians fetched:', { count: technicians?.length || 0, technicianIds });

      // Create a map of technician data
      const techMap = new Map((technicians || []).map(t => [t.id, t]));

      // 3) Get all boards that have been through repair (for repair count)
      const { data: repairData } = await supabase
        .from('repair_entries')
        .select('qr_code')
        .eq('ptl_order_id', id);

      const repairedBoardsSet = new Set(
        (repairData || []).map((r: any) => r.qr_code)
      );

      const transformedData: BoardData[] = (rows || []).map((item: any) => {
        const tech = item.technician_id ? techMap.get(item.technician_id) : null;
        return {
          id: item.id,
          qr_code: item.qr_code,
          test_status: item.test_status || 'pending', // Use actual status from board_data
          test_date: item.test_date || '',
          test_results: item.test_results,
          technician_id: item.technician_id || '',
          profiles: tech ? { full_name: tech.full_name, cw_stamp: tech.cw_stamp } : undefined,
        };
      });

      setBoardData(transformedData);

      // 4) Get total time from RPC function or fallback
      let totalTime = 0;

      // First try to get progress data from RPC function
      const { data: rpcRows } = await supabase.rpc('get_ptl_order_progress');
      if (Array.isArray(rpcRows)) {
        const progressRow = rpcRows.find((r: any) => r.id === id);
        if (progressRow) {
          // Use the time from the RPC function which properly aggregates session times
          totalTime = Number(progressRow.active_time_minutes || progressRow.total_time_minutes || 0);
        }
      }
      
      // If no data from RPC, try ptl_order_progress table as fallback
      if (totalTime === 0) {
        const { data: progressData } = await supabase
          .from('ptl_order_progress')
          .select('total_time_minutes, active_time_minutes')
          .eq('id', id)
          .maybeSingle();
        if (progressData) {
          totalTime = Number(progressData.active_time_minutes || progressData.total_time_minutes || 0);
        }
      }

      const total = transformedData.length;
      const passed = transformedData.filter(b => b.test_status === 'pass').length;
      const failed = transformedData.filter(b => b.test_status === 'fail').length;
      const repaired = transformedData.filter(b => repairedBoardsSet.has(b.qr_code)).length; // Count boards that went through repair
      const pending = transformedData.filter(b => b.test_status === 'pending').length;

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

  const handlePostTestVerification = async () => {
    if (!user || !id) return;

    const { finalCount, productCountVerified, axxessUpdater, verifierInitials } = verificationData;

    // Validation
    if (!finalCount || !productCountVerified || !axxessUpdater || !verifierInitials) {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all verification fields',
        variant: 'destructive'
      });
      return;
    }

    if (parseInt(finalCount) !== stats.total) {
      toast({
        title: 'Count Mismatch',
        description: `Final count (${finalCount}) must match scanned count (${stats.total})`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ptl_orders')
        .update({
          product_count_verified: productCountVerified,
          axxess_updater: axxessUpdater,
          verifier_initials: verifierInitials,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Verification Complete',
        description: 'PTL order has been verified and marked as completed'
      });

      setShowVerificationDialog(false);
      loadPTLOrderDetails();
    } catch (error) {
      console.error('Error completing verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete post-test verification',
        variant: 'destructive'
      });
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

  const needsVerification = ptlOrder && 
    !ptlOrder.verifier_initials && 
    !ptlOrder.product_count_verified && 
    !ptlOrder.axxess_updater &&
    stats.total > 0;

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
            <p className="text-muted-foreground">Detailed test results and board scan history</p>
          </div>
        </div>
        <div className="flex gap-2">
          {needsVerification && (
            <Button onClick={() => setShowVerificationDialog(true)} variant="default">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Complete Verification
            </Button>
          )}
          <Button onClick={exportToCSV} disabled={boardData.length === 0} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold font-mono">{ptlOrder.date_code || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Date Code</div>
          </CardContent>
        </Card>
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
              {stats.totalTime > 0 ? `${Math.floor(stats.totalTime / 60)}h ${stats.totalTime % 60}m` : '0m'}
            </div>
            <div className="text-sm text-muted-foreground">Active Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Card */}
      {ptlOrder.status === 'completed' && (ptlOrder.verifier_initials || ptlOrder.product_count_verified || ptlOrder.axxess_updater) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
                
                {ptlOrder.verifier_initials && (
                  <div className="text-sm text-muted-foreground">
                    Verified by: <span className="font-medium">{ptlOrder.verifier_initials}</span>
                  </div>
                )}
                
                {ptlOrder.product_count_verified && (
                  <div className="text-sm text-muted-foreground">
                    Product Count Verified: <span className="font-medium">{ptlOrder.product_count_verified}</span>
                  </div>
                )}
                
                {ptlOrder.axxess_updater && (
                  <div className="text-sm text-muted-foreground">
                    Axxess Updater: <span className="font-medium">{ptlOrder.axxess_updater}</span>
                  </div>
                )}
                
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
          <CardTitle>Board Test Results</CardTitle>
          <CardDescription>
            Complete testing history for all boards in this PTL order
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
                    <TableCell>{board.profiles?.full_name || board.profiles?.cw_stamp || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {board.test_status === 'fail' && board.test_results ? 
                        (typeof board.test_results === 'object' ? 
                          JSON.stringify(board.test_results) : 
                          String(board.test_results)
                        ) : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Post-Test Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Post-Test Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Expected</div>
                <div className="text-2xl font-bold">{ptlOrder?.quantity || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Scanned</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Passed</div>
                <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="final-count">Final Count</Label>
              <Input
                id="final-count"
                type="number"
                placeholder={`Must match scanned count (${stats.total})`}
                value={verificationData.finalCount}
                onChange={(e) => setVerificationData({ ...verificationData, finalCount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-count">Product Count Verified</Label>
              <Input
                id="product-count"
                placeholder="Enter verified count"
                value={verificationData.productCountVerified}
                onChange={(e) => setVerificationData({ ...verificationData, productCountVerified: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="axxess-updater">Axxess Updater</Label>
              <Input
                id="axxess-updater"
                placeholder="Enter updater info"
                value={verificationData.axxessUpdater}
                onChange={(e) => setVerificationData({ ...verificationData, axxessUpdater: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verifier-initials">Verifier Initials</Label>
              <Input
                id="verifier-initials"
                placeholder="Your initials"
                value={verificationData.verifierInitials}
                onChange={(e) => setVerificationData({ ...verificationData, verifierInitials: e.target.value })}
              />
            </div>

            <Button 
              onClick={handlePostTestVerification} 
              className="w-full"
            >
              Complete Verification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PTLOrderDetails;