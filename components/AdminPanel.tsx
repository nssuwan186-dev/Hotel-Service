

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as adminService from '../services/adminService';
import { formatISODate } from '../services/utils';
import { AdminBooking, Expense, Room, Guest, Tenant, MeterReadingsData, UtilityRates, Employee, Notification, Task } from '../types';
import { generateInvoicePDF } from '../services/pdfService';
import { generatePAOReportPDF, generateMunicipalityReportPDF } from '../services/reportPdfService';
import Spinner from './common/Spinner';
import RoomsView from './views/RoomsView';
import DashboardView from './views/DashboardView';
import MonthlyTenantsView from './views/MonthlyTenantsView';
import PayrollView from './views/PayrollView';
import EmployeesView from './views/EmployeesView';
import GuestsView from './views/GuestsView';
import TenantsDBView from './views/TenantsDBView';
import RoomsDBView from './views/RoomsDBView';
import BookingListView from './views/BookingListView';
import CheckInListView from './views/CheckInListView';
import CheckOutListView from './views/CheckOutListView';
import PAOReport from './reports/PAOReport';
import MunicipalityReport from './reports/MunicipalityReport';
import ExpenseHistoryView from './views/ExpenseHistoryView';
import Header from './Header';
import AvailabilityView from './views/AvailabilityView';
import TasksView from './views/TasksView';
import AnalyticsView from './views/AnalyticsView';

import { CashIcon } from './icons/CashIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { KeyIcon } from './icons/KeyIcon';
import { HomeIcon } from './icons/HomeIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SearchCircleIcon } from './icons/SearchCircleIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { SparklesIcon } from './icons/SparklesIcon';

type AdminView = 'dashboard' | 'rooms' | 'monthlyTenants' | 'payroll' | 'employees' | 'guests' | 'tenantsDB' | 'roomsDB' | 'paoReport' | 'municipalityReport' | 'bookingList' | 'checkInList' | 'checkOutList' | 'expenseHistory' | 'availability' | 'tasks' | 'analytics';
type ModalContent = 'addBooking' | 'editBooking' | 'addEditExpense' | 'deleteExpenseConfirmation' | 'cancelBookingConfirmation' | 'addEditTenant' | 'deleteTenantConfirmation' | 'addEditEmployee' | 'deleteEmployeeConfirmation' | 'addEditGuest' | 'deleteGuestConfirmation' | 'addEditRoom' | 'deleteRoomConfirmation' | 'addEditTask' | 'deleteTaskConfirmation' | null;

const useAdminData = () => {
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
    const [tasks, setTasks] = useState<Task[]>([]);
    
    // State for management views (active only)
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    // State for database views (all records)
    const [allGuests, setAllGuests] = useState<Guest[]>([]);
    const [allTenants, setAllTenants] = useState<Tenant[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);


    // Tenant-specific state
    const [meterReadings, setMeterReadings] = useState<Record<string, MeterReadingsData>>({});
    const [utilityRates, setUtilityRates] = useState<UtilityRates | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                roomsData, 
                bookingsData, 
                expensesData, 
                activeTenantsData, 
                utilityRatesData, 
                activeEmployeesData, 
                allGuestsData,
                allTenantsData,
                allEmployeesData,
                tasksData,
            ] = await Promise.all([
                adminService.getRooms(),
                adminService.getBookings(),
                adminService.getAllExpenses(),
                adminService.getTenants(), // Active tenants for management view
                adminService.getUtilityRates(),
                adminService.getEmployees(), // Active employees for payroll
                adminService.getAllGuests(), // All guests for DB view
                adminService.getAllTenants(), // All tenants for DB view
                adminService.getAllEmployees(), // All employees for DB view
                adminService.getTasks(),
            ]);
            setRooms(roomsData);
            setBookings(bookingsData);
            setExpenses(expensesData);
            setTenants(activeTenantsData);
            setUtilityRates(utilityRatesData);
            setEmployees(activeEmployeesData);
            setAllGuests(allGuestsData);
            setAllTenants(allTenantsData);
            setAllEmployees(allEmployeesData);
            setTasks(tasksData);
            
            const readings: Record<string, MeterReadingsData> = {};
            for (const tenant of activeTenantsData) {
                readings[tenant.id] = await adminService.getMeterReadings(tenant.id);
            }
            setMeterReadings(readings);

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        loading,
        rooms,
        bookings,
        expenses,
        tasks,
        tenants, // active
        employees, // active
        allGuests,
        allTenants,
        allEmployees,
        meterReadings,
        utilityRates,
        fetchData,
    };
};

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-text-muted mb-1">{label}</label>
        <input className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" {...props} />
    </div>
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-text-muted mb-1">{label}</label>
        <textarea className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" {...props} />
    </div>
);


