
import { AdminBooking, Expense, Room, Guest, Tenant, MeterReading, MeterReadingsData, UtilityRates, Employee, PayrollData, PayrollCalculationRow, Task } from '../types';
import { formatISODate } from './utils';

// FIX: Added helper functions to simulate async API calls and generate unique IDs.
const simulateApi = <T>(data: T): Promise<T> => new Promise(resolve => setTimeout(() => {
    // A deep copy is simulated by stringifying and parsing.
    // However, JSON.stringify(undefined) results in `undefined`, which `JSON.parse` cannot handle.
    // This check ensures that functions returning `void` (which is `undefined` at runtime) resolve correctly.
    if (data === undefined) {
        resolve(data);
        return;
    }
    resolve(JSON.parse(JSON.stringify(data)));
}, 50));
const generateId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


const today = new Date();
const yesterday = new Date(today.getTime() - 86400000);
const tomorrow = new Date(today.getTime() + 86400000);

// --- Payroll Data Helper ---
// Helper to create payroll rows consistently.
const createPayrollRow = (empId: string, allEmployees: Employee[], overrides: Partial<PayrollCalculationRow>): PayrollCalculationRow => {
    const emp = allEmployees.find(e => e.id === empId);
    if (!emp) throw new Error(`Employee ${empId} not found for payroll creation`);
    
    // Start with a default structure
    const row: PayrollCalculationRow = {
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
    };
    
    // Apply specific overrides for the period
    return { ...row, ...overrides };
};

// Helper function to simulate the "CLEAN" step from the user's schema design.
// It converts raw price strings (e.g., "400 บาท", "500.00") into numbers.
const cleanPrice = (rawPrice: string | number): number => {
    // If it's already a number, return it.
    if (typeof rawPrice === 'number') {
        return rawPrice;
    }
    // 1. Use Regular Expression to remove any characters that are not digits (0-9) or a decimal point.
    const numericString = rawPrice.replace(/[^0-9.]/g, '');
    
    // 2. Parse the cleaned string into a floating-point number.
    const parsedPrice = parseFloat(numericString);
    
    // 3. For safety, if parsing results in NaN (Not-a-Number), return 0.
    return isNaN(parsedPrice) ? 0 : parsedPrice;
};

// Interface for raw data, as requested by the user.
interface RawTransaction {
    bookingId: string;
    guestName: string;
    phone: string | null;
    roomNumber: string;
    checkIn: string;
    duration: number;
    price: number | string; // The problematic field that can be string or number
    payment: 'เงินสด' | 'เงินโอน QR';
}


// --- In-memory Database ---
let db_employees: Employee[] = [
    { id: 'emp1', name: 'นาย ณัฐภัทร สุวรรณโส', position: 'บัญชี', employmentType: 'monthly', baseRate: 6000, accountInfo: { bank: 'ธ.กสิกรไทย', accountNumber: '110-1-49744-1' }, status: 'active' },
    { id: 'emp2', name: 'น.ส สุพัตรา มาลัยเพิ่ม', position: 'แม่บ้าน', employmentType: 'monthly', baseRate: 7000, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '990-0-08635-7' }, status: 'active' },
    { id: 'emp3', name: 'นาง พิกุล สึกชัย', position: 'แม่บ้าน', employmentType: 'daily', baseRate: 320, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '990-0-15862-8' }, status: 'active' },
    { id: 'emp5', name: 'นาย พงษ์เพชร กันนารัตน์', position: 'คนสวน', employmentType: 'daily', baseRate: 400, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '990-0-17427-8' }, status: 'active' },
    { id: 'emp8', name: 'นาย ศิวะพงษ์ จันทร์ศรี', position: 'ร.ป.ภ', employmentType: 'daily', baseRate: 400, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '980-4-84751-6' }, status: 'active' },
    
    // Inactive employees for historical records
    { id: 'emp4', name: 'นายสุพจน์ นาคเสน', position: 'รปภ.', employmentType: 'daily', baseRate: 400, accountInfo: { bank: 'ธ.กรุงเทพ', accountNumber: '990-0-15994-9' }, status: 'inactive' },
    { id: 'emp6', name: 'ธฤษิดา ศรีชลภัทร', position: 'ผู้จัดการ', employmentType: 'monthly', baseRate: 7500, accountInfo: { bank: 'ธ.ไทยพานิชย์', accountNumber: '553-2-74894-6' }, status: 'inactive' },
    { id: 'emp7', name: 'ช่างเตี้ย', position: 'ช่าง', employmentType: 'monthly', baseRate: 5000, accountInfo: { bank: 'พร้อมเพย์', accountNumber: '096-3394961' }, status: 'inactive' },
];

const pr = (empId: string, overrides: Partial<PayrollCalculationRow>) => createPayrollRow(empId, db_employees, overrides);


