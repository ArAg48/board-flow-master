import React, { useState } from 'react';
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

interface PTLOrder {
  id: string;
  ptlOrderNumber: string;
  hardwareOrderId: string;
  hardwareOrderPO: string;
  saleCode: string;
  firmwareRevision: string;
  boardsToTest: number;
  dateCode: string;
  notes?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
}

interface PTLOrderForm {
  hardwareOrderId: string;
  saleCode: string;
  firmwareRevision: string;
  boardsToTest: number;
  dateCode: string;
  notes?: string;
}

const PTLOrders: React.FC = () => {
  // Mock hardware orders - in real app, fetch from API
  const hardwareOrders = [
    { id: '1', poNumber: 'PO-2024-001', assemblyNumber: '257411E', status: 'active' },
    { id: '2', poNumber: 'PO-2024-002', assemblyNumber: '257411D', status: 'active' },
    { id: '3', poNumber: 'PO-2024-003', assemblyNumber: '257411E', status: 'active' },
  ];

  const [orders, setOrders] = useState<PTLOrder[]>([
    {
      id: '1',
      ptlOrderNumber: 'PTL-2024-001',
      hardwareOrderId: '1',
      hardwareOrderPO: 'PO-2024-001',
      saleCode: '1234-ABC',
      firmwareRevision: '1.3',
      boardsToTest: 50,
      dateCode: '2401',
      notes: 'Initial production run',
      status: 'active',
      createdAt: '2024-01-15T11:00:00Z',
      createdBy: 'John Manager'
    },
    {
      id: '2',
      ptlOrderNumber: 'PTL-2024-002',
      hardwareOrderId: '2',
      hardwareOrderPO: 'PO-2024-002',
      saleCode: '5678',
      firmwareRevision: '14',
      boardsToTest: 25,
      dateCode: '2401',
      status: 'completed',
      createdAt: '2024-01-10T15:30:00Z',
      createdBy: 'John Manager'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PTLOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PTLOrder | null>(null);
  const [viewOrderDetails, setViewOrderDetails] = useState(false);
  const { toast } = useToast();

  const form = useForm<PTLOrderForm>({
    defaultValues: {
      hardwareOrderId: '',
      saleCode: '',
      firmwareRevision: '',
      boardsToTest: 1,
      dateCode: '',
      notes: '',
    },
  });

  const generatePTLOrderNumber = (): string => {
    const year = new Date().getFullYear();
    const orderCount = orders.length + 1;
    return `PTL-${year}-${orderCount.toString().padStart(3, '0')}`;
  };

  const onSubmit = async (data: PTLOrderForm) => {
    try {
      const selectedHardwareOrder = hardwareOrders.find(h => h.id === data.hardwareOrderId);
      
      if (editingOrder) {
        // Update existing order
        const updatedOrder: PTLOrder = {
          ...editingOrder,
          ...data,
          hardwareOrderPO: selectedHardwareOrder?.poNumber || editingOrder.hardwareOrderPO,
        };
        setOrders(prev => prev.map(order => order.id === editingOrder.id ? updatedOrder : order));
        toast({
          title: 'PTL Order Updated',
          description: `Order ${editingOrder.ptlOrderNumber} has been updated successfully.`,
        });
      } else {
        // Create new order
        const newOrder: PTLOrder = {
          id: Date.now().toString(),
          ptlOrderNumber: generatePTLOrderNumber(),
          hardwareOrderPO: selectedHardwareOrder?.poNumber || '',
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: 'Current User',
        };
        setOrders(prev => [newOrder, ...prev]);
        toast({
          title: 'PTL Order Created',
          description: `Order ${newOrder.ptlOrderNumber} has been created successfully.`,
        });
      }

      setIsDialogOpen(false);
      setEditingOrder(null);
      form.reset();
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
      hardwareOrderId: order.hardwareOrderId,
      saleCode: order.saleCode,
      firmwareRevision: order.firmwareRevision,
      boardsToTest: order.boardsToTest,
      dateCode: order.dateCode,
      notes: order.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (order: PTLOrder) => {
    setSelectedOrder(order);
    setViewOrderDetails(true);
  };

  const getStatusColor = (status: PTLOrder['status']) => {
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
                  name="hardwareOrderId"
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
                              {order.poNumber} - {order.assemblyNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="saleCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Code</FormLabel>
                        <FormControl>
                          <Input placeholder="1234-ABC or 1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="firmwareRevision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firmware Revision</FormLabel>
                        <FormControl>
                          <Input placeholder="1.3 or 14" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="boardsToTest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boards to Test</FormLabel>
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
                    name="dateCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Code (4 digits)</FormLabel>
                        <FormControl>
                          <Input placeholder="2401" maxLength={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes for this PTL order..."
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PTL Order</TableHead>
                <TableHead>Hardware Order</TableHead>
                <TableHead>Sale Code</TableHead>
                <TableHead>Firmware Rev</TableHead>
                <TableHead>Boards to Test</TableHead>
                <TableHead>Date Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.ptlOrderNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      {order.hardwareOrderPO}
                    </div>
                  </TableCell>
                  <TableCell>{order.saleCode}</TableCell>
                  <TableCell>{order.firmwareRevision}</TableCell>
                  <TableCell>{order.boardsToTest}</TableCell>
                  <TableCell>{order.dateCode}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={viewOrderDetails} onOpenChange={setViewOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PTL Order Details - {selectedOrder?.ptlOrderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">PTL Order Number</Label>
                  <p className="text-sm font-mono">{selectedOrder.ptlOrderNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Hardware Order</Label>
                  <p className="text-sm">{selectedOrder.hardwareOrderPO}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sale Code</Label>
                  <p className="text-sm">{selectedOrder.saleCode}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Firmware Revision</Label>
                  <p className="text-sm">{selectedOrder.firmwareRevision}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Boards to Test</Label>
                  <p className="text-sm">{selectedOrder.boardsToTest}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date Code</Label>
                  <p className="text-sm">{selectedOrder.dateCode}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-sm font-medium">Testing Progress</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">25</p>
                    <p className="text-sm text-muted-foreground">Tested</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-600">22</p>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-red-600">3</p>
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