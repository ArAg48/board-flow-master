import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BoardLookup = () => {
  const [boardId, setBoardId] = useState('');
  const [boardDetails, setBoardDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [firmwareDialogOpen, setFirmwareDialogOpen] = useState(false);
  const [firmwareValue, setFirmwareValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const validateInput = (value: string): boolean => {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i,
      /expression\(/i,
      /vbscript:/i,
      /data:/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        return false;
      }
    }
    
    return value.length <= 100 && value.length >= 1;
  };

  const handleLookup = async () => {
    if (!boardId.trim()) {
      setError('Please enter a board ID');
      return;
    }

    if (!validateInput(boardId)) {
      setError('Invalid characters in board ID');
      return;
    }

    setLoading(true);
    setError('');
    setBoardDetails(null);

    try {
      const { data, error } = await supabase.rpc('lookup_board_details', {
        p_qr_code: boardId.trim()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const board = data[0];
        console.log('Board data found:', board);
        
        const serialNumber = board.sequence_number ? board.sequence_number.slice(-7) : 'N/A';
        
        setBoardDetails({
          boardId: board.qr_code,
          serialNumber: serialNumber,
          assemblyNumber: board.assembly_number,
          boardType: board.board_type || 'N/A',
          testStatus: board.test_status,
          dateCode: board.date_code || 'N/A',
          ptlOrderNumber: board.ptl_order_number || 'N/A',
          firmwareVersion: board.firmware_revision || 'N/A',
          technicianName: board.technician_name || 'N/A'
        });
        setFirmwareValue(board.firmware_revision || '');
      } else {
        setBoardDetails(null);
        setError(`No board found with ID: ${boardId}`);
      }
    } catch (error) {
      console.error('Board lookup error:', error);
      setBoardDetails(null);
      setError('Error looking up board details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFirmware = async () => {
    if (!boardDetails || !firmwareValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a firmware version",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_board_firmware', {
        p_qr_code: boardDetails.boardId,
        p_firmware_revision: firmwareValue.trim()
      });

      if (error) throw error;

      // Update local data
      setBoardDetails({
        ...boardDetails,
        firmwareVersion: firmwareValue.trim()
      });

      setFirmwareDialogOpen(false);
      setFirmwareValue('');
      toast({
        title: "Success",
        description: "Firmware version updated successfully",
      });
    } catch (error) {
      console.error('Firmware update error:', error);
      toast({
        title: "Error",
        description: "Failed to update firmware version",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const openFirmwareDialog = () => {
    setFirmwareValue(boardDetails?.firmwareVersion || '');
    setFirmwareDialogOpen(true);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Search className="h-6 w-6" />
              Board Lookup
            </CardTitle>
            <p className="text-muted-foreground">
              Enter or scan a board ID to view details and update firmware
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="boardId">Board ID</Label>
              <Input
                id="boardId"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                placeholder="Enter or scan board ID"
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                maxLength={100}
              />
            </div>
            
            <Button 
              onClick={handleLookup} 
              disabled={loading || !boardId.trim()} 
              className="w-full"
            >
              {loading ? 'Looking up...' : 'Lookup Board'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {boardDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Board Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Board ID</TableCell>
                    <TableCell className="font-mono">{boardDetails.boardId}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Serial Number</TableCell>
                    <TableCell className="font-mono">{boardDetails.serialNumber}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Board Type</TableCell>
                    <TableCell className="font-mono">{boardDetails.boardType}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Date Code</TableCell>
                    <TableCell className="font-mono">{boardDetails.dateCode}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Firmware Version</TableCell>
                    <TableCell className="font-mono">{boardDetails.firmwareVersion}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <Dialog open={firmwareDialogOpen} onOpenChange={setFirmwareDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={openFirmwareDialog}
                    className="w-full mt-4"
                  >
                    Update Firmware Version
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Firmware Version</DialogTitle>
                    <DialogDescription>
                      Enter the new firmware version for this board.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="firmwareInput">Firmware Version</Label>
                      <Input
                        id="firmwareInput"
                        value={firmwareValue}
                        onChange={(e) => setFirmwareValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateFirmware()}
                        className="font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setFirmwareDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateFirmware} 
                        disabled={updating || !firmwareValue.trim()}
                      >
                        {updating ? 'Updating...' : 'Update'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BoardLookup;