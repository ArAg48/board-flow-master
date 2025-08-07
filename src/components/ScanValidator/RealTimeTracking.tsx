import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Target, Activity, Zap } from 'lucide-react';
import { ScanEntry, ValidationSession } from '@/types/scan-validator';

interface RealTimeTrackingProps {
  session: ValidationSession;
}

const RealTimeTracking: React.FC<RealTimeTrackingProps> = ({ session }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Keep track of last 5 scans for trend analysis
    const lastFiveScans = session.scannedEntries.slice(-5);
    setRecentScans(lastFiveScans);
  }, [session.scannedEntries]);

  const getDuration = () => {
    const start = session.startTime;
    const end = session.endTime || currentTime;
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { hours, minutes, seconds, total: diff };
  };

  const getStats = () => {
    // Calculate session-specific stats (what this technician did)
    const sessionStart = session.startTime;
    const sessionEntries = session.scannedEntries.filter(e => 
      e.timestamp >= sessionStart
    );
    
    const total = sessionEntries.length;
    const passed = sessionEntries.filter(e => e.testResult === 'pass').length;
    const failed = sessionEntries.filter(e => e.testResult === 'fail').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    // Overall order progress
    const overallPassed = session.ptlOrder.passedCount || 0;
    const expectedCount = session.ptlOrder.expectedCount;
    const remainingNeeded = Math.max(0, expectedCount - overallPassed);
    
    return { total, passed, failed, passRate, overallPassed, expectedCount, remainingNeeded };
  };

  const getProductivity = () => {
    const duration = getDuration();
    const totalMinutes = duration.total / 60000;
    const scansPerHour = totalMinutes > 0 ? Math.round((session.scannedEntries.length / totalMinutes) * 60) : 0;
    
    return { scansPerHour };
  };

  const getTrend = () => {
    if (recentScans.length < 2) return 'stable';
    
    const recentPassRate = (recentScans.filter(s => s.testResult === 'pass').length / recentScans.length) * 100;
    const overallPassRate = getStats().passRate;
    
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Session Duration */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Duration</span>
            </div>
            <div className="text-xl font-bold">
              {duration.hours.toString().padStart(2, '0')}:
              {duration.minutes.toString().padStart(2, '0')}:
              {duration.seconds.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Total Scanned */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Scanned</span>
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">
              of {session.ptlOrder.expectedCount}
            </div>
          </div>

          {/* Pass Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">Pass Rate</span>
              {getTrendIcon()}
            </div>
            <div className="text-xl font-bold">{stats.passRate}%</div>
            <Badge variant={stats.passRate >= 95 ? 'default' : stats.passRate >= 90 ? 'secondary' : 'destructive'} className="text-xs">
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
            <span>Session Progress</span>
            <span>{stats.total} scanned this session</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Order needs {stats.remainingNeeded} more passed boards ({stats.overallPassed}/{stats.expectedCount} passed total)
          </div>
        </div>

        {/* Pass Rate Progress */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-sm">
            <span>Quality Rate</span>
            <span>{stats.passRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stats.passRate)}`}
              style={{ width: `${stats.passRate}%` }}
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
