export interface SessionHistory {
  id: string;
  ptlOrderNumber: string;
  boardType: string;
  technicianName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  totalScanned: number;
  passCount: number;
  failCount: number;
  passRate: number;
  testerConfig: {
    type: number;
    scanBoxes: number;
  };
  status: 'completed' | 'paused' | 'abandoned';
  notes?: string;
}

export interface HistoryFilters {
  technician?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  ptlOrder?: string;
  status?: SessionHistory['status'];
  boardType?: string;
}