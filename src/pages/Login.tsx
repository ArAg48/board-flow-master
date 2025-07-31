import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [boardId, setBoardId] = useState('');
  const [boardDetails, setBoardDetails] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Enhanced input validation
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    
    if (!validateInput(username) || !validateInput(password)) {
      setError('Invalid characters detected in input');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(username.trim(), password);
      if (success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome to PTL Order System',
        });
      } else {
        setError('Invalid username or password. Please check your credentials.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleBoardLookup = async () => {
    if (!boardId.trim()) return;
    
    // Validate board ID input
    if (!validateInput(boardId)) {
      setLookupError('Invalid characters in board ID');
      return;
    }
    
    setLookupLoading(true);
    setLookupError('');
    setBoardDetails(null);

    try {
      // Use the new secure lookup function
      const { data, error } = await supabase
        .rpc('lookup_board_details', { p_qr_code: boardId.trim() });

      if (error || !data || data.length === 0) {
        setLookupError('Board ID not found');
        setLookupLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const board = data[0]; // Get first result from RPC function
        console.log('Board data found:', board);
        
        // Extract serial number as last 7 digits
        const serialNumber = board.sequence_number ? board.sequence_number.slice(-7) : 'N/A';
        
        setBoardDetails({
          boardId: board.qr_code,
          serialNumber: serialNumber,
          assemblyNumber: board.assembly_number,
          hardwareRevision: board.board_type,
          saleCode: board.sale_code || board.ptl_order_number || 'N/A',
          firmwareVersion: board.firmware_revision || 'N/A',
          dateCode: board.date_code || 'N/A',
          status: board.test_status === 'pass' ? 'Tested - Passed' : 
                  board.test_status === 'fail' ? 'Tested - Failed' : 'Pending',
          testDate: board.test_date ? new Date(board.test_date).toLocaleDateString() : 'N/A',
          technicianName: board.technician_name || 'N/A',
        });
      } else {
        console.log('No board data found for:', boardId);
        setBoardDetails(null);
        setLookupError(`No board found with ID: ${boardId}`);
      }
    } catch (err) {
      setLookupError('Error looking up board details');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="flex gap-6 w-full max-w-4xl">
        <Card className="w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">PTL Order System</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder="Enter your username"
                maxLength={50}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                maxLength={50}
                autoComplete="current-password"
                required
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
          </form>
          
        </CardContent>
      </Card>

      {/* Customer Board Lookup */}
      <Card className="w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Search className="h-6 w-6" />
            Board Lookup
          </CardTitle>
          <CardDescription className="text-center">
            Enter or scan a board ID to view details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="boardId">Board ID</Label>
            <Input
              id="boardId"
              type="text"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="Enter or scan board ID"
              onKeyDown={(e) => e.key === 'Enter' && handleBoardLookup()}
            />
          </div>

          <Button 
            onClick={handleBoardLookup} 
            className="w-full" 
            disabled={lookupLoading || !boardId.trim()}
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
              <h4 className="font-semibold text-sm mb-3">Board Details:</h4>
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
                    <TableCell className="font-medium">Sale Code</TableCell>
                    <TableCell className="font-mono">{boardDetails.saleCode}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Firmware Version</TableCell>
                    <TableCell className="font-mono">{boardDetails.firmwareVersion}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Date Code</TableCell>
                    <TableCell className="font-mono">{boardDetails.dateCode}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
           )}

        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Login;