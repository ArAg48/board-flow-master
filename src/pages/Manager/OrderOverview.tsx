import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, Edit, Clock, CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HardwareOrder {
  id: string;
  po_number: string;
  assembly_number: string;
  quantity: number;
  starting_sequence: string;
  ending_sequence: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  ptlOrderCount: number;
  totalTested: number;
  totalPassed: number;
  totalFailed: number;
  profiles?: {
    full_name: string;
  };
}

const OrderOverview: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<HardwareOrder | null>(null);
  const [editOrder, setEditOrder] = useState<HardwareOrder | null>(null);
  const [orders, setOrders] = useState<HardwareOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editNotes, setEditNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('hardware_orders')
        .select(`
          id,
          po_number,
          assembly_number,
          quantity,
          starting_sequence,
          ending_sequence,
          status,
          created_at,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate statistics from PTL orders and scan sessions
      const ordersWithStats = await Promise.all((data || []).map(async (order) => {
        // Get PTL orders for this hardware order
        const { data: ptlOrders } = await supabase
          .from('ptl_orders')
          .select('id')
          .eq('hardware_order_id', order.id);

        const ptlOrderIds = ptlOrders?.map(p => p.id) || [];
        
        // Get progress data for all PTL orders
        let totalScanned = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        
        if (ptlOrderIds.length > 0) {
          const { data: progress } = await supabase
            .from('ptl_order_progress')
            .select('scanned_count, passed_count, failed_count')
            .in('id', ptlOrderIds);

          totalScanned = progress?.reduce((sum, p) => sum + (p.scanned_count || 0), 0) || 0;
          totalPassed = progress?.reduce((sum, p) => sum + (p.passed_count || 0), 0) || 0;
          totalFailed = progress?.reduce((sum, p) => sum + (p.failed_count || 0), 0) || 0;
        }

        return {
          ...order,
          ptlOrderCount: ptlOrders?.length || 0,
          totalTested: totalScanned,
          totalPassed: totalPassed,
          totalFailed: totalFailed,
          status: order.status as 'pending' | 'active' | 'completed' | 'cancelled'
        };
      }));

      setOrders(ordersWithStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.assembly_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.starting_sequence.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.ending_sequence.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'active': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateProgress = (order: HardwareOrder) => {
    return order.quantity > 0 ? (order.totalTested / order.quantity) * 100 : 0;
  };

  const handleEditOrder = (order: HardwareOrder) => {
    setEditOrder(order);
    setEditNotes(''); // Initialize with empty notes for now
  };

  const handleSaveOrder = async () => {
    if (!editOrder) return;

    try {
      const { error } = await supabase
        .from('hardware_orders')
        .update({ notes: editNotes })
        .eq('id', editOrder.id);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: "Order notes have been updated successfully",
      });

      setEditOrder(null);
      setEditNotes('');
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Order Overview</h1>
            <p className="text-muted-foreground">Monitor and manage all hardware orders and their testing progress</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by PO number, assembly, or sequence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hardware Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Overview of all hardware orders and their PTL testing progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hardware Order</TableHead>
                <TableHead>Assembly</TableHead>
                <TableHead>PTL Orders</TableHead>
                <TableHead>Testing Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/manager/hardware-orders/${order.id}`)}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.po_number}</div>
                      <div className="text-sm text-muted-foreground">{order.starting_sequence} - {order.ending_sequence}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.assembly_number}</div>
                      <div className="text-sm text-muted-foreground">{order.quantity} units</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{order.ptlOrderCount}</div>
                      <div className="text-xs text-muted-foreground">PTL orders</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{order.totalTested}/{order.quantity}</span>
                        <span>{Math.round(calculateProgress(order))}%</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">✓ {order.totalPassed}</span>
                        <span className="text-red-600">✗ {order.totalFailed}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(order.status)} text-white border-0`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span>{order.profiles?.full_name || 'Unknown'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Hardware Order Details - {selectedOrder?.po_number}</DialogTitle>
                            <DialogDescription>
                              Detailed information about this hardware order
                            </DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">PO Number</Label>
                                  <p className="text-sm">{selectedOrder.po_number}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Assembly Number</Label>
                                  <p className="text-sm">{selectedOrder.assembly_number}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Quantity</Label>
                                  <p className="text-sm">{selectedOrder.quantity} units</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Sequence Range</Label>
                                  <p className="text-sm">{selectedOrder.starting_sequence} - {selectedOrder.ending_sequence}</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">PTL Orders</Label>
                                  <p className="text-sm">{selectedOrder.ptlOrderCount} orders</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Testing Progress</Label>
                                  <p className="text-sm">{selectedOrder.totalTested}/{selectedOrder.quantity} tested</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Results</Label>
                                  <div className="text-sm space-y-1">
                                    <p className="text-green-600">Passed: {selectedOrder.totalPassed}</p>
                                    <p className="text-red-600">Failed: {selectedOrder.totalFailed}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Created By</Label>
                                  <p className="text-sm">{selectedOrder.profiles?.full_name || 'Unknown'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={!!editOrder} onOpenChange={(open) => !open && setEditOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Hardware Order - {editOrder?.po_number}</DialogTitle>
            <DialogDescription>
              Update order notes and information
            </DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Order Details</Label>
                <div className="text-sm space-y-1 bg-muted p-3 rounded">
                  <p><span className="font-medium">PO:</span> {editOrder.po_number}</p>
                  <p><span className="font-medium">Assembly:</span> {editOrder.assembly_number}</p>
                  <p><span className="font-medium">Quantity:</span> {editOrder.quantity}</p>
                  <p><span className="font-medium">Status:</span> {editOrder.status}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Add notes about this order..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrder}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderOverview;