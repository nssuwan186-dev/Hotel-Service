import type { AdminBooking, Expense, Room, Guest, Tenant, MeterReadingsData, UtilityRates, Employee, PayrollCalculationRow } from '../types';
import * as api from './api';

const isDateInRange = (date: Date, start: Date, endExclusive: Date): boolean => {
    const d = new Date(date).setHours(0, 0, 0, 0);
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(endExclusive).setHours(0, 0, 0, 0);
    return d >= s && d < e;
};

// --- API Wrappers ---

export const getRooms = (): Promise<Room[]> => api.fetchRooms();

export const getBookings = async (): Promise<AdminBooking[]> => {
    const bookings = await api.fetchBookings();
    const guests = await api.fetchGuests(); // Fetches only active guests
    const rooms = await api.fetchRooms();

    const guestMap = new Map(guests.map(g => [g.id, g]));
    const roomMap = new Map(rooms.map(r => [r.id, r]));

    return bookings.map(b => ({
        ...b,
        guest: guestMap.get(b.guestId),
        room: roomMap.get(b.roomId),
    }));
};

export const addBooking = async (booking: Omit<AdminBooking, 'id' | 'status' | 'totalAmount' | 'feeAmount' | 'finalAmount' | 'paymentMethod'>, guest: Omit<Guest, 'id' | 'status'>): Promise<AdminBooking> => {
    // Check if guest already exists
    let guestRecord = await api.findGuestByPhone(guest.phoneNumber);
    if (!guestRecord) {
        guestRecord = await api.createGuest(guest);
    }
    
    const room = await api.fetchRoomById(booking.roomId);
    if (!room) throw new Error("Room not found");

    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const durationDays = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
    
    const totalAmount = durationDays * room.price;
    const feeAmount = totalAmount * 0.01; // 1% Provincial Admin Org Fee
    const finalAmount = totalAmount + feeAmount;

    const newBookingData: Omit<AdminBooking, 'id'> = {
        ...booking,
        guestId: guestRecord.id,
        status: 'จอง',
        totalAmount,
        feeAmount,
        finalAmount,
        paymentMethod: 'Pending',
    };
    return api.createBooking(newBookingData);
};

export const cancelBooking = (id: string): Promise<AdminBooking> => api.updateBookingStatus(id, 'ยกเลิก');

export const getExpensesForDate = (isoDate: string): Promise<Expense[]> => api.fetchExpensesByDate(isoDate);
export const getAllExpenses = (): Promise<Record<string, Expense[]>> => api.fetchAllExpenses();

export const addExpense = (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    return api.createExpense(expense);
};

export const getCleaningData = (): Promise<Record<string, Record<string, boolean>>> => api.fetchCleaningData();
export const toggleCleaningStatus = (isoDate: string, roomNumber: string): Promise<void> => api.updateCleaningStatus(isoDate, roomNumber);

// Guest Service Functions
export const getAllGuests = (): Promise<Guest[]> => api.fetchAllGuests();
export const addGuest = (guest: Omit<Guest, 'id' | 'status'>): Promise<Guest> => api.createGuest(guest);
export const updateGuest = (id: string, guest: Omit<Guest, 'id' | 'status'>): Promise<Guest> => api.updateGuest(id, guest);
export const removeGuest = (id: string): Promise<void> => api.removeGuest(id);

// Tenant Service Functions
export const getTenants = (): Promise<Tenant[]> => api.fetchTenants();
export const getAllTenants = (): Promise<Tenant[]> => api.fetchAllTenants();
export const addTenant = (tenant: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => api.createTenant(tenant);
export const updateTenant = (id: string, tenant: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => api.updateTenant(id, tenant);
export const removeTenant = (id: string): Promise<void> => api.removeTenant(id);
export const getMeterReadings = (tenantId: string): Promise<MeterReadingsData> => api.fetchMeterReadings(tenantId);
export const getUtilityRates = (): Promise<UtilityRates> => api.fetchUtilityRates();
export const saveMeterReadings = (tenantId: string, readings: MeterReadingsData): Promise<void> => api.saveMeterReadings(tenantId, readings);

// Employee Service Functions
export const getEmployees = (): Promise<Employee[]> => api.fetchEmployees();
export const getAllEmployees = (): Promise<Employee[]> => api.fetchAllEmployees();
export const addEmployee = (employee: Omit<Employee, 'id' | 'status'>): Promise<Employee> => api.createEmployee(employee);
export const updateEmployee = (id: string, employee: Omit<Employee, 'id' | 'status'>): Promise<Employee> => api.updateEmployee(id, employee);
export const removeEmployee = (id: string): Promise<void> => api.removeEmployee(id);

// Payroll Service Functions
export const getPayrollData = (year: number, month: number): Promise<{ period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }> => api.fetchPayrollDataForMonth(year, month);
export const savePayrollData = (year: number, month: number, data: { period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }): Promise<void> => api.savePayrollDataForMonth(year, month, data);