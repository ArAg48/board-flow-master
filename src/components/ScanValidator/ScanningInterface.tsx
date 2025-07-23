import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TesterConfig, ScanEntry, PTLOrder } from '@/types/scan-validator';
import { RepairEntry } from '@/types/repair-log';
import { Scan, CheckCircle, XCircle, Coffee, Pause, Play, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScanningInterfaceProps {
  testerConfig: TesterConfig;
  ptlOrder: PTLOrder;
  scannedEntries: ScanEntry[];
  onScanEntry: (entry: ScanEntry) => void;
  onPause: () => void;
  onBreak: () => void;
  onResume: () => void;
  onFinishPTL: () => void;
  isActive: boolean;
  isBreakMode: boolean;
}

const ScanningInterface: React.FC<ScanningInterfaceProps> = ({
  testerConfig,
  ptlOrder,
  scannedEntries,
  onScanEntry,
  onPause,
  onBreak,
  onResume,
  onFinishPTL,
  isActive,
  isBreakMode
}) => {
  const [scanInputs, setScanInputs] = useState<string[]>(Array(testerConfig.scanBoxes).fill(''));
  const [activeBox, setActiveBox] = useState(0);
  const [failureDialog, setFailureDialog] = useState<{ open: boolean; boxIndex: number; qrCode: string }>({
    open: false,
    boxIndex: -1,
    qrCode: ''
  });
  const [failureReason, setFailureReason] = useState('');
  const { toast } = useToast();

  const validateQRFormat = (qrCode: string): boolean => {
    const regex = new RegExp(ptlOrder.expectedFormat);
    return regex.test(qrCode);
  };

  const handleScanInput = (boxIndex: number, value: string) => {
    if (!isActive || isBreakMode) return;

    const newInputs = [...scanInputs];
    newInputs[boxIndex] = value;
    setScanInputs(newInputs);

    // Auto-process when QR code is complete (assuming newline or specific length)
    if (value.length >= 8 && (value.includes('\n') || value.length >= 12)) {
      const cleanQrCode = value.trim();
      processScan(boxIndex, cleanQrCode);
    }
  };

  const handleManualFail = (boxIndex: number) => {
    const qrCode = scanInputs[boxIndex].trim();
    if (!qrCode) {
      toast({
        title: "No QR Code",
        description: "Please scan a QR code first",
        variant: "destructive"
      });
      return;
    }

    const isValid = validateQRFormat(qrCode);
    if (!isValid) {
      toast({
        title: "Invalid QR Format",
        description: `Code doesn't match expected format: ${ptlOrder.expectedFormat}`,
        variant: "destructive"
      });
      return;
    }

    setFailureDialog({ open: true, boxIndex, qrCode });
  };

  const handlePassAllBoards = () => {
    const entriesWithBoards = scannedEntries.filter(entry => entry.qrCode);
    entriesWithBoards.forEach(entry => {
      if (entry.testResult !== 'pass') {
        const updatedEntry: ScanEntry = {
          ...entry,
          testResult: 'pass',
          timestamp: new Date()
        };
        onScanEntry(updatedEntry);
      }
    });

    toast({
      title: "All Boards Passed",
      description: `${entriesWithBoards.length} boards marked as passed`,
    });
  };

  const processScan = (boxIndex: number, qrCode: string) => {
    const isValid = validateQRFormat(qrCode);
    
    if (!isValid) {
      toast({
        title: "Invalid QR Format",
        description: `Code doesn't match expected format: ${ptlOrder.expectedFormat}`,
        variant: "destructive"
      });
      // Clear the input
      const newInputs = [...scanInputs];
      newInputs[boxIndex] = '';
      setScanInputs(newInputs);
      return;
    }

    // Simulate test result (in real app, this would come from tester hardware)
    const testResult = Math.random() > 0.15 ? 'pass' : 'fail'; // 85% pass rate

    if (testResult === 'fail') {
      setFailureDialog({ open: true, boxIndex, qrCode });
      return;
    }

    completeSuccessfulScan(boxIndex, qrCode, testResult);
  };

  const completeSuccessfulScan = (boxIndex: number, qrCode: string, testResult: 'pass' | 'fail', failureReason?: string) => {
    const entry: ScanEntry = {
      id: `scan-${Date.now()}-${boxIndex}`,
      boxIndex,
      qrCode,
      isValid: true,
      timestamp: new Date(),
      testResult,
      failureReason
    };

    onScanEntry(entry);

    // Clear the input and move to next box
    const newInputs = [...scanInputs];
    newInputs[boxIndex] = '';
    setScanInputs(newInputs);

    // Move to next available box
    const nextBox = (boxIndex + 1) % testerConfig.scanBoxes;
    setActiveBox(nextBox);

    toast({
      title: testResult === 'pass' ? "Board Passed" : "Board Failed",
      description: `Box ${boxIndex + 1}: ${qrCode}`,
      variant: testResult === 'pass' ? 'default' : 'destructive'
    });
  };

  const handleFailureSubmit = () => {
    if (!failureReason.trim()) return;

    completeSuccessfulScan(
      failureDialog.boxIndex, 
      failureDialog.qrCode, 
      'fail', 
      failureReason
    );

    setFailureDialog({ open: false, boxIndex: -1, qrCode: '' });
    setFailureReason('');
  };

  const getBoxStats = (boxIndex: number) => {
    const boxEntries = scannedEntries.filter(entry => entry.boxIndex === boxIndex);
    const passed = boxEntries.filter(entry => entry.testResult === 'pass').length;
    const failed = boxEntries.filter(entry => entry.testResult === 'fail').length;
    return { total: boxEntries.length, passed, failed };
  };

  if (isBreakMode) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Coffee className="h-5 w-5" />
            Break Mode
          </CardTitle>
          <CardDescription className="text-amber-600">
            Session is on break. Timer continues running but scanning is disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Button onClick={onResume} size="lg">
            <Play className="h-4 w-4 mr-2" />
            Resume Scanning
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            QR Code Scanning - {testerConfig.type}-up Tester
          </CardTitle>
          <CardDescription>
            Scan QR codes using your supermarket scanner. Codes will auto-fill the input boxes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Expected format: <code className="bg-muted px-1 rounded">{ptlOrder.expectedFormat}</code>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: testerConfig.scanBoxes }, (_, i) => {
              const stats = getBoxStats(i);
              return (
                 <div key={i} className="space-y-2">
                   <Label className="text-sm font-medium">Box {i + 1}</Label>
                   <Input
                     value={scanInputs[i]}
                     onChange={(e) => handleScanInput(i, e.target.value)}
                     placeholder="Scan QR code..."
                     className={`text-center ${activeBox === i ? 'ring-2 ring-primary' : ''}`}
                     disabled={!isActive}
                   />
                   <Button
                     size="sm"
                     variant="destructive"
                     onClick={() => handleManualFail(i)}
                     disabled={!isActive || !scanInputs[i].trim()}
                     className="w-full text-xs"
                   >
                     Fail
                   </Button>
                   <div className="text-xs text-center space-y-1">
                     <div>Total: {stats.total}</div>
                     <div className="flex justify-center gap-2">
                       <span className="text-green-600">✓{stats.passed}</span>
                       <span className="text-red-600">✗{stats.failed}</span>
                     </div>
                   </div>
                 </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {isActive ? (
              <>
                <Button onClick={onPause} variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Session
                </Button>
                <Button onClick={onBreak} variant="secondary">
                  <Coffee className="h-4 w-4 mr-2" />
                  Take Break
                </Button>
                <Button 
                  onClick={handlePassAllBoards} 
                  variant="default"
                  disabled={scannedEntries.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Pass All Boards
                </Button>
                <Button 
                  onClick={onFinishPTL} 
                  variant="default"
                  disabled={scannedEntries.length === 0}
                >
                  Finish PTL
                </Button>
              </>
            ) : (
              <Button onClick={onResume}>
                <Play className="h-4 w-4 mr-2" />
                Resume Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={failureDialog.open} onOpenChange={(open) => !open && setFailureDialog({ open: false, boxIndex: -1, qrCode: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Board Test Failed
            </DialogTitle>
            <DialogDescription>
              The board has the correct QR format but failed testing. Please provide a failure reason for repair tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>QR Code: {failureDialog.qrCode}</Label>
              <Label>Box: {failureDialog.boxIndex + 1}</Label>
            </div>
            <div>
              <Label htmlFor="failure-reason">Failure Reason</Label>
              <Textarea
                id="failure-reason"
                placeholder="Describe the failure (e.g., voltage out of range, component damage, etc.)"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleFailureSubmit}
                disabled={!failureReason.trim()}
                variant="destructive"
              >
                Submit Failure
              </Button>
              <Button 
                onClick={() => setFailureDialog({ open: false, boxIndex: -1, qrCode: '' })}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScanningInterface;