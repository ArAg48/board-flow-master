import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [qrCode, setQrCode] = useState('');
  const [boardData, setBoardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
      const response = await apiClient.lookupBoard(qrCode.trim());
      if (response.success && response.data) {
        setBoardData(response.data);
        console.log('Board data found:', response.data);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <p className="text-center text-sm text-muted-foreground">
          Need access? <a href="/auth" className="underline">Sign in or create an account</a>
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Board Lookup</CardTitle>
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <Label className="font-semibold">Board ID:</Label>
                  <p className="text-muted-foreground">{boardData.qr_code}</p>
                </div>
                <div>
                  <Label className="font-semibold">Serial Number:</Label>
                  <p className="text-muted-foreground">{boardData.sequence_number || boardData.qr_code}</p>
                </div>
                <div>
                  <Label className="font-semibold">Sale Code:</Label>
                  <p className="text-muted-foreground">{boardData.sale_code || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Firmware:</Label>
                  <p className="text-muted-foreground">{boardData.firmware_revision || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Date Code:</Label>
                  <p className="text-muted-foreground">{boardData.date_code || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
