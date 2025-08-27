import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Calendar, CheckCircle, XCircle, Search, Eye, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface HardwareOrder {
  id: string;
  po_number: string;
  assembly_number: string;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
  starting_sequence: string;
  ending_sequence: string;
  notes: string;
}

interface OrderStats {
  [orderId: string]: {
    totalPTLs: number;
    completedPTLs: number;
    totalPassed: number;
    totalFailed: number;
  };
}

const HardwareOrderArchive: React.FC = () => {
  const [orders, setOrders] = useState<HardwareOrder[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<HardwareOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCompletedHardwareOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hardware_orders')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching completed hardware orders:', error);
      setError('Failed to load completed hardware orders');
      toast({
        title: "Error",
        description: "Failed to load completed hardware orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      // Get PTL orders for each hardware order
      const { data: ptlData, error: ptlError } = await supabase
        .from('ptl_orders')
        .select('id, hardware_order_id, status');

      if (ptlError) throw ptlError;

      // Get board counts for each PTL order
      const { data: progressData, error: progressError } = await supabase
        .from('ptl_order_progress')
        .select('id, passed_count, failed_count');

      if (progressError) throw progressError;

      const stats: OrderStats = {};

      // Group PTL orders by hardware order
      const ptlByHardware: { [hardwareId: string]: any[] } = {};
      ptlData?.forEach(ptl => {
        if (ptl.hardware_order_id) {
          if (!ptlByHardware[ptl.hardware_order_id]) {
            ptlByHardware[ptl.hardware_order_id] = [];
          }
          ptlByHardware[ptl.hardware_order_id].push(ptl);
        }
      });

      // Calculate stats for each hardware order
      Object.entries(ptlByHardware).forEach(([hardwareId, ptls]) => {
        const totalPTLs = ptls.length;
        const completedPTLs = ptls.filter(ptl => ptl.status === 'completed').length;
        
        let totalPassed = 0;
        let totalFailed = 0;

        ptls.forEach(ptl => {
          const progress = progressData?.find(p => p.id === ptl.id);
          if (progress) {
            totalPassed += progress.passed_count || 0;
            totalFailed += progress.failed_count || 0;
          }
        });

        stats[hardwareId] = {
          totalPTLs,
          completedPTLs,
          totalPassed,
          totalFailed
        };
      });

      setOrderStats(stats);
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  useEffect(() => {
    fetchCompletedHardwareOrders();
    fetchOrderStats();
  }, []);

  const filteredOrders = orders.filter(order =>
    order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.assembly_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (order: HardwareOrder) => {
    navigate(`/app/hardware-orders/${order.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="h-8 w-8" />
            Hardware Order Archive
          </h1>
          <p className="text-muted-foreground">View completed hardware orders and their results</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Completed Orders</CardTitle>
          <CardDescription>Find completed hardware orders by PO number or assembly number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by PO number or assembly number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading completed hardware orders...</div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">{error}</div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Completed Hardware Orders ({filteredOrders.length})</CardTitle>
            <CardDescription>All hardware orders that have been completed</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>PTL Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const stats = orderStats[order.id] || { totalPTLs: 0, completedPTLs: 0, totalPassed: 0, totalFailed: 0 };
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.po_number}</TableCell>
                      <TableCell>{order.assembly_number}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={stats.completedPTLs === stats.totalPTLs ? "default" : "secondary"}>
                          {stats.completedPTLs}/{stats.totalPTLs} PTLs
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓ {stats.totalPassed}</span>
                          {stats.totalFailed > 0 && (
                            <span className="text-red-600">✗ {stats.totalFailed}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatDate(order.updated_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No completed orders match your search.' : 'No completed hardware orders found.'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hardware Order Details</DialogTitle>
            <DialogDescription>Detailed information about this completed hardware order</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">PO Number</h4>
                  <p>{selectedOrder.po_number}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Assembly Number</h4>
                  <p>{selectedOrder.assembly_number}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Quantity</h4>
                  <p>{selectedOrder.quantity}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Starting Sequence</h4>
                  <p>{selectedOrder.starting_sequence}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Ending Sequence</h4>
                  <p>{selectedOrder.ending_sequence || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold">{orderStats[selectedOrder.id]?.totalPTLs || 0}</p>
                  <p className="text-sm text-muted-foreground">Total PTLs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{orderStats[selectedOrder.id]?.completedPTLs || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed PTLs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{orderStats[selectedOrder.id]?.totalPassed || 0}</p>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{orderStats[selectedOrder.id]?.totalFailed || 0}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Created</h4>
                  <p>{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Completed</h4>
                  <p>{formatDate(selectedOrder.updated_at)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleViewDetails(selectedOrder)} className="flex-1">
                  View Full Details
                </Button>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HardwareOrderArchive;