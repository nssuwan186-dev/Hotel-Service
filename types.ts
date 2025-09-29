// Types for Admin Panel
// FIX: Removed unnecessary 'react/next' type reference which caused an error.

// Declare global variables from script tags
// FIX: Wrapped in declare global to correctly augment the global scope from within a module.
declare global {
  // jsPDF UMD library exposes a 'jspdf' object on the window
  const jspdf: {
    jsPDF: any; // The constructor is accessed via jspdf.jsPDF
  };
  // jspdf-autotable plugin
  var autoTable: any;
}


export interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  status: 'ว่าง' | 'ไม่ว่าง' | 'ทำความสะอาด' | 'ปิดปรับปรุง';
}

export interface Guest {
  id:string;
  fullName: string;
  idCardNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  licensePlate?: string;
  status: 'active' | 'inactive';
}

export interface AdminBooking {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  status: 'จอง' | 'เข้าพัก' | 'เช็คเอาท์แล้ว' | 'ยกเลิก';
  totalAmount: number;
  feeAmount: number;
  finalAmount: number;
  paymentMethod: 'เงินสด' | 'เงินโอน QR' | 'Pending';
  note?: string;

  // Optional: for display purposes
  guest?: Guest;
  room?: Room;
}


export interface Expense {
  id: string;
  category: string;
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
}

// Notification System Type
export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

// Monthly Tenant Types
export interface Tenant {
  id: string;
  name: string;
  roomNumber: string;
  rent: number;
  status: 'active' | 'inactive';
}

export interface MeterReading {
  water: number | null;
  electricity: number | null;
}

// Year -> Month (0-11) -> Readings
export type MeterReadingsData = Record<string, Record<string, MeterReading>>;

export interface UtilityRates {
  waterPerUnit: number;
  electricityPerUnit: number;
}

// Payroll System Types
export interface Employee {
  id: string;
  name: string;
  position: string;
  employmentType: 'monthly' | 'daily';
  baseRate: number; // Monthly salary or daily rate
  accountInfo: {
    bank: string;
    accountNumber: string;
  };
  status: 'active' | 'inactive';
}

export interface PayrollCalculationRow {
  employeeId: string;
  name: string;
  position: string;
  employmentType: 'monthly' | 'daily';
  baseRate: number; // monthly salary or daily wage
  accountInfo: { bank: string; accountNumber: string };

  // Period specific INPUT data (editable)
  workDays?: number | '' ; // For daily employees
  otherIncome?: number | '' ; // e.g., OT from PDF
  deductionSocialSecurity?: number | '' ;
  deductionAbsence?: number | '' ;
  deductionOther?: number | '' ;
}

// YYYY-MM -> { period1: data, period2: data }
export type PayrollData = Record<string, {
  period1: PayrollCalculationRow[];
  period2: PayrollCalculationRow[];
}>;


// Legacy type, can be removed later
export interface StayRecord {
  seq: number;
  transactionId: string;
  paymentType: string;
  checkIn: Date | null;
  checkOut: Date | null;
  room: string;
  fullName: string;
}