import React, { useState, useEffect, useCallback, Fragment } from 'react';
import * as adminService from '../services/adminService';
import { formatISODate, formatThaiDate } from '../services/utils';
import { AdminBooking, Expense, Room, Guest, Tenant, MeterReadingsData, UtilityRates, Employee } from '../types';
import Spinner from './common/Spinner';
import DashboardView from './views/DashboardView';
import RoomsView from './views/RoomsView';
import BookingsView from './views/BookingsView';
import ReportsView from './views/ReportsView';
import MonthlyTenantsView from './views/MonthlyTenantsView';
import PayrollView from './views/PayrollView';
import EmployeesView from './views/EmployeesView';
import GuestsView from './views/GuestsView';
import TenantsDBView from './views/TenantsDBView'; // New DB view for tenants
import PAOReport from './reports/PAOReport';
import MunicipalityReport from './reports/MunicipalityReport';
import { UserIcon } from './icons/UserIcon';
import { UsersIcon } from './icons/UsersIcon';
import { CashIcon } from './icons/CashIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';

type AdminView = 'dashboard' | 'rooms' | 'bookings' | 'reports' | 'monthlyTenants' | 'payroll' | 'employees' | 'guests' | 'tenantsDB';
type ModalContent = 'addBooking' | 'addExpense' | 'cancelBookingConfirmation' | 'paoReport' | 'municipalityReport' | 'addEditTenant' | 'deleteTenantConfirmation' | 'addEditEmployee' | 'deleteEmployeeConfirmation' | 'addEditGuest' | 'deleteGuestConfirmation' | null;

const useAdminData = () => {
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
    
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
                allEmployeesData
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

export const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string, size?: 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' }> = ({ children, onClose, title, size = 'lg' }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" aria-modal="true" role="dialog">
        <div className={`relative bg-brand-primary rounded-lg shadow-2xl w-full max-w-${size} m-4`}>
            <div className="flex justify-between items-center p-4 border-b border-brand-secondary">
                <h3 className="text-xl font-semibold text-brand-light">{title}</h3>
                <button onClick={onClose} className="text-2xl text-brand-text hover:text-brand-light">&times;</button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
    </div>
);

const DeleteConfirmationDialog: React.FC<{ onConfirm: () => void; onCancel: () => void; itemName: string; message?: string, confirmText?: string }> = ({ onConfirm, onCancel, itemName, message, confirmText = 'ยืนยันการลบ' }) => (
    <div className="text-center">
        <p className="text-lg text-brand-light mb-6">{message || `คุณแน่ใจหรือไม่ว่าต้องการลบ ${itemName}? การกระทำนี้จะเปลี่ยนสถานะเป็น "ไม่ใช้งาน" และนำออกจากรายการที่ใช้งานอยู่`}</p>
        <div className="flex justify-center gap-4">
            <button onClick={onCancel} className="bg-brand-secondary hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition-colors">ยกเลิก</button>
            <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition-colors">{confirmText}</button>
        </div>
    </div>
);

export const AddBookingForm: React.FC<{ onAdd: (booking: Omit<AdminBooking, 'id' | 'status' | 'totalAmount' | 'feeAmount' | 'finalAmount' | 'paymentMethod'>, guest: Omit<Guest, 'id' | 'status'>) => void; rooms: Room[] }> = ({ onAdd, rooms }) => {
    const [guestName, setGuestName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [roomId, setRoomId] = useState(rooms.find(r => r.status === 'ว่าง')?.id || rooms[0]?.id || '');
    const [checkIn, setCheckIn] = useState(formatISODate(new Date()));
    const [checkOut, setCheckOut] = useState(formatISODate(new Date(Date.now() + 86400000)));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName || !roomId || !checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วนและวันที่เช็คเอาท์ต้องอยู่หลังวันที่เช็คอิน');
            return;
        }
        onAdd({ roomId, checkIn, checkOut, guestId: '' }, { fullName: guestName, phoneNumber });
    };
    
    const availableRooms = rooms.filter(r => r.status === 'ว่าง');

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่อลูกค้า" value={guestName} onChange={e => setGuestName(e.target.value)} required />
            <FormInput label="เบอร์โทรศัพท์" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            <FormSelect label="ห้องพัก (เฉพาะห้องว่าง)" value={roomId} onChange={e => setRoomId(e.target.value)} options={availableRooms.map(r => ({ value: r.id, label: `${r.roomNumber} (${r.roomType})` }))} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="เช็คอิน" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
                <FormInput label="เช็คเอาท์" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">เพิ่มการจอง</button>
        </form>
    );
};

