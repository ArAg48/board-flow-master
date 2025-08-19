import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BoardLookup = () => {
  const [qrCode, setQrCode] = useState('');
  const [boardData, setBoardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editingFirmware, setEditingFirmware] = useState(false);
  const [firmwareValue, setFirmwareValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleLookup = async () => {
    if (!qrCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('lookup_board_details', {
        p_qr_code: qrCode.trim()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setBoardData(data[0]);
        setFirmwareValue(data[0].firmware_revision || '');
        console.log('Board data found:', data[0]);
      } else {
        setBoardData(null);
        toast({
          title: "Not Found",
          description: "No board found with this QR code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Board lookup error:', error);
      setBoardData(null);
      toast({
        title: "Error",
        description: "Failed to lookup board",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFirmware = async () => {
    if (!boardData || !firmwareValue.trim()) {
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
        p_qr_code: boardData.qr_code,
        p_firmware_revision: firmwareValue.trim()
      });

      if (error) throw error;

      // Update local data
      setBoardData({
        ...boardData,
        firmware_revision: firmwareValue.trim()
      });

      setEditingFirmware(false);
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

  const cancelEdit = () => {
    setEditingFirmware(false);
    setFirmwareValue(boardData?.firmware_revision || '');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Board Lookup</CardTitle>
            <p className="text-center text-muted-foreground">
              Search for board information and update firmware versions
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qrCode">QR Code / Board ID</Label>
              <Input
                id="qrCode"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Enter QR code..."
                onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>
            <Button onClick={handleLookup} disabled={loading} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Looking up...' : 'Lookup Board'}
            </Button>
          </CardContent>
        </Card>

        {boardData && (
          <Card>
            <CardHeader>
              <CardTitle>Board Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-semibold">Board ID:</Label>
                  <p className="text-muted-foreground">{boardData.qr_code}</p>
                </div>
                <div>
                  <Label className="font-semibold">Serial Number:</Label>
                  <p className="text-muted-foreground">{boardData.sequence_number || boardData.qr_code}</p>
                </div>
                <div>
                  <Label className="font-semibold">Board Type:</Label>
                  <p className="text-muted-foreground">{boardData.board_type || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Test Status:</Label>
                  <p className="text-muted-foreground">{boardData.test_status || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Date Code:</Label>
                  <p className="text-muted-foreground">{boardData.date_code || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">PTL Order:</Label>
                  <p className="text-muted-foreground">{boardData.ptl_order_number || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="font-semibold">Firmware Version:</Label>
                {editingFirmware ? (
                  <div className="flex gap-2">
                    <Input
                      value={firmwareValue}
                      onChange={(e) => setFirmwareValue(e.target.value)}
                      placeholder="Enter firmware version"
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateFirmware()}
                    />
                    <Button 
                      onClick={handleUpdateFirmware} 
                      disabled={updating}
                      size="sm"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={cancelEdit} 
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground flex-1">
                      {boardData.firmware_revision || 'Not specified'}
                    </p>
                    <Button 
                      onClick={() => setEditingFirmware(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BoardLookup;