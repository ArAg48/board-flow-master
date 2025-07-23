export interface RepairEntry {
  id: string;
  qrCode: string;
  boardType: string;
  failureReason: string;
  failureDate: Date;
  repairStatus: 'pending' | 'in-progress' | 'completed' | 'scrapped';
  assignedTechnician?: string;
  repairNotes?: string;
  repairStartDate?: Date;
  repairCompletedDate?: Date;
  retestResults?: 'pass' | 'fail';
  ptlOrderNumber: string;
  originalSessionId: string;
}

export interface RepairFilters {
  status?: RepairEntry['repairStatus'];
  technician?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  boardType?: string;
}