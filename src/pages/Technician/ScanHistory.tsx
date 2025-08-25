import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { History, Search, Filter, TrendingUp, Users, Target, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface SessionHistory {
  id: string;
  ptl_order_id: string;
  technician_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  total_scanned: number;
  pass_count: number;
  fail_count: number;
  pass_rate?: number;
  tester_config: {
    type: number;
    scanBoxes: number;
  };
  status: 'completed' | 'paused' | 'abandoned' | 'active';
  notes?: string;
  ptl_orders?: {
    ptl_order_number: string;
    board_type: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface HistoryFilters {
  technician?: string;
  ptlOrder?: string;
  status?: SessionHistory['status'];
}

const ScanHistory: React.FC = () => {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await apiClient.getScanHistory();
      const data = (res && (res.data || res.sessions || res)) || [];

      const sessionsWithPassRate = (data || []).map((session: any) => ({
        id: session.id,
        ptl_order_id: session.ptl_order_id,
        technician_id: session.technician_id,
        start_time: session.start_time,
        end_time: session.end_time,
        duration_minutes: session.duration_minutes ?? (session.start_time && session.end_time ? Math.max(0, Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime())/60000)) : undefined),
        total_scanned: session.total_scanned || 0,
        pass_count: session.pass_count || 0,
        fail_count: session.fail_count || 0,
        pass_rate: (session.total_scanned || 0) > 0 ? Math.round(((session.pass_count || 0) / session.total_scanned) * 100) : 0,
        tester_config: typeof session.tester_config === 'string' ? JSON.parse(session.tester_config) : (session.tester_config || { type: 1, scanBoxes: 1 }),
        status: session.status,
        notes: session.notes,
        ptl_orders: { ptl_order_number: session.ptl_order_number, board_type: session.board_type },
        profiles: { full_name: session.technician_name }
      })) as SessionHistory[];

      setSessions(sessionsWithPassRate);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load scan sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: SessionHistory['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'paused': return 'secondary';
      case 'abandoned': return 'destructive';
      default: return 'outline';
    }
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 95) return 'text-green-600';
    if (passRate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.ptl_orders?.ptl_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.ptl_orders?.board_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || session.status === filters.status;
    const matchesTechnician = !filters.technician || session.profiles?.full_name === filters.technician;
    const matchesPTL = !filters.ptlOrder || session.ptl_orders?.ptl_order_number === filters.ptlOrder;
    
    return matchesSearch && matchesStatus && matchesTechnician && matchesPTL;
  });

  // Calculate summary stats
  const totalSessions = filteredSessions.length;
  const avgPassRate = filteredSessions.reduce((sum, s) => sum + (s.pass_rate || 0), 0) / totalSessions || 0;
  const totalScanned = filteredSessions.reduce((sum, s) => sum + s.total_scanned, 0);
  const totalPassed = filteredSessions.reduce((sum, s) => sum + s.pass_count, 0);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scan History</h1>
          <p className="text-muted-foreground">View and analyze past validation sessions</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalSessions}</div>
                <div className="text-xs text-muted-foreground">Total Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{totalScanned}</div>
                <div className="text-xs text-muted-foreground">Boards Scanned</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(avgPassRate)}%</div>
                <div className="text-xs text-muted-foreground">Avg Pass Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-2xl font-bold">{new Set(filteredSessions.map(s => s.profiles?.full_name).filter(Boolean)).size}</div>
              <div className="text-xs text-muted-foreground">Active Techs</div>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({...filters, status: value === 'all' ? undefined : value as SessionHistory['status']})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.technician || 'all'} onValueChange={(value) => setFilters({...filters, technician: value === 'all' ? undefined : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {Array.from(new Set(sessions.map(s => s.profiles?.full_name).filter(Boolean))).map((tech) => (
                  <SelectItem key={tech} value={tech!}>{tech}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.ptlOrder || 'all'} onValueChange={(value) => setFilters({...filters, ptlOrder: value === 'all' ? undefined : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by PTL order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                {Array.from(new Set(sessions.map(s => s.ptl_orders?.ptl_order_number).filter(Boolean))).map((order) => (
                  <SelectItem key={order} value={order!}>{order}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {setFilters({}); setSearchTerm('');}}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Session History ({filteredSessions.length})
          </CardTitle>
          <CardDescription>
            Click on any session to view detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PTL Order</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Scanned</TableHead>
                <TableHead>Pass Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{session.ptl_orders?.ptl_order_number}</TableCell>
                  <TableCell>{session.profiles?.full_name}</TableCell>
                  <TableCell>{new Date(session.start_time).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {session.duration_minutes ? `${Math.floor(session.duration_minutes / 60)}h ${session.duration_minutes % 60}m` : 'In progress'}
                  </TableCell>
                  <TableCell>{session.total_scanned}</TableCell>
                  <TableCell>
                    <span className={getPassRateColor(session.pass_rate || 0)}>
                      {session.pass_rate || 0}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Session Details - {session.ptl_orders?.ptl_order_number}
                          </DialogTitle>
                          <DialogDescription>
                            {session.ptl_orders?.board_type} • {new Date(session.start_time).toLocaleDateString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Technician</div>
                              <div className="font-medium">{session.profiles?.full_name}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Tester Configuration</div>
                              <div className="font-medium">{session.tester_config.type}-up ({session.tester_config.scanBoxes} boxes)</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Start Time</div>
                              <div className="font-medium">{new Date(session.start_time).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Duration</div>
                              <div className="font-medium">
                                {session.duration_minutes ? `${Math.floor(session.duration_minutes / 60)}h ${session.duration_minutes % 60}m` : 'In progress'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Test Results</div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold">{session.total_scanned}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-green-600">{session.pass_count}</div>
                                <div className="text-xs text-muted-foreground">Passed</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-red-600">{session.fail_count}</div>
                                <div className="text-xs text-muted-foreground">Failed</div>
                              </div>
                            </div>
                            <Progress value={session.pass_rate || 0} className="h-2" />
                            <div className="text-center text-sm font-medium">
                              {session.pass_rate || 0}% Pass Rate
                            </div>
                          </div>
                          
                          {session.notes && (
                            <div>
                              <div className="text-sm text-muted-foreground">Session Notes</div>
                              <div className="p-2 bg-muted rounded text-sm">{session.notes}</div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
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

export default ScanHistory;