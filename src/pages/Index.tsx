import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [boardId, setBoardId] = useState('');
  const [boardDetails, setBoardDetails] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const validateInput = (value: string): boolean => {
    // Enhanced validation to prevent common attacks
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
    
    // Check for dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        return false;
      }
    }
    
    // Check length limits and basic format
    if (value.length > 100 || value.length < 1) {
      return false;
    }
    
    return true;
  };

  const handleBoardLookup = async () => {
    if (!boardId.trim()) {
      setLookupError('Please enter a board ID');
      return;
    }

    if (!validateInput(boardId)) {
      setLookupError('Invalid characters in board ID');
      return;
    }

    setLookupLoading(true);
    setLookupError('');
    setBoardDetails(null);

    try {
      const { data, error } = await supabase.rpc('lookup_board_details', {
        p_qr_code: boardId.trim()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const board = data[0];
        const serialNumber = board.sequence_number ? board.sequence_number.slice(-7) : 'N/A';
        
        setBoardDetails({
          boardId: board.qr_code,
          serialNumber: serialNumber,
          productId: board.board_type || 'N/A',
          dateCode: board.date_code || 'N/A',
          firmwareVersion: board.firmware_revision || 'N/A'
        });
      } else {
        setBoardDetails(null);
        setLookupError(`No board found with ID: ${boardId}`);
      }
    } catch (error) {
      console.error('Board lookup error:', error);
      setBoardDetails(null);
      setLookupError('Error looking up board details');
    } finally {
      setLookupLoading(false);
    }
  };

  const logoUrl = '/lovable-uploads/792a7450-aa55-4890-b4ce-2d6c68e8f6e3.png';

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Sign In button */}
      <div className="w-full p-4">
        <div className="flex justify-between items-center">
          <img src={logoUrl} alt="Circuit Works Inc. logo" className="h-12 w-auto" />
          <Link to="/login">
            <Button variant="default">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Search className="h-6 w-6" />
                Board Lookup
              </CardTitle>
              <p className="text-muted-foreground">
                Enter or scan a board ID to view details
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
                  onKeyDown={(e) => e.key === 'Enter' && handleBoardLookup()}
                  maxLength={100}
                />
              </div>
              
              <Button 
                onClick={handleBoardLookup} 
                disabled={lookupLoading || !boardId.trim()} 
                className="w-full"
                variant="default"
              >
                {lookupLoading ? 'Looking up...' : 'Lookup Board'}
              </Button>

              {lookupError && (
                <Alert variant="destructive">
                  <AlertDescription>{lookupError}</AlertDescription>
                </Alert>
              )}

              {boardDetails && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Board Information</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Info</TableHead>
                        <TableHead>Results</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Board ID</TableCell>
                        <TableCell className="font-mono">{boardDetails.boardId}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Product ID</TableCell>
                        <TableCell className="font-mono">{boardDetails.productId}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Date Code</TableCell>
                        <TableCell className="font-mono">{boardDetails.dateCode}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Firmware Version</TableCell>
                        <TableCell className="font-mono">{boardDetails.firmwareVersion}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Serial Number</TableCell>
                        <TableCell className="font-mono">{boardDetails.serialNumber}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;