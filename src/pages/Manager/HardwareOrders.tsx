import React, { useState } from 'react';
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

interface HardwareOrder {
  id: string;
  poNumber: string;
  quantity: number;
  assemblyNumber: string;
  revision: string;
  startingSequence: string;
  endingSequence: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
}

interface HardwareOrderForm {
  poNumber: string;
  quantity: number;
  assemblyNumber: string;
  revision: string;
  startingSequence: string;
}

const HardwareOrders: React.FC = () => {
  const [orders, setOrders] = useState<HardwareOrder[]>([
    {
      id: '1',
      poNumber: 'PO-2024-001',
      quantity: 100,
      assemblyNumber: '257411',
      revision: 'E',
      startingSequence: '411E0000001',
      endingSequence: '411E0000100',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      createdBy: 'John Manager'
    },
    {
      id: '2',
      poNumber: 'PO-2024-002',
      quantity: 50,
      assemblyNumber: '257411',
      revision: 'D',
      startingSequence: '411D0000001',
      endingSequence: '411D0000050',
      status: 'completed',
      createdAt: '2024-01-10T14:20:00Z',
      createdBy: 'John Manager'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<HardwareOrder | null>(null);
  const { toast } = useToast();

  const form = useForm<HardwareOrderForm>({
    defaultValues: {
      poNumber: '',
      quantity: 1,
      assemblyNumber: '',
      revision: '',
      startingSequence: '',
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

  const onSubmit = async (data: HardwareOrderForm) => {
    try {
      const endingSequence = calculateEndingSequence(data.startingSequence, data.quantity);
      
      const newOrder: HardwareOrder = {
        id: Date.now().toString(),
        ...data,
        endingSequence,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: 'Current User', // Replace with actual user
      };

      setOrders(prev => [newOrder, ...prev]);
      setIsDialogOpen(false);
      form.reset();
      
      toast({
        title: 'Hardware Order Created',
        description: `Order ${data.poNumber} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create hardware order.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: HardwareOrder['status']) => {
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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Hardware Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Hardware Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="poNumber"
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
                    name="assemblyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assembly Number</FormLabel>
                        <FormControl>
                          <Input placeholder="257411" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="revision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Revision</FormLabel>
                        <FormControl>
                          <Input placeholder="E" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                
                <FormField
                  control={form.control}
                  name="startingSequence"
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
                
                {form.watch('startingSequence') && form.watch('quantity') && (
                  <div className="p-3 bg-muted rounded-md">
                    <Label className="text-sm font-medium">Calculated Ending Sequence:</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {calculateEndingSequence(form.watch('startingSequence'), form.watch('quantity'))}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Order</Button>
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
                  <TableCell className="font-medium">{order.poNumber}</TableCell>
                  <TableCell>{order.assemblyNumber}{order.revision}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell className="text-sm">
                    {order.startingSequence} - {order.endingSequence}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
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

export default HardwareOrders;