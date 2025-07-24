import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Search, Eye, Edit, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  ptl_order_number: string;
  board_type: string;
  quantity: number;
  tested: number;
  passed: number;
  failed: number;  
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  hardware_orders?: {
    po_number: string;
    assembly_number: string;
  };
  profiles?: {
    full_name: string;
  };
}

const OrderOverview: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('ptl_orders')
        .select(`
          id,
          ptl_order_number,
          board_type,
          quantity,
          status,
          created_at,
          hardware_orders(po_number, assembly_number),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate statistics from scan sessions and board data
      const ordersWithStats = await Promise.all((data || []).map(async (order) => {
        // Get scan sessions for this order
        const { data: sessions } = await supabase
          .from('scan_sessions')
          .select('pass_count, fail_count, total_scanned')
          .eq('ptl_order_id', order.id);

        // Calculate totals
        const totalScanned = sessions?.reduce((sum, s) => sum + s.total_scanned, 0) || 0;
        const totalPassed = sessions?.reduce((sum, s) => sum + s.pass_count, 0) || 0;
        const totalFailed = sessions?.reduce((sum, s) => sum + s.fail_count, 0) || 0;

        return {
          ...order,
          tested: totalScanned,
          passed: totalPassed,
          failed: totalFailed,
          status: order.status as 'pending' | 'in_progress' | 'completed'
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
    const matchesSearch = order.ptl_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.board_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.hardware_orders?.po_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.hardware_orders?.assembly_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateProgress = (order: Order) => {
    return order.quantity > 0 ? (order.tested / order.quantity) * 100 : 0;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Order Overview</h1>
          <p className="text-muted-foreground">Monitor and manage all testing orders</p>
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
                  placeholder="Search by PO, Sale Code, or Assembly..."
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
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Overview of all testing orders and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PTL Order</TableHead>
                <TableHead>Board Type</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.ptl_order_number}</div>
                      <div className="text-sm text-muted-foreground">{order.hardware_orders?.po_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.board_type}</div>
                      <div className="text-sm text-muted-foreground">{order.hardware_orders?.assembly_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{order.tested}/{order.quantity}</span>
                        <span>{Math.round(calculateProgress(order))}%</span>
                      </div>
                      <Progress value={calculateProgress(order)} className="h-2" />
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">✓ {order.passed}</span>
                        <span className="text-red-600">✗ {order.failed}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(order.status)} text-white border-0`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status.replace('-', ' ')}
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
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Details - {selectedOrder?.ptl_order_number}</DialogTitle>
                            <DialogDescription>
                              Detailed information about this PTL order
                            </DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">PTL Order Number</Label>
                                  <p className="text-sm">{selectedOrder.ptl_order_number}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">PO Number</Label>
                                  <p className="text-sm">{selectedOrder.hardware_orders?.po_number || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Board Type</Label>
                                  <p className="text-sm">{selectedOrder.board_type}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Assembly</Label>
                                  <p className="text-sm">{selectedOrder.hardware_orders?.assembly_number || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Quantity</Label>
                                  <p className="text-sm">{selectedOrder.quantity} units</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Tested</Label>
                                  <p className="text-sm">{selectedOrder.tested} units</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Results</Label>
                                  <div className="text-sm space-y-1">
                                    <p className="text-green-600">Passed: {selectedOrder.passed}</p>
                                    <p className="text-red-600">Failed: {selectedOrder.failed}</p>
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
                      <Button variant="outline" size="sm">
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
    </div>
  );
};

export default OrderOverview;