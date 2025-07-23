import React, { useState } from 'react';
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

interface Order {
  id: string;
  poNumber: string;
  saleCode: string;
  assembly: string;
  revision: string;
  quantity: number;
  tested: number;
  passed: number;
  failed: number;
  repaired: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedTech: string;
  startDate: string;
  timeSpent: number; // in minutes
  estimatedTime: number; // in minutes
}

const OrderOverview: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock data
  const [orders] = useState<Order[]>([
    {
      id: '1',
      poNumber: 'PO-2024-001',
      saleCode: 'SC001',
      assembly: 'PCB-MAIN-V2',
      revision: 'Rev-C',
      quantity: 100,
      tested: 85,
      passed: 78,
      failed: 7,
      repaired: 5,
      status: 'in-progress',
      assignedTech: 'Jane Technician',
      startDate: '2024-01-15',
      timeSpent: 450,
      estimatedTime: 600,
    },
    {
      id: '2',
      poNumber: 'PO-2024-002',
      saleCode: 'SC002',
      assembly: 'PCB-SENSOR-V1',
      revision: 'Rev-A',
      quantity: 50,
      tested: 50,
      passed: 47,
      failed: 3,
      repaired: 2,
      status: 'completed',
      assignedTech: 'Bob Smith',
      startDate: '2024-01-10',
      timeSpent: 320,
      estimatedTime: 300,
    },
    {
      id: '3',
      poNumber: 'PO-2024-003',
      saleCode: 'SC003',
      assembly: 'PCB-POWER-V3',
      revision: 'Rev-B',
      quantity: 25,
      tested: 0,
      passed: 0,
      failed: 0,
      repaired: 0,
      status: 'pending',
      assignedTech: 'Not Assigned',
      startDate: '2024-01-20',
      timeSpent: 0,
      estimatedTime: 150,
    },
  ]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.saleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.assembly.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateProgress = (order: Order) => {
    return order.quantity > 0 ? (order.tested / order.quantity) * 100 : 0;
  };

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
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
                <TableHead>PO Number</TableHead>
                <TableHead>Assembly</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Tech</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.poNumber}</div>
                      <div className="text-sm text-muted-foreground">{order.saleCode}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.assembly}</div>
                      <div className="text-sm text-muted-foreground">{order.revision}</div>
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
                        <span className="text-blue-600">🔧 {order.repaired}</span>
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
                    <span className={order.assignedTech === 'Not Assigned' ? 'text-muted-foreground' : ''}>
                      {order.assignedTech}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{Math.floor(order.timeSpent / 60)}h {order.timeSpent % 60}m</div>
                      <div className="text-muted-foreground">
                        / {Math.floor(order.estimatedTime / 60)}h {order.estimatedTime % 60}m
                      </div>
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
                            <DialogTitle>Order Details - {selectedOrder?.poNumber}</DialogTitle>
                            <DialogDescription>
                              Detailed information about this testing order
                            </DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">PO Number</Label>
                                  <p className="text-sm">{selectedOrder.poNumber}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Sale Code</Label>
                                  <p className="text-sm">{selectedOrder.saleCode}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Assembly</Label>
                                  <p className="text-sm">{selectedOrder.assembly}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Revision</Label>
                                  <p className="text-sm">{selectedOrder.revision}</p>
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
                                    <p className="text-blue-600">Repaired: {selectedOrder.repaired}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Assigned Technician</Label>
                                  <p className="text-sm">{selectedOrder.assignedTech}</p>
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