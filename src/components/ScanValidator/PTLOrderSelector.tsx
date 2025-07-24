import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PTLOrder } from '@/types/scan-validator';
import { Package, Calendar, AlertCircle } from 'lucide-react';

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
          Choose the PTL order to validate and view expected board format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select onValueChange={(value) => {
          const order = orders.find(o => o.id === value);
          if (order) onOrderSelect(order);
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select a PTL order..." />
          </SelectTrigger>
          <SelectContent>
            {orders.map((order) => (
              <SelectItem key={order.id} value={order.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{order.orderNumber} - {order.boardType}</span>
                  <Badge variant={getPriorityColor(order.priority)} className="ml-2">
                    {order.priority}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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