export const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, options: { value: string, label: string }[] }> = ({ label, options, ...props }) => (
     <div>
        {label && <label className="block text-sm font-medium text-text-muted mb-1">{label}</label>}
        <select className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent appearance-none" {...props}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

// Form Components
const BookingForm: React.FC<{
  onClose: () => void;
  onSubmit: (bookingData: any, guestData: any) => void;
  rooms: Room[];
  initialData?: Partial<AdminBooking & { guest: Guest }> | null;
  isEditing: boolean;
}> = ({ onClose, onSubmit, rooms, initialData, isEditing }) => {
    const [booking, setBooking] = useState({
        roomId: initialData?.roomId || rooms[0]?.id || '',
        checkIn: initialData?.checkIn || formatISODate(new Date()),
        checkOut: initialData?.checkOut || formatISODate(new Date(Date.now() + 86400000)),
    });
    const [guest, setGuest] = useState({
        fullName: initialData?.guest?.fullName || '',
        phoneNumber: initialData?.guest?.phoneNumber || '',
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            onSubmit(initialData!.id, booking);
        } else {
            onSubmit(booking, guest);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditing && (
                <>
                    <FormInput label="ชื่อ-สกุล ผู้เข้าพัก" value={guest.fullName} onChange={e => setGuest({ ...guest, fullName: e.target.value })} required />
                    <FormInput label="เบอร์โทรศัพท์" value={guest.phoneNumber} onChange={e => setGuest({ ...guest, phoneNumber: e.target.value })} />
                </>
            )}
            <FormSelect label="ห้องพัก" value={booking.roomId} onChange={e => setBooking({ ...booking, roomId: e.target.value })} options={rooms.map(r => ({ value: r.id, label: `${r.roomNumber} (${r.roomType}) - ${r.price}฿` }))} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="เช็คอิน" type="date" value={booking.checkIn} onChange={e => setBooking({ ...booking, checkIn: e.target.value })} required />
                <FormInput label="เช็คเอาท์" type="date" value={booking.checkOut} onChange={e => setBooking({ ...booking, checkOut: e.target.value })} required />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="bg-secondary text-text-main font-bold py-2 px-4 rounded-lg border border-border">ยกเลิก</button>
                <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
            </div>
        </form>
    );
};

const ExpenseForm: React.FC<{
    onClose: () => void;
    onSave: (data: Omit<Expense, 'id'>) => void;
    initialData?: Expense | null;
}> = ({ onClose, onSave, initialData }) => {
    const [expense, setExpense] = useState({
        date: initialData?.date || formatISODate(new Date()),
        category: initialData?.category || '',
        amount: initialData?.amount || '',
        note: initialData?.note || '',
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...expense, amount: Number(expense.amount) });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="วันที่" type="date" value={expense.date} onChange={e => setExpense({ ...expense, date: e.target.value })} required />
            <FormInput label="หมวดหมู่" value={expense.category} onChange={e => setExpense({ ...expense, category: e.target.value })} required />
            <FormInput label="จำนวนเงิน" type="number" value={expense.amount} onChange={e => setExpense({ ...expense, amount: e.target.value })} required />
            <FormTextarea label="หมายเหตุ" value={expense.note} onChange={e => setExpense({ ...expense, note: e.target.value })} />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="bg-secondary text-text-main font-bold py-2 px-4 rounded-lg border border-border">ยกเลิก</button>
                <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
            </div>
        </form>
    );
}

const TenantForm: React.FC<{
    onClose: () => void;
    onSave: (data: Omit<Tenant, 'id' | 'status'>) => void;
    initialData?: Tenant | null;
}> = ({ onClose, onSave, initialData }) => {
    const [tenant, setTenant] = useState({
        name: initialData?.name || '',
        roomNumber: initialData?.roomNumber || '',
        rent: initialData?.rent || '',
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...tenant, rent: Number(tenant.rent) });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่อ-สกุล" value={tenant.name} onChange={e => setTenant({ ...tenant, name: e.target.value })} required />
            <FormInput label="หมายเลขห้อง" value={tenant.roomNumber} onChange={e => setTenant({ ...tenant, roomNumber: e.target.value })} required />
            <FormInput label="ค่าเช่า (บาท)" type="number" value={tenant.rent} onChange={e => setTenant({ ...tenant, rent: e.target.value })} required />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="bg-secondary text-text-main font-bold py-2 px-4 rounded-lg border border-border">ยกเลิก</button>
                <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
            </div>
        </form>
    );
};

const EmployeeForm: React.FC<{
    onClose: () => void;
    onSave: (data: Omit<Employee, 'id' | 'status'>) => void;
    initialData?: Employee | null;
}> = ({ onClose, onSave, initialData }) => {
    const [employee, setEmployee] = useState({
        name: initialData?.name || '',
        position: initialData?.position || '',
        employmentType: initialData?.employmentType || 'monthly',
        baseRate: initialData?.baseRate || '',
        bank: initialData?.accountInfo?.bank || '',
        accountNumber: initialData?.accountInfo?.accountNumber || '',
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: employee.name,
            position: employee.position,
            employmentType: employee.employmentType as 'monthly' | 'daily',
            baseRate: Number(employee.baseRate),
            accountInfo: {
                bank: employee.bank,
                accountNumber: employee.accountNumber,
            },
        });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่อ-สกุล" value={employee.name} onChange={e => setEmployee({ ...employee, name: e.target.value })} required />
            <FormInput label="ตำแหน่ง" value={employee.position} onChange={e => setEmployee({ ...employee, position: e.target.value })} required />
            <FormSelect
                label="ประเภทการจ้าง"
                value={employee.employmentType}
                // FIX: Type 'string' is not assignable to type '"monthly" | "daily"'.
                onChange={e => setEmployee({ ...employee, employmentType: e.target.value as 'monthly' | 'daily' })}
                options={[
                    { value: 'monthly', label: 'รายเดือน' },
                    { value: 'daily', label: 'รายวัน' },
                ]}
            />
            <FormInput label="อัตราจ้าง (เงินเดือน/ค่าจ้างต่อวัน)" type="number" value={employee.baseRate} onChange={e => setEmployee({ ...employee, baseRate: e.target.value })} required />
            <FormInput label="ธนาคาร" value={employee.bank} onChange={e => setEmployee({ ...employee, bank: e.target.value })} required />
            <FormInput label="เลขที่บัญชี" value={employee.accountNumber} onChange={e => setEmployee({ ...employee, accountNumber: e.target.value })} required />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="bg-secondary text-text-main font-bold py-2 px-4 rounded-lg border border-border">ยกเลิก</button>
                <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
            </div>
        </form>
    );
};

const GuestForm: React.FC<{
    onClose: () => void;
    onSave: (data: Omit<Guest, 'id' | 'status'>) => void;
    initialData?: Guest | null;
}> = ({ onClose, onSave, initialData }) => {
    const [guest, setGuest] = useState({
        fullName: initialData?.fullName || '',
        phoneNumber: initialData?.phoneNumber || '',
        idCardNumber: initialData?.idCardNumber || '',
        address: initialData?.address || '',
        licensePlate: initialData?.licensePlate || '',
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(guest);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่อ-สกุล" value={guest.fullName} onChange={e => setGuest({ ...guest, fullName: e.target.value })} required />
            <FormInput label="เบอร์โทรศัพท์" value={guest.phoneNumber} onChange={e => setGuest({ ...guest, phoneNumber: e.target.value })} />
            <FormInput label="เลขบัตรประชาชน" value={guest.idCardNumber} onChange={e => setGuest({ ...guest, idCardNumber: e.target.value })} />
            <FormInput label="ทะเบียนรถ" value={guest.licensePlate} onChange={e => setGuest({ ...guest, licensePlate: e.target.value })} />
            <FormTextarea label="ที่อยู่" value={guest.address} onChange={e => setGuest({ ...guest, address: e.target.value })} />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="bg-secondary text-text-main font-bold py-2 px-4 rounded-lg border border-border">ยกเลิก</button>
                <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
            </div>
        </form>
    );
};

const RoomForm: React.FC<{
    onClose: () => void;
    onSave: (data: Omit<Room, 'id'>) => void;
    initialData?: Room | null;
}> = ({ onClose, onSave, initialData }) => {
    const [room, setRoom] = useState({
        roomNumber: initialData?.roomNumber || '',
        roomType: initialData?.roomType || 'Standard',
        price: initialData?.price || '',
        status: initialData?.status || 'ว่าง',
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...room,
            price: Number(room.price),
            status: room.status as Room['status'],
        });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="หมายเลขห้อง" value={room.roomNumber} onChange={e => setRoom({ ...room, roomNumber: e.target.value })} required />
            <FormInput label="ประเภทห้อง" value={room.roomType} onChange={e => setRoom({ ...room, roomType: e.target.value })} required />
            <FormInput label="ราคา (บาท)" type="number" value={room.price} onChange={e => setRoom({ ...room, price: e.target.value })} required />
            <FormSelect
                label="สถานะ"
                value={room.status}
                // FIX: Type 'string' is not assignable to type '"ว่าง" | "ไม่ว่าง" | "ทำความสะอาด" | "ปิดปรับปรุง"'.
                onChange={e => setRoom({ ...room, status: e.target.value as Room['status'] })}
                options={[
                    { value: 'ว่าง', label: 'ว่าง' },
                    { value: 'ไม่ว่าง', label: 'ไม่ว่าง' },
                    { value: 'ทำความสะอาด', label: 'ทำความสะอาด' },
                    { value: 'ปิดปรับปรุง', label: 'ปิดปรับปรุง' },
                ]}
            />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="bg-secondary text-text-main font-bold py-2 px-4 rounded-lg border border-border">ยกเลิก</button>
                <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
            </div>
        </form>
    );
};

const TaskForm: React.FC<{
    onClose: () => void;
    onSave: (data: Omit<Task, 'id'>) => void;
    initialData?: Task | null;
    employees: Employee[];
    rooms: Room[];
}> = ({ onClose, onSave, initialData, employees, rooms }) => {
    const [task, setTask] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        dueDate: initialData?.dueDate || formatISODate(new Date()),
        assigneeId: initialData?.assigneeId || '',
        relatedRoomId: initialData?.relatedRoomId || '',
        status: initialData?.status || 'To Do',
        priority: initialData?.priority || 'Medium',
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...task,
            status: task.status as Task['status'],
            priority: task.priority as Task['priority'],
        });
    };
    
    const employeeOptions = [{ value: '', label: 'ไม่มี' }, ...employees.map(e => ({ value: e.id, label: e.name }))];
    const roomOptions = [{ value: '', label: 'ไม่มี' }, ...rooms.map(r => ({ value: r.id, label: r.roomNumber }))];
    const statusOptions = [
        { value: 'To Do', label: 'To Do' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Done', label: 'Done' },
        { value: 'Cancelled', label: 'Cancelled' },
    ];
    const priorityOptions = [
        { value: 'Low', label: 'Low' },
        { value: 'Medium', label: 'Medium' },
        { value: 'High', label: 'High' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่องาน" value={task.title} onChange={e => setTask({ ...task, title: e.target.value })} required />
            <FormTextarea label="รายละเอียด" value={task.description} onChange={e => setTask({ ...task, description: e.target.value })} />
            <FormInput label="กำหนดส่ง" type="date" value={task.dueDate} onChange={e => setTask({ ...task, dueDate: e.target.value })} required />
            <FormSelect label="ผู้รับผิดชอบ" value={task.assigneeId} onChange={e => setTask({ ...task, assigneeId: e.target.value })} options={employeeOptions} />
            <FormSelect label="ห้องที่เกี่ยวข้อง" value={task.relatedRoomId} onChange={e => setTask({ ...task, relatedRoomId: e.target.value })} options={roomOptions} />
            {/* FIX: Type 'string' is not assignable to type '"To Do" | "In Progress" | "Done" | "Cancelled"'. */}
            <FormSelect label="สถานะ" value={task.status} onChange={e => setTask({ ...task, status: e.target.value as Task['status'] })} options={statusOptions} />
            {/* FIX: Type 'string' is not assignable to type '"Low" | "Medium" | "High"'. */}
            <FormSelect label="ความสำคัญ" value={task.priority} onChange={e => setTask({ ...task, priority: e.target.value as Task['priority'] })} options={priorityOptions} />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="bg-secondary text-text-main font-bold py-2 px-4 rounded-lg border border-border">ยกเลิก</button>
                <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
            </div>
        </form>
    );
};

const ConfirmationDialog: React.FC<{
    onCancel: () => void;
    onConfirm: () => void;
    message: string;
    confirmButtonText: string;
}> = ({ onCancel, onConfirm, message, confirmButtonText }) => (
    <div>
        <p className="text-text-muted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="bg-secondary text-text-main font-bold py-2 px-4 rounded-lg border border-border">ยกเลิก</button>
            <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">{confirmButtonText}</button>
        </div>
    </div>
);

const DropdownMenu: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, icon, children, isOpen, onToggle }) => {
    return (
        <div className="relative">
            <button onClick={onToggle} className="w-full flex justify-between items-center text-left py-2.5 px-4 rounded-lg text-text-main hover:bg-accent/10 transition-colors">
                <span className="flex items-center gap-3">{icon} {title}</span>
                <ChevronDownIcon className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden pl-4 pt-2 pb-1 space-y-1">
                    {children}
                </div>
            </div>
        </div>
    );
};


