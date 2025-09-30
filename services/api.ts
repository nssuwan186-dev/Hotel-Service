
import { AdminBooking, Expense, Room, Guest, Tenant, MeterReadingsData, UtilityRates, Employee, PayrollCalculationRow, Task } from '../types';

// 🚨 แทนที่ด้วย Web App URL จริงที่คุณได้จากการ Deploy Apps Script 🚨
const GOOGLE_SHEET_API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

/**
 * ฟังก์ชันหลักในการสื่อสารกับ Google Sheets API ผ่าน Apps Script
 * @param payload Object ที่มี action และ data ที่จะส่งไป
 * @returns Promise ที่ resolve เป็นข้อมูลที่ได้รับกลับมา
 */
async function apiFetch<T>(payload: { action: string; [key: string]: any }): Promise<T> {
    try {
        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Apps Script web apps ต้องการ redirect: 'follow' และ body ที่เป็น string
            redirect: 'follow',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed with status ${response.status}: ${errorText}`);
        }
        
        // สำหรับ request ที่อาจไม่มีการตอบกลับ (เช่น delete)
        const text = await response.text();
        return text ? JSON.parse(text) : null;

    } catch (error) {
        console.error(`API Fetch Error for action "${payload.action}":`, error);
        // ในกรณีที่เกิดข้อผิดพลาด, ส่งค่า default กลับไปเพื่อไม่ให้แอปพัง
        // สำหรับ GET requests, อาจจะส่ง array ว่าง, สำหรับ POST อาจจะ throw error
        if (payload.action.startsWith('fetch') || payload.action.startsWith('get')) {
            return [] as unknown as T;
        }
        throw error;
    }
}


// --- Room API ---
export const fetchRooms = (): Promise<Room[]> => apiFetch({ action: 'getRooms' });
export const fetchRoomById = (id: string): Promise<Room | undefined> => apiFetch({ action: 'getRoomById', id });
export const createRoom = (data: Omit<Room, 'id'>): Promise<Room> => apiFetch({ action: 'createRoom', data });
export const updateRoom = (id: string, data: Omit<Room, 'id'>): Promise<Room> => apiFetch({ action: 'updateRoom', id, data });
export const deleteRoom = (id: string): Promise<void> => apiFetch({ action: 'deleteRoom', id });


// --- Booking API ---
export const fetchBookings = (): Promise<AdminBooking[]> => apiFetch({ action: 'getBookings' });
export const createBooking = (data: Omit<AdminBooking, 'id'>): Promise<AdminBooking> => apiFetch({ action: 'createBooking', data });
export const updateBooking = (id: string, data: Partial<Omit<AdminBooking, 'id'>>): Promise<AdminBooking> => apiFetch({ action: 'updateBooking', id, data });
export const updateBookingStatus = (id: string, status: AdminBooking['status']): Promise<AdminBooking> => apiFetch({ action: 'updateBookingStatus', id, status });

// --- Expense API ---
export const fetchAllExpenses = (): Promise<Record<string, Expense[]>> => apiFetch({ action: 'getAllExpenses' });
export const fetchExpensesByDate = (isoDate: string): Promise<Expense[]> => apiFetch({ action: 'getExpensesByDate', date: isoDate });
export const createExpense = (data: Omit<Expense, 'id'>): Promise<Expense> => apiFetch({ action: 'createExpense', data });
export const updateExpense = (id: string, data: Omit<Expense, 'id'>): Promise<Expense> => apiFetch({ action: 'updateExpense', id, data });
export const deleteExpense = (id: string): Promise<void> => apiFetch({ action: 'deleteExpense', id });

// --- Cleaning API ---
export const fetchCleaningData = (): Promise<Record<string, Record<string, boolean>>> => apiFetch({ action: 'getCleaningData' });
export const updateCleaningStatus = (isoDate: string, roomNumber: string): Promise<void> => apiFetch({ action: 'updateCleaningStatus', date: isoDate, roomNumber });

// --- Guest API ---
export const fetchAllGuests = (): Promise<Guest[]> => apiFetch({ action: 'getAllGuests' });
export const findGuestByPhone = (phone?: string): Promise<Guest | undefined> => apiFetch({ action: 'findGuestByPhone', phone });
export const createGuest = (data: Omit<Guest, 'id'|'status'>): Promise<Guest> => apiFetch({ action: 'createGuest', data });
export const updateGuest = (id: string, data: Omit<Guest, 'id' | 'status'>): Promise<Guest> => apiFetch({ action: 'updateGuest', id, data });
export const deleteGuest = (id: string): Promise<void> => apiFetch({ action: 'deleteGuest', id });

// --- Tenant API ---
export const fetchAllTenants = (): Promise<Tenant[]> => apiFetch({ action: 'getAllTenants' });
export const fetchActiveTenants = (): Promise<Tenant[]> => apiFetch({ action: 'getActiveTenants' });
export const createTenant = (data: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => apiFetch({ action: 'createTenant', data });
export const updateTenant = (id: string, data: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => apiFetch({ action: 'updateTenant', id, data });
export const deleteTenant = (id: string): Promise<void> => apiFetch({ action: 'deleteTenant', id });
export const fetchMeterReadings = (tenantId: string): Promise<MeterReadingsData> => apiFetch({ action: 'getMeterReadings', tenantId });
export const updateMeterReadings = (tenantId: string, readings: MeterReadingsData): Promise<void> => apiFetch({ action: 'updateMeterReadings', tenantId, readings });
export const fetchUtilityRates = (): Promise<UtilityRates> => apiFetch({ action: 'getUtilityRates' });

// --- Employee API ---
export const fetchAllEmployees = (): Promise<Employee[]> => apiFetch({ action: 'getAllEmployees' });
export const fetchActiveEmployees = (): Promise<Employee[]> => apiFetch({ action: 'getActiveEmployees' });
export const createEmployee = (data: Omit<Employee, 'id' | 'status'>): Promise<Employee> => apiFetch({ action: 'createEmployee', data });
export const updateEmployee = (id: string, data: Omit<Employee, 'id' | 'status'>): Promise<Employee> => apiFetch({ action: 'updateEmployee', id, data });
export const deleteEmployee = (id: string): Promise<void> => apiFetch({ action: 'deleteEmployee', id });
export const fetchPayrollDataForMonth = (year: number, month: number): Promise<{ period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }> => apiFetch({ action: 'getPayrollData', year, month });
export const updatePayrollDataForMonth = (year: number, month: number, data: { period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }): Promise<void> => apiFetch({ action: 'updatePayrollData', year, month, data });

// --- Task API ---
export const fetchTasks = (): Promise<Task[]> => apiFetch({ action: 'getTasks' });
export const createTask = (data: Omit<Task, 'id'>): Promise<Task> => apiFetch({ action: 'createTask', data });
export const updateTask = (id: string, data: Omit<Task, 'id'>): Promise<Task> => apiFetch({ action: 'updateTask', id, data });
export const deleteTask = (id: string): Promise<void> => apiFetch({ action: 'deleteTask', id });
