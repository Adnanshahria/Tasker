import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export type AssignmentStatus = "Not Started" | "In Progress" | "Completed";
export type AssignmentPriority = "Low" | "Medium" | "Urgent";

export interface Assignment {
  id: string;
  userId: string;
  title: string;
  subject: string;
  dueDate: Timestamp;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  type: string; // e.g., 'Exam', 'Quiz', 'Project' (User definable)
  weight?: number; // perctage of course grade (0-100)
  score?: number; // Obtained marks
  totalPoints?: number; // Max marks
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  completedDates: string[]; // YYYY-MM-DD
  category: "Health" | "Study" | "Productivity" | "Creativity" | "Other";
}

export interface ChartDataPoint {
  name: string;
  value: number;
}