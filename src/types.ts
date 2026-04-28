import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Status = 'pending' | 'approved' | 'rejected';

export interface Member {
  id: string;
  name: string;
  email: string;
  type: string;
  status: string;
  joinDate: string;
  // Audit & System Fields
  companyCode?: string;
  systemStatus?: number; // Reconciled with existing status
  isDeleted?: number;
  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  duration: number;
  purpose: string;
  status: string;
  date: string;
  interestRate?: number;
  totalInterest?: number;
  totalRepayment?: number;
  remainingBalance?: number;
  paidAmount?: number;
  // Audit & System Fields
  companyCode?: string;
  systemStatus?: number; // Reconciled with existing status
  isDeleted?: number;
  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export interface Saving {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  type: string;
  date: string;
  // Audit & System Fields
  companyCode?: string;
  status?: number;
  isDeleted?: number;
  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: string;
}

export interface Finance {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdBy: string;
  createdDate: string;
  // Audit & System Fields
  companyCode?: string;
  status?: number;
  isDeleted?: number;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export interface Document {
  id: string;
  type: string;
  purpose: string;
  status: string;
  requesterId: string;
  requesterName: string;
  supportingDocs?: string;
  requesterSignature?: string;
  approverSignature?: string;
  approvedAt?: string;
  approvedBy?: string;
  approverName?: string;
  notes?: string;
  // Audit & System Fields
  companyCode?: string;
  systemStatus?: number;
  isDeleted?: number;
  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export interface Report {
  id: string;
  title: string;
  category: string;
  description: string;
  location?: string;
  status: string;
  isAnonymous: boolean;
  images?: string;
  userId: string;
  userName: string;
  // Audit & System Fields
  companyCode?: string;
  systemStatus?: number;
  isDeleted?: number;
  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export interface ReportResponse {
  id: string;
  reportId: string;
  message: string;
  responderId: string;
  responderName: string;
  responderRole: string;
  // Audit & System Fields
  companyCode?: string;
  status?: number;
  isDeleted?: number;
  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amountPaid: number;
  paymentDate: string;
  status: string;
  // Audit & System Fields
  companyCode?: string;
  createdBy?: string;
  createdDate?: string;
}

declare global {
  interface Window {
    snap: any;
  }
}
