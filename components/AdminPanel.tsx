

import React, { useState, useEffect, useCallback, Fragment, useMemo, useRef } from 'react';
import * as adminService from '../services/adminService';
import { formatISODate, formatThaiDate } from '../services/utils';
import { AdminBooking, Expense, Room, Guest, Tenant, MeterReadingsData, UtilityRates, Employee, Notification } from '../types';
import Spinner from './common/Spinner';
import RoomsView from './views/RoomsView';
import BookingsView from './views/BookingsView';
import ReportsView from './views/ReportsView';
import MonthlyTenantsView from './views/MonthlyTenantsView';
import PayrollView from './views/PayrollView';
import EmployeesView from './views/EmployeesView';
import GuestsView from './views/GuestsView';
import TenantsDBView from './views/TenantsDBView';
import BookingListView from './views/BookingListView';
import CheckInListView from './views/CheckInListView';
import CheckOutListView from './views/CheckOutListView';
import PAOReport from './reports/PAOReport';
import MunicipalityReport from './reports/MunicipalityReport';
import NotificationsDropdown from './common/NotificationsDropdown';
import { UserIcon } from './icons/UserIcon';
import { UsersIcon } from './icons/UsersIcon';
import { CashIcon } from './icons/CashIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { MenuIcon } from './icons/MenuIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { BellIcon } from './icons/BellIcon';

type AdminView = 'rooms' | 'bookings' | 'monthlyTenants' | 'payroll' | 'employees' | 'guests' | 'tenantsDB' | 'paoReport' | 'municipalityReport' | 'reports' | 'bookingList' | 'checkInList' | 'checkOutList';
type ModalContent = 'addBooking' | 'editBooking' | 'addExpense' | 'cancelBookingConfirmation' | 'addEditTenant' | 'deleteTenantConfirmation' | 'addEditEmployee' | 'deleteEmployeeConfirmation' | 'addEditGuest' | 'deleteGuestConfirmation' | null;

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

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text mb-1">{label}</label>
        <input className="w-full bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" {...props} />
    </div>
);

export const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, options: { value: string, label: string }[] }> = ({ label, options, ...props }) => (
     <div>
        {label && <label className="block text-sm font-medium text-brand-text mb-1">{label}</label>}
        <select className="w-full bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent appearance-none" {...props}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
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
            <button onClick={onToggle} className="w-full flex justify-between items-center text-left py-2.5 px-4 rounded-md text-brand-light hover:bg-brand-accent transition-colors">
                <span className="flex items-center gap-3">{icon} {title}</span>
                <ChevronDownIcon className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pl-8 pt-2 pb-2 space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
};


