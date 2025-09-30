
import React, { useMemo } from 'react';
import { AdminBooking, Expense, Room, Task, Guest } from '../../types';
import { formatISODate, formatThaiDate } from '../../services/utils';
import { PlusIcon } from '../icons/PlusIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { ClipboardCheckIcon } from '../icons/ClipboardCheckIcon';

interface DashboardProps {
    bookings: AdminBooking[];
    expenses: Record<string, Expense[]>;
    rooms: Room[];
    tasks: Task[];
    guests: Guest[];
    onAddBooking: () => void;
    onAddExpense: () => void;
    onAddTask: () => void;
}

const WidgetCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-primary p-4 rounded-xl shadow-md border border-border ${className}`}>
        <h4 className="font-semibold text-text-main mb-3">{title}</h4>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-secondary p-4 rounded-lg border border-border flex items-center gap-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="font-bold text-2xl text-text-main">{value}</p>
            <p className="text-xs text-text-muted">{title}</p>
        </div>
    </div>
);

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="w-full bg-secondary rounded-full h-3 border border-border">
            <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const ActionItem: React.FC<{ icon: React.ReactNode; text: string; subtext?: string; colorClass?: string; }> = ({ icon, text, subtext, colorClass = 'bg-blue-100 dark:bg-blue-900/50' }) => (
    <div className="flex items-center gap-3 bg-secondary p-3 rounded-lg border border-border">
        <div className={`p-2 rounded-md ${colorClass}`}>
           {icon}
        </div>
        <div>
            <p className="font-semibold text-text-main text-sm">{text}</p>
            {subtext && <p className="text-xs text-text-muted">{subtext}</p>}
        </div>
    </div>
);

const DashboardView: React.FC<DashboardProps> = ({ bookings, expenses, rooms, tasks, guests, onAddBooking, onAddExpense, onAddTask }) => {
    const todayISO = useMemo(() => formatISODate(new Date()), []);
    
    const hotelStatus = useMemo(() => {
        const occupiedRooms = rooms.filter(r => r.status === 'ไม่ว่าง').length;
        const totalRooms = rooms.length;
        const availableRooms = totalRooms - occupiedRooms;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
        
        const arrivalsToday = bookings.filter(b => b.status === 'จอง' && b.checkIn === todayISO);
        const departuresToday = bookings.filter(b => b.status === 'เข้าพัก' && b.checkOut === todayISO);
        
        return { occupiedRooms, totalRooms, availableRooms, occupancyRate, arrivalsToday, departuresToday };
    }, [rooms, bookings, todayISO]);

    const actionableItems = useMemo(() => {
        const openTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'In Progress');
        return [...hotelStatus.departuresToday, ...hotelStatus.arrivalsToday, ...openTasks];
    }, [tasks, hotelStatus.arrivalsToday, hotelStatus.departuresToday]);

    const financialSummary = useMemo(() => {
        const monthStart = formatISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

        const checkedOutToday = bookings.filter(b => b.status === 'เช็คเอาท์แล้ว' && b.checkOut === todayISO);
        const checkedOutMonth = bookings.filter(b => b.status === 'เช็คเอาท์แล้ว' && b.checkOut >= monthStart);
        
        const calculateMetrics = (bookingList: AdminBooking[]) => {
            const grossRevenue = bookingList.reduce((sum, b) => sum + b.totalAmount, 0);
            const revenueExcludingVat = grossRevenue / 1.07;
            const vatAmount = grossRevenue - revenueExcludingVat;
            const paoFeeCollected = bookingList.reduce((sum, b) => sum + b.feeAmount, 0);
            
            const bookingsCount = bookingList.length;
            const adr = bookingsCount > 0 ? revenueExcludingVat / bookingsCount : 0;

            return { grossRevenue, netRevenue: revenueExcludingVat, vatCollected: vatAmount, paoFeeCollected, adr };
        };

        const todayMetrics = calculateMetrics(checkedOutToday);
        const monthMetrics = calculateMetrics(checkedOutMonth);

        const expenseToday = (expenses[todayISO] || []).reduce((sum, e) => sum + e.amount, 0);
        const expenseMonth = Object.entries(expenses)
            .filter(([date]) => date >= monthStart)
            .flatMap(([, dailyExpenses]) => dailyExpenses)
            .reduce((sum, e) => sum + e.amount, 0);

        const revParToday = rooms.length > 0 ? todayMetrics.netRevenue / rooms.length : 0;
        const revParMonth = rooms.length > 0 ? monthMetrics.netRevenue / rooms.length : 0;

        return {
            today: {
                ...todayMetrics,
                expense: expenseToday,
                netProfit: todayMetrics.netRevenue - expenseToday,
                revPar: revParToday,
            },
            month: {
                ...monthMetrics,
                expense: expenseMonth,
                netProfit: monthMetrics.netRevenue - expenseMonth,
                revPar: revParMonth,
            }
        };
    }, [bookings, expenses, todayISO, rooms]);

    return (
        <div className="space-y-6">
             {/* Action Buttons Header */}
            <div className="flex items-center justify-end gap-2 flex-wrap">
                <button onClick={onAddBooking} className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all flex items-center gap-2"><PlusIcon /> เพิ่มการจอง</button>
                <button onClick={onAddExpense} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap shadow-md hover:shadow-lg flex items-center gap-2"><PlusIcon /> เพิ่มค่าใช้จ่าย</button>
                <button onClick={onAddTask} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap shadow-md hover:shadow-lg flex items-center gap-2"><PlusIcon /> เพิ่มงาน</button>
            </div>
        
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Column: Operational Status */}
                <div className="lg:col-span-2 space-y-6">
                    <WidgetCard title="สถานะโรงแรมภาพรวม (วันนี้)">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard title="ห้องว่าง" value={hotelStatus.availableRooms} icon={<KeyIcon />} colorClass="bg-green-100 dark:bg-green-900/50 text-green-500" />
                            <StatCard title="มีแขก" value={hotelStatus.occupiedRooms} icon={<UsersIcon />} colorClass="bg-red-100 dark:bg-red-900/50 text-red-500" />
                             <StatCard title="ทั้งหมด" value={hotelStatus.totalRooms} icon={<ChartBarIcon />} colorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-500" />
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-text-muted text-sm">อัตราการเข้าพัก</span>
                                <span className="font-bold text-text-main">{hotelStatus.occupancyRate.toFixed(0)}%</span>
                            </div>
                            <ProgressBar value={hotelStatus.occupiedRooms} max={hotelStatus.totalRooms} />
                        </div>
                    </WidgetCard>
                    
                     <WidgetCard title="การแจ้งเตือนและงานที่ต้องทำ">
                        {actionableItems.length === 0 ? (
                            <p className="text-sm text-center text-text-muted py-4">ไม่มีรายการที่ต้องจัดการในขณะนี้</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {actionableItems.map(item => {
                                    // Type guard for AdminBooking
                                    if ('guestId' in item) {
                                        const isArrival = item.status === 'จอง';
                                        return (
                                            <ActionItem
                                                key={`booking-${item.id}`}
                                                icon={isArrival ? <KeyIcon /> : <UsersIcon />}
                                                text={`${isArrival ? 'เช็คอิน' : 'เช็คเอาท์'}: ห้อง ${item.room?.roomNumber || 'N/A'}`}
                                                subtext={item.guest?.fullName || ''}
                                                colorClass={isArrival ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}
                                            />
                                        );
                                    }
                                    // Type guard for Task
                                    if ('title' in item) {
                                        return (
                                            <ActionItem
                                                key={`task-${item.id}`}
                                                icon={<ClipboardCheckIcon />}
                                                text={`งาน: ${item.title}`}
                                                subtext={`ห้อง ${item.room?.roomNumber || 'ทั่วไป'}`}
                                                colorClass="bg-purple-100 dark:bg-purple-900/50"
                                            />
                                        )
                                    }
                                    return null;
                                })}
                            </div>
                        )}
                    </WidgetCard>
                </div>

                {/* Sidebar Column: Financials */}
                <div className="lg:col-span-1 space-y-6">
                    <WidgetCard title="สรุปการเงิน">
                         <div>
                            <h5 className="font-semibold text-text-muted text-sm mb-2">วันนี้ ({formatThaiDate(new Date())})</h5>
                            <DetailRow label="รายรับรวม" value={`+ ${financialSummary.today.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-green-500" />
                            <DetailRow label="ภาษีขาย (7%)" value={`- ${financialSummary.today.vatCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-text-muted" />
                            <DetailRow label="รายรับสุทธิ" value={`${financialSummary.today.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-green-500 font-semibold" />
                            <DetailRow label="รายจ่าย" value={`- ${financialSummary.today.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-red-500" />
                            <hr className="border-border !my-2" />
                            <DetailRow label="กำไรสุทธิ" value={`${financialSummary.today.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="font-bold !text-yellow-400" />
                            <DetailRow label="ค่าธรรมเนียม อบจ." value={`${financialSummary.today.paoFeeCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-xs !text-blue-400" />
                         </div>
                         <hr className="border-border" />
                          <div>
                            <h5 className="font-semibold text-text-muted text-sm mb-2">เดือนนี้</h5>
                            <DetailRow label="รายรับรวม" value={`+ ${financialSummary.month.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-green-500" />
                            <DetailRow label="ภาษีขาย (7%)" value={`- ${financialSummary.month.vatCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-text-muted" />
                            <DetailRow label="รายรับสุทธิ" value={`${financialSummary.month.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-green-500 font-semibold" />
                            <DetailRow label="รายจ่าย" value={`- ${financialSummary.month.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-red-500" />
                            <hr className="border-border !my-2" />
                            <DetailRow label="กำไรสุทธิ" value={`${financialSummary.month.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="font-bold !text-yellow-400" />
                            <DetailRow label="ADR" value={`${financialSummary.month.adr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-blue-400" />
                            <DetailRow label="RevPAR" value={`${financialSummary.month.revPar.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-blue-400" />
                            <DetailRow label="ค่าธรรมเนียม อบจ." value={`${financialSummary.month.paoFeeCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-xs !text-blue-400" />
                         </div>
                    </WidgetCard>
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string; value: string | number; valueClass?: string }> = ({ label, value, valueClass }) => (
    <div className="flex justify-between items-center py-0.5 text-sm">
        <p className="text-text-muted">{label}</p>
        <p className={`font-semibold text-text-main ${valueClass}`}>{value}</p>
    </div>
);

export default DashboardView;