// --- Data Hydration ---
const rooms: Room[] = [
    { id: 'r1', roomNumber: 'A101', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r2', roomNumber: 'A102', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r3', roomNumber: 'A103', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r4', roomNumber: 'A104', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r5', roomNumber: 'A105', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r6', roomNumber: 'A106', roomType: 'Standard Twin', price: 500, status: 'ว่าง' }, { id: 'r7', roomNumber: 'A107', roomType: 'Standard Twin', price: 500, status: 'ว่าง' }, { id: 'r8', roomNumber: 'A108', roomType: 'Standard Twin', price: 500, status: 'ว่าง' }, { id: 'r9', roomNumber: 'A109', roomType: 'Standard Twin', price: 500, status: 'ว่าง' }, { id: 'r10', roomNumber: 'A110', roomType: 'Standard Twin', price: 500, status: 'ว่าง' }, { id: 'r11', roomNumber: 'A111', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r12', roomNumber: 'A201', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r13', roomNumber: 'A202', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r14', roomNumber: 'A203', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r15', roomNumber: 'A204', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r16', roomNumber: 'A205', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r17', roomNumber: 'A206', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r18', roomNumber: 'A207', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r19', roomNumber: 'A208', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r20', roomNumber: 'A209', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r21', roomNumber: 'A210', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r22', roomNumber: 'A211', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r23', roomNumber: 'B101', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r24', roomNumber: 'B102', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r25', roomNumber: 'B103', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r26', roomNumber: 'B104', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r27', roomNumber: 'B105', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r28', roomNumber: 'B106', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r29', roomNumber: 'B107', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r30', roomNumber: 'B108', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r31', roomNumber: 'B109', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r32', roomNumber: 'B110', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r33', roomNumber: 'B111', roomType: 'Standard Twin', price: 500, status: 'ว่าง' }, { id: 'r34', roomNumber: 'B201', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r35', roomNumber: 'B202', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r36', roomNumber: 'B203', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r37', roomNumber: 'B204', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r38', roomNumber: 'B205', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r39', roomNumber: 'B206', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r40', roomNumber: 'B207', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r41', roomNumber: 'B208', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r42', roomNumber: 'B209', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r43', roomNumber: 'B210', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r44', roomNumber: 'B211', roomType: 'Standard', price: 400, status: 'ว่าง' }, { id: 'r45', roomNumber: 'N1', roomType: 'Standard Twin', price: 600, status: 'ว่าง' }, { id: 'r46', roomNumber: 'N2', roomType: 'Standard', price: 500, status: 'ว่าง' }, { id: 'r47', roomNumber: 'N3', roomType: 'Standard', price: 500, status: 'ว่าง' }, { id: 'r48', roomNumber: 'N4', roomType: 'Standard Twin', price: 600, status: 'ว่าง' }, { id: 'r49', roomNumber: 'N5', roomType: 'Standard Twin', price: 600, status: 'ว่าง' }, { id: 'r50', roomNumber: 'N6', roomType: 'Standard Twin', price: 600, status: 'ว่าง' }, { id: 'r51', roomNumber: 'N7', roomType: 'Standard', price: 500, status: 'ว่าง' },
];
const roomMap = new Map(rooms.map(r => [r.roomNumber, r.id]));

// Raw historical transaction data (Data Lake simulation)
const historicalTransactions: RawTransaction[] = [
    { bookingId: 'VP01146', guestName: 'เชาวลิต', phone: '098-7991-839', roomNumber: 'B106', checkIn: '2025-08-02', duration: 1, price: '400 บาท', payment: 'เงินสด' },
    { bookingId: 'VP01147', guestName: 'เหนือฟ้า', phone: '064-3586-160', roomNumber: 'A102', checkIn: '2025-08-02', duration: 1, price: '400.00', payment: 'เงินโอน QR' },
    { bookingId: 'VP01148', guestName: 'ทวีศักดิ์', phone: '082-8389-843', roomNumber: 'B107', checkIn: '2025-08-02', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01149', guestName: 'สุริยันห์ ยิ่งลาท', phone: '092-5202-651', roomNumber: 'A103', checkIn: '2025-08-03', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01150', guestName: 'วีระยุทธ วีระกร', phone: '064-5919-705', roomNumber: 'N2', checkIn: '2025-08-03', duration: 1, price: '500', payment: 'เงินสด' },
    { bookingId: 'VP01151', guestName: 'ดวงฤดี ธนพรรัชต์', phone: '092-8067-515', roomNumber: 'A104', checkIn: '2025-08-03', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01152', guestName: 'ณัฐวุฒิ โพธิ์สว่าง', phone: '088-5605-004', roomNumber: 'A105', checkIn: '2025-08-03', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01153', guestName: 'อภิชาติ', phone: '082-2474-822', roomNumber: 'N3', checkIn: '2025-08-03', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01154', guestName: 'วุฒิชัย เศษรักษา', phone: '098-6460-740', roomNumber: 'A109', checkIn: '2025-08-04', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01155', guestName: 'ชัชพล หลวงชา', phone: '091-8673-787', roomNumber: 'A111', checkIn: '2025-08-04', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01156', guestName: 'คุณปอนด์', phone: '06-2414-378', roomNumber: 'A201', checkIn: '2025-08-04', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01157', guestName: 'เพลง', phone: '081-9524-051', roomNumber: 'A106', checkIn: '2025-08-04', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01158', guestName: 'โสภณ', phone: '083-7257-244', roomNumber: 'A202', checkIn: '2025-08-04', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01159', guestName: 'บริษัท โชวี่', phone: '081-7369-113', roomNumber: 'A203', checkIn: '2025-08-04', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01160', guestName: 'คุณส้ม', phone: '065-9208-391', roomNumber: 'A107', checkIn: '2025-08-04', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01161', guestName: 'เต้', phone: '088-2744-477', roomNumber: 'A204', checkIn: '2025-08-04', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01162', guestName: 'อธิวัฒน์ ยาทองไชย', phone: '063-5250-916', roomNumber: 'A205', checkIn: '2025-08-05', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01163', guestName: 'พัชรินทร์', phone: '080-2104-363', roomNumber: 'A206', checkIn: '2025-08-05', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01164', guestName: 'ราชสีมา', phone: null, roomNumber: 'A207', checkIn: '2025-08-05', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01165', guestName: 'กำธร โพธิ์เสน', phone: '089-5305-462', roomNumber: 'A208', checkIn: '2025-08-05', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01166', guestName: 'คุณเป๊ก', phone: '065-1193-844', roomNumber: 'A209', checkIn: '2025-08-06', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01167', guestName: 'พิชิตชัย', phone: '080-0138-270', roomNumber: 'A108', checkIn: '2025-08-06', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01168', guestName: 'คุณ พีระ ตรีบวรกุศล', phone: '085-6672-260', roomNumber: 'A110', checkIn: '2025-08-06', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01169', guestName: 'บรรเจิด หอยทอง', phone: '081-4410-591', roomNumber: 'A210', checkIn: '2025-08-06', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01170', guestName: 'สมภพ โชติวงษ์', phone: '089-2087-259', roomNumber: 'A211', checkIn: '2025-08-07', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01171', guestName: 'คุณสุพัตรา', phone: '099-4526-649', roomNumber: 'B101', checkIn: '2025-08-07', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01172', guestName: 'ลุงเลียม', phone: '088-7479-892', roomNumber: 'B102', checkIn: '2025-08-07', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01173', guestName: 'วิชิต', phone: '093-1011-156', roomNumber: 'B103', checkIn: '2025-08-07', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01174', guestName: 'น้องฟ้า', phone: '080-1805-376', roomNumber: 'B104', checkIn: '2025-08-07', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01175', guestName: 'ธีรพงษ์', phone: '080-4651-451', roomNumber: 'B105', checkIn: '2025-08-07', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01176', guestName: 'คมกริช กุหลาบขาว', phone: null, roomNumber: 'B108', checkIn: '2025-08-08', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01177', guestName: 'คุณวัน', phone: null, roomNumber: 'B109', checkIn: '2025-08-08', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01178', guestName: 'สำเริง เดือนคล้อย', phone: '089-2542-788', roomNumber: 'B111', checkIn: '2025-08-08', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01179', guestName: 'จิณิพงษ์ ละการชั่ว', phone: '080-2454-323', roomNumber: 'N7', checkIn: '2025-08-08', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01180', guestName: 'ธาราวุธ', phone: '082-2698-388', roomNumber: 'B202', checkIn: '2025-08-09', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01181', guestName: 'จีระเดช แข็งขัน', phone: '064-0100-598', roomNumber: 'B203', checkIn: '2025-08-09', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01182', guestName: 'นายวิทยา ชัยระเทศ', phone: '064-9929-890', roomNumber: 'B204', checkIn: '2025-08-09', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01183', guestName: 'ชญานิศ ชินใหม่', phone: '063-0290-136', roomNumber: 'B205', checkIn: '2025-08-09', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01184', guestName: 'สุกัญญา', phone: '096-5306-618', roomNumber: 'B206', checkIn: '2025-08-09', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01185', guestName: 'ชัยศักดิ์ อัดตละ', phone: '089-3977-374', roomNumber: 'B207', checkIn: '2025-08-09', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01186', guestName: 'ภณัชกร', phone: '099-6864-837', roomNumber: 'N5', checkIn: '2025-08-09', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01187', guestName: 'ต่าย', phone: '094-4824-955', roomNumber: 'N6', checkIn: '2025-08-09', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01188', guestName: 'บริษัท ชัวร์ ฟิลเตอร์ (ประเทศไทย) จำกัด', phone: null, roomNumber: 'B208', checkIn: '2025-08-09', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01189', guestName: 'วิญญู', phone: '082-8500-850', roomNumber: 'A108', checkIn: '2025-08-10', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01190', guestName: 'คุณสมบัติ', phone: '098-1834-229', roomNumber: 'A101', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01191', guestName: 'สันติ ขอมกิ่ง', phone: '092-9526-159', roomNumber: 'A102', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01192', guestName: 'มนัส', phone: '089-5126-243', roomNumber: 'A103', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01193', guestName: 'บริษัท ดี.เอช.เอ.สยามวาลา จํากัด', phone: null, roomNumber: 'A104', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01194', guestName: 'บริษัท ไบโอ', phone: null, roomNumber: 'A105', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01195', guestName: 'ปณต โพธิ์สว่าง', phone: '093-5435-843', roomNumber: 'A106', checkIn: '2025-08-10', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01196', guestName: 'สุจิตรา ธรรมเจริญ', phone: '092-8875-964', roomNumber: 'A111', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01197', guestName: 'ประนมไพร', phone: '080-0556-182', roomNumber: 'A201', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01198', guestName: 'วินัย', phone: '080-7710-888', roomNumber: 'A202', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01199', guestName: 'ชุตินันต์', phone: '093-5202-132', roomNumber: 'A107', checkIn: '2025-08-10', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01200', guestName: 'ธีรยุทธ', phone: null, roomNumber: 'A109', checkIn: '2025-08-10', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01201', guestName: 'นมดูเม็ก', phone: '095-205-2957', roomNumber: 'A203', checkIn: '2025-08-10', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01202', guestName: 'วงศ์วรัญ นารถชัย', phone: null, roomNumber: 'A207', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01203', guestName: 'บริษัท เค เทคนิคเชี่ยน แอนด์ เซอร์วิส จำกัด', phone: null, roomNumber: 'A208', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01204', guestName: 'บริษัท ห้าม้า โอสถ จำกัด', phone: null, roomNumber: 'A110', checkIn: '2025-08-11', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01205', guestName: 'ศราวุฒิ', phone: '091-0518-256', roomNumber: 'A209', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01206', guestName: 'ครูยา', phone: '081-0540-830', roomNumber: 'A210', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01207', guestName: 'ทองใส', phone: '084-5929-022', roomNumber: 'A211', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01208', guestName: 'ยุทธพงษ์', phone: '062-5782-534', roomNumber: 'B101', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01209', guestName: 'ช่อผกา', phone: '086-4342-126', roomNumber: 'B102', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01210', guestName: 'รัฐธรรมนูญ', phone: '086-2682-833', roomNumber: 'B103', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01211', guestName: 'จุติพร เทยเลอร์', phone: '080-7014-582', roomNumber: 'B104', checkIn: '2025-08-11', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01212', guestName: 'บริษัท เอคโค่', phone: '098-6239-932', roomNumber: 'B105', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01213', guestName: 'วรวุธ', phone: '091-8622-406', roomNumber: 'B106', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01214', guestName: 'คุณตุ๊', phone: '098-2269-056', roomNumber: 'B107', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01215', guestName: 'น้องเบลล์', phone: null, roomNumber: 'B108', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01216', guestName: 'วิจิตรา', phone: '080-7569-935', roomNumber: 'B109', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01217', guestName: 'พิศิษ', phone: '082-1130-448', roomNumber: 'B110', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01218', guestName: 'สุชาติ', phone: null, roomNumber: 'B201', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01219', guestName: 'ทนากร', phone: '094-4985-514', roomNumber: 'B202', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01220', guestName: 'บริษัท ออโตคอร์ป โฮลดิ้ง จำกัด', phone: null, roomNumber: 'B203', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01221', guestName: 'เบนซ์', phone: null, roomNumber: 'B204', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01222', guestName: 'คุณ ธนาธร', phone: '094-4985-514', roomNumber: 'B205', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01223', guestName: 'คุณ วรพล', phone: '094-6828-266', roomNumber: 'B206', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01224', guestName: 'มานพ', phone: '082-8372-824', roomNumber: 'B207', checkIn: '2025-08-12', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01225', guestName: 'กิ่งกานณ์ กุลาวงษ์', phone: '082-9299-888', roomNumber: 'B208', checkIn: '2025-08-13', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01226', guestName: 'กรรณิกา', phone: '095-1655-445', roomNumber: 'B209', checkIn: '2025-08-13', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01227', guestName: 'น.ส. ชนิทณี เดชบุรีรัมธ', phone: '086-3403-382', roomNumber: 'B210', checkIn: '2025-08-13', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01228', guestName: 'รุ่งโรจน์', phone: '062-8573-585', roomNumber: 'B211', checkIn: '2025-08-13', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01229', guestName: 'คุณ ปอนด์', phone: '098-7993-370', roomNumber: 'A101', checkIn: '2025-08-13', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01230', guestName: 'เตชิน', phone: '083-0408-237', roomNumber: 'A106', checkIn: '2025-08-13', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01231', guestName: 'ช่างซ่อมเครื่องซักผ้า', phone: null, roomNumber: 'A107', checkIn: '2025-08-13', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01232', guestName: 'ธวัชชัย', phone: null, roomNumber: 'A108', checkIn: '2025-08-13', duration: 1, price: 500, payment: 'เงินโอน QR' },
    { bookingId: 'VP01233', guestName: 'อาทิตย์', phone: '096-6317-976', roomNumber: 'A102', checkIn: '2025-08-14', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01234', guestName: 'ชาวลิต', phone: '098-7991-839', roomNumber: 'A103', checkIn: '2025-08-14', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01235', guestName: 'สมควร', phone: '095-8614-778', roomNumber: 'A104', checkIn: '2025-08-14', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01236', guestName: 'คุณทาม', phone: '090-192-0150', roomNumber: 'A105', checkIn: '2025-08-14', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01237', guestName: 'ลลิตา', phone: '064-3364-681', roomNumber: 'A111', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01238', guestName: 'คุณไพโรจน์', phone: null, roomNumber: 'A201', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01239', guestName: 'คุณสนธยา', phone: '080-8192-542', roomNumber: 'A202', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01240', guestName: 'คุณฉัตรชัย', phone: null, roomNumber: 'A203', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01241', guestName: 'ฐิติกา', phone: '064-0351-274', roomNumber: 'A109', checkIn: '2025-08-15', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01242', guestName: 'วัชรินทร์', phone: '095-2219-945', roomNumber: 'A205', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01243', guestName: 'ชญานี', phone: '064-7293-821', roomNumber: 'A206', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01244', guestName: 'อนุชิต', phone: '061-2598-988', roomNumber: 'B104', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01245', guestName: 'โชติรส', phone: '063-3614-993', roomNumber: 'B105', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01246', guestName: 'ธิดารัตน์', phone: '096-3453-706', roomNumber: 'B106', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01247', guestName: 'ภาณุวัฒน์', phone: '098-3498-404', roomNumber: 'B107', checkIn: '2025-08-15', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01248', guestName: 'สวภณ', phone: '067-6435-832', roomNumber: 'B108', checkIn: '2025-08-16', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01249', guestName: 'ณัฐภัทร', phone: '085-4840-614', roomNumber: 'B109', checkIn: '2025-08-16', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01250', guestName: 'ตองสาม', phone: '088-8924-498', roomNumber: 'A106', checkIn: '2025-08-16', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01251', guestName: 'ธิติยา', phone: '062-1878-476', roomNumber: 'A107', checkIn: '2025-08-16', duration: 1, price: 500, payment: 'เงินสด' },
    { bookingId: 'VP01252', guestName: 'สุระชัย', phone: '088-9435-547', roomNumber: 'B110', checkIn: '2025-08-16', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01253', guestName: 'อภิวัฒน์', phone: '081-8724-322', roomNumber: 'N1', checkIn: '2025-08-16', duration: 1, price: 600, payment: 'เงินสด' },
    { bookingId: 'VP01254', guestName: 'กชพรรณ', phone: '098-2405-411', roomNumber: 'B201', checkIn: '2025-08-16', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01255', guestName: 'เอ้', phone: '089-4480-514', roomNumber: 'B202', checkIn: '2025-08-16', duration: 1, price: 400, payment: 'เงินโอน QR' },
    { bookingId: 'VP01256', guestName: 'วัฒนา สีอ่อง', phone: '080-2372-464', roomNumber: 'B203', checkIn: '2025-08-16', duration: 1, price: 400, payment: 'เงินสด' },
    { bookingId: 'VP01257', guestName: 'จรัสชัย', phone: '096-0978-692', roomNumber: 'B204', checkIn: '2025-08-16', duration: 1, price: 400, payment: 'เงินสด' },
];

// FIX: Added implementation for all missing API functions and data stores.
// --- Additional Data Stores ---
let db_guests: Guest[] = [];
let db_bookings: AdminBooking[] = [];
let db_expenses: Record<string, Expense[]> = {
    '2024-11-15': [ { id: generateId('exp'), date: '2024-11-15', category: 'เงินเดือน', amount: 35275, note: 'ค่าจ้างพนักงาน 1-15 พ.ย. 2567' } ],
    '2024-12-31': [ { id: generateId('exp'), date: '2024-12-31', category: 'เงินเดือน', amount: 40295, note: 'ค่าจ้างพนักงาน 16-31 ธ.ค. 2567' } ],
    '2025-01-15': [ { id: generateId('exp'), date: '2025-01-15', category: 'เงินเดือน', amount: 32475, note: 'ค่าจ้างพนักงาน 1-15 ม.ค. 2568' } ],
    '2025-01-31': [ { id: generateId('exp'), date: '2025-01-31', category: 'เงินเดือน', amount: 25575, note: 'ค่าจ้างพนักงาน 16-31 ม.ค. 2568' } ],
    '2025-02-15': [ { id: generateId('exp'), date: '2025-02-15', category: 'เงินเดือน', amount: 24855, note: 'ค่าจ้างพนักงาน 1-15 ก.พ. 2568' } ],
    '2025-02-28': [ { id: generateId('exp'), date: '2025-02-28', category: 'เงินเดือน', amount: 16835, note: 'ค่าจ้างพนักงาน 16-28 ก.พ. 2568' } ],
    '2025-03-15': [ { id: generateId('exp'), date: '2025-03-15', category: 'เงินเดือน', amount: 24149, note: 'ค่าจ้างพนักงาน 1-15 มี.ค. 2568' } ],
    '2025-03-31': [ { id: generateId('exp'), date: '2025-03-31', category: 'เงินเดือน', amount: 24869, note: 'ค่าจ้างพนักงาน 16-31 มี.ค. 2568' } ],
    '2025-04-15': [ { id: generateId('exp'), date: '2025-04-15', category: 'เงินเดือน', amount: 29175, note: 'ค่าจ้างพนักงาน 1-15 เม.ย. 2568' } ],
    '2025-04-30': [ { id: generateId('exp'), date: '2025-04-30', category: 'เงินเดือน', amount: 29975, note: 'ค่าจ้างพนักงาน 16-30 เม.ย. 2568' } ],
    '2025-05-31': [ { id: generateId('exp'), date: '2025-05-31', category: 'เงินเดือน', amount: 29175, note: 'ค่าจ้างพนักงาน 16-31 พ.ค. 2568' } ],
    '2025-06-30': [ { id: generateId('exp'), date: '2025-06-30', category: 'เงินเดือน', amount: 29575, note: 'ค่าจ้างพนักงาน 16-30 มิ.ย. 2568' } ],
    '2025-07-15': [ { id: generateId('exp'), date: '2025-07-15', category: 'เงินเดือน', amount: 28775, note: 'ค่าจ้างพนักงาน 1-15 ก.ค. 2568' } ],
    '2025-07-31': [ { id: generateId('exp'), date: '2025-07-31', category: 'เงินเดือน', amount: 29575, note: 'ค่าจ้างพนักงาน 16-31 ก.ค. 2568' } ],
    '2025-08-15': [
        { id: 'exp1', category: 'ค่าจ้างแม่บ้าน', amount: 350, note: 'คุณป้าณี', date: '2025-08-15' },
        { id: 'exp2', category: 'ซื้ออุปกรณ์ทำความสะอาด', amount: 520, note: 'น้ำยาล้างห้องน้ำ, แปรง', date: '2025-08-15' },
        { id: generateId('exp'), date: '2025-08-15', category: 'เงินเดือน', amount: 29575, note: 'ค่าจ้างพนักงาน 1-15 ส.ค. 2568' }
    ],
    '2025-08-16': [
        { id: 'exp3', category: 'ค่าอาหารกลางวัน', amount: 150, note: 'สำหรับพนักงาน 3 คน', date: '2025-08-16' },
    ],
    '2025-08-31': [
        { id: generateId('exp'), date: '2025-08-31', category: 'เงินเดือน', amount: 30695, note: 'ค่าจ้างพนักงาน 16-31 ส.ค. 2568' }
    ],
    '2025-09-15': [
        { id: generateId('exp'), date: '2025-09-15', category: 'เงินเดือน', amount: 29575, note: 'ค่าจ้างพนักงาน 1-15 ก.ย. 2568' }
    ],
};
let db_cleaning: Record<string, Record<string, boolean>> = {}; // date -> roomNumber -> isCleaned
let db_tenants: Tenant[] = [
    { id: 't1', name: 'คุณสมชาย ใจดี', roomNumber: 'N1', rent: 4500, status: 'active' },
    { id: 't2', name: 'คุณสมหญิง รักสงบ', roomNumber: 'N4', rent: 5000, status: 'active' },
    { id: 't3', name: 'John Doe', roomNumber: 'A101', rent: 3500, status: 'inactive' },
    { id: 't4', name: 'นาย ณัฐภัทร ไกรรัตน์', roomNumber: 'A204', rent: 3500, status: 'active' },
    { id: 't5', name: 'น.ส. จีรัญญา มหาคม', roomNumber: 'A205', rent: 3500, status: 'active' },
];
let db_meterReadings: Record<string, MeterReadingsData> = {
    't1': { '2024': { '5': { water: 100, electricity: 1000 }, '6': { water: 105, electricity: 1150 }, '7': { water: 112, electricity: 1320 } } },
    't2': { '2024': { '5': { water: 200, electricity: 2000 }, '6': { water: 210, electricity: 2200 }, '7': { water: 225, electricity: 2450 } } },
    't4': {
        '2024': {
            '7': { water: 130, electricity: 4672 }, // Aug
            '8': { water: 136, electricity: 4822 }, // Sep
            '9': { water: 142, electricity: 4970 }, // Oct
            '10': { water: 146, electricity: 5088 }, // Nov
            '11': { water: 149, electricity: 5166 }  // Dec
        },
        '2025': {
            '0': { water: 151, electricity: 5217 }, // Jan
            '1': { water: 155, electricity: 5294 }, // Feb
            '2': { water: 158, electricity: 5418 }, // Mar
            '3': { water: 164, electricity: 5580 }, // Apr
            '4': { water: 168, electricity: 5756 }, // May
            '5': { water: 172, electricity: 5889 }, // Jun
            '6': { water: 176, electricity: 5990 }, // Jul
            '7': { water: 179, electricity: 6099 }  // Aug
        }
    },
    't5': {
        '2024': {
            '7': { water: 148, electricity: 7330 }, // Aug
            '8': { water: 155, electricity: 7508 }, // Sep
            '9': { water: 160, electricity: 7669 }, // Oct
            '10': { water: 164, electricity: 7780 },// Nov
            '11': { water: 169, electricity: 7857 } // Dec
        },
        '2025': {
            '0': { water: 172, electricity: 7915 }, // Jan
            '1': { water: 176, electricity: 8004 }, // Feb
            '2': { water: 180, electricity: 8131 }, // Mar
            '3': { water: 184, electricity: 8261 }, // Apr
            '4': { water: 188, electricity: 8451 }, // May
            '5': { water: 192, electricity: 8632 }, // Jun
            '6': { water: 196, electricity: 8801 }, // Jul
            '7': { water: 201, electricity: 8978 }  // Aug
        }
    }
};
const db_utilityRates: UtilityRates = { waterPerUnit: 18, electricityPerUnit: 8 };
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
let db_payroll: Record<string, { period1: PayrollCalculationRow[], period2: PayrollCalculationRow[]}> = {
     [`${currentYear}-${currentMonth}`]: {
        period1: [
            pr('emp1', { deductionSocialSecurity: 300 }),
            pr('emp2', { deductionSocialSecurity: 350 }),
            pr('emp3', { workDays: 15, deductionSocialSecurity: 240 }),
            pr('emp5', { workDays: 15, deductionSocialSecurity: 300 }),
            pr('emp8', { workDays: 15, deductionSocialSecurity: 300 }),
        ],
        period2: [
            pr('emp1', { deductionSocialSecurity: 300 }),
            pr('emp2', { deductionSocialSecurity: 350 }),
            pr('emp3', { workDays: 14, deductionSocialSecurity: 224, otherIncome: 500 }),
            pr('emp5', { workDays: 15, deductionSocialSecurity: 300 }),
            pr('emp8', { workDays: 15, deductionSocialSecurity: 300 }),
        ],
    }
};

let db_tasks: Task[] = [
    { id: 'task1', title: 'เปลี่ยนหลอดไฟห้อง B102', dueDate: formatISODate(new Date()), assigneeId: 'emp5', relatedRoomId: 'r24', status: 'To Do', priority: 'Medium' },
    { id: 'task2', title: 'ตัดหญ้าบริเวณสวนหย่อม', dueDate: formatISODate(new Date()), assigneeId: 'emp5', status: 'In Progress', priority: 'Low' },
    { id: 'task3', title: 'ทำความสะอาดใหญ่ N1', dueDate: formatISODate(new Date(Date.now() + 86400000)), assigneeId: 'emp2', relatedRoomId: 'r45', status: 'To Do', priority: 'High'},
    { id: 'task4', title: 'ซ่อมก๊อกน้ำ A105', dueDate: formatISODate(new Date(Date.now() - 86400000)), assigneeId: 'emp7', relatedRoomId: 'r5', status: 'Done', priority: 'Medium' }
];

// --- Data Hydration Logic ---
// This function runs once to populate the "clean" database from the raw data.
const hydrateData = () => {
    if (db_bookings.length > 0) return; // Already hydrated

    // Step 1: Process and create unique guests (ETL's "Transform" for Guests)
    const guestPhoneMap = new Map<string, Guest>();
    const guestsFromTransactions: Guest[] = [];

    historicalTransactions.forEach(tx => {
        // Use phone number as a unique key for guests where available
        const guestKey = tx.phone || `${tx.guestName}_${tx.bookingId}`; // Fallback key for guests without phone
        
        if (!guestPhoneMap.has(guestKey)) {
             const newGuest: Guest = {
                id: generateId('guest'),
                fullName: tx.guestName,
                phoneNumber: tx.phone || undefined,
                status: 'active',
            };
            guestPhoneMap.set(guestKey, newGuest);
            guestsFromTransactions.push(newGuest);
        }
    });
    db_guests = guestsFromTransactions;

    // Step 2: Create the Data Mapper function as requested by the user
    const mapRawTransactionToClean = (rawTx: RawTransaction): AdminBooking | null => {
        const guestKey = rawTx.phone || `${rawTx.guestName}_${rawTx.bookingId}`;
        const guest = guestPhoneMap.get(guestKey);
        const roomId = roomMap.get(rawTx.roomNumber);

        if (!guest || !roomId) {
            // Can't create a clean booking without a guest or room
            console.warn(`Skipping booking ${rawTx.bookingId}: could not find guest or room.`);
            return null;
        }

        const checkInDate = new Date(rawTx.checkIn);
        const checkOutDate = new Date(checkInDate.getTime() + (rawTx.duration * 86400000));
        
        // Transform: Clean the price
        const totalAmount = cleanPrice(rawTx.price);
        const feeAmount = totalAmount * 0.01;
        const finalAmount = totalAmount + feeAmount;

        const cleanBooking: AdminBooking = {
            id: rawTx.bookingId,
            guestId: guest.id,
            roomId: roomId,
            checkIn: formatISODate(checkInDate),
            checkOut: formatISODate(checkOutDate),
            status: 'เช็คเอาท์แล้ว',
            totalAmount: totalAmount,
            feeAmount: feeAmount,
            finalAmount: finalAmount,
            paymentMethod: rawTx.payment
        };
        
        return cleanBooking;
    };
    
    // Step 3: Use Array.map to transform raw transactions into clean bookings
    db_bookings = historicalTransactions
        .map(mapRawTransactionToClean)
        .filter((b): b is AdminBooking => b !== null); // Filter out any nulls from failed mappings
};

hydrateData(); // Run hydration on startup

// --- Room API ---
export const fetchRooms = (): Promise<Room[]> => simulateApi(rooms);
export const fetchRoomById = (id: string): Promise<Room | undefined> => simulateApi(rooms.find(r => r.id === id));
export const createRoom = (data: Omit<Room, 'id'>): Promise<Room> => {
    const newRoom: Room = { id: generateId('room'), ...data };
    rooms.push(newRoom);
    return simulateApi(newRoom);
};
export const updateRoom = (id: string, data: Omit<Room, 'id'>): Promise<Room> => {
    const index = rooms.findIndex(r => r.id === id);
    if (index === -1) return Promise.reject("Room not found");
    rooms[index] = { ...rooms[index], ...data };
    return simulateApi(rooms[index]);
};
export const deleteRoom = (id: string): Promise<void> => {
    const index = rooms.findIndex(r => r.id === id);
    if (index > -1) {
        rooms.splice(index, 1);
    }
    return simulateApi(undefined);
};


// --- Booking API ---
export const fetchBookings = (): Promise<AdminBooking[]> => simulateApi(db_bookings);
export const createBooking = (data: Omit<AdminBooking, 'id'>): Promise<AdminBooking> => {
    const newBooking: AdminBooking = { id: generateId('booking'), ...data };
    db_bookings.push(newBooking);
    return simulateApi(newBooking);
};
export const updateBooking = (id: string, data: Partial<Omit<AdminBooking, 'id'>>): Promise<AdminBooking> => {
    const index = db_bookings.findIndex(b => b.id === id);
    if (index === -1) return Promise.reject("Booking not found");
    db_bookings[index] = { ...db_bookings[index], ...data };
    return simulateApi(db_bookings[index]);
};
export const updateBookingStatus = (id: string, status: AdminBooking['status']): Promise<AdminBooking> => {
    const index = db_bookings.findIndex(b => b.id === id);
    if (index === -1) return Promise.reject("Booking not found");
    db_bookings[index].status = status;
    return simulateApi(db_bookings[index]);
};

// --- Expense API ---
export const fetchAllExpenses = (): Promise<Record<string, Expense[]>> => simulateApi(db_expenses);
export const fetchExpensesByDate = (isoDate: string): Promise<Expense[]> => simulateApi(db_expenses[isoDate] || []);
export const createExpense = (data: Omit<Expense, 'id'>): Promise<Expense> => {
    const newExpense: Expense = { id: generateId('exp'), ...data };
    if (!db_expenses[data.date]) {
        db_expenses[data.date] = [];
    }
    db_expenses[data.date].push(newExpense);
    return simulateApi(newExpense);
};
export const updateExpense = (id: string, data: Omit<Expense, 'id'>): Promise<Expense> => {
    const oldDate = Object.keys(db_expenses).find(date => db_expenses[date].some(e => e.id === id));
    if (!oldDate) return Promise.reject("Expense not found");

    const expenseIndex = db_expenses[oldDate].findIndex(e => e.id === id);
    
    // If date has changed, move the expense
    if (oldDate !== data.date) {
        db_expenses[oldDate].splice(expenseIndex, 1); // Remove from old date
        if (!db_expenses[data.date]) db_expenses[data.date] = [];
        db_expenses[data.date].push({ id, ...data }); // Add to new date
    } else {
        db_expenses[oldDate][expenseIndex] = { id, ...data };
    }
    return simulateApi({ id, ...data });
};
export const deleteExpense = (id: string): Promise<void> => {
    const dateKey = Object.keys(db_expenses).find(date => db_expenses[date].some(e => e.id === id));
    if (dateKey) {
        db_expenses[dateKey] = db_expenses[dateKey].filter(e => e.id !== id);
    }
    return simulateApi(undefined);
};

// --- Cleaning API ---
export const fetchCleaningData = (): Promise<Record<string, Record<string, boolean>>> => simulateApi(db_cleaning);
export const updateCleaningStatus = (isoDate: string, roomNumber: string): Promise<void> => {
    if (!db_cleaning[isoDate]) {
        db_cleaning[isoDate] = {};
    }
    db_cleaning[isoDate][roomNumber] = !db_cleaning[isoDate][roomNumber];
    return simulateApi(undefined);
};


// --- Guest API ---
export const fetchAllGuests = (): Promise<Guest[]> => simulateApi(db_guests);
export const findGuestByPhone = (phone?: string): Promise<Guest | undefined> => simulateApi(phone ? db_guests.find(g => g.phoneNumber === phone) : undefined);
export const createGuest = (data: Omit<Guest, 'id'|'status'>): Promise<Guest> => {
    const newGuest: Guest = { id: generateId('guest'), ...data, status: 'active' };
    db_guests.push(newGuest);
    return simulateApi(newGuest);
};
export const updateGuest = (id: string, data: Omit<Guest, 'id' | 'status'>): Promise<Guest> => {
    const index = db_guests.findIndex(g => g.id === id);
    if (index === -1) return Promise.reject("Guest not found");
    db_guests[index] = { ...db_guests[index], ...data };
    return simulateApi(db_guests[index]);
};
export const deleteGuest = (id: string): Promise<void> => {
    const index = db_guests.findIndex(g => g.id === id);
    if (index > -1) {
        db_guests.splice(index, 1);
    }
    return simulateApi(undefined);
};

// --- Tenant API ---
export const fetchAllTenants = (): Promise<Tenant[]> => simulateApi(db_tenants);
export const fetchActiveTenants = (): Promise<Tenant[]> => simulateApi(db_tenants.filter(t => t.status === 'active'));
export const createTenant = (data: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => {
    const newTenant: Tenant = { id: generateId('tenant'), ...data, status: 'active' };
    db_tenants.push(newTenant);
    return simulateApi(newTenant);
};
export const updateTenant = (id: string, data: Omit<Tenant, 'id' | 'status'>): Promise<Tenant> => {
    const index = db_tenants.findIndex(t => t.id === id);
    if (index === -1) return Promise.reject("Tenant not found");
    db_tenants[index] = { ...db_tenants[index], ...data };
    return simulateApi(db_tenants[index]);
};
export const deleteTenant = (id: string): Promise<void> => {
    const index = db_tenants.findIndex(t => t.id === id);
    if (index > -1) {
        db_tenants[index].status = 'inactive';
    }
    return simulateApi(undefined);
};
export const fetchMeterReadings = (tenantId: string): Promise<MeterReadingsData> => simulateApi(db_meterReadings[tenantId] || {});
export const updateMeterReadings = (tenantId: string, readings: MeterReadingsData): Promise<void> => {
    db_meterReadings[tenantId] = readings;
    return simulateApi(undefined);
};
export const fetchUtilityRates = (): Promise<UtilityRates> => simulateApi(db_utilityRates);

// --- Employee API ---
export const fetchAllEmployees = (): Promise<Employee[]> => simulateApi(db_employees);
export const fetchActiveEmployees = (): Promise<Employee[]> => simulateApi(db_employees.filter(e => e.status === 'active'));
export const createEmployee = (data: Omit<Employee, 'id' | 'status'>): Promise<Employee> => {
    const newEmployee: Employee = { id: generateId('emp'), ...data, status: 'active' };
    db_employees.push(newEmployee);
    return simulateApi(newEmployee);
};
export const updateEmployee = (id: string, data: Omit<Employee, 'id' | 'status'>): Promise<Employee> => {
    const index = db_employees.findIndex(e => e.id === id);
    if (index === -1) return Promise.reject("Employee not found");
    db_employees[index] = { ...db_employees[index], ...data };
    return simulateApi(db_employees[index]);
};
export const deleteEmployee = (id: string): Promise<void> => {
    const index = db_employees.findIndex(e => e.id === id);
    if (index > -1) {
        db_employees[index].status = 'inactive';
    }
    return simulateApi(undefined);
};
export const fetchPayrollDataForMonth = (year: number, month: number): Promise<{ period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }> => {
    const key = `${year}-${month}`;
    if (db_payroll[key]) {
        return simulateApi(db_payroll[key]);
    }
    // If no data, create a default structure for all active employees
    const activeEmployees = db_employees.filter(e => e.status === 'active');
    const defaultData = {
        period1: activeEmployees.map(e => createPayrollRow(e.id, db_employees, {})),
        period2: activeEmployees.map(e => createPayrollRow(e.id, db_employees, {})),
    }
    db_payroll[key] = defaultData;
    return simulateApi(defaultData);
};
export const updatePayrollDataForMonth = (year: number, month: number, data: { period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }): Promise<void> => {
    const key = `${year}-${month}`;
    db_payroll[key] = data;
    return simulateApi(undefined);
};

// --- Task API ---
export const fetchTasks = (): Promise<Task[]> => simulateApi(db_tasks);
export const createTask = (data: Omit<Task, 'id'>): Promise<Task> => {
    const newTask: Task = { id: generateId('task'), ...data };
    db_tasks.push(newTask);
    return simulateApi(newTask);
};
export const updateTask = (id: string, data: Omit<Task, 'id'>): Promise<Task> => {
    const index = db_tasks.findIndex(t => t.id === id);
    if (index === -1) return Promise.reject("Task not found");
    db_tasks[index] = { ...db_tasks[index], ...data };
    return simulateApi(db_tasks[index]);
};
export const deleteTask = (id: string): Promise<void> => {
    db_tasks = db_tasks.filter(t => t.id !== id);
    return simulateApi(undefined);
};
