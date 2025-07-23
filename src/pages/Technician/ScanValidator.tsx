import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Camera, CameraOff, RotateCcw, CheckCircle, XCircle, Clock, Play, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScanSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  scannedBoards: number;
  passedBoards: number;
  failedBoards: number;
  status: 'active' | 'paused' | 'completed';
}

interface BoardScan {
  id: string;
  serialNumber: string;
  timestamp: Date;
  result: 'pass' | 'fail';
  testDetails?: {
    voltage: number;
    current: number;
    resistance: number;
    temperature: number;
  };
}

const ScanValidator: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null);
  const [recentScans, setRecentScans] = useState<BoardScan[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const codeReader = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());
  const { toast } = useToast();

  const startSession = () => {
    const newSession: ScanSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      scannedBoards: 0,
      passedBoards: 0,
      failedBoards: 0,
      status: 'active'
    };
    setCurrentSession(newSession);
    setIsScanning(true);
    setScanError(null);
    toast({
      title: "Session Started",
      description: "Scan validation session has begun"
    });
  };

  const pauseSession = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'paused' });
      setIsScanning(false);
    }
  };

  const endSession = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        endTime: new Date(),
        status: 'completed' as const
      };
      setCurrentSession(updatedSession);
      setIsScanning(false);
      toast({
        title: "Session Completed",
        description: `Scanned ${updatedSession.scannedBoards} boards - ${updatedSession.passedBoards} passed, ${updatedSession.failedBoards} failed`
      });
    }
  };

  const simulateTestResults = () => {
    // Simulate random test results for demo
    return {
      voltage: 3.3 + (Math.random() - 0.5) * 0.2,
      current: 1.2 + (Math.random() - 0.5) * 0.1,
      resistance: 100 + (Math.random() - 0.5) * 10,
      temperature: 25 + Math.random() * 5
    };
  };

  const processScan = useCallback((serialNumber: string) => {
    if (!currentSession || currentSession.status !== 'active') return;

    const testDetails = simulateTestResults();
    const result = Math.random() > 0.3 ? 'pass' : 'fail'; // 70% pass rate for demo

    const newScan: BoardScan = {
      id: `scan-${Date.now()}`,
      serialNumber,
      timestamp: new Date(),
      result,
      testDetails
    };

    setRecentScans(prev => [newScan, ...prev].slice(0, 10));
    
    const updatedSession = {
      ...currentSession,
      scannedBoards: currentSession.scannedBoards + 1,
      passedBoards: result === 'pass' ? currentSession.passedBoards + 1 : currentSession.passedBoards,
      failedBoards: result === 'fail' ? currentSession.failedBoards + 1 : currentSession.failedBoards
    };
    setCurrentSession(updatedSession);

    toast({
      title: result === 'pass' ? "Board Passed" : "Board Failed",
      description: `Serial: ${serialNumber}`,
      variant: result === 'pass' ? 'default' : 'destructive'
    });
  }, [currentSession, toast]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isScanning && webcamRef.current) {
      intervalId = setInterval(async () => {
        try {
          const imageSrc = webcamRef.current?.getScreenshot();
          if (imageSrc) {
            const result = await codeReader.current.decodeFromImageUrl(imageSrc);
            if (result) {
              processScan(result.getText());
              setScanError(null);
            }
          }
        } catch (error) {
          // Expected when no QR code is found
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, processScan]);

  const manualScan = () => {
    // Simulate manual scan for demo
    const mockSerial = `PCB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    processScan(mockSerial);
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

  const passRate = currentSession?.scannedBoards 
    ? Math.round((currentSession.passedBoards / currentSession.scannedBoards) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scan Validator</h1>
          <p className="text-muted-foreground">Validate PCB boards through QR code scanning</p>
        </div>
        <div className="flex gap-2">
          {!currentSession && (
            <Button onClick={startSession} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Session
            </Button>
          )}
          {currentSession?.status === 'active' && (
            <>
              <Button variant="outline" onClick={pauseSession} className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Pause
              </Button>
              <Button variant="destructive" onClick={endSession} className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                End Session
              </Button>
            </>
          )}
          {currentSession?.status === 'paused' && (
            <Button onClick={() => { setCurrentSession({ ...currentSession, status: 'active' }); setIsScanning(true); }} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
        </div>
      </div>

      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Session
              <Badge variant={currentSession.status === 'active' ? 'default' : currentSession.status === 'paused' ? 'secondary' : 'outline'}>
                {currentSession.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              Duration: {getSessionDuration()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{currentSession.scannedBoards}</div>
                <div className="text-sm text-muted-foreground">Total Scanned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentSession.passedBoards}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{currentSession.failedBoards}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{passRate}%</div>
                <div className="text-sm text-muted-foreground">Pass Rate</div>
              </div>
            </div>
            <Progress value={passRate} className="h-2" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Point the camera at a PCB QR code to scan and validate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                {isScanning ? (
                  <div className="relative">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-64 object-cover rounded-lg border"
                      videoConstraints={{
                        facingMode: "environment"
                      }}
                    />
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-primary"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-primary"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-primary"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-primary"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-muted rounded-lg border flex items-center justify-center">
                    <div className="text-center">
                      <CameraOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Camera is off</p>
                    </div>
                  </div>
                )}
              </div>
              
              {scanError && (
                <Alert variant="destructive">
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsScanning(!isScanning)} 
                  variant={isScanning ? "destructive" : "default"}
                  className="flex-1"
                  disabled={!currentSession || currentSession.status !== 'active'}
                >
                  {isScanning ? <CameraOff className="h-4 w-4 mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                  {isScanning ? 'Stop Camera' : 'Start Camera'}
                </Button>
                <Button 
                  onClick={manualScan} 
                  variant="outline"
                  disabled={!currentSession || currentSession.status !== 'active'}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Demo Scan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>
              Latest validation results from this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentScans.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No scans yet. Start scanning to see results here.
                </div>
              ) : (
                recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {scan.result === 'pass' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">{scan.serialNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {scan.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={scan.result === 'pass' ? 'default' : 'destructive'}>
                      {scan.result.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Details</CardTitle>
            <CardDescription>
              Detailed test results for recent scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.slice(0, 3).map((scan) => (
                <div key={scan.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{scan.serialNumber}</span>
                    <Badge variant={scan.result === 'pass' ? 'default' : 'destructive'}>
                      {scan.result.toUpperCase()}
                    </Badge>
                  </div>
                  {scan.testDetails && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Voltage</div>
                        <div className="font-medium">{scan.testDetails.voltage.toFixed(2)}V</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current</div>
                        <div className="font-medium">{scan.testDetails.current.toFixed(2)}A</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Resistance</div>
                        <div className="font-medium">{scan.testDetails.resistance.toFixed(1)}Ω</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Temperature</div>
                        <div className="font-medium">{scan.testDetails.temperature.toFixed(1)}°C</div>
                      </div>
                    </div>
                  )}
                  {scan !== recentScans[recentScans.length - 1] && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScanValidator;