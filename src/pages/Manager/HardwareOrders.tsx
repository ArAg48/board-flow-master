import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Eye, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type HardwareOrder = Database['public']['Tables']['hardware_orders']['Row'];

interface HardwareOrderForm {
  order_number: string;
  customer_name: string;
  order_date: string;
  delivery_date?: string;
  total_amount?: number;
  notes?: string;
}

const HardwareOrders: React.FC = () => {
  const [orders, setOrders] = useState<HardwareOrder[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<HardwareOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<HardwareOrder | null>(null);
  const [viewPTLOrders, setViewPTLOrders] = useState(false);
  const { toast } = useToast();

  const form = useForm<HardwareOrderForm>({
    defaultValues: {
      order_number: '',
      customer_name: '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      total_amount: 0,
      notes: '',
    },
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('hardware_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch hardware orders.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: HardwareOrderForm) => {
    try {
      if (editingOrder) {
        // Update existing order
        const { error } = await supabase
          .from('hardware_orders')
          .update(data)
          .eq('id', editingOrder.id);

        if (error) throw error;

        toast({
          title: 'Hardware Order Updated',
          description: `Order ${data.order_number} has been updated successfully.`,
        });
      } else {
        // Create new order
        const { error } = await supabase
          .from('hardware_orders')
          .insert([data]);

        if (error) throw error;

        toast({
          title: 'Hardware Order Created',
          description: `Order ${data.order_number} has been created successfully.`,
        });
      }
      
      setIsDialogOpen(false);
      setEditingOrder(null);
      form.reset();
      fetchOrders(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: editingOrder ? 'Failed to update hardware order.' : 'Failed to create hardware order.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (order: HardwareOrder) => {
    setEditingOrder(order);
    form.reset({
      order_number: order.order_number,
      customer_name: order.customer_name,
      order_date: order.order_date,
      delivery_date: order.delivery_date || '',
      total_amount: order.total_amount || 0,
      notes: order.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleViewPTLOrders = (order: HardwareOrder) => {
    setSelectedOrder(order);
    getPTLOrdersForHardware(order.id);
    setViewPTLOrders(true);
  };

  const [ptlOrders, setPtlOrders] = useState<any[]>([]);

  const getPTLOrdersForHardware = async (hardwareOrderId: string) => {
    try {
      const { data, error } = await supabase
        .from('ptl_orders')
        .select('*')
        .eq('hardware_order_id', hardwareOrderId);

      if (error) throw error;
      setPtlOrders(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch PTL orders.',
        variant: 'destructive',
      });
    }
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
          <h1 className="text-3xl font-bold">Hardware Orders</h1>
          <p className="text-muted-foreground">Manage hardware orders that will be used for PTL testing</p>
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
              New Hardware Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingOrder ? 'Edit Hardware Order' : 'Create Hardware Order'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="order_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Number</FormLabel>
                      <FormControl>
                        <Input placeholder="HW-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer ABC Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="order_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="delivery_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="total_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        <Input placeholder="Additional notes..." {...field} />
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
            <Package className="h-5 w-5" />
            Hardware Orders
          </CardTitle>
          <CardDescription>
            All hardware orders that can be used for PTL testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {order.total_amount ? `$${order.total_amount.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewPTLOrders(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(order)}>
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

      {/* PTL Orders Dialog */}
      <Dialog open={viewPTLOrders} onOpenChange={setViewPTLOrders}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>PTL Orders for {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Hardware Order</Label>
                  <p className="text-sm">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Order Date</Label>
                  <p className="text-sm">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PTL Order</TableHead>
                    <TableHead>Board Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ptlOrders.map((ptlOrder) => (
                    <TableRow key={ptlOrder.id}>
                      <TableCell className="font-medium">{ptlOrder.ptl_order_number}</TableCell>
                      <TableCell>{ptlOrder.board_type}</TableCell>
                      <TableCell>{ptlOrder.quantity}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ptlOrder.status)}>
                          {ptlOrder.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(ptlOrder.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HardwareOrders;