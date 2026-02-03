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
  const [stillTestingDialog, setStillTestingDialog] = useState<{ 
    open: boolean; 
    pausedAt: Date | null 
  }>({ 
    open: false, 
    pausedAt: null 
  });
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
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

  // Auto-save session when it changes (including post-test)
  useEffect(() => {
    if (currentSession && user && (currentSession.status === 'scanning' || currentSession.status === 'paused' || currentSession.status === 'break' || currentSession.status === 'post-test')) {
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

  // 3-hour inactivity check - pause session and show dialog every 3 hours
  useEffect(() => {
    // Only run when session is actively scanning
    if (!currentSession || currentSession.status !== 'scanning') {
      return;
    }

    // TESTING: 5 minutes (change back to 3 * 60 * 60 * 1000 for production)
    const THREE_HOURS_MS = 5 * 60 * 1000; // 5 minutes for testing
    const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds for testing

    const checkTimer = setInterval(() => {
      if (!currentSession || currentSession.status !== 'scanning') {
        return;
      }

      const now = new Date();
      const sessionStart = currentSession.startTime;
      const lastCheck = lastCheckTime || sessionStart;
      
      // Calculate total active time since start (excluding pauses)
      const totalElapsed = now.getTime() - sessionStart.getTime();
      const activeTime = totalElapsed - (currentSession.accumulatedPauseTime || 0) - (currentSession.accumulatedBreakTime || 0);
      
      // Calculate time since last check prompt
      const timeSinceLastCheck = now.getTime() - lastCheck.getTime();
      
      // Show dialog if it's been 3 hours since last check (or since session start if first check)
      if (timeSinceLastCheck >= THREE_HOURS_MS) {
        // Pause the session and show dialog
        const pauseTime = new Date();
        setStillTestingDialog({ open: true, pausedAt: pauseTime });
        setCurrentSession(prev => prev ? { ...prev, status: 'paused', pausedTime: pauseTime } : null);
        setLastCheckTime(now);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(checkTimer);
  }, [currentSession?.status, currentSession?.startTime, lastCheckTime]);

  const handleStillTestingYes = () => {
    if (currentSession && stillTestingDialog.pausedAt) {
      const now = new Date();
      const pauseDuration = now.getTime() - stillTestingDialog.pausedAt.getTime();
      
      setCurrentSession({ 
        ...currentSession, 
        status: 'scanning', 
        pausedTime: undefined,
        accumulatedPauseTime: (currentSession.accumulatedPauseTime || 0) + pauseDuration
      });
      setLastCheckTime(now);
    }
    setStillTestingDialog({ open: false, pausedAt: null });
    toast({
      title: 'Session Resumed',
      description: 'Keep up the good work!'
    });
  };

  const handleStillTestingNo = () => {
    if (currentSession && stillTestingDialog.pausedAt) {
      const now = new Date();
      const pauseDuration = now.getTime() - stillTestingDialog.pausedAt.getTime();
      
      // Keep session paused but add the pause duration
      setCurrentSession({ 
        ...currentSession, 
        status: 'paused', 
        pausedTime: undefined,
        accumulatedPauseTime: (currentSession.accumulatedPauseTime || 0) + pauseDuration
      });
    }
    setStillTestingDialog({ open: false, pausedAt: null });
    toast({
      title: 'Session Stopped',
      description: 'Click "Start PTL" when you\'re ready to continue.'
    });
  };

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

      // Fetch progress data for all orders using RPC fallback
      const orderIds = (ptlOrdersData || []).map(order => order.id);
      let progressRows: any[] = [];
      
      // Try RPC first for most up-to-date data
      const { data: rpcProgress, error: rpcError } = await supabase.rpc('get_ptl_order_progress');
      if (!rpcError && Array.isArray(rpcProgress)) {
        progressRows = rpcProgress.filter((r: any) => orderIds.includes(r.id));
      }
      
      // Fallback to progress table if needed
      if (progressRows.length === 0 && orderIds.length > 0) {
        const { data: progressData } = await supabase
          .from('ptl_order_progress')
          .select('*')
          .in('id', orderIds);
        progressRows = progressData || [];
      }

      const progressMap = progressRows.reduce((acc, progress) => {
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
          firmwareRevision: order.firmware_revision,
          is_firmware_update: order.is_firmware_update || false,
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
      const { data: activeSession, error } = await supabase
        .rpc('get_active_session_for_user', { user_id: user.id });

      if (error) throw error;

      if (activeSession && activeSession.length > 0) {
        const session = activeSession[0];
        setResumeDialog({ open: true, session });
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
      const endTimeForCalc = currentSession.endTime || new Date();
      const totalElapsed = endTimeForCalc.getTime() - currentSession.startTime.getTime();
      const activeDuration = totalElapsed - (currentSession.accumulatedPauseTime || 0) - (currentSession.accumulatedBreakTime || 0);
      const duration = Math.floor(Math.max(0, activeDuration) / (1000 * 60));

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
        endTime: currentSession.endTime?.toISOString(),
        accumulatedPauseTime: currentSession.accumulatedPauseTime || 0,
        accumulatedBreakTime: currentSession.accumulatedBreakTime || 0
      }));

      // Session row is maintained via direct updates (no RPC)

      // Update session statistics in database
      // Persist session state via RPC (bypasses RLS)
      // Upsert session via RPC (long signature) including live counts and duration
      // Map status to database enum, keeping post-test as active so it can be resumed
      const dbStatus = currentSession.status === 'paused' || currentSession.status === 'break' 
        ? 'paused' 
        : (currentSession.status === 'completed' ? 'completed' : 'active');
      
      await (supabase.rpc as any)('save_session', {
        p_session_id: currentSession.id,
        p_technician_id: user.id,
        p_ptl_order_id: currentSession.ptlOrder.id,
        p_session_data: sessionData,
        p_status: dbStatus as any,
        p_paused_at: currentSession.pausedTime?.toISOString() || null,
        p_break_started_at: currentSession.breakTime?.toISOString() || null,
        p_duration_minutes: duration,
        p_active_duration_minutes: duration,
        p_session_scanned_count: stats.total,
        p_session_pass_count: stats.passed,
        p_session_fail_count: stats.failed,
        p_total_scanned: stats.total,
        p_pass_count: stats.passed,
        p_fail_count: stats.failed,
      } as any);

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

      // Determine the appropriate status based on stored session status
      let resumeStatus: ValidationSession['status'] = 'pre-test';
      if (storedData.status === 'post-test') {
        // If session was in post-test, resume directly to post-test
        resumeStatus = 'post-test';
      } else if (storedData.status === 'scanning' || storedData.status === 'paused' || storedData.status === 'break') {
        // For scanning sessions, require pre-test verification
        resumeStatus = 'pre-test';
      }

      // Calculate accumulated times when resuming from pause or break
      const now = new Date();
      let accumulatedPauseTime = storedData.accumulatedPauseTime || 0;
      let accumulatedBreakTime = storedData.accumulatedBreakTime || 0;
      let pausedTime: Date | undefined = undefined;
      let breakTime: Date | undefined = undefined;

      // If resuming from a pause, add the pause duration to accumulated time
      if (sessionData.paused_at) {
        const pauseStart = new Date(sessionData.paused_at);
        const pauseDuration = now.getTime() - pauseStart.getTime();
        accumulatedPauseTime += pauseDuration;
        console.log(`Resuming from pause: added ${Math.floor(pauseDuration / (1000 * 60))} minutes to accumulated pause time`);
      }

      // If resuming from a break, add the break duration to accumulated time
      if (sessionData.break_started_at) {
        const breakStart = new Date(sessionData.break_started_at);
        const breakDuration = now.getTime() - breakStart.getTime();
        accumulatedBreakTime += breakDuration;
        console.log(`Resuming from break: added ${Math.floor(breakDuration / (1000 * 60))} minutes to accumulated break time`);
      }

      const reconstructedSession: ValidationSession = {
        id: sessionData.session_id,
        ptlOrder,
        testerConfig: storedData.testerConfig || { type: 1, scanBoxes: 1 },
        preTestVerification: storedData.preTestVerification || { testerCheck: false, firmwareCheck: false },
        postTestVerification: storedData.postTestVerification,
        startTime: new Date(storedData.startTime || sessionData.start_time),
        pausedTime,
        breakTime,
        status: resumeStatus,
        scannedEntries: restoredScannedEntries,
        totalDuration: storedData.totalDuration || 0,
        accumulatedPauseTime,
        accumulatedBreakTime
      };

      setCurrentSession(reconstructedSession);
      setLastCheckTime(new Date()); // Reset 3-hour timer when resuming
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
      // Mark old session inactive (handled via direct DB updates)
    }
    
    setResumeDialog({ open: false, session: null });
    setCurrentSession(null);
  };

  const handleOrderSelect = async (order: PTLOrder) => {
    if (!currentSession && user?.id) {
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
        totalDuration: 0,
        accumulatedPauseTime: 0,
        accumulatedBreakTime: 0
      };
      setCurrentSession(newSession);
      setLastCheckTime(newSession.startTime); // Reset 3-hour timer for new session

      // Create initial session record in database
      try {
        const sessionData = JSON.parse(JSON.stringify({
          id: newSession.id,
          status: newSession.status,
          startTime: newSession.startTime.toISOString(),
          testerConfig: newSession.testerConfig,
          preTestVerification: newSession.preTestVerification,
          scannedEntries: [],
          totalDuration: 0
        }));

        await (supabase.rpc as any)('save_session', {
          p_session_id: newSession.id,
          p_technician_id: user.id,
          p_ptl_order_id: newSession.ptlOrder.id,
          p_session_data: sessionData,
          p_status: 'active' as any,
          p_paused_at: null,
          p_break_started_at: null,
          p_duration_minutes: 0,
          p_active_duration_minutes: 0,
          p_session_scanned_count: 0,
          p_session_pass_count: 0,
          p_session_fail_count: 0,
          p_total_scanned: 0,
          p_pass_count: 0,
          p_fail_count: 0,
        } as any);
      } catch (error) {
        console.error('Error creating session:', error);
      }
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

  const handleStop = () => {
    if (currentSession) {
      // Use 'paused' status internally to stop the timer
      setCurrentSession({ ...currentSession, status: 'paused', pausedTime: new Date() });
    }
  };

const handleResume = () => {
  if (currentSession) {
    const now = new Date();
    let newAccumulatedPauseTime = currentSession.accumulatedPauseTime;
    let newAccumulatedBreakTime = currentSession.accumulatedBreakTime;
    
    // Add the time spent paused/breaking to accumulated totals
    if (currentSession.status === 'paused' && currentSession.pausedTime) {
      newAccumulatedPauseTime += now.getTime() - currentSession.pausedTime.getTime();
    } else if (currentSession.status === 'break' && currentSession.breakTime) {
      newAccumulatedBreakTime += now.getTime() - currentSession.breakTime.getTime();
    }
    
    setCurrentSession({ 
      ...currentSession, 
      status: 'scanning', 
      pausedTime: undefined, 
      breakTime: undefined,
      accumulatedPauseTime: newAccumulatedPauseTime,
      accumulatedBreakTime: newAccumulatedBreakTime
    });
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
      const totalElapsed = endTime.getTime() - currentSession.startTime.getTime();
      const activeDuration = totalElapsed - (currentSession.accumulatedPauseTime || 0) - (currentSession.accumulatedBreakTime || 0);
      const duration = Math.floor(Math.max(0, activeDuration) / (1000 * 60));
      
      const updatedSession = {
        ...currentSession,
        endTime,
        status: 'completed' as const
      };
      setCurrentSession(updatedSession);
      
      // Final save to ensure all data is persisted
      try {
        const stats = getSessionStats();

        // Serialize session data properly for JSON storage
        const completedSessionData = JSON.parse(JSON.stringify({
          id: updatedSession.id,
          status: updatedSession.status,
          startTime: updatedSession.startTime.toISOString(),
          endTime: updatedSession.endTime?.toISOString(),
          testerConfig: updatedSession.testerConfig,
          preTestVerification: updatedSession.preTestVerification,
          postTestVerification: updatedSession.postTestVerification,
          scannedEntries: updatedSession.scannedEntries.map(entry => ({
            ...entry,
            timestamp: entry.timestamp.toISOString()
          })),
          totalDuration: updatedSession.totalDuration,
          pausedTime: updatedSession.pausedTime?.toISOString(),
          breakTime: updatedSession.breakTime?.toISOString(),
          accumulatedPauseTime: updatedSession.accumulatedPauseTime || 0,
          accumulatedBreakTime: updatedSession.accumulatedBreakTime || 0
        }));

        await supabase.rpc('save_session', {
          p_session_id: currentSession.id,
          p_technician_id: user.id,
          p_ptl_order_id: currentSession.ptlOrder.id,
          p_session_data: completedSessionData,
          p_status: 'completed'
        });

        // Update session final counts and duration via RPC (bypasses RLS)
        await supabase.rpc('update_session_counts', {
          p_session_id: currentSession.id,
          p_scanned_count: stats.total,
          p_pass_count: stats.passed,
          p_fail_count: stats.failed,
          p_duration_minutes: duration
        });

        // Refresh PTL order progress aggregates
        await supabase.rpc('update_ptl_progress', {
          p_ptl_order_id: currentSession.ptlOrder.id
        });

        // Get latest progress to determine completion and show accurate time
        const { data: latestProgress } = await supabase
          .from('ptl_order_progress')
          .select('scanned_count, passed_count, failed_count, total_time_minutes, active_time_minutes')
          .eq('id', currentSession.ptlOrder.id)
          .maybeSingle();

        const totalPassed = latestProgress?.passed_count || 0;
        const isComplete = totalPassed >= currentSession.ptlOrder.expectedCount;

        // Show completion notification to technician
        if (isComplete) {
          toast({
            title: '🎉 PTL Order Complete!',
            description: `You have successfully tested and passed all ${currentSession.ptlOrder.expectedCount} boards for this PTL order.`,
            duration: 8000,
          });

          // Update PTL order status to completed with verifier info
          await supabase
            .from('ptl_orders')
            .update({
            status: 'completed',
            verified_by: user?.id,
            verified_at: endTime.toISOString(),
            verifier_initials: currentSession.postTestVerification?.productCountVerified,
            product_count_verified: currentSession.postTestVerification?.productCountVerified,
            axxess_updater: currentSession.postTestVerification?.axxessUpdater,
            updated_at: endTime.toISOString()
            })
            .eq('id', currentSession.ptlOrder.id);
        } else {
          toast({
            title: '✅ Session Complete',
            description: `Session finished. ${totalPassed}/${currentSession.ptlOrder.expectedCount} boards have passed testing.`,
            duration: 3000,
          });
        }
        
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
    
    // Calculate active duration by subtracting accumulated pause/break time
    const getActiveDuration = (endTime: Date) => {
      const totalElapsed = endTime.getTime() - start.getTime();
      const activeDuration = totalElapsed - (currentSession.accumulatedPauseTime || 0) - (currentSession.accumulatedBreakTime || 0);
      // Cap at 24 hours to prevent unrealistic display values
      return Math.max(0, Math.min(activeDuration, 86400000));
    };
    
    // If session is paused, freeze at the duration when pause started
    if (currentSession.status === 'paused' && currentSession.pausedTime) {
      const activeDiff = getActiveDuration(currentSession.pausedTime);
      const hours = Math.floor(activeDiff / 3600000);
      const minutes = Math.floor((activeDiff % 3600000) / 60000);
      const seconds = Math.floor((activeDiff % 60000) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // If session is on break, freeze at the duration when break started
    if (currentSession.status === 'break' && currentSession.breakTime) {
      const activeDiff = getActiveDuration(currentSession.breakTime);
      const hours = Math.floor(activeDiff / 3600000);
      const minutes = Math.floor((activeDiff % 3600000) / 60000);
      const seconds = Math.floor((activeDiff % 60000) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Regular running session - calculate active time
    const end = currentSession.endTime || new Date();
    const activeDiff = getActiveDuration(end);
    const hours = Math.floor(activeDiff / 3600000);
    const minutes = Math.floor((activeDiff % 3600000) / 60000);
    const seconds = Math.floor((activeDiff % 60000) / 1000);
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
      {/* Resume Session Dialog */}
      <Dialog open={resumeDialog.open} onOpenChange={(open) => {
        if (!open) setResumeDialog({ open: false, session: null });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Active Session?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>You have an active session. Would you like to resume it or start a new one?</p>
            {resumeDialog.session?.session_data?.status === 'post-test' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 font-medium">
                  ⚠️ This session needs post-test verification to complete
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={resumeActiveSession} className="flex-1">
                Resume Session
              </Button>
              <Button onClick={startNewSessionFromDialog} variant="outline" className="flex-1">
                Start New
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3-Hour Inactivity Check Dialog */}
      <Dialog open={stillTestingDialog.open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Are you still testing?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-6">
            <p className="text-center text-muted-foreground">
              It's been 3 hours since the last check. The session timer has been paused.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleStillTestingYes} 
                size="lg"
                className="px-8"
              >
                Yes
              </Button>
              <Button 
                onClick={handleStillTestingNo} 
                variant="destructive"
                size="lg"
                className="px-8"
              >
                No
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          ptlOrder={currentSession.ptlOrder}
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
            onStop={handleStop}
            onResume={handleResume}
            onFinishPTL={handleFinishPTL}
            isActive={currentSession.status === 'scanning'}
            isStopped={currentSession.status === 'paused' || currentSession.status === 'break'}
            sessionId={currentSession.id}
          />
        </div>
      )}

      {currentSession?.status === 'post-test' && (
        <PostTestVerificationComponent
          verification={{
            finalCount: stats.total,
            accessUpdaterSync: false,
            productCountVerified: '',
            axxessUpdater: ''
          }}
          expectedCount={currentSession.ptlOrder.expectedCount}
          actualCount={stats.total}
          firmwareRevision={currentSession.ptlOrder.firmwareRevision}
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


      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading PTL orders...</div>
        </div>
      )}
    </div>
  );
};

export default ScanValidator;