export const AddExpenseForm: React.FC<{ onAdd: (expense: Omit<Expense, 'id'>) => void; selectedDate: string }> = ({ onAdd, selectedDate }) => {
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!category || isNaN(numAmount)) {
            alert('กรุณากรอกหมวดหมู่และจำนวนเงินให้ถูกต้อง');
            return;
        }
        onAdd({ category, amount: numAmount, note, date: selectedDate });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-brand-text">เพิ่มรายจ่ายสำหรับ: <span className="font-semibold text-brand-light">{formatThaiDate(new Date(selectedDate))}</span></h4>
            <FormInput label="หมวดหมู่" placeholder="เช่น เครื่องใช้, ซ่อมบำรุง" value={category} onChange={e => setCategory(e.target.value)} required />
            <FormInput label="จำนวนเงิน (บาท)" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
            <FormInput label="หมายเหตุ (ถ้ามี)" placeholder="เช่น หลอดไฟใหม่" value={note} onChange={e => setNote(e.target.value)} />
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">เพิ่มรายจ่าย</button>
        </form>
    );
};

const AddEditGuestForm: React.FC<{ onSave: (data: Omit<Guest, 'id' | 'status'>) => void; guest: Guest | null }> = ({ onSave, guest }) => {
    const [fullName, setFullName] = useState(guest?.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState(guest?.phoneNumber || '');
    const [idCardNumber, setIdCardNumber] = useState(guest?.idCardNumber || '');
    const [address, setAddress] = useState(guest?.address || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName) {
            alert('กรุณากรอกชื่อ-สกุล');
            return;
        }
        onSave({ fullName, phoneNumber, idCardNumber, address });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่อ-สกุล" value={fullName} onChange={e => setFullName(e.target.value)} required />
            <FormInput label="เบอร์โทรศัพท์" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            <FormInput label="เลขบัตรประชาชน" value={idCardNumber} onChange={e => setIdCardNumber(e.target.value)} />
            <FormInput label="ที่อยู่" value={address} onChange={e => setAddress(e.target.value)} />
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">บันทึก</button>
        </form>
    );
};


const AddEditTenantForm: React.FC<{ onSave: (data: Omit<Tenant, 'id' | 'status'>) => void; tenant: Tenant | null }> = ({ onSave, tenant }) => {
    const [name, setName] = useState(tenant?.name || '');
    const [roomNumber, setRoomNumber] = useState(tenant?.roomNumber || '');
    const [rent, setRent] = useState(tenant?.rent.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const rentAmount = parseFloat(rent);
        if (!name || !roomNumber || isNaN(rentAmount)) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        onSave({ name, roomNumber, rent: rentAmount });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่อ-สกุล ผู้เช่า" value={name} onChange={e => setName(e.target.value)} required />
            <FormInput label="หมายเลขห้อง" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required />
            <FormInput label="ค่าเช่า (บาท)" type="number" value={rent} onChange={e => setRent(e.target.value)} required />
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">บันทึก</button>
        </form>
    );
};

const AddEditEmployeeForm: React.FC<{ onSave: (data: Omit<Employee, 'id' | 'status'>) => void; employee: Employee | null }> = ({ onSave, employee }) => {
    const [name, setName] = useState(employee?.name || '');
    const [position, setPosition] = useState(employee?.position || '');
    const [employmentType, setEmploymentType] = useState<'monthly' | 'daily'>(employee?.employmentType || 'monthly');
    const [baseRate, setBaseRate] = useState(employee?.baseRate.toString() || '');
    const [bank, setBank] = useState(employee?.accountInfo.bank || '');
    const [accountNumber, setAccountNumber] = useState(employee?.accountInfo.accountNumber || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const rateAmount = parseFloat(baseRate);
        if (!name || !position || !bank || !accountNumber || isNaN(rateAmount)) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        onSave({ name, position, employmentType, baseRate: rateAmount, accountInfo: { bank, accountNumber } });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่อ-สกุล" value={name} onChange={e => setName(e.target.value)} required />
            <FormInput label="ตำแหน่ง" value={position} onChange={e => setPosition(e.target.value)} required />
            <FormSelect 
                label="ประเภทการจ้าง" 
                value={employmentType} 
                onChange={e => setEmploymentType(e.target.value as 'monthly' | 'daily')} 
                options={[
                    { value: 'monthly', label: 'รายเดือน' },
                    { value: 'daily', label: 'รายวัน' }
                ]} 
            />
            <FormInput label={employmentType === 'monthly' ? "เงินเดือน (บาท)" : "ค่าจ้าง (บาท/วัน)"} type="number" value={baseRate} onChange={e => setBaseRate(e.target.value)} required />
            <h4 className="text-brand-text pt-2 border-t border-brand-secondary">ข้อมูลบัญชี</h4>
            <FormInput label="ธนาคาร" value={bank} onChange={e => setBank(e.target.value)} required />
            <FormInput label="เลขที่บัญชี" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required />
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">บันทึก</button>
        </form>
    );
};