const AdminPanel: React.FC = () => {
    const { loading, rooms, bookings, expenses, tenants, employees, allGuests, allTenants, allEmployees, meterReadings, utilityRates, fetchData } = useAdminData();
    const [currentView, setCurrentView] = useState<AdminView>('bookings');
    const [modalContent, setModalContent] = useState<ModalContent>(null);
    const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
    const [selectedDateForExpense, setSelectedDateForExpense] = useState<string>('');
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [dailyReportDate, setDailyReportDate] = useState(() => formatISODate(new Date()));
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Notification state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

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
    
    // Effect to close notifications dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    useEffect(() => {
        const menuMapping: Record<string, AdminView[]> = {
            booking: ['bookingList', 'checkInList', 'checkOutList'],
            monthly: ['monthlyTenants', 'payroll'],
            database: ['guests', 'tenantsDB', 'employees'],
            reports: ['reports', 'paoReport', 'municipalityReport'],
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
            if (content === 'addExpense') setSelectedDateForExpense(data);
            if (content.startsWith('delete')) setItemToDelete(data);
            if (content.startsWith('addEdit')) setItemToDelete(data); // Using itemToDelete to hold the item being edited
        } else {
             setItemToDelete(null);
             setSelectedBooking(null);
        }
    };
    
    const handleCloseModal = () => setModalContent(null);

    const handleOpenAddBookingModal = () => handleOpenModal('addBooking');
    const handleOpenEditBookingModal = (booking: AdminBooking) => handleOpenModal('editBooking', booking);
    const handleOpenCancelBookingModal = (booking: AdminBooking) => handleOpenModal('cancelBookingConfirmation', booking);
    
    const handleOpenAddExpenseModal = () => {
        const initialDate = currentView === 'bookings' ? dailyReportDate : formatISODate(new Date());
        handleOpenModal('addExpense', initialDate);
    };

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
            const updatedBooking = await adminService.updateBooking(id, bookingUpdate);
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

    const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
        try {
            await adminService.addExpense(expense);
            addNotification(`บันทึกรายจ่าย '${expense.category}' จำนวน ${expense.amount.toLocaleString()} บาท`, 'info');
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to add expense:", error);
            addNotification("เกิดข้อผิดพลาดในการบันทึกรายจ่าย", "error");
        }
    };

    const handleSaveTenant = async (data: Omit<Tenant, 'id' | 'status'>) => {
        try {
            if (itemToDelete) { // Editing existing tenant
                await adminService.updateTenant(itemToDelete.id, data);
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
        if(itemToDelete) {
            try {
                await adminService.removeTenant(itemToDelete.id);
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
            if (itemToDelete) { // Editing
                await adminService.updateEmployee(itemToDelete.id, data);
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
        if(itemToDelete) {
            try {
                await adminService.removeEmployee(itemToDelete.id);
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete employee:", error);
            }
        }
    };
    
    const handleSaveGuest = async (data: Omit<Guest, 'id' | 'status'>) => {
         try {
            if (itemToDelete) { // Editing
                await adminService.updateGuest(itemToDelete.id, data);
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
        if(itemToDelete) {
            try {
                await adminService.removeGuest(itemToDelete.id);
                fetchData();
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete guest:", error);
            }
        }
    };
    
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const handleToggleNotifications = () => {
        setIsNotificationsOpen(prev => {
            const willBeOpen = !prev;
            if (willBeOpen && unreadCount > 0) {
                setNotifications(currentNotifications => 
                    currentNotifications.map(n => ({ ...n, read: true }))
                );
            }
            return willBeOpen;
        });
    };
    
    const handleClearNotifications = () => {
        setNotifications([]);
        setIsNotificationsOpen(false);
    };

    const renderView = () => {
        if (loading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;

        switch (currentView) {
            case 'rooms':
                return <RoomsView rooms={rooms} bookings={bookings} />;
            case 'bookings':
                return <BookingsView 
                    bookings={bookings} 
                    rooms={rooms} 
                    expenses={expenses} 
                    selectedDate={dailyReportDate} 
                    onDateChange={setDailyReportDate} 
                    onAddBooking={handleOpenAddBookingModal}
                    onAddExpense={handleOpenAddExpenseModal}
                />;
            case 'bookingList':
                return <BookingListView bookings={bookings} onEdit={handleOpenEditBookingModal} onCheckIn={handleCheckInBooking} />;
            case 'checkInList':
                return <CheckInListView bookings={bookings} onEdit={handleOpenEditBookingModal} onCheckOut={handleCheckOutBooking} />;
            case 'checkOutList':
                return <CheckOutListView bookings={bookings} />;
            case 'reports':
                return <ReportsView bookings={bookings} expenses={expenses} />;
            case 'paoReport':
                return <PAOReport bookings={bookings} />;
            case 'municipalityReport':
                return <MunicipalityReport bookings={bookings} />;
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
            default:
                return null;
        }
    };

    const viewTitles: Record<AdminView, string> = {
        rooms: 'ปฏิทินห้องพัก',
        bookings: 'จัดการรายวัน',
        bookingList: 'รายการจอง',
        checkInList: 'รายการเช็คอิน',
        checkOutList: 'ประวัติการเข้าพัก',
        reports: 'สรุปผลประกอบการ',
        paoReport: 'รายงาน อบจ.',
        municipalityReport: 'รายงานเทศบาล',
        monthlyTenants: 'จัดการผู้เช่ารายเดือน',
        payroll: 'ระบบเงินเดือน',
        employees: 'ฐานข้อมูลพนักงาน',
        guests: 'ฐานข้อมูลผู้เข้าพัก',
        tenantsDB: 'ฐานข้อมูลผู้เช่า',
    };

    return (
        <div className="relative min-h-screen md:flex bg-brand-secondary">
             {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-brand-primary text-brand-light flex flex-col p-4 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="text-2xl font-bold mb-8 text-center">Viphat Hotel</div>
                <nav className="flex-1 space-y-2">
                    <button onClick={() => setCurrentView('bookings')} className={`w-full text-left py-2.5 px-4 rounded-md flex items-center gap-3 ${currentView === 'bookings' ? 'bg-brand-accent' : 'hover:bg-brand-accent/50'} transition-colors`}>
                        <BuildingIcon /> จัดการรายวัน
                    </button>
                    <button onClick={() => setCurrentView('rooms')} className={`w-full text-left py-2.5 px-4 rounded-md flex items-center gap-3 ${currentView === 'rooms' ? 'bg-brand-accent' : 'hover:bg-brand-accent/50'} transition-colors`}>
                        <BuildingIcon /> ปฏิทินห้องพัก
                    </button>
                    
                     <DropdownMenu 
                        title="การจอง" 
                        icon={<ClipboardListIcon />}
                        isOpen={openMenu === 'booking'}
                        onToggle={() => setOpenMenu(openMenu === 'booking' ? null : 'booking')}
                    >
                        <button onClick={() => setCurrentView('bookingList')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'bookingList' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - รายการจอง
                        </button>
                         <button onClick={() => setCurrentView('checkInList')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'checkInList' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - รายการเช็คอิน
                        </button>
                         <button onClick={() => setCurrentView('checkOutList')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'checkOutList' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - ประวัติการเข้าพัก
                        </button>
                    </DropdownMenu>

                     <DropdownMenu 
                        title="จัดการรายเดือน" 
                        icon={<CashIcon />}
                        isOpen={openMenu === 'monthly'}
                        onToggle={() => setOpenMenu(openMenu === 'monthly' ? null : 'monthly')}
                    >
                        <button onClick={() => setCurrentView('monthlyTenants')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'monthlyTenants' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - จัดการผู้เช่า
                        </button>
                         <button onClick={() => setCurrentView('payroll')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'payroll' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - ระบบเงินเดือน
                        </button>
                    </DropdownMenu>

                     <DropdownMenu 
                        title="ฐานข้อมูล" 
                        icon={<DatabaseIcon />}
                        isOpen={openMenu === 'database'}
                        onToggle={() => setOpenMenu(openMenu === 'database' ? null : 'database')}
                     >
                         <button onClick={() => setCurrentView('guests')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'guests' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - ผู้เข้าพัก
                        </button>
                         <button onClick={() => setCurrentView('tenantsDB')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'tenantsDB' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - ผู้เช่า
                        </button>
                         <button onClick={() => setCurrentView('employees')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'employees' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - พนักงาน
                        </button>
                    </DropdownMenu>
                    
                     <DropdownMenu 
                        title="รายงาน" 
                        icon={<DocumentIcon />}
                        isOpen={openMenu === 'reports'}
                        onToggle={() => setOpenMenu(openMenu === 'reports' ? null : 'reports')}
                     >
                        <button onClick={() => setCurrentView('reports')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'reports' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                            - สรุปผลประกอบการ
                        </button>
                        <button onClick={() => setCurrentView('paoReport')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'paoReport' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                           - รายงาน อบจ.
                        </button>
                        <button onClick={() => setCurrentView('municipalityReport')} className={`w-full text-left py-2.5 px-4 rounded-md text-sm ${currentView === 'municipalityReport' ? 'bg-brand-accent/60' : 'hover:bg-brand-accent/50'} transition-colors`}>
                           - รายงานเทศบาล
                        </button>
                    </DropdownMenu>

                </nav>
            </aside>
            <div className="flex-1 flex flex-col min-w-0">
                 <header className="bg-brand-primary p-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-4">
                        <button
                            className="text-brand-light md:hidden"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <MenuIcon />
                        </button>
                        <h1 className="text-xl font-bold text-brand-light hidden sm:block">ระบบจัดการโรงแรมวิพัฒน์</h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                             <div className="relative" ref={notificationsRef}>
                                <button onClick={handleToggleNotifications} className="relative text-brand-light p-2 hover:bg-brand-secondary rounded-full">
                                    <BellIcon />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-5 w-5 rounded-full ring-2 ring-brand-primary bg-red-500 text-white text-xs flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {isNotificationsOpen && (
                                    <NotificationsDropdown 
                                        notifications={notifications} 
                                        onClearAll={handleClearNotifications}
                                    />
                                )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
                               <UserIcon />
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold">{viewTitles[currentView]}</h3>
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
                        modalContent === 'addExpense' ? 'เพิ่มรายจ่าย' :
                        modalContent === 'addEditTenant' ? (itemToDelete ? 'แก้ไขข้อมูลผู้เช่า' : 'เพิ่มผู้เช่าใหม่') :
                        modalContent === 'deleteTenantConfirmation' ? 'ยืนยันการลบผู้เช่า' :
                        modalContent === 'addEditEmployee' ? (itemToDelete ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่') :
                        modalContent === 'deleteEmployeeConfirmation' ? 'ยืนยันการลบพนักงาน' :
                        modalContent === 'addEditGuest' ? (itemToDelete ? 'แก้ไขข้อมูลผู้เข้าพัก' : 'เพิ่มผู้เข้าพักใหม่') :
                        modalContent === 'deleteGuestConfirmation' ? 'ยืนยันการลบผู้เข้าพัก' : ''
                    }
                    size={modalContent.includes('Employee') ? '2xl' : 'lg'}
                >
                    {modalContent === 'addBooking' && <AddBookingForm onAdd={handleAddBooking} rooms={rooms} />}
                    {modalContent === 'editBooking' && selectedBooking && <AddEditBookingForm onSave={handleUpdateBooking} onCancelBooking={() => handleOpenModal('cancelBookingConfirmation', selectedBooking)} booking={selectedBooking} rooms={rooms} />}
                    {modalContent === 'cancelBookingConfirmation' && selectedBooking && (
                        <DeleteConfirmationDialog 
                            onConfirm={handleCancelBooking} 
                            onCancel={handleCloseModal} 
                            itemName={`การจองของคุณ ${selectedBooking.guest?.fullName}`} 
                            message={`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?`}
                            confirmText="ยืนยันการยกเลิก"
                        />
                    )}
                    {modalContent === 'addExpense' && <AddExpenseForm onAdd={handleAddExpense} selectedDate={selectedDateForExpense} />}
                    
                    {modalContent === 'addEditTenant' && <AddEditTenantForm onSave={handleSaveTenant} tenant={itemToDelete} />}
                    {modalContent === 'deleteTenantConfirmation' && itemToDelete && <DeleteConfirmationDialog onConfirm={handleDeleteTenant} onCancel={handleCloseModal} itemName={`ผู้เช่า ${itemToDelete.name}`} />}

                    {modalContent === 'addEditEmployee' && <AddEditEmployeeForm onSave={handleSaveEmployee} employee={itemToDelete} />}
                    {modalContent === 'deleteEmployeeConfirmation' && itemToDelete && <DeleteConfirmationDialog onConfirm={handleDeleteEmployee} onCancel={handleCloseModal} itemName={`พนักงาน ${itemToDelete.name}`} />}
                
                    {modalContent === 'addEditGuest' && <AddEditGuestForm onSave={handleSaveGuest} guest={itemToDelete} />}
                    {modalContent === 'deleteGuestConfirmation' && itemToDelete && <DeleteConfirmationDialog onConfirm={handleDeleteGuest} onCancel={handleCloseModal} itemName={`ผู้เข้าพัก ${itemToDelete.fullName}`} />}

                </Modal>
            )}
        </div>
    );
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

export const AddEditBookingForm: React.FC<{ 
    onSave: (bookingId: string, data: { roomId: string, checkIn: string, checkOut: string }) => void;
    onCancelBooking: () => void;
    booking: AdminBooking;
    rooms: Room[];
}> = ({ onSave, onCancelBooking, booking, rooms }) => {
    const [roomId, setRoomId] = useState(booking.roomId);
    const [checkIn, setCheckIn] = useState(booking.checkIn);
    const [checkOut, setCheckOut] = useState(booking.checkOut);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId || !checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
            alert('กรุณาเลือกห้องและวันที่ให้ถูกต้อง');
            return;
        }
        onSave(booking.id, { roomId, checkIn, checkOut });
    };
    
    const availableRooms = rooms.filter(r => r.status === 'ว่าง' || r.id === booking.roomId);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-brand-text mb-1">ลูกค้า</label>
                <p className="w-full bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md">{booking.guest?.fullName}</p>
            </div>
            
            <FormSelect label="ห้องพัก (ห้องว่าง + ห้องปัจจุบัน)" value={roomId} onChange={e => setRoomId(e.target.value)} options={availableRooms.map(r => ({ value: r.id, label: `${r.roomNumber} (${r.roomType}) - ${r.price}฿` }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="เช็คอิน" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
                <FormInput label="เช็คเอาท์" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
            </div>

            <div className="flex justify-between items-center pt-4 mt-2 border-t border-brand-secondary">
                 <button type="button" onClick={onCancelBooking} className="text-red-500 hover:text-red-400 font-bold py-2 px-4 rounded-md border border-red-500 hover:bg-red-500/10 transition-colors">
                    ยกเลิกการจอง
                </button>
                <button type="submit" className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors">
                    บันทึกการเปลี่ยนแปลง
                </button>
            </div>
        </form>
    );
};

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="เช็คอิน" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
                <FormInput label="เช็คเอาท์" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">เพิ่มการจอง</button>
        </form>
    );
};

export const AddExpenseForm: React.FC<{ onAdd: (expense: Omit<Expense, 'id'>) => void; selectedDate: string }> = ({ onAdd, selectedDate }) => {
    const [date, setDate] = useState(selectedDate);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!category || isNaN(numAmount) || !date) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        onAdd({ category, amount: numAmount, note, date: date });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="วันที่" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <FormInput label="หมวดหมู่" placeholder="เช่น เครื่องใช้, ซ่อมบำรุง" value={category} onChange={e => setCategory(e.target.value)} required />
            <FormInput label="จำนวนเงิน (บาท)" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
            <FormInput label="หมายเหตุ (ถ้ามี)" placeholder="เช่น หลอดไฟใหม่" value={note} onChange={e => setNote(e.target.value)} />
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">เพิ่มรายจ่าย</button>
        </form>
    );
};

const AddEditTenantForm: React.FC<{ onSave: (data: Omit<Tenant, 'id' | 'status'>) => void; tenant: Tenant | null }> = ({ onSave, tenant }) => {
    const [name, setName] = useState(tenant?.name || '');
    const [roomNumber, setRoomNumber] = useState(tenant?.roomNumber || '');
    const [rent, setRent] = useState(tenant?.rent.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numRent = parseFloat(rent);
        if (!name || !roomNumber || isNaN(numRent)) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        onSave({ name, roomNumber, rent: numRent });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="ชื่อ-สกุล" value={name} onChange={e => setName(e.target.value)} required />
            <FormInput label="หมายเลขห้อง" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required />
            <FormInput label="ค่าเช่า (บาท)" type="number" value={rent} onChange={e => setRent(e.target.value)} required />
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 mt-4">บันทึก</button>
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
        const numBaseRate = parseFloat(baseRate);
        if (!name || !position || isNaN(numBaseRate)) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        onSave({ name, position, employmentType, baseRate: numBaseRate, accountInfo: { bank, accountNumber } });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="ชื่อ-สกุล" value={name} onChange={e => setName(e.target.value)} required />
                <FormInput label="ตำแหน่ง" value={position} onChange={e => setPosition(e.target.value)} required />
                <FormSelect 
                    label="ประเภทการจ้าง" 
                    value={employmentType} 
                    onChange={e => setEmploymentType(e.target.value as 'monthly' | 'daily')} 
                    options={[{value: 'monthly', label: 'รายเดือน'}, {value: 'daily', label: 'รายวัน'}]} 
                />
                <FormInput label="อัตราจ้าง (เงินเดือน/ค่าจ้างต่อวัน)" type="number" value={baseRate} onChange={e => setBaseRate(e.target.value)} required />
                <FormInput label="ธนาคาร" value={bank} onChange={e => setBank(e.target.value)} />
                <FormInput label="เลขที่บัญชี" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 mt-4">บันทึก</button>
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
            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 mt-4">บันทึก</button>
        </form>
    );
};


export default AdminPanel;