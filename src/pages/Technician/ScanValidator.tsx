import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PTLOrder, ValidationSession, ScanEntry, TesterConfig, PreTestVerification, PostTestVerification } from '@/types/scan-validator';
import PTLOrderSelector from '@/components/ScanValidator/PTLOrderSelector';
import PreTestVerificationComponent from '@/components/ScanValidator/PreTestVerification';
import TesterConfiguration from '@/components/ScanValidator/TesterConfiguration';
import ScanningInterface from '@/components/ScanValidator/ScanningInterface';
import PostTestVerificationComponent from '@/components/ScanValidator/PostTestVerification';

const ScanValidator: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<ValidationSession | null>(null);
  const [availableOrders] = useState<PTLOrder[]>([
    {
      id: '1',
      orderNumber: 'PTL-2024-001',
      boardType: 'Main Control Board v2.1',
      expectedFormat: '^PCB-[A-Z0-9]{8}$',
      expectedCount: 100,
      priority: 'high',
      dueDate: new Date('2024-12-30')
    },
    {
      id: '2',
      orderNumber: 'PTL-2024-002',
      boardType: 'Sensor Interface Board',
      expectedFormat: '^SIB-[0-9]{6}-[A-Z]{2}$',
      expectedCount: 150,
      priority: 'medium',
      dueDate: new Date('2024-12-28')
    }
  ]);
  const { toast } = useToast();

  const handleOrderSelect = (order: PTLOrder) => {
    if (!currentSession) {
      const newSession: ValidationSession = {
        id: `session-${Date.now()}`,
        ptlOrder: order,
        testerConfig: { type: 1, scanBoxes: 1 },
        preTestVerification: {
          firmwareVersion: '',
          testerCalibration: false,
          environmentCheck: false
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
    </div>
  );
};

export default ScanValidator;