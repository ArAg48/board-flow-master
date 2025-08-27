export interface PTLOrder {
  id: string;
  orderNumber: string;
  boardType: string;
  expectedFormat: string;
  expectedCount: number;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
  scannedCount?: number;
  passedCount?: number;
  failedCount?: number;
  status?: string;
  firmwareRevision?: string;
}

export interface TesterConfig {
  type: 1 | 4 | 5 | 10;
  scanBoxes: number;
}

export interface PreTestVerification {
  testerCheck: boolean;
  firmwareCheck: boolean;
}

export interface PostTestVerification {
  finalCount: number;
  accessUpdaterSync: boolean;
  productCountVerified: string;
  axxessUpdater: string;
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
  // Active time tracking (exclude paused periods)
  activeStart?: Date;
  accumulatedActiveMs?: number;
}