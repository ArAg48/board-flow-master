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
  History,
  Target
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
      // Fetch hardware orders
      const { data: hardwareOrders } = await supabase
        .from('hardware_orders')
        .select('id, status, created_at');

      // Fetch PTL orders
      const { data: ptlOrders } = await supabase
        .from('ptl_orders')
        .select('id, status, created_at');

      // Refresh progress snapshot from existing data (sessions + boards) via DB function
      try { await supabase.rpc('refresh_ptl_progress'); } catch (e) { /* ignore */ }

      // Fetch technician count separately
      const { data: techs } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'technician');

      // Fetch repair entries
      const { data: repairs } = await supabase
        .from('repair_entries')
        .select('id, repair_status')
        .eq('repair_status', 'completed');

      // Counts per user request
      const totalHardwareOrders = hardwareOrders?.length || 0;
      const totalPTLOrders = ptlOrders?.length || 0;
      const completedOrders = ptlOrders?.filter(o => o.status === 'completed').length || 0;
      const technicians = techs?.length || 0;

      // Aggregate board and time stats using DB function that derives from sessions + boards
      const { data: progress } = await supabase.rpc('get_ptl_order_progress');

      const boardsTested = progress?.reduce((sum: number, p: any) => sum + (Number(p.scanned_count) || 0), 0) || 0;
      const boardsPassed = progress?.reduce((sum: number, p: any) => sum + (Number(p.passed_count) || 0), 0) || 0;
      const boardsFailed = progress?.reduce((sum: number, p: any) => sum + (Number(p.failed_count) || 0), 0) || 0;

      // Time calculations with proper formatting
      const totalDuration = progress?.reduce((sum: number, p: any) => sum + (Number(p.total_time_minutes) || 0), 0) || 0;
      const totalActiveTime = progress?.reduce((sum: number, p: any) => sum + (Number(p.active_time_minutes) || 0), 0) || 0;

      const formatTime = (minutes: number) => {
        const rounded = Math.round(minutes);
        if (rounded === 0) return '0 min';
        const hours = Math.floor(rounded / 60);
        const mins = rounded % 60;
        if (hours > 0) {
          return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
      };

      const avgTestTime = boardsTested > 0 ? formatTime(totalDuration / boardsTested) : '0 min';
      const avgActiveTime = boardsTested > 0 ? formatTime(totalActiveTime / boardsTested) : '0 min';

      // Calculate success rate
      const successRate = boardsTested > 0 ? ((boardsPassed / boardsTested) * 100).toFixed(1) : '0';

      setStats({
        totalOrders: totalHardwareOrders,
        activeOrders: totalPTLOrders,
        completedOrders,
        technicians,
        boardsTested,
        boardsPassed,
        boardsFailed,
        boardsRepaired: repairs?.length || 0,
        avgTestTime,
        todayTests: 0,
        techSuccessRate: parseFloat(successRate),
        techAvgTime: avgActiveTime
      });

      // Fetch recent activity from board_data
      const { data: recentBoards } = await supabase
        .from('board_data')
        .select(`
          created_at, test_status,
          profiles(full_name),
          ptl_orders(ptl_order_number)
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      const activity = (recentBoards || []).map((b: any) => ({
        time: new Date(b.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        action: `${b.profiles?.full_name || 'Technician'} ${b.test_status === 'pass' ? 'passed' : b.test_status === 'fail' ? 'failed' : 'scanned'} a board in PTL ${b.ptl_orders?.ptl_order_number || ''}`,
        type: b.test_status === 'fail' ? 'error' : 'info'
      }));

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching manager stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicianStats = async () => {
    try {
      // Use SECURITY DEFINER history to derive counts reliably
      const techId = user?.id || null;
      const { data: sessions }: { data: any[] | null } = await supabase.rpc('get_scan_history', {
        p_technician_id: techId,
      });

      const list = sessions || [];
      const now = new Date();

      const totalScanned = list.reduce((sum: number, s: any) => sum + (Number(s.total_scanned) || 0), 0);
      const totalPassed = list.reduce((sum: number, s: any) => sum + (Number(s.pass_count) || 0), 0);

      // Compute total duration with fallback when duration_minutes is null
      const totalDuration = list.reduce((sum: number, s: any) => {
        if (typeof s.duration_minutes === 'number' && s.duration_minutes !== null) {
          return sum + s.duration_minutes;
        }
        const start = s.start_time ? new Date(s.start_time) : null;
        const end = s.end_time ? new Date(s.end_time) : null;
        if (start) {
          const endTime = end || now;
          const mins = Math.max(0, Math.floor((endTime.getTime() - start.getTime()) / 60000));
          return sum + mins;
        }
        return sum;
      }, 0);

      // Today's tests: sum boards from sessions that started today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTests = list
        .filter((s: any) => (s.start_time || '').startsWith(todayStr))
        .reduce((sum: number, s: any) => sum + (Number(s.total_scanned) || 0), 0);

      const formatTime = (minutes: number) => {
        if (!minutes) return '0 min';
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      };

      const avgTime = totalScanned > 0 ? formatTime(totalDuration / totalScanned) : '0 min';
      const successRate = totalScanned > 0 ? ((totalPassed / totalScanned) * 100).toFixed(1) : '0';

      const completedPTLOrders = list.filter((s: any) => s.ptl_order_status === 'completed').length;

      setStats(prev => ({
        ...prev,
        todayTests,
        boardsTested: totalScanned,
        boardsPassed: totalPassed,
        techSuccessRate: parseFloat(String(successRate)),
        techAvgTime: avgTime,
        completedOrders: completedPTLOrders
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
            Welcome back, {user?.first_name || user?.username}!
          </span>
        </div>
      </div>

      {user?.role === 'manager' ? (
        <>
          {/* Manager Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hardware Orders</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Total hardware orders
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PTL Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Total PTL orders
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
                    <Wrench className="h-4 w-4 text-yellow-500" />
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
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Target className="h-4 w-4 text-purple-500" />
                     <span className="text-sm">Total Tested</span>
                   </div>
                   <span className="font-semibold">{stats.boardsTested}</span>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Tests</CardTitle>
                <Scan className="h-4 w-4 text-muted-foreground" />
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PTL Orders Done</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Orders completed
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Access your main tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/app/scan-validator')}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Scan className="h-5 w-5" />
                        CW PTL
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
                    onClick={() => navigate('/app/repair-log')}
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
                    onClick={() => navigate('/app/scan-history')}
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
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/app/dashboard')}
                    className="w-full"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;