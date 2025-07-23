export interface PTLOrder {
  id: string;
  orderNumber: string;
  boardType: string;
  expectedFormat: string;
  expectedCount: number;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
}

export interface TesterConfig {
  type: 1 | 4 | 5 | 10;
  scanBoxes: number;
}

export interface PreTestVerification {
  firmwareVersion: string;
  testerCalibration: boolean;
  environmentCheck: boolean;
}

export interface PostTestVerification {
  finalCount: number;
  accessUpdaterSync: boolean;
}

export interface ScanEntry {
  id: string;
  boxIndex: number;
  qrCode: string;
  isValid: boolean;
  timestamp: Date;
  testResult?: 'pass' | 'fail';
  failureReason?: string;
}

export interface ValidationSession {
  id: string;
  ptlOrder: PTLOrder;
  testerConfig: TesterConfig;
  preTestVerification: PreTestVerification;
  postTestVerification?: PostTestVerification;
  startTime: Date;
  endTime?: Date;
  pausedTime?: Date;
  breakTime?: Date;
  status: 'setup' | 'pre-test' | 'scanning' | 'paused' | 'break' | 'post-test' | 'completed';
  scannedEntries: ScanEntry[];
  totalDuration: number;
}