import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Scan,
  Wrench,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    technicians: 0,
    boardsTested: 0,
    boardsPassed: 0,
    boardsFailed: 0,
    boardsRepaired: 0,
    avgTestTime: '0 min',
    todayTests: 0,
    techSuccessRate: 0,
    techAvgTime: '0 min'
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'manager') {
      fetchManagerStats();
    } else {
      fetchTechnicianStats();
    }
  }, [user]);

  const fetchManagerStats = async () => {
    try {
      // Fetch PTL orders
      const { data: orders } = await supabase
        .from('ptl_orders')
        .select('id, status, created_at');

      // Fetch scan sessions for board stats
      const { data: sessions } = await supabase
        .from('scan_sessions')
        .select('pass_count, fail_count, total_scanned, duration_minutes, created_at');

      // Fetch technician count
      const { data: techs } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'technician');

      // Fetch repair entries
      const { data: repairs } = await supabase
        .from('repair_entries')
        .select('id, repair_status')
        .eq('repair_status', 'completed');

      const totalOrders = orders?.length || 0;
      const activeOrders = orders?.filter(o => o.status === 'in_progress').length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      const boardsTested = sessions?.reduce((sum, s) => sum + s.total_scanned, 0) || 0;
      const boardsPassed = sessions?.reduce((sum, s) => sum + s.pass_count, 0) || 0;
      const boardsFailed = sessions?.reduce((sum, s) => sum + s.fail_count, 0) || 0;
      
      // Calculate average test time
      const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const avgTestTime = boardsTested > 0 ? `${(totalDuration / boardsTested).toFixed(1)} min` : '0 min';
      
      // Calculate success rate
      const successRate = boardsTested > 0 ? ((boardsPassed / boardsTested) * 100).toFixed(1) : '0';

      setStats({
        totalOrders,
        activeOrders,
        completedOrders,
        technicians: techs?.length || 0,
        boardsTested,
        boardsPassed,
        boardsFailed,
        boardsRepaired: repairs?.length || 0,
        avgTestTime,
        todayTests: 0,
        techSuccessRate: parseFloat(successRate),
        techAvgTime: '0 min'
      });

      // Fetch recent activity (recent scan sessions)
      const { data: recentSessions } = await supabase
        .from('scan_sessions')
        .select(`
          id, created_at, status, pass_count, fail_count,
          profiles(full_name),
          ptl_orders(ptl_order_number)
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      const activity = recentSessions?.map(session => ({
        time: new Date(session.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        action: `${session.profiles?.full_name} ${session.status === 'completed' ? 'completed' : 'started'} PTL ${session.ptl_orders?.ptl_order_number} - ${session.pass_count || 0} passed, ${session.fail_count || 0} failed`,
        type: session.status === 'completed' ? 'success' : 'info'
      })) || [];

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching manager stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicianStats = async () => {
    try {
      // Fetch technician's scan sessions
      const { data: sessions } = await supabase
        .from('scan_sessions')
        .select('pass_count, fail_count, total_scanned, duration_minutes, created_at, status')
        .eq('technician_id', user?.id);

      // Today's tests
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = sessions?.filter(s => 
        s.created_at.startsWith(today)
      ) || [];
      
      const todayTests = todaySessions.reduce((sum, s) => sum + s.total_scanned, 0);
      const totalPassed = sessions?.reduce((sum, s) => sum + s.pass_count, 0) || 0;
      const totalScanned = sessions?.reduce((sum, s) => sum + s.total_scanned, 0) || 0;
      const successRate = totalScanned > 0 ? ((totalPassed / totalScanned) * 100).toFixed(1) : 0;
      
      // Average test time
      const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const avgTime = totalScanned > 0 ? `${(totalDuration / totalScanned).toFixed(1)} min` : '0 min';

      setStats(prev => ({
        ...prev,
        todayTests,
        techSuccessRate: parseFloat(successRate.toString()),
        techAvgTime: avgTime
      }));
    } catch (error) {
      console.error('Error fetching technician stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {user?.role === 'manager' ? 'Manager' : 'Technician'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Welcome back, {user?.firstName || user?.username}!
          </span>
        </div>
      </div>

      {user?.role === 'manager' ? (
        <>
          {/* Manager Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Technicians</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.technicians}</div>
                <p className="text-xs text-muted-foreground">
                  Active team members
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.techSuccessRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Boards passing tests
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Testing Statistics</CardTitle>
                <CardDescription>Board testing overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Passed</span>
                  </div>
                  <span className="font-semibold">{stats.boardsPassed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Failed</span>
                  </div>
                  <span className="font-semibold">{stats.boardsFailed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Repaired</span>
                  </div>
                  <span className="font-semibold">{stats.boardsRepaired}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Avg. Test Time</span>
                  </div>
                  <span className="font-semibold">{stats.avgTestTime}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                        <p className="text-sm">{activity.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Technician Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Tests</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayTests}</div>
                <p className="text-xs text-muted-foreground">
                  Boards tested today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.techSuccessRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Your pass rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Test Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.techAvgTime}</div>
                <p className="text-xs text-muted-foreground">
                  Per board tested
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access your main tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate('/technician/scan-validator')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scan className="h-5 w-5" />
                      Scan Validator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Start a new scanning session
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate('/technician/repair-log')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Repair Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      View and update repairs
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate('/technician/scan-history')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Scan History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Review past scans
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;