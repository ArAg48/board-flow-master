import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PTLOrder } from '@/types/scan-validator';
import { Package, Calendar, AlertCircle, Search } from 'lucide-react';

interface PTLOrderSelectorProps {
  orders: PTLOrder[];
  selectedOrder: PTLOrder | null;
  onOrderSelect: (order: PTLOrder) => void;
  onConfirm: () => void;
}

const PTLOrderSelector: React.FC<PTLOrderSelectorProps> = ({
  orders,
  selectedOrder,
  onOrderSelect,
  onConfirm
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState(orders);

  useEffect(() => {
    const filtered = orders.filter(order =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.boardType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Select PTL Order
        </CardTitle>
        <CardDescription>
          Search and choose the PTL order to validate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or board type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedOrder?.id === order.id ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onClick={() => onOrderSelect(order)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{order.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">{order.boardType}</div>
                </div>
                <Badge variant={getPriorityColor(order.priority)}>
                  {order.priority}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Count: {order.expectedCount} | Due: {order.dueDate.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No PTL orders found matching your search
          </div>
        )}

        {selectedOrder && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selectedOrder.orderNumber}</h3>
              <Badge variant={getPriorityColor(selectedOrder.priority)}>
                {selectedOrder.priority} priority
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Board Type:</span>
                <div className="font-medium">{selectedOrder.boardType}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Expected Count:</span>
                <div className="font-medium">{selectedOrder.expectedCount}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Expected Format:</span>
                <div className="font-mono text-xs bg-muted p-1 rounded">
                  {selectedOrder.expectedFormat}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <div className="font-medium">{selectedOrder.dueDate.toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                Board format: First 4 characters + 7 digit serial (e.g., 411E0000001)
              </span>
            </div>

            <Button onClick={onConfirm} className="w-full">
              Continue with Selected Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTLOrderSelector;