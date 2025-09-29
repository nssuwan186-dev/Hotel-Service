import React, { useMemo, useState } from 'react';
import { AdminBooking, Room, Expense } from '../../types';
import { formatISODate, formatThaiDate } from '../../services/utils';

// This component is for the detailed list items for check-ins and check-outs
const BookingListItem: React.FC<{ booking: AdminBooking; type: 'checkin' | 'checkout' }> = ({ booking, type }) => (
    <li className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
            <p className="font-medium text-brand-light">{booking.guest?.fullName}</p>
            <p className="text-sm text-brand-text">ห้อง {booking.room?.roomNumber}</p>
        </div>
        <div className="text-sm text-right mt-2 sm:mt-0">
            <p className="text-brand-text">{formatThaiDate(booking.checkIn)} - {formatThaiDate(booking.checkOut)}</p>
            {type === 'checkin' ? (
                <p className="font-semibold text-brand-light">{booking.paymentMethod}</p>
            ) : (
                <p className="font-semibold text-yellow-400">฿{booking.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            )}
        </div>
    </li>
);

// Helper for key-value pairs in the report block for cleaner code
const ReportRow: React.FC<{ label: string; value: string | number; valueClass?: string; isSubItem?: boolean }> = ({ label, value, valueClass = 'text-brand-light', isSubItem = false }) => (
    <div className={`flex justify-between py-1 ${isSubItem ? 'pl-4' : ''}`}>
        <p className="text-brand-text">{label}</p>
        <p className={`font-semibold ${valueClass}`}>{value}</p>
    </div>
);


const DashboardView: React.FC<{ bookings: AdminBooking[]; rooms: Room[]; expenses: Record<string, Expense[]> }> = ({ bookings, rooms, expenses }) => {
    const [selectedDate, setSelectedDate] = useState(() => formatISODate(new Date()));

    const dailyStats = useMemo(() => {
        const checkInsForDate = bookings.filter(b => b.checkIn === selectedDate);

        // Revenue is recognized from checkouts on the selected day
        const checkOutsForDate = bookings.filter(b => 
            b.checkOut === selectedDate && 
            (b.status === 'เช็คเอาท์แล้ว' || b.status === 'เข้าพัก')
        );
        
        const revenueCash = checkOutsForDate
            .filter(b => b.paymentMethod === 'เงินสด')
            .reduce((sum, b) => sum + b.finalAmount, 0);

        const revenueTransfer = checkOutsForDate
            .filter(b => b.paymentMethod === 'เงินโอน QR')
            .reduce((sum, b) => sum + b.finalAmount, 0);

        const activeStays = bookings.filter(b => {
            if (b.status === 'จอง' || b.status === 'ยกเลิก') return false;
            return b.checkIn <= selectedDate && b.checkOut > selectedDate;
        });

        const dailyExpensesList = expenses[selectedDate] || [];
        const dailyExpensesTotal = dailyExpensesList.reduce((sum, e) => sum + e.amount, 0);

        return {
            checkInsForDate,
            checkOutsForDate,
            revenueCash,
            revenueTransfer,
            totalRevenue: revenueCash + revenueTransfer,
            roomCountA: rooms.filter(r => r.roomNumber.startsWith('A')).length,
            roomCountB: rooms.filter(r => r.roomNumber.startsWith('B')).length,
            roomCountN: rooms.filter(r => r.roomNumber.startsWith('N')).length,
            dailyExpensesTotal,
            occupiedRooms: activeStays.map(b => b.room?.roomNumber).filter(Boolean).join(', ') || 'ไม่มี',
        };
    }, [bookings, rooms, expenses, selectedDate]);


    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-6 gap-4">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
            </div>

            {/* Daily Report Block */}
            <div className="bg-brand-primary p-4 rounded-lg shadow-lg mb-6">
                <h4 className="text-lg font-semibold text-brand-light mb-2 border-b border-brand-secondary pb-2">รายงานประจำวัน</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm mt-3">
                    {/* Income Section */}
                    <div>
                        <p className="font-bold mb-1 text-brand-light">รายรับประจำวัน</p>
                        <ReportRow label="จำนวนเช็คเอาท์" value={`${dailyStats.checkOutsForDate.length} รายการ`} isSubItem />
                        <ReportRow label="ยอดเงินสด" value={`฿${dailyStats.revenueCash.toLocaleString('en-US')}`} isSubItem />
                        <ReportRow label="ยอดเงินโอน" value={`฿${dailyStats.revenueTransfer.toLocaleString('en-US')}`} isSubItem />
                        <ReportRow label="ยอดรวม" value={`฿${dailyStats.totalRevenue.toLocaleString('en-US')}`} valueClass="text-green-400 font-bold" />
                    </div>

                    {/* Room Count Section */}
                    <div>
                        <p className="font-bold mb-1 text-brand-light">จำนวนห้องพัก</p>
                        <ReportRow label="ตึก A" value={`${dailyStats.roomCountA} ห้อง`} isSubItem />
                        <ReportRow label="ตึก B" value={`${dailyStats.roomCountB} ห้อง`} isSubItem />
                        <ReportRow label="ตึกดาวน์ N" value={`${dailyStats.roomCountN} ห้อง`} isSubItem />
                    </div>

                    {/* Expenses Section */}
                    <div className="border-t border-brand-secondary pt-3">
                        <ReportRow label="หักค่าจ่ายประจำวัน" value={`- ฿${dailyStats.dailyExpensesTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`} valueClass="text-red-400 font-bold" />
                    </div>

                    {/* Occupied Rooms Section */}
                     <div className="border-t border-brand-secondary pt-3">
                        <p className="text-brand-text">หมายเลขห้องที่มีการเข้าพัก</p>
                        <p className="font-semibold text-brand-light truncate">{dailyStats.occupiedRooms}</p>
                    </div>
                </div>
            </div>
            
            {/* Check-in and Check-out lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-primary p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-brand-light mb-3">รายการเช็คอินวันนี้</h4>
                    <ul className="divide-y divide-brand-secondary max-h-60 overflow-y-auto">
                        {dailyStats.checkInsForDate.length === 0 
                            ? <li className="py-2 text-sm text-brand-text">ไม่มีรายการ</li> 
                            : dailyStats.checkInsForDate.map(b => <BookingListItem key={b.id} booking={b} type="checkin" />)
                        }
                    </ul>
                </div>

                <div className="bg-brand-primary p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-brand-light mb-3">รายการเช็คเอาท์วันนี้</h4>
                    <ul className="divide-y divide-brand-secondary max-h-60 overflow-y-auto">
                        {dailyStats.checkOutsForDate.length === 0 
                            ? <li className="py-2 text-sm text-brand-text">ไม่มีรายการ</li> 
                            : dailyStats.checkOutsForDate.map(b => <BookingListItem key={b.id} booking={b} type="checkout" />)
                        }
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;