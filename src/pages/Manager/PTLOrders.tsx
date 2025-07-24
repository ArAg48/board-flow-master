import React, { useState, useEffect } from 'react';
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
import { Plus, Edit, Eye, Clipboard, Link } from 'lucide-react';
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
  test_parameters?: any;
}

const PTLOrders: React.FC = () => {
  const [hardwareOrders, setHardwareOrders] = useState<HardwareOrder[]>([]);
  const [orders, setOrders] = useState<PTLOrder[]>([]);

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
      test_parameters: {},
    },
  });

  useEffect(() => {
    fetchHardwareOrders();
    fetchPTLOrders();
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

        if (error) throw error;

        toast({
          title: 'PTL Order Created',
          description: `Order ${orderData.ptl_order_number} has been created successfully.`,
        });
      }

      setIsDialogOpen(false);
      setEditingOrder(null);
      form.reset();
      fetchPTLOrders(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: editingOrder ? 'Failed to update PTL order.' : 'Failed to create PTL order.',
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
      test_parameters: order.test_parameters || {},
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (order: PTLOrder) => {
    setSelectedOrder(order);
    setViewOrderDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
                              {order.order_number} - {order.customer_name}
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
                        <FormLabel>Quantity</FormLabel>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PTL Order</TableHead>
                <TableHead>Hardware Order</TableHead>
                <TableHead>Board Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const hardwareOrder = hardwareOrders.find(h => h.id === order.hardware_order_id);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.ptl_order_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-muted-foreground" />
                        {hardwareOrder?.order_number || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{order.board_type}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(order)}>
                          <Edit className="h-4 w-4" />
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
                  <p className="text-sm">{hardwareOrders.find(h => h.id === selectedOrder.hardware_order_id)?.order_number || 'N/A'}</p>
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
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Testing Progress</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-muted-foreground">Tested</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-600">0</p>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-red-600">0</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
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