import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TesterConfig, ScanEntry, PTLOrder } from '@/types/scan-validator';
import { Scan, CheckCircle, XCircle, Coffee, Pause, Play, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  sessionId: string;
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
  isBreakMode,
  sessionId
}) => {
  const [scanInputs, setScanInputs] = useState<string[]>(Array(testerConfig.scanBoxes).fill(''));
  const [validatedBoards, setValidatedBoards] = useState<{[boxIndex: number]: string}>({});
  const [activeBox, setActiveBox] = useState(0);
  const [failureDialog, setFailureDialog] = useState<{ open: boolean; boxIndex: number; qrCode: string }>({
    open: false,
    boxIndex: -1,
    qrCode: ''
  });
  const [failureReason, setFailureReason] = useState('');
  const { toast } = useToast();

  const validateQRFormat = (qrCode: string): boolean => {
    try {
      const regex = new RegExp(ptlOrder.expectedFormat);
      return regex.test(qrCode);
    } catch (error) {
      console.error('Invalid regex pattern:', ptlOrder.expectedFormat, error);
      // Fallback validation: check if it matches the expected board format (4 chars + 7 digits)
      const fallbackRegex = /^[A-Z0-9]{4}\d{7}$/;
      return fallbackRegex.test(qrCode);
    }
  };

  const handleScanInput = (boxIndex: number, value: string) => {
    if (!isActive || isBreakMode) return;

    const newInputs = [...scanInputs];
    newInputs[boxIndex] = value;
    setScanInputs(newInputs);

    // Auto-process when QR code is complete (11 characters: 4 letters + 7 digits)
    // Also check for newline character which indicates scan completion
    if (value.length >= 11 || value.includes('\n') || value.includes('\r')) {
      const cleanQrCode = value.replace(/[\n\r]/g, '').trim();
      if (cleanQrCode.length >= 11) {
        processScan(boxIndex, cleanQrCode);
      }
    }
  };

  const handleManualFail = (boxIndex: number) => {
    const qrCode = validatedBoards[boxIndex];
    if (!qrCode) {
      toast({
        title: "No Validated Board",
        description: "Please scan a QR code first",
        variant: "destructive"
      });
      return;
    }

    setFailureDialog({ open: true, boxIndex, qrCode });
  };

  const handlePassAllBoards = async () => {
    const validatedBoardEntries = Object.entries(validatedBoards);
    const alreadyProcessedBoxes = scannedEntries.map(entry => entry.boxIndex);
    const unprocessedBoards = validatedBoardEntries.filter(([boxIndex]) => 
      !alreadyProcessedBoxes.includes(parseInt(boxIndex))
    );

    for (const [boxIndex, qrCode] of unprocessedBoards) {
      const entry: ScanEntry = {
        id: crypto.randomUUID(),
        boxIndex: parseInt(boxIndex),
        qrCode,
        isValid: true,
        timestamp: new Date(),
        testResult: 'pass'
      };
      onScanEntry(entry);

      // Save board data to database
      await saveBoardData(qrCode, 'pass');
    }

    // Clear processed boards from validated boards and inputs
    const newValidatedBoards = { ...validatedBoards };
    const newInputs = [...scanInputs];
    
    unprocessedBoards.forEach(([boxIndex]) => {
      delete newValidatedBoards[parseInt(boxIndex)];
      newInputs[parseInt(boxIndex)] = '';
    });
    
    setValidatedBoards(newValidatedBoards);
    setScanInputs(newInputs);
    
    // Reset active box to first empty box
    const firstEmptyBox = findNextEmptyBox(-1);
    setActiveBox(firstEmptyBox);

    toast({
      title: "All Unfailed Boards Passed",
      description: `${unprocessedBoards.length} boards marked as passed`,
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

    // Check if this QR code was already scanned in this box
    const existingEntry = scannedEntries.find(entry => entry.boxIndex === boxIndex && entry.qrCode === qrCode);
    if (existingEntry) {
      toast({
        title: "Already Scanned",
        description: `This code was already processed for Box ${boxIndex + 1}`,
        variant: "destructive"
      });
      return;
    }

    // Store validated board in local state - don't create scan entry yet
    const newValidatedBoards = { ...validatedBoards };
    newValidatedBoards[boxIndex] = qrCode;
    setValidatedBoards(newValidatedBoards);

    // Auto-advance cursor to next box
    const nextBox = findNextEmptyBox(boxIndex);
    setActiveBox(nextBox);
    
    // Focus the next input box
    setTimeout(() => {
      const nextInput = document.querySelector(`input[data-box-index="${nextBox}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }, 100);

    toast({
      title: "Board Validated",
      description: `Box ${boxIndex + 1}: ${qrCode} - Ready for testing`,
    });
  };

  const findNextEmptyBox = (currentBox: number): number => {
    // Look for next empty box that doesn't have a validated board
    for (let i = 1; i <= testerConfig.scanBoxes; i++) {
      const nextIndex = (currentBox + i) % testerConfig.scanBoxes;
      if (!validatedBoards[nextIndex] || scanInputs[nextIndex] === '') {
        return nextIndex;
      }
    }
    // If all boxes are filled, return current box
    return currentBox;
  };

  const saveBoardData = async (qrCode: string, testResult: 'pass' | 'fail', failureReason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the unique constraint to properly handle updates
      const { error } = await supabase
        .from('board_data')
        .upsert({
          qr_code: qrCode,
          board_type: ptlOrder.boardType,
          assembly_number: ptlOrder.boardType,
          sequence_number: qrCode,
          test_status: testResult,
          test_date: new Date().toISOString(),
          ptl_order_id: ptlOrder.id,
          technician_id: user?.id || null,
          test_results: failureReason ? { failure_reason: failureReason } : { result: 'passed' }
        }, {
          onConflict: 'qr_code,ptl_order_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
      
      // Refresh PTL progress after saving using the updated counting function
      await supabase.rpc('update_ptl_progress', { p_ptl_order_id: ptlOrder.id });
      
    } catch (error) {
      console.error('Error saving board data:', error);
      throw error;
    }
  };

  const handleFailureSubmit = async () => {
    if (!failureReason.trim()) return;

    const entry: ScanEntry = {
      id: crypto.randomUUID(),
      boxIndex: failureDialog.boxIndex,
      qrCode: failureDialog.qrCode,
      isValid: true,
      timestamp: new Date(),
      testResult: 'fail',
      failureReason
    };

    onScanEntry(entry);

    // Save board data and create repair entry
    await saveBoardData(failureDialog.qrCode, 'fail', failureReason);

    try {
      const { error } = await supabase
        .from('repair_entries')
        .insert({
          qr_code: failureDialog.qrCode,
          board_type: ptlOrder.boardType,
          failure_reason: failureReason,
          failure_date: new Date().toISOString().split('T')[0],
          repair_status: 'pending',
          ptl_order_id: ptlOrder.id,
          original_session_id: sessionId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating repair entry:', error);
    }

    // Remove from validated boards since it's now processed
    const newValidatedBoards = { ...validatedBoards };
    delete newValidatedBoards[failureDialog.boxIndex];
    setValidatedBoards(newValidatedBoards);

    setFailureDialog({ open: false, boxIndex: -1, qrCode: '' });
    setFailureReason('');

    toast({
      title: "Board Failed",
      description: `Box ${failureDialog.boxIndex + 1}: ${failureDialog.qrCode}`,
      variant: 'destructive'
    });
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
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox 
                        checked={!!validatedBoards[i]}
                        disabled
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <span className="text-xs text-muted-foreground">Format Valid</span>
                    </div>
                    <Input
                      value={scanInputs[i]}
                      onChange={(e) => handleScanInput(i, e.target.value)}
                      placeholder="Scan QR code..."
                      className={`text-center ${activeBox === i ? 'ring-2 ring-primary' : ''}`}
                      disabled={!isActive}
                      data-box-index={i}
                      autoFocus={activeBox === i}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleManualFail(i)}
                      disabled={!isActive || !validatedBoards[i]}
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
                   disabled={Object.keys(validatedBoards).length === 0}
                 >
                   <CheckCircle className="h-4 w-4 mr-2" />
                   Pass All Unfailed Boards
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