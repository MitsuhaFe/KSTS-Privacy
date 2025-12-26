export type Role = 'TEACHER' | 'HEADMASTER' | 'LEADER';

export enum SecurityLevel {
  PUBLIC = 0,
  CONFIDENTIAL = 1,
}

export interface StudentTag {
  label: string;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
}

export interface Student {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  classId: string;
  avatar: string;
  isBoarder: boolean;
  publicTags: StudentTag[]; // Updated to support colors
  // Confidential Data
  familyBackground?: {
    economicStatus: 'Difficult' | 'Average' | 'Affluent';
    guardianContact: string;
    notes: string;
  };
  psychProfile?: {
    status: 'Healthy' | 'At Risk' | 'Critical';
    lastAssessment: string;
    notes: string;
  };
}

export interface LogEntry {
  id: string;
  studentId: string;
  date: string;
  type: 'Behavior' | 'Homework' | 'Intervention' | 'Family' | 'Psych';
  content: string; 
  tags: string[];
  securityLevel: SecurityLevel;
  author: string;
}

export interface GradeRecord {
  id?: string;
  studentId: string; 
  subject: string;
  score: number;
  date: string;
  examName: string;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  alert?: boolean;
}

export interface AlertItem {
  id: string;
  studentId: string;
  studentName: string;
  type: 'Academic' | 'Behavior' | 'Psych' | 'Family'; 
  level: 'High' | 'Medium' | 'Low';
  date: string;
  contentPublic: string;        
  contentConfidential?: string; 
}

export interface ClassAcademicStat {
  subject: string;
  average: number;
  max: number;
  min: number;
}