const AdminPanel: React.FC = () => {
    const { loading, rooms, bookings, expenses, tasks, tenants, employees, allGuests, allTenants, allEmployees, meterReadings, utilityRates, fetchData } = useAdminData();
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [modalContent, setModalContent] = useState<ModalContent>(null);
    const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
    const [itemToEditOrDelete, setItemToEditOrDelete] = useState<any | null>(null);
    const [bookingDefaults, setBookingDefaults] = useState<{ roomId: string; checkIn: string; checkOut: string; } | null>(null);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Notification state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);


    const addNotification = useCallback((message: string, type: Notification['type']) => {
        setNotifications(prev => [
            { id: `notif_${Date.now()}_${Math.random()}`, message, type, timestamp: new Date(), read: false },
            ...prev
        ].slice(0, 50)); // Keep max 50 notifications
    }, []);

    // Effect for generating check-out warning notifications
    useEffect(() => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const todayISO = formatISODate(today);
        const tomorrowISO = formatISODate(tomorrow);

        const upcomingCheckouts = bookings.filter(b => 
            b.status === 'เข้าพัก' && (b.checkOut === todayISO || b.checkOut === tomorrowISO)
        );

        const newNotifications: Notification[] = upcomingCheckouts.map(b => {
            const isToday = b.checkOut === todayISO;
            return {
                id: `checkout-alert-${b.id}-${b.checkOut}`, // Unique ID per booking per day
                message: `ห้อง ${b.room?.roomNumber} (${b.guest?.fullName}) มีกำหนดเช็คเอาท์${isToday ? 'วันนี้' : 'พรุ่งนี้'}.`,
                type: 'warning',
                timestamp: new Date(),
                read: false,
            };
        });

        setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const trulyNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));

            // Also, remove stale checkout alerts
            const upcomingCheckoutIds = new Set(newNotifications.map(n => n.id));
            const nonStalePrev = prev.filter(n => {
                if (n.id.startsWith('checkout-alert-')) {
                    return upcomingCheckoutIds.has(n.id);
                }
                return true; // Keep other notification types
            });
            
            if (trulyNewNotifications.length > 0) {
                return [...trulyNewNotifications, ...nonStalePrev].slice(0, 50);
            }
            return nonStalePrev;
        });

    }, [bookings]);
    
    useEffect(() => {
        const menuMapping: Record<string, AdminView[]> = {
            booking: ['bookingList', 'checkInList', 'checkOutList', 'availability'],
            monthly: ['monthlyTenants', 'payroll'],
            database: ['guests', 'tenantsDB', 'employees', 'roomsDB'],
            reports: ['paoReport', 'municipalityReport', 'expenseHistory', 'analytics'],
        };

        const currentParentMenu = Object.keys(menuMapping).find(key => 
            menuMapping[key].includes(currentView)
        );

        if (currentParentMenu) {
            setOpenMenu(currentParentMenu);
        } else {
            setOpenMenu(null); // Collapse all for top-level items
        }
    }, [currentView]);


    const handleOpenModal = (content: ModalContent, data?: any) => {
        setModalContent(content);
        if (data) {
            if (content === 'editBooking' || content === 'cancelBookingConfirmation') setSelectedBooking(data);
            if (typeof content === 'string' && (content.startsWith('addEdit') || content.startsWith('delete'))) {
                setItemToEditOrDelete(data);
            }
        } else {
             setItemToEditOrDelete(null);
             setSelectedBooking(null);
        }
    };
    
    const handleCloseModal = () => {
        setModalContent(null);
        setItemToEditOrDelete(null);
        setSelectedBooking(null);
        setBookingDefaults(null);
    };

    const handleOpenAddBookingModal = (defaults?: { roomId: string; checkIn: string; checkOut: string; }) => {
        setBookingDefaults(defaults || null);
        handleOpenModal('addBooking');
    };
    const handleOpenEditBookingModal = (booking: AdminBooking) => handleOpenModal('editBooking', booking);
    
    const handleAddBooking = async (booking: Omit<AdminBooking, 'id' | 'status' | 'totalAmount' | 'feeAmount' | 'finalAmount' | 'paymentMethod'>, guest: Omit<Guest, 'id'|'status'>) => {
        try {
            await adminService.addBooking(booking, guest);
            const room = rooms.find(r => r.id === booking.roomId);
            addNotification(`จองห้อง ${room?.roomNumber || ''} สำหรับคุณ ${guest.fullName} สำเร็จ`, 'success');
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to add booking:", error);
            addNotification("เกิดข้อผิดพลาดในการเพิ่มการจอง", "error");
        }
    };
    
    const handleUpdateBooking = async (id: string, bookingUpdate: { roomId: string, checkIn: string, checkOut: string }) => {
        try {
            await adminService.updateBooking(id, bookingUpdate);
            // Re-fetch to get populated guest/room data for notification
            const fullBooking = await adminService.getBookings().then(bs => bs.find(b => b.id === id));
            addNotification(`อัปเดตการจองห้อง ${fullBooking?.room?.roomNumber} สำเร็จ`, 'info');
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to update booking:", error);
            addNotification("เกิดข้อผิดพลาดในการอัปเดตการจอง", "error");
        }
    };

    const handleCancelBooking = async () => {
        if (selectedBooking) {
            try {
                await adminService.cancelBooking(selectedBooking.id);
                addNotification(`ยกเลิกการจองห้อง ${selectedBooking.room?.roomNumber} แล้ว`, 'error');
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to cancel booking:", error);
                addNotification("เกิดข้อผิดพลาดในการยกเลิกการจอง", "error");
            }
        }
    };
    
    const handleCheckInBooking = async (id: string) => {
        if (confirm('คุณต้องการยืนยันการเช็คอินใช่หรือไม่?')) {
             try {
                await adminService.checkInBooking(id);
                const checkedInBooking = bookings.find(b => b.id === id);
                if (checkedInBooking) {
                    addNotification(`เช็คอินห้อง ${checkedInBooking.room?.roomNumber} (${checkedInBooking.guest?.fullName}) เรียบร้อย`, 'success');
                }
                fetchData();
            } catch (error) {
                console.error("Failed to check-in booking:", error);
                addNotification("เกิดข้อผิดพลาดในการเช็คอิน", "error");
            }
        }
    };

    const handleCheckOutBooking = async (id: string) => {
         if (confirm('คุณต้องการยืนยันการเช็คเอาท์ใช่หรือไม่?')) {
             try {
                await adminService.checkOutBooking(id);
                const checkedOutBooking = bookings.find(b => b.id === id);
                if (checkedOutBooking) {
                    addNotification(`เช็คเอาท์ห้อง ${checkedOutBooking.room?.roomNumber} เรียบร้อย`, 'info');
                }
                fetchData();
            } catch (error) {
                console.error("Failed to check-out booking:", error);
                addNotification("เกิดข้อผิดพลาดในการเช็คเอาท์", "error");
            }
        }
    }

    const handleSaveExpense = async (expenseData: Omit<Expense, 'id'>) => {
        try {
            const isEditing = itemToEditOrDelete && itemToEditOrDelete.id;
            if (isEditing) {
                await adminService.updateExpense(itemToEditOrDelete.id, expenseData);
                addNotification(`แก้ไขรายจ่าย '${expenseData.category}' สำเร็จ`, 'success');
            } else {
                await adminService.addExpense(expenseData);
                addNotification(`บันทึกรายจ่าย '${expenseData.category}' จำนวน ${expenseData.amount.toLocaleString()} บาท`, 'info');
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save expense:", error);
            addNotification("เกิดข้อผิดพลาดในการบันทึกรายจ่าย", "error");
        }
    };

    const handleDeleteExpense = async () => {
        if (itemToEditOrDelete) {
            try {
                await adminService.deleteExpense(itemToEditOrDelete.id);
                addNotification(`ลบรายจ่าย '${itemToEditOrDelete.category}' สำเร็จ`, 'info');
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete expense:", error);
                addNotification("เกิดข้อผิดพลาดในการลบรายจ่าย", "error");
            }
        }
    };


    const handleSaveTenant = async (data: Omit<Tenant, 'id' | 'status'>) => {
        try {
            if (itemToEditOrDelete) { // Editing existing tenant
                await adminService.updateTenant(itemToEditOrDelete.id, data);
            } else { // Adding new tenant
                await adminService.addTenant(data);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save tenant:", error);
        }
    };

    const handleDeleteTenant = async () => {
        if(itemToEditOrDelete) {
            try {
                await adminService.removeTenant(itemToEditOrDelete.id);
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete tenant:", error);
            }
        }
    };
    
    const handleSaveMeterReadings = async (tenantId: string, readings: MeterReadingsData) => {
        try {
            await adminService.saveMeterReadings(tenantId, readings);
            fetchData(); // Refetch all data to update meter readings in state
        } catch (error) {
            console.error("Failed to save meter readings:", error);
        }
    };

    const handleSaveEmployee = async (data: Omit<Employee, 'id' | 'status'>) => {
         try {
            if (itemToEditOrDelete) { // Editing
                await adminService.updateEmployee(itemToEditOrDelete.id, data);
            } else { // Adding
                await adminService.addEmployee(data);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save employee:", error);
        }
    };

    const handleDeleteEmployee = async () => {
        if(itemToEditOrDelete) {
            try {
                await adminService.removeEmployee(itemToEditOrDelete.id);
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete employee:", error);
            }
        }
    };
    
    const handleSaveGuest = async (data: Omit<Guest, 'id' | 'status'>) => {
         try {
            if (itemToEditOrDelete) { // Editing
                await adminService.updateGuest(itemToEditOrDelete.id, data);
            } else { // Adding
                await adminService.addGuest(data);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save guest:", error);
        }
    };

    const handleDeleteGuest = async () => {
        if(itemToEditOrDelete) {
            try {
                await adminService.removeGuest(itemToEditOrDelete.id);
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete guest:", error);
            }
        }
    };
    
    const handleSaveRoom = async (data: Omit<Room, 'id'>) => {
        try {
            if (itemToEditOrDelete) { // Editing
                await adminService.updateRoom(itemToEditOrDelete.id, data);
                 addNotification(`แก้ไขข้อมูลห้อง ${data.roomNumber} สำเร็จ`, 'success');
            } else { // Adding
                await adminService.addRoom(data);
                addNotification(`เพิ่มห้อง ${data.roomNumber} ใหม่สำเร็จ`, 'success');
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save room:", error);
            addNotification("เกิดข้อผิดพลาดในการบันทึกข้อมูลห้อง", "error");
        }
    };

    const handleDeleteRoom = async () => {
        if(itemToEditOrDelete) {
            try {
                await adminService.removeRoom(itemToEditOrDelete.id);
                 addNotification(`ลบห้อง ${itemToEditOrDelete.roomNumber} สำเร็จ`, 'info');
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete room:", error);
                addNotification("เกิดข้อผิดพลาดในการลบห้องพัก", "error");
            }
        }
    };

    const handleSaveTask = async (data: Omit<Task, 'id'>) => {
        try {
            if (itemToEditOrDelete) { // Editing
                await adminService.updateTask(itemToEditOrDelete.id, data);
                addNotification(`แก้ไขงาน '${data.title}' สำเร็จ`, 'success');
            } else { // Adding
                await adminService.addTask(data);
                addNotification(`เพิ่มงานใหม่ '${data.title}'`, 'info');
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save task:", error);
            addNotification("เกิดข้อผิดพลาดในการบันทึกงาน", "error");
        }
    };

    const handleDeleteTask = async () => {
        if(itemToEditOrDelete) {
            try {
                await adminService.removeTask(itemToEditOrDelete.id);
                addNotification(`ลบงาน '${itemToEditOrDelete.title}' สำเร็จ`, 'info');
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete task:", error);
                addNotification("เกิดข้อผิดพลาดในการลบงาน", "error");
            }
        }
    };

    const handlePrintInvoice = (booking: AdminBooking) => {
        generateInvoicePDF(booking);
        addNotification(`สร้างใบแจ้งหนี้สำหรับห้อง ${booking.room?.roomNumber} สำเร็จ`, 'info');
    };

    const renderView = () => {
        if (loading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;

        switch (currentView) {
            case 'dashboard':
                return <DashboardView 
                    bookings={bookings}
                    expenses={expenses}
                    rooms={rooms}
                    tasks={tasks}
                    guests={allGuests}
                    onAddBooking={() => handleOpenAddBookingModal()}
                    onAddExpense={() => handleOpenModal('addEditExpense')}
                    onAddTask={() => handleOpenModal('addEditTask')}
                />;
            case 'rooms':
                return <RoomsView rooms={rooms} bookings={bookings} />;
            case 'tasks':
                return <TasksView 
                    tasks={tasks}
                    onEditTask={(task) => handleOpenModal('addEditTask', task)}
                    onDeleteTask={(task) => handleOpenModal('deleteTaskConfirmation', task)}
                />;
            case 'bookingList':
                return <BookingListView bookings={bookings} onEdit={handleOpenEditBookingModal} onCheckIn={handleCheckInBooking} />;
            case 'checkInList':
                return <CheckInListView bookings={bookings} onEdit={handleOpenEditBookingModal} onCheckOut={handleCheckOutBooking} />;
            case 'checkOutList':
                return <CheckOutListView bookings={bookings} onPrintInvoice={handlePrintInvoice} />;
            case 'availability':
                return <AvailabilityView rooms={rooms} bookings={bookings} onAddBooking={handleOpenAddBookingModal} />;
            case 'expenseHistory':
                 return <ExpenseHistoryView 
                    allExpenses={expenses}
                    onEdit={(e) => handleOpenModal('addEditExpense', e)} 
                    onDelete={(e) => handleOpenModal('deleteExpenseConfirmation', e)}
                />;
            case 'paoReport':
                return <PAOReport bookings={bookings} onGeneratePDF={generatePAOReportPDF} />;
            case 'municipalityReport':
                return <MunicipalityReport bookings={bookings} onGeneratePDF={generateMunicipalityReportPDF} />;
            case 'monthlyTenants':
                 return <MonthlyTenantsView tenants={tenants} meterReadings={meterReadings} utilityRates={utilityRates} onSave={handleSaveMeterReadings} onAdd={() => handleOpenModal('addEditTenant')} onEdit={(t) => handleOpenModal('addEditTenant', t)} onDelete={(t) => handleOpenModal('deleteTenantConfirmation', t)} />;
            case 'payroll':
                 return <PayrollView />;
            case 'employees':
                 return <EmployeesView employees={allEmployees} onAdd={() => handleOpenModal('addEditEmployee')} onEdit={(e) => handleOpenModal('addEditEmployee', e)} onDelete={(e) => handleOpenModal('deleteEmployeeConfirmation', e)} />;
            case 'guests':
                 return <GuestsView guests={allGuests} onAdd={() => handleOpenModal('addEditGuest')} onEdit={(g) => handleOpenModal('addEditGuest', g)} onDelete={(g) => handleOpenModal('deleteGuestConfirmation', g)} />;
            case 'tenantsDB':
                return <TenantsDBView tenants={allTenants} onAdd={() => handleOpenModal('addEditTenant')} onEdit={(t) => handleOpenModal('addEditTenant', t)} onDelete={(t) => handleOpenModal('deleteTenantConfirmation', t)} />;
            case 'roomsDB':
                return <RoomsDBView rooms={rooms} onAdd={() => handleOpenModal('addEditRoom')} onEdit={(r) => handleOpenModal('addEditRoom', r)} onDelete={(r) => handleOpenModal('deleteRoomConfirmation', r)} />;
            case 'analytics':
                return <AnalyticsView bookings={bookings} expenses={expenses} rooms={rooms} />;
            default:
                return null;
        }
    };

    const viewTitles: Record<AdminView, string> = {
        dashboard: 'แดชบอร์ด',
        rooms: 'ปฏิทินห้องพัก',
        tasks: 'จัดการงาน',
        bookingList: 'รายการจอง',
        checkInList: 'รายการเช็คอิน',
        checkOutList: 'ประวัติการเข้าพัก',
        availability: 'ตรวจสอบห้องว่าง',
        paoReport: 'รายงาน อบจ.',
        municipalityReport: 'รายงานเทศบาล',
        expenseHistory: 'ประวัติค่าใช้จ่าย',
        monthlyTenants: 'จัดการผู้เช่ารายเดือน',
        payroll: 'ระบบเงินเดือน',
        employees: 'ฐานข้อมูลพนักงาน',
        guests: 'ฐานข้อมูลผู้เข้าพัก',
        tenantsDB: 'ฐานข้อมูลผู้เช่า',
        roomsDB: 'ฐานข้อมูลห้องพัก',
        analytics: 'รายงานวิเคราะห์ (BI)',
    };
    
    const NavLink: React.FC<{
        view: AdminView;
        icon: React.ReactNode;
        label: string;
        isSub?: boolean;
    }> = ({ view, icon, label, isSub = false }) => {
        const isActive = currentView === view;
        const activeClasses = 'bg-accent text-white font-semibold shadow-inner';
        const inactiveClasses = 'hover:bg-accent/10';
        const subClasses = isSub ? 'text-sm pl-8' : '';

        return (
             <button onClick={() => setCurrentView(view)} className={`w-full text-left py-2.5 px-4 rounded-lg flex items-center gap-3 transition-colors ${isActive ? activeClasses : inactiveClasses} ${subClasses}`}>
                {icon} {label}
            </button>
        )
    };

    const Modal: React.FC<{
        onClose: () => void;
        title: string;
        children: React.ReactNode;
        size?: 'sm' | 'md' | 'lg' | 'xl';
    }> = ({ onClose, title, children, size = 'md' }) => {
        const sizeClasses = {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg',
            xl: 'max-w-xl',
        };
    
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-16 sm:pt-24" aria-modal="true" role="dialog">
                <div className={`bg-primary rounded-xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[85vh]`}>
                    <div className="flex justify-between items-center p-4 border-b border-border">
                        <h3 className="text-lg font-bold text-text-main">{title}</h3>
                        <button onClick={onClose} className="text-text-muted hover:text-text-main text-2xl">&times;</button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="relative min-h-screen md:flex bg-secondary">
             {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-primary text-text-main flex flex-col p-4 transform transition-transform duration-300 ease-in-out border-r border-border shadow-2xl md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="text-2xl font-bold mb-8 text-center text-accent">Viphat Hotel</div>
                <nav className="flex-1 space-y-2">
                    <NavLink view="dashboard" icon={<HomeIcon />} label="แดชบอร์ด" />
                    <NavLink view="tasks" icon={<ClipboardCheckIcon />} label="จัดการงาน" />
                    <NavLink view="rooms" icon={<BuildingIcon />} label="ปฏิทินห้องพัก" />
                    
                     <DropdownMenu 
                        title="การจอง" 
                        icon={<ClipboardListIcon />}
                        isOpen={openMenu === 'booking'}
                        onToggle={() => setOpenMenu(openMenu === 'booking' ? null : 'booking')}
                    >
                        <NavLink view="availability" icon={<SearchCircleIcon />} label="ตรวจสอบห้องว่าง" isSub />
                        <NavLink view="bookingList" icon={<span className="w-6 h-6 flex items-center justify-center">-</span>} label="รายการจอง" isSub />
                        <NavLink view="checkInList" icon={<span className="w-6 h-6 flex items-center justify-center">-</span>} label="รายการเช็คอิน" isSub />
                        <NavLink view="checkOutList" icon={<span className="w-6 h-6 flex items-center justify-center">-</span>} label="ประวัติการเข้าพัก" isSub />
                    </DropdownMenu>

                     <DropdownMenu 
                        title="จัดการรายเดือน" 
                        icon={<CashIcon />}
                        isOpen={openMenu === 'monthly'}
                        onToggle={() => setOpenMenu(openMenu === 'monthly' ? null : 'monthly')}
                    >
                        <NavLink view="monthlyTenants" icon={<span className="w-6">-</span>} label="จัดการผู้เช่า" isSub />
                        <NavLink view="payroll" icon={<span className="w-6">-</span>} label="ระบบเงินเดือน" isSub />
                    </DropdownMenu>

                     <DropdownMenu 
                        title="ฐานข้อมูล" 
                        icon={<DatabaseIcon />}
                        isOpen={openMenu === 'database'}
                        onToggle={() => setOpenMenu(openMenu === 'database' ? null : 'database')}
                     >
                         <NavLink view="guests" icon={<UsersIcon />} label="ผู้เข้าพัก" isSub />
                         <NavLink view="tenantsDB" icon={<UserGroupIcon />} label="ผู้เช่า" isSub />
                         <NavLink view="employees" icon={<BriefcaseIcon />} label="พนักงาน" isSub />
                         <NavLink view="roomsDB" icon={<KeyIcon />} label="ห้องพัก" isSub />
                    </DropdownMenu>
                    
                     <DropdownMenu 
                        title="รายงาน" 
                        icon={<DocumentIcon />}
                        isOpen={openMenu === 'reports'}
                        onToggle={() => setOpenMenu(openMenu === 'reports' ? null : 'reports')}
                     >
                         <NavLink view="analytics" icon={<SparklesIcon />} label="วิเคราะห์ข้อมูล (BI)" isSub />
                         <NavLink view="expenseHistory" icon={<ReceiptIcon />} label="ประวัติค่าใช้จ่าย" isSub />
                         <NavLink view="paoReport" icon={<span className="w-6">-</span>} label="รายงาน อบจ." isSub />
                         <NavLink view="municipalityReport" icon={<span className="w-6">-</span>} label="รายงานเทศบาล" isSub />
                    </DropdownMenu>

                </nav>
            </aside>
            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    theme={theme}
                    onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                    notifications={notifications}
                    onNotificationsUpdate={setNotifications}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-text-main">{viewTitles[currentView]}</h3>
                    </div>

                    {renderView()}
                </main>
            </div>
             {modalContent && (
                <Modal 
                    onClose={handleCloseModal} 
                    title={
                        modalContent === 'addBooking' ? 'เพิ่มการจองใหม่' :
                        modalContent === 'editBooking' ? 'แก้ไขการจอง' :
                        modalContent === 'cancelBookingConfirmation' ? 'ยืนยันการยกเลิก' :
                        modalContent === 'addEditExpense' ? (itemToEditOrDelete?.id ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่าย') :
                        modalContent === 'deleteExpenseConfirmation' ? 'ยืนยันการลบรายจ่าย' :
                        modalContent === 'addEditTenant' ? (itemToEditOrDelete ? 'แก้ไขข้อมูลผู้เช่า' : 'เพิ่มผู้เช่าใหม่') :
                        modalContent === 'deleteTenantConfirmation' ? 'ยืนยันการลบผู้เช่า' :
                        modalContent === 'addEditEmployee' ? (itemToEditOrDelete ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่') :
                        modalContent === 'deleteEmployeeConfirmation' ? 'ยืนยันการลบพนักงาน' :
                        modalContent === 'addEditGuest' ? (itemToEditOrDelete ? 'แก้ไขข้อมูลผู้เข้าพัก' : 'เพิ่มผู้เข้าพักใหม่') :
                        modalContent === 'deleteGuestConfirmation' ? 'ยืนยันการลบผู้เข้าพัก' : 
                        modalContent === 'addEditRoom' ? (itemToEditOrDelete ? 'แก้ไขข้อมูลห้องพัก' : 'เพิ่มห้องพักใหม่') :
                        modalContent === 'deleteRoomConfirmation' ? 'ยืนยันการลบห้องพัก' : 
                        modalContent === 'addEditTask' ? (itemToEditOrDelete ? 'แก้ไขงาน' : 'เพิ่มงานใหม่') :
                        modalContent === 'deleteTaskConfirmation' ? 'ยืนยันการลบงาน' : ''
                    }
                >
                    {(modalContent === 'addBooking' || modalContent === 'editBooking') && 
                        <BookingForm 
                            onClose={handleCloseModal} 
                            onSubmit={modalContent === 'addBooking' ? handleAddBooking : handleUpdateBooking}
                            rooms={rooms}
                            initialData={modalContent === 'editBooking' ? selectedBooking : bookingDefaults}
                            isEditing={modalContent === 'editBooking'}
                        /> 
                    }
                    {modalContent === 'addEditExpense' && 
                        <ExpenseForm
                            onClose={handleCloseModal}
                            onSave={handleSaveExpense}
                            initialData={itemToEditOrDelete}
                        />
                    }
                    {modalContent === 'addEditTenant' &&
                        <TenantForm
                            onClose={handleCloseModal}
                            onSave={handleSaveTenant}
                            initialData={itemToEditOrDelete}
                        />
                    }
                    {modalContent === 'addEditEmployee' &&
                        <EmployeeForm
                            onClose={handleCloseModal}
                            onSave={handleSaveEmployee}
                            initialData={itemToEditOrDelete}
                        />
                    }
                    {modalContent === 'addEditGuest' &&
                        <GuestForm
                            onClose={handleCloseModal}
                            onSave={handleSaveGuest}
                            initialData={itemToEditOrDelete}
                        />
                    }
                    {modalContent === 'addEditRoom' &&
                        <RoomForm
                            onClose={handleCloseModal}
                            onSave={handleSaveRoom}
                            initialData={itemToEditOrDelete}
                        />
                    }
                    {modalContent === 'addEditTask' &&
                        <TaskForm
                            onClose={handleCloseModal}
                            onSave={handleSaveTask}
                            initialData={itemToEditOrDelete}
                            employees={employees}
                            rooms={rooms}
                        />
                    }
                    {modalContent === 'cancelBookingConfirmation' && (
                        <ConfirmationDialog 
                            onCancel={handleCloseModal}
                            onConfirm={handleCancelBooking}
                            message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?"
                            confirmButtonText="ยืนยันการยกเลิก"
                        />
                    )}
                    {modalContent === 'deleteExpenseConfirmation' && (
                        <ConfirmationDialog 
                            onCancel={handleCloseModal}
                            onConfirm={handleDeleteExpense}
                            message="คุณแน่ใจหรือไม่ว่าต้องการลบรายจ่ายนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
                            confirmButtonText="ยืนยันการลบ"
                        />
                    )}
                     {modalContent === 'deleteTenantConfirmation' && (
                        <ConfirmationDialog
                            onCancel={handleCloseModal}
                            onConfirm={handleDeleteTenant}
                            message="คุณแน่ใจหรือไม่ว่าต้องการลบผู้เช่ารายนี้?"
                            confirmButtonText="ยืนยันการลบ"
                        />
                    )}
                     {modalContent === 'deleteEmployeeConfirmation' && (
                        <ConfirmationDialog
                            onCancel={handleCloseModal}
                            onConfirm={handleDeleteEmployee}
                            message="คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานรายนี้?"
                            confirmButtonText="ยืนยันการลบ"
                        />
                    )}
                    {modalContent === 'deleteGuestConfirmation' && (
                        <ConfirmationDialog
                            onCancel={handleCloseModal}
                            onConfirm={handleDeleteGuest}
                            message="คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้เข้าพักรายนี้?"
                            confirmButtonText="ยืนยันการลบ"
                        />
                    )}
                     {modalContent === 'deleteRoomConfirmation' && (
                        <ConfirmationDialog
                            onCancel={handleCloseModal}
                            onConfirm={handleDeleteRoom}
                            message="คุณแน่ใจหรือไม่ว่าต้องการลบห้องพักนี้?"
                            confirmButtonText="ยืนยันการลบ"
                        />
                    )}
                     {modalContent === 'deleteTaskConfirmation' && (
                        <ConfirmationDialog
                            onCancel={handleCloseModal}
                            onConfirm={handleDeleteTask}
                            message="คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้?"
                            confirmButtonText="ยืนยันการลบ"
                        />
                    )}
                </Modal>
            )}
        </div>
    );
};

export default AdminPanel;