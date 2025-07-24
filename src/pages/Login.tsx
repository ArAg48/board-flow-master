import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [boardId, setBoardId] = useState('');
  const [boardDetails, setBoardDetails] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const { login, user } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome to PTL Order System',
        });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };


  const handleBoardLookup = async () => {
    if (!boardId.trim()) return;
    
    setLookupLoading(true);
    setLookupError('');
    setBoardDetails(null);

    try {
      // TODO: Replace with actual API call to your backend
      // const response = await fetch(`/api/board-lookup/${boardId}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      setTimeout(() => {
        if (boardId === 'DEMO123') {
          setBoardDetails({
            boardId: 'DEMO123',
            assemblyNumber: '257411E',
            revision: 'Rev C',
            saleCode: '1234-ABC',
            firmwareVersion: '1.3',
            dateCode: '2024',
            status: 'Tested - Passed',
            testDate: '2024-01-15',
            technician: 'tech001',
            notes: 'All tests passed successfully'
          });
        } else {
          setLookupError('Board ID not found');
        }
        setLookupLoading(false);
      }, 1000);
    } catch (err) {
      setLookupError('Error looking up board details');
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
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
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
            <div className="space-y-3 mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm">Board Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Board ID:</span>
                  <p className="font-medium">{boardDetails.boardId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Assembly:</span>
                  <p className="font-medium">{boardDetails.assemblyNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Revision:</span>
                  <p className="font-medium">{boardDetails.revision}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sale Code:</span>
                  <p className="font-medium">{boardDetails.saleCode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Firmware:</span>
                  <p className="font-medium">{boardDetails.firmwareVersion}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date Code:</span>
                  <p className="font-medium">{boardDetails.dateCode}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium text-green-600">{boardDetails.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Test Date:</span>
                  <p className="font-medium">{boardDetails.testDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Technician:</span>
                  <p className="font-medium">{boardDetails.technician}</p>
                </div>
                {boardDetails.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="font-medium">{boardDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Login;