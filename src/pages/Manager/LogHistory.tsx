import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Download, Calendar as CalendarIcon, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'test' | 'repair' | 'order' | 'system';
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  technician: string;
  poNumber?: string;
  boardId?: string;
  details?: string;
}

const LogHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    // Set up real-time updates
    const interval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      // Fetch scan sessions via SECURITY DEFINER function to bypass RLS
      const { data: sessions } = await supabase.rpc('get_scan_history', { p_technician_id: null });

      // Fetch repair entries for repair logs
      const { data: repairs } = await supabase
        .from('repair_entries')
        .select(`
          id, created_at, updated_at, failure_reason, repair_status, qr_code,
          profiles(full_name),
          ptl_orders(ptl_order_number, hardware_orders(po_number))
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch PTL orders for order logs
      const { data: orders } = await supabase
        .from('ptl_orders')
        .select(`
          id, created_at, ptl_order_number, status,
          profiles!created_by(full_name),
          hardware_orders(po_number)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const logEntries: LogEntry[] = [];

      // Add session logs with timing information
      (sessions as any[] | null)?.forEach((session: any) => {
        const isCompleted = session.session_status === 'completed';
        const level = isCompleted ? 'success' : 'info';
        const start = session.start_time ? new Date(session.start_time) : null;
        const end = session.end_time ? new Date(session.end_time) : null;
        const duration = (typeof session.duration_minutes === 'number' && session.duration_minutes > 0)
          ? session.duration_minutes
          : (start ? Math.max(0, Math.floor(((end || new Date()).getTime() - start.getTime()) / 60000)) : 0);
        const durationText = duration > 60 ? `${Math.floor(duration/60)}h ${duration%60}m` : `${duration}m`;
        
        logEntries.push({
          id: `session-${session.id}`,
          timestamp: session.created_at,
          type: 'test',
          level,
          message: `Scan session ${session.session_status}${duration ? ` (${durationText})` : ''}`,
          technician: session.technician_name || 'Unknown',
          boardId: session.ptl_order_number,
          details: `Total scanned: ${session.total_scanned}, Passed: ${session.pass_count}, Failed: ${session.fail_count}${duration ? `, Duration: ${durationText}` : ''}`
        });

        if ((session.fail_count || 0) > 0) {
          logEntries.push({
            id: `session-fail-${session.id}`,
            timestamp: session.created_at,
            type: 'test',
            level: 'error',
            message: `${session.fail_count} board(s) failed testing`,
            technician: session.technician_name || 'Unknown',
            boardId: session.ptl_order_number,
            details: `Failed boards require repair`
          });
        }
      });

      // Add repair logs
      repairs?.forEach(repair => {
        const level = repair.repair_status === 'completed' ? 'success' : 'warning';
        logEntries.push({
          id: `repair-${repair.id}`,
          timestamp: repair.repair_status === 'completed' ? repair.updated_at : repair.created_at,
          type: 'repair',
          level,
          message: repair.repair_status === 'completed' ? 'Board repair completed' : 'Board repair initiated',
          technician: repair.profiles?.full_name || 'Unknown',
          poNumber: repair.ptl_orders?.hardware_orders?.po_number,
          boardId: repair.qr_code,
          details: repair.failure_reason
        });
      });

      // Add order logs
      orders?.forEach(order => {
        logEntries.push({
          id: `order-${order.id}`,
          timestamp: order.created_at,
          type: 'order',
          level: 'info',
          message: 'New PTL order created',
          technician: order.profiles?.full_name || 'Unknown',
          poNumber: order.hardware_orders?.po_number,
          details: `PTL Order: ${order.ptl_order_number}`
        });
      });

      logEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(logEntries);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.poNumber && log.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (log.boardId && log.boardId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesTech = techFilter === 'all' || log.technician === techFilter;
    
    const logDate = new Date(log.timestamp);
    const matchesDateFrom = !dateFrom || logDate >= dateFrom;
    const matchesDateTo = !dateTo || logDate <= dateTo;
    
    return matchesSearch && matchesType && matchesLevel && matchesTech && matchesDateFrom && matchesDateTo;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'test': return 'bg-purple-100 text-purple-800';
      case 'repair': return 'bg-orange-100 text-orange-800';
      case 'order': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const uniqueTechnicians = Array.from(new Set(logs.map(log => log.technician)));

  const exportLogs = () => {
    // TODO: Implement actual export functionality
    console.log('Exporting logs...', filteredLogs);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Log History</h1>
          <p className="text-muted-foreground">Monitor system activity and testing logs</p>
        </div>
        <Button onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <Label htmlFor="search">Search Logs</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search messages, technician, PO, or board ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Filter by Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="level">Filter by Level</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="technician">Filter by Technician</Label>
              <Select value={techFilter} onValueChange={setTechFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Technicians" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {uniqueTechnicians.map((tech) => (
                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            System activity and testing logs sorted by most recent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(log.type)}>
                      {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      <Badge variant="outline" className={getLevelColor(log.level)}>
                        {log.level}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.message}</div>
                      {log.details && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={log.technician === 'System' ? 'text-muted-foreground font-mono' : ''}>
                      {log.technician}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.poNumber && (
                        <div className="font-mono">{log.poNumber}</div>
                      )}
                      {log.boardId && (
                        <div className="text-xs text-muted-foreground font-mono">{log.boardId}</div>
                      )}
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

export default LogHistory;