

import React, { useMemo } from 'react';
import { AdminBooking, Room, Expense } from '../../types';
import { formatThaiDate } from '../../services/utils';

// Helper for key-value pairs in the report block
const ReportRow: React.FC<{ label: string; value: string | number; valueClass?: string; isSubItem?: boolean }> = ({ label, value, valueClass = 'text-brand-light', isSubItem = false }) => (
    <div className={`flex justify-between py-1 ${isSubItem ? 'pl-4' : ''}`}>
        <p className="text-brand-text">{label}</p>
        <p className={`font-semibold ${valueClass}`}>{value}</p>
    </div>
);


const BookingsView: React.FC<{ 
    bookings: AdminBooking[]; 
    rooms: Room[]; 
    expenses: Record<string, Expense[]>;
    selectedDate: string;
    onDateChange: (date: string) => void;
    onAddBooking: () => void;
    onAddExpense: () => void;
}> = ({ bookings, rooms, expenses, selectedDate, onDateChange, onAddBooking, onAddExpense }) => {

    const dailyData = useMemo(() => {
        // Revenue is recognized from checkouts on the selected day
        const checkOutsForDate = bookings.filter(b => 
            b.checkOut === selectedDate && b.status === 'เช็คเอาท์แล้ว'
        );
        
        const revenueCash = checkOutsForDate
            .filter(b => b.paymentMethod === 'เงินสด')
            .reduce((sum, b) => sum + b.finalAmount, 0);

        const revenueTransfer = checkOutsForDate
            .filter(b => b.paymentMethod === 'เงินโอน QR')
            .reduce((sum, b) => sum + b.finalAmount, 0);

        const activeStays = bookings.filter(b => {
            if (b.status === 'จอง' || b.status === 'ยกเลิก') return false;
            // A stay is active if the selected date is between check-in (inclusive) and check-out (exclusive)
            const checkIn = new Date(b.checkIn);
            checkIn.setHours(0,0,0,0);
            const checkOut = new Date(b.checkOut);
            checkOut.setHours(0,0,0,0);
            const selected = new Date(selectedDate);
            selected.setHours(0,0,0,0);
            return checkIn <= selected && checkOut > selected;
        });

        const dailyExpensesTotal = (expenses[selectedDate] || []).reduce((sum, e) => sum + e.amount, 0);

        return {
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
            {/* Control Bar with Date Picker and Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent w-full sm:w-auto"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={onAddBooking} className="flex-1 sm:flex-none bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">
                        + เพิ่มการจอง
                    </button>
                    <button onClick={onAddExpense} className="flex-1 sm:flex-none bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        + เพิ่มค่าใช้จ่าย
                    </button>
                </div>
            </div>

            {/* Daily Report Block */}
            <div className="bg-brand-primary p-4 rounded-lg shadow-lg mb-6">
                <h4 className="text-lg font-semibold text-brand-light mb-2 border-b border-brand-secondary pb-2">รายงานประจำวัน</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm mt-3">
                    {/* Income Section */}
                    <div>
                        <p className="font-bold mb-1 text-brand-light">รายรับประจำวัน</p>
                        <ReportRow label="จำนวนเช็คเอาท์" value={`${dailyData.checkOutsForDate.length} รายการ`} isSubItem />
                        <ReportRow label="ยอดเงินสด" value={`฿${dailyData.revenueCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} isSubItem />
                        <ReportRow label="ยอดเงินโอน" value={`฿${dailyData.revenueTransfer.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} isSubItem />
                        <ReportRow label="ยอดรวม" value={`฿${dailyData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-green-400 font-bold" />
                    </div>

                    {/* Room Count Section */}
                    <div>
                        <p className="font-bold mb-1 text-brand-light">จำนวนห้องพัก</p>
                        <ReportRow label="ตึก A" value={`${dailyData.roomCountA} ห้อง`} isSubItem />
                        <ReportRow label="ตึก B" value={`${dailyData.roomCountB} ห้อง`} isSubItem />
                        <ReportRow label="ตึกดาวน์ N" value={`${dailyData.roomCountN} ห้อง`} isSubItem />
                    </div>

                    {/* Expenses Section */}
                    <div className="border-t border-brand-secondary pt-3">
                        <ReportRow label="หักค่าจ่ายประจำวัน" value={`- ฿${dailyData.dailyExpensesTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`} valueClass="text-red-400 font-bold" />
                    </div>

                    {/* Occupied Rooms Section */}
                     <div className="border-t border-brand-secondary pt-3">
                        <p className="text-brand-text">หมายเลขห้องที่มีการเข้าพัก</p>
                        <p className="font-semibold text-brand-light truncate">{dailyData.occupiedRooms}</p>
                    </div>
                </div>
            </div>
            
            {/* The detailed lists have been removed to avoid functional overlap */}
        </div>
    );
};

export default BookingsView;