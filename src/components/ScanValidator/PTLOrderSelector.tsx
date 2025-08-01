import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PTLOrder } from '@/types/scan-validator';
import { Package, Calendar, AlertCircle, Search, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
          {filteredOrders.map((order) => {
            const remainingCount = Math.max(0, order.expectedCount - (order.scannedCount || 0));
            const progressPercentage = Math.min(100, ((order.scannedCount || 0) / order.expectedCount) * 100);
            
            return (
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
                
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress: {order.scannedCount || 0} / {order.expectedCount}</span>
                    <span className="font-medium text-primary">{remainingCount} remaining</span>
                  </div>
                  <Progress value={progressPercentage} className="h-1.5" />
                </div>
                
                <div className="text-xs text-muted-foreground mt-1">
                  Due: {order.dueDate.toLocaleDateString()}
                </div>
              </div>
            );
          })}
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
                <span className="text-muted-foreground">Total Required:</span>
                <div className="font-medium">{selectedOrder.expectedCount}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Already Scanned:</span>
                <div className="font-medium text-blue-600">{selectedOrder.scannedCount || 0}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Remaining:</span>
                <div className="font-medium text-primary">
                  {Math.max(0, selectedOrder.expectedCount - (selectedOrder.scannedCount || 0))}
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Expected Format:</span>
                <div className="font-mono text-xs bg-muted p-1 rounded mt-1">
                  {selectedOrder.expectedFormat}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <div className="font-medium">{selectedOrder.dueDate.toLocaleDateString()}</div>
              </div>
            </div>

            {/* Show progress if there's any */}
            {(selectedOrder.scannedCount || 0) > 0 && (
              <div className="border-t pt-3 mt-3">
                <div className="text-sm font-medium mb-2">Current Progress:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-semibold">{selectedOrder.scannedCount}</div>
                    <div className="text-muted-foreground">Scanned</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 text-green-700 rounded">
                    <div className="font-semibold">{selectedOrder.passedCount || 0}</div>
                    <div>Passed</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 text-red-700 rounded">
                    <div className="font-semibold">{selectedOrder.failedCount || 0}</div>
                    <div>Failed</div>
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center gap-2 text-blue-800 text-xs">
                    <Info className="h-3 w-3" />
                    <span className="font-medium">Progress Notice:</span>
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    This PTL order is {((selectedOrder.scannedCount || 0) / selectedOrder.expectedCount * 100).toFixed(1)}% complete. 
                    You'll continue from where the previous technician left off.
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                Board format: First 4 characters + 7 digit serial (e.g., 411E0000001)
              </span>
            </div>

            <Button onClick={onConfirm} className="w-full">
              {(selectedOrder.scannedCount || 0) > 0 
                ? `Continue PTL Order (${Math.max(0, selectedOrder.expectedCount - (selectedOrder.scannedCount || 0))} boards remaining)`
                : 'Start PTL Order'
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTLOrderSelector;