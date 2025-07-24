import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wrench, Search, Filter, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RepairEntry {
  id: string;
  qr_code: string;
  board_type: string;
  failure_reason: string;
  failure_date: string;
  repair_status: 'pending' | 'in_progress' | 'completed' | 'scrapped';
  assigned_technician_id?: string;
  repair_notes?: string;
  repair_start_date?: string;
  repair_completed_date?: string;
  retest_results?: 'pass' | 'fail';
  ptl_order_id: string;
  ptl_orders?: {
    ptl_order_number: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface RepairFilters {
  status?: RepairEntry['repair_status'];
  technician?: string;
}

const RepairLog: React.FC = () => {
  const [repairEntries, setRepairEntries] = useState<RepairEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RepairFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<RepairEntry | null>(null);
  const [repairNotes, setRepairNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRepairEntries();
  }, []);

  const fetchRepairEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('repair_entries')
        .select(`
          *,
          ptl_orders(ptl_order_number),
          profiles(full_name)
        `)
        .order('failure_date', { ascending: false });

      if (error) throw error;
      setRepairEntries(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load repair entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: RepairEntry['repair_status']) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'in_progress': return 'secondary';
      case 'completed': return 'default';
      case 'scrapped': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: RepairEntry['repair_status']) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'scrapped': return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredEntries = repairEntries.filter(entry => {
    const matchesSearch = entry.qr_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.board_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.failure_reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || entry.repair_status === filters.status;
    const matchesTechnician = !filters.technician || entry.profiles?.full_name === filters.technician;
    
    return matchesSearch && matchesStatus && matchesTechnician;
  });

  const handleUpdateRepair = async (entryId: string, updates: Partial<RepairEntry>) => {
    try {
      const { error } = await supabase
        .from('repair_entries')
        .update(updates)
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Repair Updated",
        description: "Repair entry has been updated successfully",
      });
      
      fetchRepairEntries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update repair entry",
        variant: "destructive",
      });
    }
  };

  const handleAssignTechnician = async (entryId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await handleUpdateRepair(entryId, {
        assigned_technician_id: user.id,
        repair_status: 'in_progress',
        repair_start_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign technician",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Repair Log</h1>
          <p className="text-muted-foreground">Track and manage failed board repairs</p>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search QR code, board type, or failure reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({...filters, status: value === 'all' ? undefined : value as RepairEntry['repair_status']})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scrapped">Scrapped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.technician || 'all'} onValueChange={(value) => setFilters({...filters, technician: value === 'all' ? undefined : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {Array.from(new Set(repairEntries.map(entry => entry.profiles?.full_name).filter(Boolean))).map((tech) => (
                  <SelectItem key={tech} value={tech!}>{tech}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {setFilters({}); setSearchTerm('');}}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Repair Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Repair Entries ({filteredEntries.length})
          </CardTitle>
          <CardDescription>
            Click on any entry to view details and update repair progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR Code</TableHead>
                <TableHead>Board Type</TableHead>
                <TableHead>Failure Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{entry.qr_code}</TableCell>
                  <TableCell>{entry.board_type}</TableCell>
                  <TableCell>{new Date(entry.failure_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(entry.repair_status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(entry.repair_status)}
                      {entry.repair_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.profiles?.full_name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedEntry(entry)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            Repair Details - {entry.qr_code}
                          </DialogTitle>
                          <DialogDescription>
                            {entry.board_type} from {entry.ptl_orders?.ptl_order_number}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Failure Reason</Label>
                              <div className="p-2 bg-muted rounded text-sm">{entry.failure_reason}</div>
                            </div>
                            <div>
                              <Label>Current Status</Label>
                              <Badge variant={getStatusColor(entry.repair_status)} className="flex items-center gap-1 w-fit mt-1">
                                {getStatusIcon(entry.repair_status)}
                                {entry.repair_status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          {entry.repair_notes && (
                            <div>
                              <Label>Repair Notes</Label>
                              <div className="p-2 bg-muted rounded text-sm">{entry.repair_notes}</div>
                            </div>
                          )}
                          <div>
                            <Label htmlFor="new-notes">Add Repair Notes</Label>
                            <Textarea
                              id="new-notes"
                              placeholder="Enter repair progress notes..."
                              value={repairNotes}
                              onChange={(e) => setRepairNotes(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleUpdateRepair(entry.id, { repair_notes: repairNotes })}>
                              Update Notes
                            </Button>
                            {entry.repair_status === 'pending' && (
                              <Button variant="outline" onClick={() => handleAssignTechnician(entry.id)}>
                                Assign to Me
                              </Button>
                            )}
                            {entry.repair_status === 'in_progress' && (
                              <Button variant="default" onClick={() => handleUpdateRepair(entry.id, { repair_status: 'completed', repair_completed_date: new Date().toISOString().split('T')[0] })}>
                                Mark Complete
                              </Button>
                            )}
                          </div>
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

export default RepairLog;