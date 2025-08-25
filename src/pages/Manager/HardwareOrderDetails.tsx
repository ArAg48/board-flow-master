import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HardwareOrderDetail {
  id: string;
  po_number: string;
  assembly_number: string;
  quantity: number;
  starting_sequence: string;
  ending_sequence: string;
  status: string;
  created_at: string;
}

interface PTLOrder {
  id: string;
  ptl_order_number: string;
  board_type: string;
  quantity: number;
  status: string;
  created_at: string;
  tested: number;
  passed: number;
  failed: number;
}

const HardwareOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hardwareOrder, setHardwareOrder] = useState<HardwareOrderDetail | null>(null);
  const [ptlOrders, setPtlOrders] = useState<PTLOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadHardwareOrderDetails();
      loadPTLOrders();
      
      // Refresh PTL order progress every 30 seconds
      const interval = setInterval(() => {
        loadPTLOrders();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadHardwareOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('hardware_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setHardwareOrder(data);
    } catch (error) {
      console.error('Error loading hardware order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hardware order details',
        variant: 'destructive'
      });
    }
  };

  const loadPTLOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('ptl_orders')
        .select('*')
        .eq('hardware_order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get progress data from the ptl_order_progress table instead
      const orderIds = (data || []).map(order => order.id);
      const { data: progressData } = await supabase
        .from('ptl_order_progress')
        .select('*')
        .in('id', orderIds);

      const progressMap = (progressData || []).reduce((acc, progress) => {
        acc[progress.id] = progress;
        return acc;
      }, {} as Record<string, any>);

      // Transform PTL orders with accurate progress data
      const ptlOrdersWithStats = (data || []).map(order => {
        const progress = progressMap[order.id];
        return {
          ...order,
          tested: progress?.scanned_count || 0,
          passed: progress?.passed_count || 0,
          failed: progress?.failed_count || 0,
        };
      });

      setPtlOrders(ptlOrdersWithStats);
    } catch (error) {
      console.error('Error loading PTL orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load PTL orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (order: PTLOrder) => {
    return order.quantity > 0 ? Math.round((order.tested / order.quantity) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading hardware order details...</div>
      </div>
    );
  }

  if (!hardwareOrder) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Hardware order not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Hardware Order {hardwareOrder.po_number}</h1>
          <p className="text-muted-foreground">PTL orders and testing progress</p>
        </div>
      </div>

      {/* Hardware Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hardware Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">PO Number</div>
              <div className="text-lg font-semibold">{hardwareOrder.po_number}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Assembly</div>
              <div className="text-lg font-semibold">{hardwareOrder.assembly_number}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Quantity</div>
              <div className="text-lg font-semibold">{hardwareOrder.quantity}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="mt-1">{getStatusBadge(hardwareOrder.status)}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-muted-foreground">Sequence Range</div>
            <div className="text-lg font-semibold">{hardwareOrder.starting_sequence} - {hardwareOrder.ending_sequence}</div>
          </div>
        </CardContent>
      </Card>

      {/* PTL Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>PTL Orders ({ptlOrders.length})</CardTitle>
          <CardDescription>
            Test orders created for this hardware order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ptlOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No PTL orders have been created for this hardware order yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PTL Order</TableHead>
                  <TableHead>Board Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ptlOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.ptl_order_number}</TableCell>
                    <TableCell>{order.board_type}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {order.tested}/{order.quantity} ({calculateProgress(order)}%)
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600">✓ {order.passed}</span>
                          <span className="text-red-600">✗ {order.failed}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/app/ptl-orders/${order.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HardwareOrderDetails;