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
    
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }

    if (!validateInput(username) || !validateInput(password)) {
      setError('Invalid characters detected in input');
      setIsLoading(false);
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(username.trim(), password);
        toast({
          title: 'Login Successful',
          description: 'Welcome to CKT WORKS Inventory',
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">CKT WORKS Inventory</CardTitle>
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

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Search className="h-6 w-6" />
                Board Lookup
              </CardTitle>
              <CardDescription>
                Enter or scan a board ID to view details
              </CardDescription>
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
                        <TableCell className="font-medium">Date Code</TableCell>
                        <TableCell className="font-mono">{boardDetails.dateCode}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Firmware Version</TableCell>
                        <TableCell className="font-mono">{boardDetails.firmwareVersion}</TableCell>
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

export default Login;