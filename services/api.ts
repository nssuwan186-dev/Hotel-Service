import { AdminBooking, Expense, Room, Guest, Tenant, MeterReading, MeterReadingsData, UtilityRates, Employee, PayrollData, PayrollCalculationRow } from '../types';
import { formatISODate } from './utils';

const today = new Date();
const yesterday = new Date(today.getTime() - 86400000);
const tomorrow = new Date(today.getTime() + 86400000);

// --- In-memory Database ---
let db = {
    rooms: [
        { id: 'r1', roomNumber: 'A101', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r2', roomNumber: 'A102', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r3', roomNumber: 'A103', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r4', roomNumber: 'A104', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r5', roomNumber: 'A105', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r6', roomNumber: 'A106', roomType: 'Standard Twin', price: 500, status: 'ว่าง' },
        { id: 'r7', roomNumber: 'A107', roomType: 'Standard Twin', price: 500, status: 'ว่าง' },
        { id: 'r8', roomNumber: 'A108', roomType: 'Standard Twin', price: 500, status: 'ว่าง' },
        { id: 'r9', roomNumber: 'A109', roomType: 'Standard Twin', price: 500, status: 'ว่าง' },
        { id: 'r10', roomNumber: 'A110', roomType: 'Standard Twin', price: 500, status: 'ว่าง' },
        { id: 'r11', roomNumber: 'A111', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r12', roomNumber: 'A201', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r13', roomNumber: 'A202', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r14', roomNumber: 'A203', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r15', roomNumber: 'A204', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r16', roomNumber: 'A205', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r17', roomNumber: 'A206', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r18', roomNumber: 'A207', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r19', roomNumber: 'A208', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r20', roomNumber: 'A209', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r21', roomNumber: 'A210', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r22', roomNumber: 'A211', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r23', roomNumber: 'B101', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r24', roomNumber: 'B102', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r25', roomNumber: 'B103', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r26', roomNumber: 'B104', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r27', roomNumber: 'B105', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r28', roomNumber: 'B106', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r29', roomNumber: 'B107', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r30', roomNumber: 'B108', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r31', roomNumber: 'B109', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r32', roomNumber: 'B110', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r33', roomNumber: 'B111', roomType: 'Standard Twin', price: 500, status: 'ว่าง' },
        { id: 'r34', roomNumber: 'B201', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r35', roomNumber: 'B202', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r36', roomNumber: 'B203', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r37', roomNumber: 'B204', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r38', roomNumber: 'B205', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r39', roomNumber: 'B206', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r40', roomNumber: 'B207', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r41', roomNumber: 'B208', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r42', roomNumber: 'B209', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r43', roomNumber: 'B210', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r44', roomNumber: 'B211', roomType: 'Standard', price: 400, status: 'ว่าง' },
        { id: 'r45', roomNumber: 'N1', roomType: 'Standard Twin', price: 600, status: 'ว่าง' },
        { id: 'r46', roomNumber: 'N2', roomType: 'Standard', price: 500, status: 'ว่าง' },
        { id: 'r47', roomNumber: 'N3', roomType: 'Standard', price: 500, status: 'ว่าง' },
        { id: 'r48', roomNumber: 'N4', roomType: 'Standard Twin', price: 600, status: 'ว่าง' },
        { id: 'r49', roomNumber: 'N5', roomType: 'Standard Twin', price: 600, status: 'ว่าง' },
        { id: 'r50', roomNumber: 'N6', roomType: 'Standard Twin', price: 600, status: 'ว่าง' },
        { id: 'r51', roomNumber: 'N7', roomType: 'Standard', price: 500, status: 'ว่าง' },
    ] as Room[],
    guests: [
        { id: 'g1', fullName: 'สมชาย ใจดี', phoneNumber: '0812345678', status: 'active' },
        { id: 'g2', fullName: 'สมหญิง จริงใจ', phoneNumber: '0898765432', status: 'active' },
        { id: 'g3', fullName: 'อาทิตย์ กองกาณ', phoneNumber: '0986773611', status: 'active' },
        { id: 'g4', fullName: 'มานพ ศรีสุข', phoneNumber: '0828372824', status: 'inactive' },
        { id: 'g5', fullName: 'กรรณิกา เดชบุรีรัมย์', phoneNumber: '0951655445', status: 'active' },
    ] as Guest[],
    bookings: [
        // Current Stays
        { id: 'VP01244', guestId: 'g1', roomId: 'r1', checkIn: formatISODate(yesterday), checkOut: formatISODate(tomorrow), status: 'เข้าพัก', totalAmount: 800, feeAmount: 8, finalAmount: 808, paymentMethod: 'เงินสด' },
        { id: 'b2', guestId: 'g2', roomId: 'r6', checkIn: formatISODate(today), checkOut: formatISODate(new Date(tomorrow.getTime() + 86400000)), status: 'เข้าพัก', totalAmount: 1000, feeAmount: 10, finalAmount: 1010, paymentMethod: 'เงินโอน QR' },
        // Upcoming Bookings
        { id: 'b3', guestId: 'g3', roomId: 'r2', checkIn: formatISODate(new Date(today.getTime() + 86400000 * 2)), checkOut: formatISODate(new Date(today.getTime() + 86400000 * 3)), status: 'จอง', totalAmount: 400, feeAmount: 4, finalAmount: 404, paymentMethod: 'Pending' },
        // Past Stays
        { id: 'b5', guestId: 'g5', roomId: 'r46', checkIn: formatISODate(new Date(today.getTime() - 86400000 * 5)), checkOut: formatISODate(new Date(today.getTime() - 86400000 * 4)), status: 'เช็คเอาท์แล้ว', totalAmount: 500, feeAmount: 5, finalAmount: 505, paymentMethod: 'เงินสด' },
    ] as AdminBooking[],
    expenses: {
        [formatISODate(today)]: [ { id: 'e1', date: formatISODate(today), category: 'ของใช้ในห้องน้ำ', amount: 550.75, note: 'สบู่, แชมพู' }, ],
        [formatISODate(yesterday)]: [ { id: 'e2', date: formatISODate(yesterday), category: 'ซ่อมบำรุง', amount: 1200.00, note: 'เปลี่ยนหลอดไฟ A103' }, ]
    } as Record<string, Expense[]>,
    cleaning: { [formatISODate(today)]: { 'A103': true } } as Record<string, Record<string, boolean>>,
    
    // Monthly Tenants Data
    tenants: [
      { id: 't1', name: 'นาย ณัฐภัทร ไกรรัตน์', roomNumber: 'A204', rent: 3500, status: 'active' },
      { id: 't2', name: 'น.ส.จีรัญญา มหาคม', roomNumber: 'A205', rent: 3500, status: 'active' },
      { id: 't3', name: 'นายสมศักดิ์ รักเรียน', roomNumber: 'B201', rent: 3200, status: 'inactive' },
    ] as Tenant[],
    meterReadings: {
      't1': {
        '2024': {
          '6': { water: 176, electricity: 5990 }, // ก.ค.
          '7': { water: 179, electricity: 6099 }, // ส.ค.
        }
      },
      't2': {
        '2024': {
          '6': { water: 196, electricity: 8801 }, // ก.ค.
          '7': { water: 201, electricity: 8978 }, // ส.ค.
        }
      }
    } as Record<string, MeterReadingsData>,
    utilityRates: {
      waterPerUnit: 25,
      electricityPerUnit: 8
    } as UtilityRates,

    // Payroll Data
    employees: [
        { id: 'emp1', name: 'นาย ณัฐภัทร สุวรรณโส', position: 'บัญชี', employmentType: 'monthly', baseRate: 6000, accountInfo: { bank: 'ธ.กสิกรไทย', accountNumber: '110-1-49744-1' }, status: 'active' },
        { id: 'emp2', name: 'น.ส สุพัตรา มาลัยเพิ่ม', position: 'แม่บ้าน', employmentType: 'monthly', baseRate: 7000, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '990-0-08635-7' }, status: 'active' },
        { id: 'emp3', name: 'นาง พิกุล สึกชัย', position: 'แม่บ้าน', employmentType: 'daily', baseRate: 320, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '990-0-15862-8' }, status: 'active' },
        { id: 'emp5', name: 'นาย พงษ์เพชร กันนารัตน์', position: 'คนสวน', employmentType: 'daily', baseRate: 400, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '990-0-17427-8' }, status: 'active' },
        { id: 'emp8', name: 'นาย ศิวะพงษ์ จันทร์ศรี', position: 'ร.ป.ภ', employmentType: 'daily', baseRate: 400, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '980-4-84751-6' }, status: 'active' },
        
        // Inactive employees for historical records
        { id: 'emp4', name: 'นายสุพจน์ นาคเสน', position: 'รปภ.', employmentType: 'daily', baseRate: 400, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '990-0-15994-9' }, status: 'inactive' },
        { id: 'emp6', name: 'ธฤษิดา ศรีชลภัทร', position: 'ผู้จัดการ', employmentType: 'monthly', baseRate: 7500, accountInfo: { bank: 'ธ.ไทยพานิชย์', accountNumber: '553-2-74894-6' }, status: 'inactive' },
        { id: 'emp7', name: 'ช่างเตี้ย', position: 'ช่าง', employmentType: 'monthly', baseRate: 5000, accountInfo: { bank: 'พร้อมเพย์', accountNumber: '096-3394961' }, status: 'inactive' },
    ] as Employee[],
    payrollData: {} as PayrollData,
};