// --- Form Components ---
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}
export const FormInput: React.FC<FormInputProps> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text mb-1">{label}</label>
        <input className="w-full bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" {...props} />
    </div>
);

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string | number; label: string }[];
}
export const FormSelect: React.FC<FormSelectProps> = ({ label, options, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text mb-1">{label}</label>
        <select className="w-full bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" {...props}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const AdminPanel: React.FC = () => {
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ModalContent>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedItem, setSelectedItem] = useState<AdminBooking | Tenant | Employee | Guest | null>(null);

    const { 
        loading, rooms, bookings, expenses, tenants, employees, allGuests, allTenants, allEmployees,
        meterReadings, utilityRates, fetchData 
    } = useAdminData();

    const handleOpenModal = (content: ModalContent, item: any = null) => {
        setModalContent(content);
        setSelectedItem(item);
    };
    
    const handleCloseModal = () => {
        setModalContent(null);
        setSelectedItem(null);
    };

    const handleAddBooking = async (bookingData: Omit<AdminBooking, 'id' | 'status' | 'totalAmount' | 'feeAmount' | 'finalAmount' | 'paymentMethod'>, guestData: Omit<Guest, 'id' | 'status'>) => {
        try {
            await adminService.addBooking(bookingData, guestData);
            await fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to add booking:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มการจอง");
        }
    };
    
    const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
        try {
            await adminService.addExpense(expenseData);
            await fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to add expense:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มรายจ่าย");
        }
    };

    const handleCancelBooking = async () => {
        if (selectedItem) {
            try {
                await adminService.cancelBooking(selectedItem.id);
                await fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to cancel booking:", error);
                alert("เกิดข้อผิดพลาดในการยกเลิกการจอง");
            }
        }
    };
    
    const handleSaveTenant = async (data: Omit<Tenant, 'id' | 'status'>) => {
        try {
            if (selectedItem) {
                await adminService.updateTenant(selectedItem.id, data);
            } else {
                await adminService.addTenant(data);
            }
            await fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save tenant:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้เช่า");
        }
    };

    const handleDeleteTenant = async () => {
        if (selectedItem) {
            try {
                await adminService.removeTenant(selectedItem.id);
                await fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete tenant:", error);
                alert("เกิดข้อผิดพลาดในการลบข้อมูลผู้เช่า");
            }
        }
    };

    const handleSaveEmployee = async (data: Omit<Employee, 'id' | 'status'>) => {
        try {
            if (selectedItem) {
                await adminService.updateEmployee(selectedItem.id, data);
            } else {
                await adminService.addEmployee(data);
            }
            await fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save employee:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลพนักงาน");
        }
    };
    
    const handleDeleteEmployee = async () => {
         if (selectedItem) {
            try {
                await adminService.removeEmployee(selectedItem.id);
                await fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete employee:", error);
                alert("เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน");
            }
        }
    };
    
    const handleSaveGuest = async (data: Omit<Guest, 'id' | 'status'>) => {
        try {
            if (selectedItem) {
                await adminService.updateGuest(selectedItem.id, data);
            } else {
                await adminService.addGuest(data);
            }
            await fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save guest:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้เข้าพัก");
        }
    };
    
    const handleDeleteGuest = async () => {
         if (selectedItem) {
            try {
                await adminService.removeGuest(selectedItem.id);
                await fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete guest:", error);
                alert("เกิดข้อผิดพลาดในการลบข้อมูลผู้เข้าพัก");
            }
        }
    };

    const getModalSize = (content: ModalContent): 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' => {
        switch (content) {
            case 'paoReport':
            case 'municipalityReport':
                return '5xl';
            case 'addBooking':
            case 'addExpense':
            case 'addEditEmployee':
            case 'addEditTenant':
            case 'addEditGuest':
                 return 'lg';
            default:
                return 'lg';
        }
    };
    
    const navItems = [
        {
            group: 'จัดการรายวัน',
            items: [
                { view: 'dashboard', label: 'ภาพรวม', icon: <ClipboardListIcon /> },
                { view: 'rooms', label: 'ปฏิทินห้องพัก', icon: <BuildingIcon /> },
                { view: 'bookings', label: 'การจอง', icon: <UserIcon /> },
                { view: 'reports', label: 'รายงาน', icon: <ClipboardListIcon /> },
            ]
        },
        {
            group: 'จัดการรายเดือน',
            items: [
                { view: 'monthlyTenants', label: 'ผู้เช่ารายเดือน', icon: <UsersIcon /> },
                { view: 'payroll', label: 'จัดการเงินเดือน', icon: <CashIcon /> },
            ]
        },
        {
            group: 'ฐานข้อมูล',
            items: [
                { view: 'employees', label: 'ทะเบียนพนักงาน', icon: <DatabaseIcon /> },
                { view: 'guests', label: 'ทะเบียนผู้เข้าพัก', icon: <DatabaseIcon /> },
                { view: 'tenantsDB', label: 'ทะเบียนผู้เช่า', icon: <DatabaseIcon /> },
            ]
        }
    ];

    const NavLink: React.FC<{ view: AdminView; label: string; icon: React.ReactElement }> = ({ view, label, icon }) => (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); setCurrentView(view); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === view ? 'bg-brand-accent text-white' : 'text-brand-text hover:bg-brand-primary hover:text-white'}`}
        >
            {icon}
            <span>{label}</span>
        </a>
    );

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView bookings={bookings} rooms={rooms} />;
            case 'rooms':
                return <RoomsView rooms={rooms} bookings={bookings} />;
            case 'bookings':
                return <BookingsView 
                            bookings={bookings} 
                            onCancel={(id) => handleOpenModal('cancelBookingConfirmation', bookings.find(b => b.id === id))}
                            onAddClick={() => handleOpenModal('addBooking')}
                        />;
            case 'reports':
                return <ReportsView 
                            bookings={bookings} 
                            expenses={expenses} 
                            onAddExpenseClick={(date) => { setSelectedDate(date); handleOpenModal('addExpense'); }}
                            onPaoReportClick={() => handleOpenModal('paoReport')}
                            onMunicipalityReportClick={() => handleOpenModal('municipalityReport')}
                        />;
            case 'monthlyTenants':
                return <MonthlyTenantsView
                            tenants={tenants}
                            meterReadings={meterReadings}
                            utilityRates={utilityRates}
                            onSave={adminService.saveMeterReadings}
                            onAdd={() => handleOpenModal('addEditTenant')}
                            onEdit={(tenant) => handleOpenModal('addEditTenant', tenant)}
                            onDelete={(tenant) => handleOpenModal('deleteTenantConfirmation', tenant)}
                        />;
            case 'payroll':
                return <PayrollView />;
            case 'employees':
                return <EmployeesView 
                            employees={allEmployees}
                            onAdd={() => handleOpenModal('addEditEmployee')}
                            onEdit={(emp) => handleOpenModal('addEditEmployee', emp)}
                            onDelete={(emp) => handleOpenModal('deleteEmployeeConfirmation', emp)}
                        />;
            case 'guests':
                 return <GuestsView
                            guests={allGuests}
                            onAdd={() => handleOpenModal('addEditGuest')}
                            onEdit={(guest) => handleOpenModal('addEditGuest', guest)}
                            onDelete={(guest) => handleOpenModal('deleteGuestConfirmation', guest)}
                        />;
            case 'tenantsDB':
                return <TenantsDBView
                            tenants={allTenants}
                            onAdd={() => handleOpenModal('addEditTenant')}
                            onEdit={(tenant) => handleOpenModal('addEditTenant', tenant)}
                            onDelete={(tenant) => handleOpenModal('deleteTenantConfirmation', tenant)}
                        />;
            default:
                return null;
        }
    };

    const renderModalContent = () => {
        if (!modalContent) return null;
        const size = getModalSize(modalContent);
        
        switch (modalContent) {
            case 'addBooking':
                return <Modal title="เพิ่มการจองใหม่" onClose={handleCloseModal} size={size}><AddBookingForm onAdd={handleAddBooking} rooms={rooms} /></Modal>;
            case 'addExpense':
                return <Modal title="เพิ่มรายจ่าย" onClose={handleCloseModal} size={size}><AddExpenseForm onAdd={handleAddExpense} selectedDate={selectedDate} /></Modal>;
            case 'cancelBookingConfirmation':
                // FIX: Added a type assertion to `selectedItem` to correctly access the `guest.fullName` property for a booking cancellation confirmation. The `selectedItem` state can hold different types, and this assertion clarifies that it's an `AdminBooking` in this context.
                return <Modal title="ยืนยันการยกเลิก" onClose={handleCloseModal} size={size}><DeleteConfirmationDialog onConfirm={handleCancelBooking} onCancel={handleCloseModal} itemName={`การจองของ ${(selectedItem as AdminBooking)?.guest?.fullName}`} message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?" confirmText='ยืนยันการยกเลิก' /></Modal>;
            case 'paoReport':
                return <Modal title="รายงาน อบจ." onClose={handleCloseModal} size={size}><PAOReport bookings={bookings} /></Modal>;
            case 'municipalityReport':
                return <Modal title="รายงานเทศบาล" onClose={handleCloseModal} size={size}><MunicipalityReport bookings={bookings} /></Modal>;
            case 'addEditTenant':
                return <Modal title={selectedItem ? 'แก้ไขข้อมูลผู้เช่า' : 'เพิ่มผู้เช่าใหม่'} onClose={handleCloseModal} size={size}><AddEditTenantForm onSave={handleSaveTenant} tenant={selectedItem as Tenant | null} /></Modal>;
            case 'deleteTenantConfirmation':
                return <Modal title="ยืนยันการลบผู้เช่า" onClose={handleCloseModal} size={size}><DeleteConfirmationDialog onConfirm={handleDeleteTenant} onCancel={handleCloseModal} itemName={(selectedItem as Tenant)?.name} /></Modal>;
            case 'addEditEmployee':
                return <Modal title={selectedItem ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'} onClose={handleCloseModal} size={size}><AddEditEmployeeForm onSave={handleSaveEmployee} employee={selectedItem as Employee | null} /></Modal>;
            case 'deleteEmployeeConfirmation':
                return <Modal title="ยืนยันการลบพนักงาน" onClose={handleCloseModal} size={size}><DeleteConfirmationDialog onConfirm={handleDeleteEmployee} onCancel={handleCloseModal} itemName={(selectedItem as Employee)?.name} /></Modal>;
            case 'addEditGuest':
                return <Modal title={selectedItem ? 'แก้ไขข้อมูลผู้เข้าพัก' : 'เพิ่มผู้เข้าพักใหม่'} onClose={handleCloseModal} size={size}><AddEditGuestForm onSave={handleSaveGuest} guest={selectedItem as Guest | null} /></Modal>;
            case 'deleteGuestConfirmation':
                return <Modal title="ยืนยันการลบผู้เข้าพัก" onClose={handleCloseModal} size={size}><DeleteConfirmationDialog onConfirm={handleDeleteGuest} onCancel={handleCloseModal} itemName={(selectedItem as Guest)?.fullName} /></Modal>;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-brand-secondary">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-brand-secondary p-4 transform transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <h1 className="text-2xl font-bold text-white text-center mb-8">Viphat Hotel</h1>
                 <nav className="space-y-6">
                    {navItems.map(group => (
                        <div key={group.group}>
                            <h2 className="px-3 text-xs font-semibold uppercase text-brand-text tracking-wider mb-2">{group.group}</h2>
                            <div className="space-y-1">
                                {group.items.map(item => <NavLink key={item.view} view={item.view as AdminView} label={item.label} icon={item.icon} />)}
                            </div>
                        </div>
                    ))}
                 </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:pl-64">
                <header className="sticky top-0 z-10 lg:hidden flex items-center justify-between p-4 bg-brand-secondary border-b border-brand-primary">
                    <button onClick={() => setSidebarOpen(true)} className="text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <h2 className="text-xl font-bold text-white">{navItems.flatMap(g => g.items).find(i => i.view === currentView)?.label}</h2>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {loading ? <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div> : renderView()}
                </main>
            </div>
            
            {renderModalContent()}
        </div>
    );
};
export default AdminPanel;
