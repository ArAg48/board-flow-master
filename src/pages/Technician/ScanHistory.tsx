import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { History, Search, Filter, Calendar, Clock, TrendingUp, Users, Target } from 'lucide-react';
import { SessionHistory, HistoryFilters } from '@/types/scan-history';

const ScanHistory: React.FC = () => {
  const [sessions] = useState<SessionHistory[]>([
    {
      id: 'session-001',
      ptlOrderNumber: 'PTL-2024-001',
      boardType: 'Main Control Board v2.1',
      technicianName: 'John Smith',
      startTime: new Date('2024-01-15T09:00:00'),
      endTime: new Date('2024-01-15T11:30:00'),
      duration: 150,
      totalScanned: 45,
      passCount: 42,
      failCount: 3,
      passRate: 93,
      testerConfig: { type: 5, scanBoxes: 5 },
      status: 'completed',
      notes: 'Good session, 3 failures were voltage regulator issues'
    },
    {
      id: 'session-002',
      ptlOrderNumber: 'PTL-2024-002',
      boardType: 'Sensor Interface Board',
      technicianName: 'Sarah Johnson',
      startTime: new Date('2024-01-14T13:30:00'),
      endTime: new Date('2024-01-14T16:45:00'),
      duration: 195,
      totalScanned: 62,
      passCount: 60,
      failCount: 2,
      passRate: 97,
      testerConfig: { type: 10, scanBoxes: 10 },
      status: 'completed'
    },
    {
      id: 'session-003',
      ptlOrderNumber: 'PTL-2024-001',
      boardType: 'Main Control Board v2.1',
      technicianName: 'Mike Wilson',
      startTime: new Date('2024-01-13T10:15:00'),
      duration: 85,
      totalScanned: 28,
      passCount: 25,
      failCount: 3,
      passRate: 89,
      testerConfig: { type: 4, scanBoxes: 4 },
      status: 'paused',
      notes: 'Session paused due to equipment maintenance'
    },
    {
      id: 'session-004',
      ptlOrderNumber: 'PTL-2024-003',
      boardType: 'Power Management Board',
      technicianName: 'John Smith',
      startTime: new Date('2024-01-12T08:00:00'),
      endTime: new Date('2024-01-12T12:30:00'),
      duration: 270,
      totalScanned: 88,
      passCount: 84,
      failCount: 4,
      passRate: 95,
      testerConfig: { type: 10, scanBoxes: 10 },
      status: 'completed',
      notes: 'High throughput session, excellent results'
    }
  ]);

  const [filters, setFilters] = useState<HistoryFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(null);

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
    const matchesSearch = session.ptlOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.boardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.technicianName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || session.status === filters.status;
    const matchesTechnician = !filters.technician || session.technicianName === filters.technician;
    const matchesPTL = !filters.ptlOrder || session.ptlOrderNumber === filters.ptlOrder;
    
    return matchesSearch && matchesStatus && matchesTechnician && matchesPTL;
  });

  // Calculate summary stats
  const totalSessions = filteredSessions.length;
  const avgPassRate = filteredSessions.reduce((sum, s) => sum + s.passRate, 0) / totalSessions || 0;
  const totalScanned = filteredSessions.reduce((sum, s) => sum + s.totalScanned, 0);
  const totalPassed = filteredSessions.reduce((sum, s) => sum + s.passCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scan History</h1>
          <p className="text-muted-foreground">View and analyze past validation sessions</p>
        </div>
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
                <div className="text-2xl font-bold">{new Set(filteredSessions.map(s => s.technicianName)).size}</div>
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
            <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value as SessionHistory['status'] || undefined})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.technician || ''} onValueChange={(value) => setFilters({...filters, technician: value || undefined})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Technicians</SelectItem>
                <SelectItem value="John Smith">John Smith</SelectItem>
                <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                <SelectItem value="Mike Wilson">Mike Wilson</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.ptlOrder || ''} onValueChange={(value) => setFilters({...filters, ptlOrder: value || undefined})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by PTL order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Orders</SelectItem>
                <SelectItem value="PTL-2024-001">PTL-2024-001</SelectItem>
                <SelectItem value="PTL-2024-002">PTL-2024-002</SelectItem>
                <SelectItem value="PTL-2024-003">PTL-2024-003</SelectItem>
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
                  <TableCell className="font-medium">{session.ptlOrderNumber}</TableCell>
                  <TableCell>{session.technicianName}</TableCell>
                  <TableCell>{session.startTime.toLocaleDateString()}</TableCell>
                  <TableCell>{Math.floor(session.duration / 60)}h {session.duration % 60}m</TableCell>
                  <TableCell>{session.totalScanned}</TableCell>
                  <TableCell>
                    <span className={getPassRateColor(session.passRate)}>
                      {session.passRate}%
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
                            Session Details - {session.ptlOrderNumber}
                          </DialogTitle>
                          <DialogDescription>
                            {session.boardType} • {session.startTime.toLocaleDateString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Technician</div>
                              <div className="font-medium">{session.technicianName}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Tester Configuration</div>
                              <div className="font-medium">{session.testerConfig.type}-up ({session.testerConfig.scanBoxes} boxes)</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Start Time</div>
                              <div className="font-medium">{session.startTime.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Duration</div>
                              <div className="font-medium">{Math.floor(session.duration / 60)}h {session.duration % 60}m</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Test Results</div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold">{session.totalScanned}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-green-600">{session.passCount}</div>
                                <div className="text-xs text-muted-foreground">Passed</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-red-600">{session.failCount}</div>
                                <div className="text-xs text-muted-foreground">Failed</div>
                              </div>
                            </div>
                            <Progress value={session.passRate} className="h-2" />
                            <div className="text-center text-sm font-medium">
                              {session.passRate}% Pass Rate
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