const SIMULATED_DELAY = 300;

const simulateApiCall = <T>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), SIMULATED_DELAY);
    });
};

export const fetchRooms = (): Promise<Room[]> => simulateApiCall(db.rooms);
export const fetchRoomById = (id: string): Promise<Room | undefined> => simulateApiCall(db.rooms.find(r => r.id === id));
export const fetchGuests = (): Promise<Guest[]> => simulateApiCall(db.guests.filter(g => g.status === 'active'));
export const fetchBookings = (): Promise<AdminBooking[]> => simulateApiCall(db.bookings);
export const fetchAllExpenses = (): Promise<Record<string, Expense[]>> => simulateApiCall(db.expenses);
export const fetchExpensesByDate = (isoDate: string): Promise<Expense[]> => simulateApiCall(db.expenses[isoDate] || []);
export const fetchCleaningData = (): Promise<Record<string, Record<string, boolean>>> => simulateApiCall(db.cleaning);

// Guest APIs
export const fetchAllGuests = (): Promise<Guest[]> => simulateApiCall(db.guests);
export const findGuestByPhone = (phone?: string): Promise<Guest | undefined> => {
    if (!phone) return simulateApiCall(undefined);
    return simulateApiCall(db.guests.find(g => g.phoneNumber === phone && g.status === 'active'));
}
export const createGuest = (guestData: Omit<Guest, 'id' | 'status'>): Promise<Guest> => {
    const newGuest: Guest = { ...guestData, id: `g${Date.now()}`, status: 'active' };
    db.guests.push(newGuest);
    return simulateApiCall(newGuest);
};
export const updateGuest = (id: string, data: Omit<Guest, 'id' | 'status'>): Promise<Guest> => {
    const index = db.guests.findIndex(g => g.id === id);
    if (index === -1) throw new Error("Guest not found");
    db.guests[index] = { ...db.guests[index], ...data };
    return simulateApiCall(db.guests[index]);
};
export const removeGuest = (id: string): Promise<void> => {
    const index = db.guests.findIndex(g => g.id === id);
    if (index !== -1) {
        db.guests[index].status = 'inactive';
    }
    return simulateApiCall(undefined);
};

