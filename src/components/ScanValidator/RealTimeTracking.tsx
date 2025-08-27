import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Target, Activity, Zap } from 'lucide-react';
import { ScanEntry, ValidationSession } from '@/types/scan-validator';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeTrackingProps {
  session: ValidationSession;
}

const RealTimeTracking: React.FC<RealTimeTrackingProps> = ({ session }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);
  const [liveProgress, setLiveProgress] = useState({
    passedCount: session.ptlOrder.passedCount || 0,
    scannedCount: session.ptlOrder.scannedCount || 0,
    failedCount: session.ptlOrder.failedCount || 0
  });

  useEffect(() => {
    // Only update timer if session is not paused
    if (session.status !== 'paused') {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session.status]);

  useEffect(() => {
    // Keep track of last 5 scans for trend analysis
    const lastFiveScans = session.scannedEntries.slice(-5);
    setRecentScans(lastFiveScans);
  }, [session.scannedEntries]);

  useEffect(() => {
    // Listen for PTL progress updates and refresh data
    const handleProgressUpdate = async (event: CustomEvent) => {
      if (event.detail.orderId === session.ptlOrder.id) {
        try {
          const { data: progressData } = await supabase
            .from('ptl_order_progress')
            .select('passed_count, scanned_count, failed_count')
            .eq('id', session.ptlOrder.id)
            .single();

          if (progressData) {
            setLiveProgress({
              passedCount: progressData.passed_count || 0,
              scannedCount: progressData.scanned_count || 0,
              failedCount: progressData.failed_count || 0
            });
          }
        } catch (error) {
          console.error('Error fetching updated progress:', error);
        }
      }
    };

    window.addEventListener('ptlProgressUpdated', handleProgressUpdate as EventListener);
    return () => window.removeEventListener('ptlProgressUpdated', handleProgressUpdate as EventListener);
  }, [session.ptlOrder.id]);

  const getDuration = () => {
    const baseMs = session.accumulatedActiveMs || 0;
    const now = currentTime;

    // While scanning, add running active time since last resume
    if (session.status === 'scanning' && session.activeStart) {
      const running = now.getTime() - session.activeStart.getTime();
      const total = baseMs + Math.max(0, running);
      const hours = Math.floor(total / 3600000);
      const minutes = Math.floor((total % 3600000) / 60000);
      const seconds = Math.floor((total % 60000) / 1000);
      return { hours, minutes, seconds, total };
    }

    // Paused or break: show accumulated active time only
    const total = baseMs;
    const hours = Math.floor(total / 3600000);
    const minutes = Math.floor((total % 3600000) / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    return { hours, minutes, seconds, total };
  };

  const getStats = () => {
    // Calculate session-specific stats (what this technician did THIS session)
    const sessionStart = session.startTime;
    const sessionEntries = session.scannedEntries.filter(e => 
      e.testResult && e.timestamp >= sessionStart
    );
    
    const sessionTotal = sessionEntries.length;
    const sessionPassed = sessionEntries.filter(e => e.testResult === 'pass').length;
    const sessionFailed = sessionEntries.filter(e => e.testResult === 'fail').length;
    const sessionPassRate = sessionTotal > 0 ? Math.round((sessionPassed / sessionTotal) * 100) : 0;
    
    // Overall order progress (use live progress data for accurate real-time display)
    const overallPassed = liveProgress.passedCount;
    const expectedCount = session.ptlOrder.expectedCount;
    const remainingNeeded = Math.max(0, expectedCount - overallPassed);
    
    return { 
      sessionTotal, 
      sessionPassed, 
      sessionFailed, 
      sessionPassRate, 
      overallPassed, 
      expectedCount, 
      remainingNeeded
    };
  };

  const getProductivity = () => {
    const duration = getDuration();
    const totalMinutes = duration.total / 60000;
    const sessionStats = getStats();
    const scansPerHour = totalMinutes > 0 ? Math.round((sessionStats.sessionTotal / totalMinutes) * 60) : 0;
    
    return { scansPerHour };
  };

  const getTrend = () => {
    if (recentScans.length < 2) return 'stable';
    
    const recentPassRate = (recentScans.filter(s => s.testResult === 'pass').length / recentScans.length) * 100;
    const overallPassRate = getStats().sessionPassRate;
    
    if (recentPassRate > overallPassRate + 5) return 'improving';
    if (recentPassRate < overallPassRate - 5) return 'declining';
    return 'stable';
  };

  const duration = getDuration();
  const stats = getStats();
  const productivity = getProductivity();
  const trend = getTrend();

  const getProgressColor = (passRate: number) => {
    if (passRate >= 95) return 'bg-green-500';
    if (passRate >= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-Time Session Tracking
        </CardTitle>
        <CardDescription>
          Live monitoring of current validation session
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall PTL Progress Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="text-base font-medium text-blue-800 mb-3">PTL Order Progress</div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{stats.overallPassed}</div>
              <div className="text-blue-700">Passed Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{stats.expectedCount}</div>
              <div className="text-blue-700">Required</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{stats.remainingNeeded}</div>
              <div className="text-blue-700">Still Needed</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Session Duration */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Session Time</span>
            </div>
            <div className="text-xl font-bold">
              {duration.hours.toString().padStart(2, '0')}:
              {duration.minutes.toString().padStart(2, '0')}:
              {duration.seconds.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Session Scanned */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">This Session</span>
            </div>
            <div className="text-xl font-bold">{stats.sessionTotal}</div>
            <div className="text-xs text-muted-foreground">
              boards scanned
            </div>
          </div>

          {/* Session Pass Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">Session Quality</span>
              {getTrendIcon()}
            </div>
            <div className="text-xl font-bold">{stats.sessionPassRate}%</div>
            <Badge variant={stats.sessionPassRate >= 95 ? 'default' : stats.sessionPassRate >= 90 ? 'secondary' : 'destructive'} className="text-xs">
              {trend}
            </Badge>
          </div>

          {/* Productivity */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Rate</span>
            </div>
            <div className="text-xl font-bold">{productivity.scansPerHour}</div>
            <div className="text-xs text-muted-foreground">per hour</div>
          </div>
        </div>

        {/* Session Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Session</span>
            <span>{stats.sessionPassed} passed / {stats.sessionTotal} scanned</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.remainingNeeded > 0 
              ? `Need ${stats.remainingNeeded} more passed boards to complete order`
              : 'Order completion target reached!'
            }
          </div>
        </div>

        {/* Session Pass Rate Progress */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-sm">
            <span>Session Quality Rate</span>
            <span>{stats.sessionPassRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stats.sessionPassRate)}`}
              style={{ width: `${stats.sessionPassRate}%` }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        {recentScans.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">Recent Scans</div>
            <div className="flex gap-1">
              {recentScans.slice(-10).map((scan, index) => (
                <div
                  key={`${scan.id}-${index}`}
                  className={`w-3 h-3 rounded-full ${
                    scan.testResult === 'pass' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={`${scan.qrCode} - ${scan.testResult}`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeTracking;
