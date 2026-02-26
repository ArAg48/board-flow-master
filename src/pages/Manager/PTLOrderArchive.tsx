import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clipboard, Eye, Search, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PTLOrder = Database['public']['Tables']['ptl_orders']['Row'];
type HardwareOrder = Database['public']['Tables']['hardware_orders']['Row'];

const PTLOrderArchive: React.FC = () => {
  const navigate = useNavigate();
  const [hardwareOrders, setHardwareOrders] = useState<HardwareOrder[]>([]);
  const [orders, setOrders] = useState<PTLOrder[]>([]);
  const [orderCounts, setOrderCounts] = useState<{[key: string]: {scanned: number, passed: number, failed: number, totalTime: number}}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PTLOrder | null>(null);
  const [viewOrderDetails, setViewOrderDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchHardwareOrders();
    fetchCompletedPTLOrders();
    fetchOrderCounts();
  }, []);

  const fetchHardwareOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('hardware_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHardwareOrders(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch hardware orders.',
        variant: 'destructive',
      });
    }
  };

  const fetchCompletedPTLOrders = async () => {
    try {
      // Fetch all completed orders
      const { data: allCompleted, error } = await supabase
        .from('ptl_orders')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false }); // Sort by completion date

      if (error) throw error;
      
      // Only show orders that have been properly verified (post-test verification complete)
      const verifiedOrders = (allCompleted || []).filter(order =>
        order.verifier_initials && 
        order.product_count_verified && 
        order.axxess_updater
      );
      
      setOrders(verifiedOrders);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch completed PTL orders.',
        variant: 'destructive',
      });
    }
  };

  const fetchOrderCounts = async () => {
    try {
      // Prefer RPC for live derived progress; fallback to ptl_order_progress table
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_ptl_order_progress');
      if (rpcError) console.warn('RPC get_ptl_order_progress error:', rpcError);

      let rows: any[] = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData : [];

      if (rows.length === 0) {
        const { data: progRows, error: progError } = await supabase
          .from('ptl_order_progress')
          .select('id, scanned_count, passed_count, failed_count, total_time_minutes, active_time_minutes');
        if (progError) throw progError;
        rows = progRows || [];
      }

      const counts: {[key: string]: {scanned: number, passed: number, failed: number, totalTime: number}} = {};
      rows.forEach((row: any) => {
        counts[row.id] = {
          scanned: Number(row.scanned_count) || 0,
          passed: Number(row.passed_count) || 0,
          failed: Number(row.failed_count) || 0,
          totalTime: Number(row.active_time_minutes || row.total_time_minutes) || 0,
        };
      });

      setOrderCounts(counts);
    } catch (error) {
      console.error('Error fetching order counts:', error);
    }
  };

  const handleViewDetails = (order: PTLOrder) => {
    setSelectedOrder(order);
    setViewOrderDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter orders based on search term - same as main PTL Orders page
  const filteredOrders = orders.filter(order =>
    order.ptl_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.board_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.sale_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.firmware_revision?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.date_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <CardTitle className="flex items-center gap-2">
            <Clipboard className="h-5 w-5" />
            Completed PTL Orders
          </CardTitle>
          <CardDescription>
            All PTL orders that have been completed and archived
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search orders by PTL number, board type, sale code, firmware..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PTL Order</TableHead>
                <TableHead>Sale Code</TableHead>
                <TableHead>Firmware Rev</TableHead>
                <TableHead>Date Code</TableHead>
                <TableHead>Board Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const hardwareOrder = hardwareOrders.find(h => h.id === order.hardware_order_id);
                const counts = orderCounts[order.id] || { scanned: 0, passed: 0, failed: 0, totalTime: 0 };
                return (
                  <TableRow 
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/app/ptl-orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.ptl_order_number}</TableCell>
                    <TableCell>{order.sale_code || '-'}</TableCell>
                    <TableCell>{order.firmware_revision || '-'}</TableCell>
                    <TableCell>{order.date_code || '-'}</TableCell>
                    <TableCell>{order.board_type}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{counts.scanned}/{order.quantity} scanned</div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-green-600">✓ {counts.passed} passed</span>
                          <span className="text-red-600">✗ {counts.failed} failed</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: '100%' }} // Completed orders are 100%
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {counts.totalTime > 0 ? (
                          <span>{Math.floor(counts.totalTime / 60)}h {counts.totalTime % 60}m</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        {order.status === 'completed' && order.verifier_initials && (
                          <div className="text-xs text-muted-foreground">
                            Verified by: {order.verifier_initials}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)}>
                          <Eye className="h-4 w-4" />
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

      {/* Order Details Dialog - Same as main PTL Orders page */}
      <Dialog open={viewOrderDetails} onOpenChange={setViewOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PTL Order Details - {selectedOrder?.ptl_order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">PTL Order Number</Label>
                  <p className="text-sm font-mono">{selectedOrder.ptl_order_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Hardware Order</Label>
                  <p className="text-sm">{hardwareOrders.find(h => h.id === selectedOrder.hardware_order_id)?.po_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sale Code</Label>
                  <p className="text-sm">{selectedOrder.sale_code || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Firmware Revision</Label>
                  <p className="text-sm">{selectedOrder.firmware_revision || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Board Type</Label>
                  <p className="text-sm">{selectedOrder.board_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p className="text-sm">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date Code</Label>
                  <p className="text-sm">{selectedOrder.date_code || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Completed</Label>
                  <p className="text-sm">{new Date(selectedOrder.updated_at).toLocaleDateString()}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm bg-background p-2 rounded border">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Final Testing Results</Label>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{orderCounts[selectedOrder.id]?.scanned || 0}</p>
                    <p className="text-sm text-muted-foreground">Boards Tested</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{orderCounts[selectedOrder.id]?.passed || 0}</p>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{orderCounts[selectedOrder.id]?.failed || 0}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {orderCounts[selectedOrder.id]?.totalTime > 0 ? 
                        `${Math.floor(orderCounts[selectedOrder.id].totalTime / 60)}h ${orderCounts[selectedOrder.id].totalTime % 60}m` : 
                        '0m'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Total Time</p>
                  </div>
                </div>
                
                {/* Progress bar - 100% for completed */}
                <div className="w-full bg-secondary rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500 flex items-center justify-center text-xs text-white font-medium" 
                    style={{ width: '100%' }}
                  >
                    100% Complete
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  Order completed with {orderCounts[selectedOrder.id]?.scanned || 0} boards tested
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PTLOrderArchive;