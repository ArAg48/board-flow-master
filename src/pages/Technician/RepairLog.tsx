import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wrench, Search, Filter, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { RepairEntry, RepairFilters } from '@/types/repair-log';
import { useToast } from '@/hooks/use-toast';

const RepairLog: React.FC = () => {
  const [repairEntries] = useState<RepairEntry[]>([
    {
      id: 'repair-001',
      qrCode: 'PCB-ABC12345',
      boardType: 'Main Control Board v2.1',
      failureReason: 'Voltage regulator failure - output voltage 3.2V instead of 3.3V',
      failureDate: new Date('2024-01-15T10:30:00'),
      repairStatus: 'completed',
      assignedTechnician: 'John Smith',
      repairNotes: 'Replaced U3 voltage regulator. Tested at 3.31V output. Retested all functionality.',
      repairStartDate: new Date('2024-01-16T09:00:00'),
      repairCompletedDate: new Date('2024-01-16T11:30:00'),
      retestResults: 'pass',
      ptlOrderNumber: 'PTL-2024-001',
      originalSessionId: 'session-001'
    },
    {
      id: 'repair-002',
      qrCode: 'SIB-789012-AB',
      boardType: 'Sensor Interface Board',
      failureReason: 'ADC channel 2 reading incorrect values',
      failureDate: new Date('2024-01-14T14:20:00'),
      repairStatus: 'in-progress',
      assignedTechnician: 'Sarah Johnson',
      repairNotes: 'Investigating ADC circuitry. Suspect C15 capacitor issue.',
      repairStartDate: new Date('2024-01-15T08:00:00'),
      ptlOrderNumber: 'PTL-2024-002',
      originalSessionId: 'session-002'
    },
    {
      id: 'repair-003',
      qrCode: 'PCB-DEF67890',
      boardType: 'Main Control Board v2.1',
      failureReason: 'No power on LED indicator',
      failureDate: new Date('2024-01-13T16:45:00'),
      repairStatus: 'pending',
      ptlOrderNumber: 'PTL-2024-001',
      originalSessionId: 'session-003'
    }
  ]);

  const [filters, setFilters] = useState<RepairFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<RepairEntry | null>(null);
  const [repairNotes, setRepairNotes] = useState('');
  const { toast } = useToast();

  const getStatusColor = (status: RepairEntry['repairStatus']) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'in-progress': return 'secondary';
      case 'completed': return 'default';
      case 'scrapped': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: RepairEntry['repairStatus']) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'scrapped': return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredEntries = repairEntries.filter(entry => {
    const matchesSearch = entry.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.boardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.failureReason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || entry.repairStatus === filters.status;
    const matchesTechnician = !filters.technician || entry.assignedTechnician === filters.technician;
    
    return matchesSearch && matchesStatus && matchesTechnician;
  });

  const handleUpdateRepair = (entryId: string, updates: Partial<RepairEntry>) => {
    // In real app, this would call an API
    toast({
      title: "Repair Updated",
      description: "Repair entry has been updated successfully",
    });
  };

  const handleAssignTechnician = (entryId: string, technician: string) => {
    handleUpdateRepair(entryId, {
      assignedTechnician: technician,
      repairStatus: 'in-progress',
      repairStartDate: new Date()
    });
  };

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
            <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value as RepairEntry['repairStatus'] || undefined})}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scrapped">Scrapped</SelectItem>
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
                  <TableCell className="font-medium">{entry.qrCode}</TableCell>
                  <TableCell>{entry.boardType}</TableCell>
                  <TableCell>{entry.failureDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(entry.repairStatus)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(entry.repairStatus)}
                      {entry.repairStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.assignedTechnician || 'Unassigned'}</TableCell>
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
                            Repair Details - {entry.qrCode}
                          </DialogTitle>
                          <DialogDescription>
                            {entry.boardType} from {entry.ptlOrderNumber}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Failure Reason</Label>
                              <div className="p-2 bg-muted rounded text-sm">{entry.failureReason}</div>
                            </div>
                            <div>
                              <Label>Current Status</Label>
                              <Badge variant={getStatusColor(entry.repairStatus)} className="flex items-center gap-1 w-fit mt-1">
                                {getStatusIcon(entry.repairStatus)}
                                {entry.repairStatus}
                              </Badge>
                            </div>
                          </div>
                          {entry.repairNotes && (
                            <div>
                              <Label>Repair Notes</Label>
                              <div className="p-2 bg-muted rounded text-sm">{entry.repairNotes}</div>
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
                            <Button onClick={() => handleUpdateRepair(entry.id, { repairNotes })}>
                              Update Notes
                            </Button>
                            {entry.repairStatus === 'pending' && (
                              <Button variant="outline" onClick={() => handleAssignTechnician(entry.id, 'Current User')}>
                                Assign to Me
                              </Button>
                            )}
                            {entry.repairStatus === 'in-progress' && (
                              <Button variant="default" onClick={() => handleUpdateRepair(entry.id, { repairStatus: 'completed', repairCompletedDate: new Date() })}>
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