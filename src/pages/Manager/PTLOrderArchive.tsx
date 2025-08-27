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

interface PTLOrder {
  id: string;
  ptl_order_number: string;
  board_type: string;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OrderCounts {
  [orderId: string]: {
    total: number;
    passed: number;
    failed: number;
  };
}

const PTLOrderArchive: React.FC = () => {
  const [orders, setOrders] = useState<PTLOrder[]>([]);
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PTLOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCompletedPTLOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ptl_orders')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching completed PTL orders:', error);
      setError('Failed to load completed PTL orders');
      toast({
        title: "Error",
        description: "Failed to load completed PTL orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('ptl_order_progress')
        .select('id, scanned_count, passed_count, failed_count');

      if (error) throw error;

      const counts: OrderCounts = {};
      data?.forEach(progress => {
        counts[progress.id] = {
          total: progress.scanned_count || 0,
          passed: progress.passed_count || 0,
          failed: progress.failed_count || 0
        };
      });

      setOrderCounts(counts);
    } catch (error) {
      console.error('Error fetching order counts:', error);
    }
  };

  useEffect(() => {
    fetchCompletedPTLOrders();
    fetchOrderCounts();
  }, []);

  const filteredOrders = orders.filter(order =>
    order.ptl_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.board_type.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleViewDetails = (order: PTLOrder) => {
    navigate(`/app/ptl-orders/${order.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="h-8 w-8" />
            PTL Order Archive
          </h1>
          <p className="text-muted-foreground">View completed PTL orders and their results</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Completed Orders</CardTitle>
          <CardDescription>Find completed PTL orders by number or board type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by PTL order number or board type..."
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
            <div className="text-center">Loading completed PTL orders...</div>
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
            <CardTitle>Completed PTL Orders ({filteredOrders.length})</CardTitle>
            <CardDescription>All PTL orders that have been completed</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PTL Order #</TableHead>
                  <TableHead>Board Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const counts = orderCounts[order.id] || { total: 0, passed: 0, failed: 0 };
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.ptl_order_number}</TableCell>
                      <TableCell>{order.board_type}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓ {counts.passed} passed</span>
                          {counts.failed > 0 && (
                            <span className="text-red-600">✗ {counts.failed} failed</span>
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
                {searchTerm ? 'No completed orders match your search.' : 'No completed PTL orders found.'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PTL Order Details</DialogTitle>
            <DialogDescription>Detailed information about this completed PTL order</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">PTL Order Number</h4>
                  <p>{selectedOrder.ptl_order_number}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Board Type</h4>
                  <p>{selectedOrder.board_type}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Quantity</h4>
                  <p>{selectedOrder.quantity}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{orderCounts[selectedOrder.id]?.passed || 0}</p>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{orderCounts[selectedOrder.id]?.failed || 0}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{orderCounts[selectedOrder.id]?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Tested</p>
                </div>
              </div>
              
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

export default PTLOrderArchive;