

import type { AdminBooking, Expense, Room, Guest, Tenant, MeterReadingsData, UtilityRates, Employee, PayrollCalculationRow, Task } from '../types';
import * as api from './api';

// --- API Wrappers ---

export const getRooms = (): Promise<Room[]> => api.fetchRooms();
export const addRoom = (room: Omit<Room, 'id'>): Promise<Room> => api.createRoom(room);
export const updateRoom = (id: string, room: Omit<Room, 'id'>): Promise<Room> => api.updateRoom(id, room);
export const removeRoom = (id: string): Promise<void> => api.deleteRoom(id);


export const getBookings = async (): Promise<AdminBooking[]> => {
    const bookings = await api.fetchBookings();
    const guests = await api.fetchAllGuests(); // FIX: Fetch all guests, not just active ones.
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

export const updateBooking = async (id: string, bookingUpdate: { roomId: string, checkIn: string, checkOut: string }): Promise<AdminBooking> => {
    const { roomId, checkIn, checkOut } = bookingUpdate;
    
    const room = await api.fetchRoomById(roomId);
    if (!room) throw new Error("Room not found");

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const durationDays = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
    
    const totalAmount = durationDays * room.price;
    const feeAmount = totalAmount * 0.01; // 1% Provincial Admin Org Fee
    const finalAmount = totalAmount + feeAmount;

    const updatedData = {
        roomId,
        checkIn,
        checkOut,
        totalAmount,
        feeAmount,
        finalAmount,
    };
    
    return api.updateBooking(id, updatedData);
};

export const cancelBooking = (id: string): Promise<AdminBooking> => api.updateBookingStatus(id, 'ยกเลิก');
export const checkInBooking = (id: string): Promise<AdminBooking> => api.updateBookingStatus(id, 'เข้าพัก');
export const checkOutBooking = (id: string): Promise<AdminBooking> => api.updateBookingStatus(id, 'เช็คเอาท์แล้ว');

export const getExpensesForDate = (isoDate: string): Promise<Expense[]> => api.fetchExpensesByDate(isoDate);
export const getAllExpenses = (): Promise<Record<string, Expense[]>> => api.fetchAllExpenses();
export const addExpense = (expense: Omit<Expense, 'id'>): Promise<Expense> => api.createExpense(expense);
export const updateExpense = (id: string, data: Omit<Expense, 'id'>): Promise<Expense> => api.updateExpense(id, data);
export const deleteExpense = (id: string): Promise<void> => api.deleteExpense(id);


export const getCleaningData = (): Promise<Record<string, Record<string, boolean>>> => api.fetchCleaningData();
export const toggleCleaningStatus = (isoDate: string, roomNumber: string): Promise<void> => api.updateCleaningStatus(isoDate, roomNumber);

// Guest Service Functions
export const getAllGuests = (): Promise<Guest[]> => api.fetchAllGuests();
export const addGuest = (data: Omit<Guest, 'id' | 'status'>): Promise<Guest> => api.createGuest(data);
export const updateGuest = (id: string, data: Omit<Guest, 'id' | 'status'>): Promise<Guest> => api.updateGuest(id, data);
export const removeGuest = (id: string): Promise<void> => api.deleteGuest(id);

// Tenant Service Functions
export const getTenants = (): Promise<Tenant[]> => api.fetchActiveTenants();
export const getAllTenants = (): Promise<Tenant[]> => api.fetchAllTenants();
export const addTenant = (data: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => api.createTenant(data);
export const updateTenant = (id: string, data: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => api.updateTenant(id, data);
export const removeTenant = (id: string): Promise<void> => api.deleteTenant(id);
export const getMeterReadings = (tenantId: string): Promise<MeterReadingsData> => api.fetchMeterReadings(tenantId);
export const saveMeterReadings = (tenantId: string, readings: MeterReadingsData): Promise<void> => api.updateMeterReadings(tenantId, readings);
export const getUtilityRates = (): Promise<UtilityRates> => api.fetchUtilityRates();

// Employee Service Functions
export const getEmployees = (): Promise<Employee[]> => api.fetchActiveEmployees();
export const getAllEmployees = (): Promise<Employee[]> => api.fetchAllEmployees();
export const addEmployee = (data: Omit<Employee, 'id' | 'status'>): Promise<Employee> => api.createEmployee(data);
export const updateEmployee = (id: string, data: Omit<Employee, 'id' | 'status'>): Promise<Employee> => api.updateEmployee(id, data);
export const removeEmployee = (id: string): Promise<void> => api.deleteEmployee(id);
export const getPayrollData = (year: number, month: number): Promise<{ period1: PayrollCalculationRow[], period2: PayrollCalculationRow[]}> => api.fetchPayrollDataForMonth(year, month);
export const savePayrollData = (year: number, month: number, data: { period1: PayrollCalculationRow[], period2: PayrollCalculationRow[]}): Promise<void> => api.updatePayrollDataForMonth(year, month, data);

// Task Service Functions
export const getTasks = async (): Promise<Task[]> => {
    const tasks = await api.fetchTasks();
    const employees = await api.fetchAllEmployees();
    const rooms = await api.fetchRooms();

    const employeeMap = new Map(employees.map(e => [e.id, e]));
    const roomMap = new Map(rooms.map(r => [r.id, r]));

    return tasks.map(t => ({
        ...t,
        assignee: t.assigneeId ? employeeMap.get(t.assigneeId) : undefined,
        room: t.relatedRoomId ? roomMap.get(t.relatedRoomId) : undefined,
    }));
};
export const addTask = (data: Omit<Task, 'id'>): Promise<Task> => api.createTask(data);
export const updateTask = (id: string, data: Omit<Task, 'id'>): Promise<Task> => api.updateTask(id, data);
export const removeTask = (id: string): Promise<void> => api.deleteTask(id);