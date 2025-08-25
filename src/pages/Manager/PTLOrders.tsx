import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Eye, Clipboard, Link, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PTLOrder = Database['public']['Tables']['ptl_orders']['Row'];
type HardwareOrder = Database['public']['Tables']['hardware_orders']['Row'];

interface PTLOrderForm {
  hardware_order_id: string;
  ptl_order_number: string;
  board_type: string;
  quantity: number;
  sale_code: string;
  firmware_revision: string;
  date_code: string;
  notes?: string;
  test_parameters?: any;
}

const PTLOrders: React.FC = () => {
  const navigate = useNavigate();
  const [hardwareOrders, setHardwareOrders] = useState<HardwareOrder[]>([]);
  const [orders, setOrders] = useState<PTLOrder[]>([]);
  const [orderCounts, setOrderCounts] = useState<{[key: string]: {scanned: number, passed: number, failed: number, totalTime: number}}>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PTLOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PTLOrder | null>(null);
  const [viewOrderDetails, setViewOrderDetails] = useState(false);
  const { toast } = useToast();

  const form = useForm<PTLOrderForm>({
    defaultValues: {
      hardware_order_id: '',
      ptl_order_number: '',
      board_type: '',
      quantity: 1,
      sale_code: '',
      firmware_revision: '',
      date_code: '',
      notes: '',
      test_parameters: {},
    },
  });

  useEffect(() => {
    fetchHardwareOrders();
    fetchPTLOrders();
    fetchOrderCounts();
    
    // Refresh counts every 30 seconds to show real-time progress
    const interval = setInterval(() => {
      fetchOrderCounts();
    }, 30000);
    
    return () => clearInterval(interval);
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

  const fetchPTLOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('ptl_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch PTL orders.',
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
          .select('id, scanned_count, passed_count, failed_count, total_time_minutes');
        if (progError) throw progError;
        rows = progRows || [];
      }

      const counts: {[key: string]: {scanned: number, passed: number, failed: number, totalTime: number}} = {};
      rows.forEach((row: any) => {
        counts[row.id] = {
          scanned: Number(row.scanned_count) || 0,
          passed: Number(row.passed_count) || 0,
          failed: Number(row.failed_count) || 0,
          totalTime: Number(row.total_time_minutes) || 0,
        };
      });

      setOrderCounts(counts);
    } catch (error) {
      console.error('Error fetching order counts:', error);
    }
  };

  const generatePTLOrderNumber = (): string => {
    const year = new Date().getFullYear();
    const orderCount = orders.length + 1;
    return `PTL-${year}-${orderCount.toString().padStart(3, '0')}`;
  };

  const onSubmit = async (data: PTLOrderForm) => {
    try {
      if (editingOrder) {
        // Update existing order
        const { error } = await supabase
          .from('ptl_orders')
          .update(data)
          .eq('id', editingOrder.id);

        if (error) throw error;

        toast({
          title: 'PTL Order Updated',
          description: `Order ${data.ptl_order_number} has been updated successfully.`,
        });
      } else {
        // Create new order
        const orderData = {
          ...data,
          ptl_order_number: data.ptl_order_number || generatePTLOrderNumber(),
        };

        const { error } = await supabase
          .from('ptl_orders')
          .insert([orderData]);

        if (error) {
          // Handle specific duplicate error
          if (error.code === '23505' && error.message.includes('ptl_orders_ptl_order_number_key')) {
            toast({
              title: 'Duplicate PTL Order Number',
              description: `PTL order number "${orderData.ptl_order_number}" already exists. Please use a different number.`,
              variant: 'destructive',
            });
            return;
          }
          throw error;
        }

        toast({
          title: 'PTL Order Created',
          description: `Order ${orderData.ptl_order_number} has been created successfully.`,
        });
      }

      setIsDialogOpen(false);
      setEditingOrder(null);
      form.reset();
      await fetchPTLOrders(); // Refresh the list
      await fetchOrderCounts(); // Refresh counts
    } catch (error: any) {
      console.error('PTL Order submission error:', error);
      let errorMessage = editingOrder ? 'Failed to update PTL order.' : 'Failed to create PTL order.';
      
      // Handle other potential database errors
      if (error?.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'This PTL order number already exists. Please choose a different number.';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Invalid data provided. Please check your inputs.';
        } else if (error.message.includes('not-null constraint')) {
          errorMessage = 'Please fill in all required fields.';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (order: PTLOrder) => {
    setEditingOrder(order);
    form.reset({
      hardware_order_id: order.hardware_order_id || '',
      ptl_order_number: order.ptl_order_number,
      board_type: order.board_type,
      quantity: order.quantity,
      sale_code: order.sale_code || '',
      firmware_revision: order.firmware_revision || '',
      date_code: order.date_code || '',
      notes: order.notes || '',
      test_parameters: order.test_parameters || {},
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (order: PTLOrder) => {
    setSelectedOrder(order);
    setViewOrderDetails(true);
  };

  const handleDelete = async (order: any) => {
    if (!confirm(`Are you sure you want to delete PTL order ${order.ptl_order_number}?`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_ptl_order', {
        p_ptl_order_id: order.id
      });

      if (error) throw error;

      toast({
        title: 'PTL Order Deleted',
        description: `Order ${order.ptl_order_number} has been deleted successfully.`,
      });

      fetchPTLOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete PTL order.',
        variant: 'destructive',
      });
    }
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

  // Filter orders based on search term
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
          <h1 className="text-3xl font-bold">PTL Orders</h1>
          <p className="text-muted-foreground">Create and manage PTL orders linked to hardware orders</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingOrder(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New PTL Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingOrder ? 'Edit PTL Order' : 'Create PTL Order'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="hardware_order_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hardware Order</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hardware order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hardwareOrders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.po_number} - {order.assembly_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ptl_order_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PTL Order Number</FormLabel>
                      <FormControl>
                        <Input placeholder={generatePTLOrderNumber()} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="board_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Board Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Main Board, Control Board" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Boards to Test</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sale_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1234-ABC or 1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="firmware_revision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firmware Revision</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1.3 or 14" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="date_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Code (4 digits)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 2501" 
                          maxLength={4}
                          pattern="[0-9]{4}"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes or comments..." 
                          className="resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    setEditingOrder(null);
                    form.reset();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingOrder ? 'Update Order' : 'Create Order'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clipboard className="h-5 w-5" />
            PTL Orders
          </CardTitle>
          <CardDescription>
            PTL orders linked to hardware orders for testing
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
                <TableHead>Progress</TableHead>
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
                            className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, (counts.scanned / order.quantity) * 100)}%` }}
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
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEdit(order); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDelete(order); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
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
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm bg-background p-2 rounded border">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Testing Progress & Boards Scanned</Label>
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
                
                {/* Progress bar */}
                <div className="w-full bg-secondary rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500 flex items-center justify-center text-xs text-white font-medium" 
                    style={{ width: `${Math.min(100, ((orderCounts[selectedOrder.id]?.scanned || 0) / selectedOrder.quantity) * 100)}%` }}
                  >
                    {Math.round(((orderCounts[selectedOrder.id]?.scanned || 0) / selectedOrder.quantity) * 100)}%
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  {orderCounts[selectedOrder.id]?.scanned || 0} of {selectedOrder.quantity} boards have been scanned and tested
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PTLOrders;