export const createBooking = (bookingData: Omit<AdminBooking, 'id'>): Promise<AdminBooking> => {
    const newBooking: AdminBooking = { ...bookingData, id: `b${Date.now()}` };
    db.bookings.push(newBooking);
    return simulateApiCall(newBooking);
};

export const updateBooking = (id: string, data: Partial<Omit<AdminBooking, 'id' | 'guestId'>>): Promise<AdminBooking> => {
    const bookingIndex = db.bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) throw new Error("Booking not found");
    
    const currentGuestId = db.bookings[bookingIndex].guestId;
    const updatedBooking = { ...db.bookings[bookingIndex], ...data, guestId: currentGuestId };
    db.bookings[bookingIndex] = updatedBooking;

    return simulateApiCall(updatedBooking);
};

export const updateBookingStatus = (id: string, status: AdminBooking['status']): Promise<AdminBooking> => {
    const bookingIndex = db.bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) throw new Error("Booking not found");
    db.bookings[bookingIndex].status = status;
    return simulateApiCall(db.bookings[bookingIndex]);
};

export const createExpense = (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const newExpense: Expense = { ...expenseData, id: `e${Date.now()}` };
    const { date } = newExpense;
    if (!db.expenses[date]) {
        db.expenses[date] = [];
    }
    db.expenses[date].push(newExpense);
    return simulateApiCall(newExpense);
};

export const updateCleaningStatus = (isoDate: string, roomNumber: string): Promise<void> => {
    if (!db.cleaning[isoDate]) {
        db.cleaning[isoDate] = {};
    }
    if (db.cleaning[isoDate][roomNumber]) {
        delete db.cleaning[isoDate][roomNumber];
    } else {
        db.cleaning[isoDate][roomNumber] = true;
    }
    return simulateApiCall(undefined);
};

