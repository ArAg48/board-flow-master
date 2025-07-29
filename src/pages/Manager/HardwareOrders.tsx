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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type HardwareOrder = Database['public']['Tables']['hardware_orders']['Row'];

interface HardwareOrderForm {
  po_number: string;
  quantity: number;
  assembly_number: string;
  starting_sequence: string;
}

const HardwareOrders: React.FC = () => {
  const [orders, setOrders] = useState<HardwareOrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<HardwareOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<HardwareOrder | null>(null);
  const [viewPTLOrders, setViewPTLOrders] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<HardwareOrderForm>({
    defaultValues: {
      po_number: '',
      quantity: 1,
      assembly_number: '',
      starting_sequence: '',
    },
  });

  const calculateEndingSequence = (startingSeq: string, quantity: number): string => {
    // Extract the numeric part and increment by quantity - 1
    const match = startingSeq.match(/(\d+)$/);
    if (match) {
      const numericPart = parseInt(match[1]);
      const endingNum = numericPart + quantity - 1;
      return startingSeq.replace(/\d+$/, endingNum.toString().padStart(match[1].length, '0'));
    }
    return startingSeq;
  };

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
      // Check if user is authenticated
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to create hardware orders.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Form data submitted:', data);
      console.log('Current user:', user);
      console.log('Current user role:', user?.role);
      
      // Test current user role
      const { data: roleTest, error: roleError } = await supabase.rpc('get_current_user_role');
      console.log('RPC get_current_user_role result:', roleTest, roleError);
      
      const endingSequence = calculateEndingSequence(data.starting_sequence, data.quantity);
      const orderData = { 
        ...data, 
        ending_sequence: endingSequence,
        created_by: user.id  // Use the profile ID from AuthContext
      };
      console.log('Order data to insert:', orderData);

      if (editingOrder) {
        // Update existing order
        const { error } = await supabase
          .from('hardware_orders')
          .update(orderData)
          .eq('id', editingOrder.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        toast({
          title: 'Hardware Order Updated',
          description: `Order ${data.po_number} has been updated successfully.`,
        });
      } else {
        // Create new order
        console.log('Attempting to insert new order...');
        const { error, data: insertData } = await supabase
          .from('hardware_orders')
          .insert([orderData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        console.log('Insert successful:', insertData);
        toast({
          title: 'Hardware Order Created',
          description: `Order ${data.po_number} has been created successfully.`,
        });
      }
      
      setIsDialogOpen(false);
      setEditingOrder(null);
      form.reset();
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Full error object:', error);
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
      po_number: order.po_number,
      quantity: order.quantity,
      assembly_number: order.assembly_number,
      starting_sequence: order.starting_sequence,
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
                  name="po_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Number</FormLabel>
                      <FormControl>
                        <Input placeholder="PO-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assembly_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assembly Number with Revision</FormLabel>
                        <FormControl>
                          <Input placeholder="257411E" {...field} />
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
                
                <FormField
                  control={form.control}
                  name="starting_sequence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Sequence</FormLabel>
                      <FormControl>
                        <Input placeholder="411E0000001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('starting_sequence') && form.watch('quantity') && (
                  <div className="p-3 bg-muted rounded-md">
                    <Label className="text-sm font-medium">Calculated Ending Sequence:</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {calculateEndingSequence(form.watch('starting_sequence'), form.watch('quantity'))}
                    </p>
                  </div>
                )}
                
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
                <TableHead>PO Number</TableHead>
                <TableHead>Assembly</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Sequence Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.po_number}</TableCell>
                  <TableCell>{order.assembly_number}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell className="text-sm">
                    {order.starting_sequence} - {order.ending_sequence}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
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
            <DialogTitle>PTL Orders for {selectedOrder?.po_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Hardware Order</Label>
                  <p className="text-sm">{selectedOrder.po_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Assembly</Label>
                  <p className="text-sm">{selectedOrder.assembly_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p className="text-sm">{selectedOrder.quantity}</p>
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