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
      
      // Set up interval to refresh PTL orders every 30 seconds
      const interval = setInterval(() => {
        if (user) {
          loadPTLOrders();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Clear orders when user logs out
      setAvailableOrders([]);
      setLoading(false);
    }
  }, [user]);

  // Auto-save session when it changes
  useEffect(() => {
    if (currentSession && user && (currentSession.status === 'scanning' || currentSession.status === 'paused' || currentSession.status === 'break')) {
      saveSession();
    }
  }, [currentSession, user]);

  // Listen for PTL progress updates to refresh order data
  useEffect(() => {
    const handleProgressUpdate = () => {
      loadPTLOrders();
    };

    window.addEventListener('ptlProgressUpdated', handleProgressUpdate);
    return () => window.removeEventListener('ptlProgressUpdated', handleProgressUpdate);
  }, []);

  const loadPTLOrders = async () => {
    if (!user) {
      console.log('No user found, skipping PTL orders load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading PTL orders for user:', user.id);
      
      // Fetch PTL orders with hardware order details - include both pending and in_progress
      const { data: ptlOrdersData, error: ptlError } = await supabase
        .from('ptl_orders')
        .select(`
          *,
          hardware_orders(starting_sequence)
        `)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false });

      if (ptlError) throw ptlError;

      // Fetch progress data for all orders
      const orderIds = (ptlOrdersData || []).map(order => order.id);
      const { data: progressData } = await supabase
        .from('ptl_order_progress')
        .select('*')
        .in('id', orderIds);

      const progressMap = (progressData || []).reduce((acc, progress) => {
        acc[progress.id] = progress;
        return acc;
      }, {} as Record<string, any>);

      // Transform database records to PTLOrder format
      const transformedOrders: PTLOrder[] = (ptlOrdersData || []).map(order => {
        const hardwareOrder = order.hardware_orders as any;
        const startSequence = hardwareOrder?.starting_sequence || '411E0000001';
        const first4Chars = startSequence.substring(0, 4);
        const progress = progressMap[order.id];
        
        return {
          id: order.id,
          orderNumber: order.ptl_order_number,
          boardType: order.board_type,
          expectedFormat: `^${first4Chars}\\d{7}$`, // First 4 chars + 7 digits
          expectedCount: order.quantity,
          priority: 'medium' as const, // Default priority
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
          scannedCount: progress?.scanned_count || 0,
          passedCount: progress?.passed_count || 0,
          failedCount: progress?.failed_count || 0,
          status: order.status,
        };
      });

      setAvailableOrders(transformedOrders);
      console.log('Loaded PTL orders with progress:', transformedOrders);
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
      // Calculate real-time statistics
      const stats = getSessionStats();
      const duration = currentSession.endTime 
        ? Math.floor((currentSession.endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60))
        : Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / (1000 * 60));

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

      // Save session with accurate counts
      await supabase.rpc('save_session', {
        p_session_id: currentSession.id,
        p_technician_id: user.id,
        p_ptl_order_id: currentSession.ptlOrder.id,
        p_session_data: sessionData,
        p_status: currentSession.status,
        p_paused_at: currentSession.pausedTime?.toISOString() || null,
        p_break_started_at: currentSession.breakTime?.toISOString() || null
      });

      // Update session statistics in database
      await supabase
        .from('scan_sessions')
        .update({
          total_scanned: stats.total,
          pass_count: stats.passed,
          fail_count: stats.failed,
          pass_rate: stats.passRate,
          duration_minutes: duration,
          end_time: currentSession.endTime?.toISOString() || null
        })
        .eq('id', currentSession.id);

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

      // Reconstruct the session using only this session's stored data
      const storedData = sessionData.session_data || {};
      const storedEntries = Array.isArray(storedData.scannedEntries) ? storedData.scannedEntries : [];
      const restoredScannedEntries: ScanEntry[] = storedEntries.map((e: any) => ({
        id: e.id || crypto.randomUUID(),
        boxIndex: e.boxIndex ?? 0,
        qrCode: e.qrCode,
        isValid: e.isValid ?? true,
        timestamp: new Date(e.timestamp),
        testResult: e.testResult,
        failureReason: e.failureReason
      }));

      const reconstructedSession: ValidationSession = {
        id: sessionData.session_id,
        ptlOrder,
        testerConfig: storedData.testerConfig || { type: 1, scanBoxes: 1 },
        preTestVerification: { testerCheck: false, firmwareCheck: false }, // Reset verification for resumed sessions
        startTime: new Date(storedData.startTime || sessionData.start_time),
        pausedTime: sessionData.paused_at ? new Date(sessionData.paused_at) : undefined,
        breakTime: sessionData.break_started_at ? new Date(sessionData.break_started_at) : undefined,
        status: 'pre-test', // Always require pre-test verification when resuming
        scannedEntries: restoredScannedEntries, // Use only this session's entries
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

  const handleOrderSelect = async (order: PTLOrder) => {
    if (!currentSession && user?.id) {
      // First check if there's an existing active session for this PTL order
      try {
        const { data: existingSessions, error } = await supabase
          .from('scan_sessions')
          .select('*')
          .eq('ptl_order_id', order.id)
          .eq('technician_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (existingSessions && existingSessions.length > 0) {
          // Found an existing active session, set up resume dialog
          const existingSession = existingSessions[0];
          setResumeDialog({ 
            open: true, 
            session: {
              session_id: existingSession.id,
              ptl_order_id: existingSession.ptl_order_id,
              session_data: existingSession.session_data,
              start_time: existingSession.start_time,
              paused_at: existingSession.paused_at,
              break_started_at: existingSession.break_started_at
            }
          });
          return;
        }

        // No active session found, start a fresh session
        // Don't load existing board data into the session - session should only track what THIS session scans
      } catch (error) {
        console.error('Error checking for existing session:', error);
      }

      // No existing session found, create a new one
      // Refresh the order data to get the latest progress before starting
      await loadPTLOrders();
      
      // Find the updated order with latest progress
      const updatedOrder = availableOrders.find(o => o.id === order.id) || order;
      
      const newSession: ValidationSession = {
        id: crypto.randomUUID(),
        ptlOrder: updatedOrder,
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

    console.log('handleScanEntry called with:', entry);

    // Use functional setState to ensure we get the most current state
    setCurrentSession(prevSession => {
      console.log('Current session scanned entries before:', prevSession.scannedEntries.length);
      const updatedSession = {
        ...prevSession,
        scannedEntries: [...prevSession.scannedEntries, entry]
      };
      console.log('Updated session scanned entries after:', updatedSession.scannedEntries.length);
      
      // Force a re-render to update stats display
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sessionStatsUpdated'));
      }, 100);
      
      return updatedSession;
    });
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

  const handleFinishPTL = async () => {
    if (currentSession) {
      try {
        // Check current progress directly from board_data table for accurate count
        const { data: boardData, error: boardError } = await supabase
          .from('board_data')
          .select('test_status')
          .eq('ptl_order_id', currentSession.ptlOrder.id);

        if (boardError) throw boardError;

        const currentPassedCount = boardData?.filter(board => board.test_status === 'pass').length || 0;
        const expectedCount = currentSession.ptlOrder.expectedCount;
        
        console.log('PTL Finish Check:', {
          currentPassedCount,
          expectedCount,
          sessionEntries: currentSession.scannedEntries.length,
          boardDataCount: boardData?.length || 0
        });
        
        // Allow finishing if there are scanned entries in this session
        // Technicians can finish PTL orders early when needed
        
        // Ensure we have some activity in this session
        if (currentSession.scannedEntries.length === 0) {
          toast({
            title: "No Scans in Session",
            description: "Cannot finish PTL without any scanned boards in this session.",
            variant: "destructive"
          });
          return;
        }
        
        setCurrentSession({ ...currentSession, status: 'post-test' });
      } catch (error) {
        console.error('Error checking PTL progress:', error);
        toast({
          title: "Error",
          description: "Could not verify PTL completion status. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  const handlePostTestComplete = async () => {
    if (currentSession) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60));
      
      const updatedSession = {
        ...currentSession,
        endTime,
        status: 'completed' as const
      };
      setCurrentSession(updatedSession);
      
      // Final save to ensure all data is persisted
      try {
        const stats = getSessionStats();

        await supabase
          .from('scan_sessions')
          .update({
            status: 'completed',
            end_time: endTime.toISOString(),
            total_scanned: stats.total,
            pass_count: stats.passed,
            fail_count: stats.failed,
            pass_rate: stats.passRate,
            duration_minutes: duration,
            is_active: false
          })
          .eq('id', currentSession.id);

        // Deactivate session
        await supabase.rpc('deactivate_session', {
          p_session_id: currentSession.id
        });
        
        // Show completion message with session duration
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        toast({
          title: "Session Completed",
          description: `Processed ${stats.total} boards in ${durationText} - ${stats.passed} passed, ${stats.failed} failed`
        });
      } catch (error) {
        console.error('Error finalizing session:', error);
      }
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
    
    // Show overall PTL order progress (all scanned entries for this order)
    const total = currentSession.scannedEntries.filter(e => e.testResult).length;
    const passed = currentSession.scannedEntries.filter(e => e.testResult === 'pass').length;
    const failed = currentSession.scannedEntries.filter(e => e.testResult === 'fail').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    return { total, passed, failed, passRate };
  };

  // Add effect to listen for stats updates
  useEffect(() => {
    const handleStatsUpdate = () => {
      // Force a re-render by updating a state value
      setCurrentSession(prevSession => ({ ...prevSession }));
    };
    
    window.addEventListener('sessionStatsUpdated', handleStatsUpdate);
    return () => window.removeEventListener('sessionStatsUpdated', handleStatsUpdate);
  }, []);

  const stats = getSessionStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CW PTL</h1>
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
            sessionId={currentSession.id}
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