// Monthly Tenant APIs
export const fetchTenants = (): Promise<Tenant[]> => simulateApiCall(db.tenants.filter(t => t.status === 'active'));
export const fetchAllTenants = (): Promise<Tenant[]> => simulateApiCall(db.tenants);
export const createTenant = (data: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => {
    const newTenant: Tenant = { ...data, id: `t${Date.now()}`, status: 'active' };
    db.tenants.push(newTenant);
    return simulateApiCall(newTenant);
};
export const updateTenant = (id: string, data: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => {
    const index = db.tenants.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Tenant not found");
    db.tenants[index] = { ...db.tenants[index], ...data };
    return simulateApiCall(db.tenants[index]);
};
export const removeTenant = (id: string): Promise<void> => {
    const index = db.tenants.findIndex(t => t.id === id);
    if (index !== -1) {
        db.tenants[index].status = 'inactive';
    }
    return simulateApiCall(undefined);
};
export const fetchMeterReadings = (tenantId: string): Promise<MeterReadingsData> => simulateApiCall(db.meterReadings[tenantId] || {});
export const fetchUtilityRates = (): Promise<UtilityRates> => simulateApiCall(db.utilityRates);

export const saveMeterReadings = (tenantId: string, readings: MeterReadingsData): Promise<void> => {
    db.meterReadings[tenantId] = readings;
    return simulateApiCall(undefined);
};


// Employee APIs
export const fetchEmployees = (): Promise<Employee[]> => simulateApiCall(db.employees.filter(e => e.status === 'active'));
export const fetchAllEmployees = (): Promise<Employee[]> => simulateApiCall(db.employees);
export const createEmployee = (data: Omit<Employee, 'id' | 'status'>): Promise<Employee> => {
    const newEmployee: Employee = { ...data, id: `emp${Date.now()}`, status: 'active' };
    db.employees.push(newEmployee);
    return simulateApiCall(newEmployee);
};
export const updateEmployee = (id: string, data: Omit<Employee, 'id' | 'status'>): Promise<Employee> => {
    const index = db.employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Employee not found");
    db.employees[index] = { ...db.employees[index], ...data };
    return simulateApiCall(db.employees[index]);
};
export const removeEmployee = (id: string): Promise<void> => {
    const index = db.employees.findIndex(e => e.id === id);
    if (index !== -1) {
        db.employees[index].status = 'inactive';
    }
    return simulateApiCall(undefined);
};

// Payroll APIs
export const fetchPayrollDataForMonth = (year: number, month: number): Promise<{ period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }> => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const activeEmployees = db.employees.filter(e => e.status === 'active');
    
    // If data exists, sync it with the current active employees
    if (db.payrollData[key]) {
        const existingData = db.payrollData[key];
        const activeEmployeeIds = new Set(activeEmployees.map(e => e.id));
        
        const syncPeriod = (periodData: PayrollCalculationRow[]): PayrollCalculationRow[] => {
            const periodMap = new Map(periodData.map(p => [p.employeeId, p]));
            const newPeriodData: PayrollCalculationRow[] = [];
            
            // Add existing and updated employees
            for (const emp of activeEmployees) {
                if (periodMap.has(emp.id)) {
                    const existingRow = periodMap.get(emp.id)!;
                    // Update non-editable fields
                    existingRow.name = emp.name;
                    existingRow.position = emp.position;
                    existingRow.employmentType = emp.employmentType;
                    existingRow.baseRate = emp.baseRate;
                    existingRow.accountInfo = emp.accountInfo;
                    newPeriodData.push(existingRow);
                } else {
                     newPeriodData.push(defaultRow(emp));
                }
            }
            return newPeriodData;
        };
        
        const syncedData = {
            period1: syncPeriod(existingData.period1),
            period2: syncPeriod(existingData.period2)
        };
        db.payrollData[key] = syncedData;
        return simulateApiCall(syncedData);
    }
    
    const defaultRow = (emp: Employee): PayrollCalculationRow => ({
        employeeId: emp.id,
        name: emp.name,
        position: emp.position,
        employmentType: emp.employmentType,
        baseRate: emp.baseRate,
        accountInfo: emp.accountInfo,
        workDays: emp.employmentType === 'daily' ? '' : '',
        otherIncome: '',
        deductionSocialSecurity: '',
        deductionAbsence: '',
        deductionOther: '',
    });

    const defaultData = {
        period1: activeEmployees.map(defaultRow),
        period2: activeEmployees.map(defaultRow),
    };
    
    return simulateApiCall(defaultData);
};

export const savePayrollDataForMonth = (year: number, month: number, data: { period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }): Promise<void> => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    db.payrollData[key] = data;
    return simulateApiCall(undefined);
};