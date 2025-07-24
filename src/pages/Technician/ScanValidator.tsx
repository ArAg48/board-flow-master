import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PTLOrder, ValidationSession, ScanEntry, TesterConfig, PreTestVerification, PostTestVerification } from '@/types/scan-validator';
import PTLOrderSelector from '@/components/ScanValidator/PTLOrderSelector';
import PreTestVerificationComponent from '@/components/ScanValidator/PreTestVerification';
import TesterConfiguration from '@/components/ScanValidator/TesterConfiguration';
import ScanningInterface from '@/components/ScanValidator/ScanningInterface';
import PostTestVerificationComponent from '@/components/ScanValidator/PostTestVerification';
import RealTimeTracking from '@/components/ScanValidator/RealTimeTracking';

const ScanValidator: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<ValidationSession | null>(null);
  const [availableOrders, setAvailableOrders] = useState<PTLOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeDialog, setResumeDialog] = useState<{ open: boolean; session: any | null }>({ 
    open: false, 
    session: null 
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Load PTL orders and check for active sessions on component mount
  useEffect(() => {
    if (user) {
      loadPTLOrders();
      checkForActiveSession();
    }
  }, [user]);

  // Auto-save session when it changes
  useEffect(() => {
    if (currentSession && user && (currentSession.status === 'scanning' || currentSession.status === 'paused' || currentSession.status === 'break')) {
      saveSession();
    }
  }, [currentSession, user]);

  const loadPTLOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch PTL orders with hardware order details
      const { data: ptlOrdersData, error: ptlError } = await supabase
        .from('ptl_orders')
        .select(`
          *,
          hardware_orders(starting_sequence)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ptlError) throw ptlError;

      // Transform database records to PTLOrder format
      const transformedOrders: PTLOrder[] = (ptlOrdersData || []).map(order => {
        const hardwareOrder = order.hardware_orders as any;
        const startSequence = hardwareOrder?.starting_sequence || '411E0000001';
        const first4Chars = startSequence.substring(0, 4);
        
        return {
          id: order.id,
          orderNumber: order.ptl_order_number,
          boardType: order.board_type,
          expectedFormat: `^${first4Chars}\\d{7}$`, // First 4 chars + 7 digits
          expectedCount: order.quantity,
          priority: 'medium' as const, // Default priority
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
        };
      });

      setAvailableOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading PTL orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load PTL orders.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForActiveSession = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_active_session_for_user', {
        user_id: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const activeSession = data[0];
        setResumeDialog({ open: true, session: activeSession });
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
    }
  };

  const saveSession = async () => {
    if (!currentSession || !user?.id) return;

    try {
      const sessionData = JSON.parse(JSON.stringify({
        id: currentSession.id,
        status: currentSession.status,
        startTime: currentSession.startTime.toISOString(),
        testerConfig: currentSession.testerConfig,
        preTestVerification: currentSession.preTestVerification,
        postTestVerification: currentSession.postTestVerification,
        scannedEntries: currentSession.scannedEntries.map(entry => ({
          ...entry,
          timestamp: entry.timestamp.toISOString()
        })),
        totalDuration: currentSession.totalDuration,
        pausedTime: currentSession.pausedTime?.toISOString(),
        breakTime: currentSession.breakTime?.toISOString(),
        endTime: currentSession.endTime?.toISOString()
      }));

      await supabase.rpc('save_session', {
        p_session_id: currentSession.id,
        p_technician_id: user.id,
        p_ptl_order_id: currentSession.ptlOrder.id,
        p_session_data: sessionData,
        p_status: currentSession.status,
        p_paused_at: currentSession.pausedTime?.toISOString() || null,
        p_break_started_at: currentSession.breakTime?.toISOString() || null
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const resumeActiveSession = async () => {
    const sessionData = resumeDialog.session;
    if (!sessionData) return;

    try {
      // Find the corresponding PTL order
      const ptlOrder = availableOrders.find(order => order.id === sessionData.ptl_order_id);
      if (!ptlOrder) {
        toast({
          title: 'Error',
          description: 'Could not find the PTL order for this session.',
          variant: 'destructive'
        });
        return;
      }

      // Reconstruct the session from stored data
      const storedData = sessionData.session_data;
      const reconstructedSession: ValidationSession = {
        id: sessionData.session_id,
        ptlOrder,
        testerConfig: storedData.testerConfig || { type: 1, scanBoxes: 1 },
        preTestVerification: storedData.preTestVerification || { testerCheck: true, firmwareCheck: true },
        startTime: new Date(storedData.startTime || sessionData.start_time),
        pausedTime: sessionData.paused_at ? new Date(sessionData.paused_at) : undefined,
        breakTime: sessionData.break_started_at ? new Date(sessionData.break_started_at) : undefined,
        status: sessionData.break_started_at ? 'break' : 'paused',
        scannedEntries: (storedData.scannedEntries || []).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })),
        totalDuration: storedData.totalDuration || 0
      };

      setCurrentSession(reconstructedSession);
      setResumeDialog({ open: false, session: null });

      toast({
        title: 'Session Resumed',
        description: 'Your previous session has been restored.'
      });
    } catch (error) {
      console.error('Error resuming session:', error);
      toast({
        title: 'Error',
        description: 'Failed to resume session.',
        variant: 'destructive'
      });
    }
  };

  const startNewSessionFromDialog = async () => {
    if (resumeDialog.session && user?.id) {
      // Deactivate the old session
      try {
        await supabase.rpc('deactivate_session', {
          p_session_id: resumeDialog.session.session_id
        });
      } catch (error) {
        console.error('Error deactivating old session:', error);
      }
    }
    
    setResumeDialog({ open: false, session: null });
    setCurrentSession(null);
  };

  const handleOrderSelect = (order: PTLOrder) => {
    if (!currentSession) {
      const newSession: ValidationSession = {
        id: `session-${Date.now()}`,
        ptlOrder: order,
        testerConfig: { type: 1, scanBoxes: 1 },
        preTestVerification: {
          testerCheck: false,
          firmwareCheck: false
        },
        startTime: new Date(),
        status: 'setup',
        scannedEntries: [],
        totalDuration: 0
      };
      setCurrentSession(newSession);
    }
  };

  const handlePreTestComplete = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'pre-test' });
    }
  };

  const handleTesterConfigComplete = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'scanning' });
    }
  };

  const handleScanEntry = (entry: ScanEntry) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      scannedEntries: [...currentSession.scannedEntries, entry]
    };
    setCurrentSession(updatedSession);
  };

  const handlePause = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'paused', pausedTime: new Date() });
    }
  };

  const handleBreak = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'break', breakTime: new Date() });
    }
  };

  const handleResume = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'scanning' });
    }
  };

  const handleFinishPTL = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'post-test' });
    }
  };

  const handlePostTestComplete = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        endTime: new Date(),
        status: 'completed' as const
      };
      setCurrentSession(updatedSession);
      
      const passed = currentSession.scannedEntries.filter(e => e.testResult === 'pass').length;
      const failed = currentSession.scannedEntries.filter(e => e.testResult === 'fail').length;
      
      toast({
        title: "Session Completed",
        description: `Processed ${currentSession.scannedEntries.length} boards - ${passed} passed, ${failed} failed`
      });
    }
  };

  const startNewSession = () => {
    setCurrentSession(null);
  };

  const getSessionDuration = () => {
    if (!currentSession) return '00:00:00';
    const start = currentSession.startTime;
    const end = currentSession.endTime || new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSessionStats = () => {
    if (!currentSession) return { total: 0, passed: 0, failed: 0, passRate: 0 };
    
    const total = currentSession.scannedEntries.length;
    const passed = currentSession.scannedEntries.filter(e => e.testResult === 'pass').length;
    const failed = currentSession.scannedEntries.filter(e => e.testResult === 'fail').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    return { total, passed, failed, passRate };
  };

  const stats = getSessionStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scan Validator</h1>
          <p className="text-muted-foreground">Complete PCB validation workflow with PTL order management</p>
        </div>
        {currentSession?.status === 'completed' && (
          <Button onClick={startNewSession}>
            Start New Session
          </Button>
        )}
      </div>

      {/* Session Status Card */}
      {currentSession && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Order: {currentSession.ptlOrder.orderNumber} - {currentSession.ptlOrder.boardType}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Duration: {getSessionDuration()}</span>
              <Badge variant={
                currentSession.status === 'scanning' ? 'default' :
                currentSession.status === 'paused' ? 'secondary' :
                currentSession.status === 'break' ? 'outline' :
                'default'
              }>
                {currentSession.status}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.passRate}%</div>
              <div className="text-xs text-muted-foreground">Pass Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Steps */}
      {!currentSession && (
        <PTLOrderSelector
          orders={availableOrders}
          selectedOrder={null}
          onOrderSelect={handleOrderSelect}
          onConfirm={handlePreTestComplete}
        />
      )}

      {currentSession?.status === 'setup' && (
        <PreTestVerificationComponent
          verification={currentSession.preTestVerification}
          onVerificationChange={(verification) => 
            setCurrentSession({ ...currentSession, preTestVerification: verification })
          }
          onComplete={handlePreTestComplete}
        />
      )}

      {currentSession?.status === 'pre-test' && (
        <TesterConfiguration
          config={currentSession.testerConfig}
          onConfigChange={(config) => 
            setCurrentSession({ ...currentSession, testerConfig: config })
          }
          onConfirm={handleTesterConfigComplete}
        />
      )}

      {(currentSession?.status === 'scanning' || currentSession?.status === 'paused' || currentSession?.status === 'break') && (
        <div className="space-y-6">
          <RealTimeTracking session={currentSession} />
          <ScanningInterface
            testerConfig={currentSession.testerConfig}
            ptlOrder={currentSession.ptlOrder}
            scannedEntries={currentSession.scannedEntries}
            onScanEntry={handleScanEntry}
            onPause={handlePause}
            onBreak={handleBreak}
            onResume={handleResume}
            onFinishPTL={handleFinishPTL}
            isActive={currentSession.status === 'scanning'}
            isBreakMode={currentSession.status === 'break'}
          />
        </div>
      )}

      {currentSession?.status === 'post-test' && (
        <PostTestVerificationComponent
          verification={{
            finalCount: stats.total,
            accessUpdaterSync: false
          }}
          expectedCount={currentSession.ptlOrder.expectedCount}
          actualCount={stats.total}
          onVerificationChange={(verification) => 
            setCurrentSession({ ...currentSession, postTestVerification: verification })
          }
          onComplete={handlePostTestComplete}
        />
      )}

      {currentSession?.status === 'completed' && (
        <div className="text-center p-8 border rounded-lg bg-green-50">
          <h3 className="text-xl font-semibold text-green-700 mb-2">Session Completed Successfully!</h3>
          <p className="text-green-600">
            All validation steps completed for order {currentSession.ptlOrder.orderNumber}
          </p>
          <Progress value={100} className="h-2 mt-4" />
        </div>
      )}

      {/* Resume Session Dialog */}
      <Dialog open={resumeDialog.open} onOpenChange={(open) => {
        if (!open) {
          setResumeDialog({ open: false, session: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Previous Session?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You have an active session from a previous login. Would you like to resume it or start fresh?
            </p>
            {resumeDialog.session && (
              <div className="p-4 bg-muted rounded-lg text-sm">
                <div><strong>Session:</strong> {resumeDialog.session.session_id}</div>
                <div><strong>Started:</strong> {new Date(resumeDialog.session.start_time).toLocaleString()}</div>
                {resumeDialog.session.paused_at && (
                  <div><strong>Paused:</strong> {new Date(resumeDialog.session.paused_at).toLocaleString()}</div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={startNewSessionFromDialog}>
                Start New Session
              </Button>
              <Button onClick={resumeActiveSession}>
                Resume Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading PTL orders...</div>
        </div>
      )}
    </div>
  );
};

export default ScanValidator;