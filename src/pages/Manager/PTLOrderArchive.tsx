import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardList, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PTLOrderArchive: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'PTL Order Archive | Circuit Works';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'PTL Order Archive of completed PTL orders');
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = window.location.href;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('ptl_orders')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <main>
      <header className="mb-6 flex items-center gap-2">
        <Archive className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">PTL Order Archive</h1>
      </header>
      <section>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{o.ptl_order_number}</span>
                    <Badge variant="secondary">Completed</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Board</span>
                    <span className="text-muted-foreground">{o.board_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity</span>
                    <span className="text-muted-foreground">{o.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <span className="text-muted-foreground">{new Date(o.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="pt-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/app/ptl-orders/${o.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default PTLOrderArchive;
