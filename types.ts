export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  HR_ADMIN = 'HR_ADMIN'
}

export enum ShiftStatus {
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  COMPLETED = 'COMPLETED'
}

export enum Department {
  WARD_2A = '2A病棟',
  WARD_3A = '3A病棟',
  WARD_3B = '3B病棟',
  WARD_4A = '4A病棟',
  OTHER = 'その他'
}

export enum JobRole {
  NURSE = '看護師',
  ASSISTANT = '看護補助者',
  OTHER = 'その他'
}

export interface Shift {
  id: string;
  title: string;
  department: Department;
  jobRole: JobRole;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRateBoost: number; // Extra pay per hour (yen)
  description: string;
  requirements: string;
  status: ShiftStatus;
  applicantIds: string[];
  assignedUserId?: string;
}

export interface User {
  id: string;
  name: string;
  department: Department;
  role: UserRole;
  password?: string; // Added for authentication
}

export interface PolicyDraft {
  title: string;
  content: string;
  createdAt: Date;
}