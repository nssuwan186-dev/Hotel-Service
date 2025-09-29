
import React, { useMemo } from 'react';
import { AdminBooking, Room } from '../../types';
import { formatISODate, formatThaiDate } from '../../services/utils';

const StatCard: React.FC<{ title: string, value: string | number }> = ({ title, value }) => (
    <div className="bg-brand-primary p-4 rounded-lg text-center shadow-lg">
        <p className="text-sm text-brand-text">{title}</p>
        <p className="text-3xl font-bold text-brand-light mt-1">{value}</p>
    </div>
);

const DailyActivityList: React.FC<{ title: string, bookings: AdminBooking[], dateKey: keyof AdminBooking, label: string }> = ({ title, bookings, dateKey, label }) => (
     <div className="bg-brand-primary p-4 rounded-lg">
        <h4 className="text-lg font-semibold text-brand-light mb-3">{title}</h4>
         <ul className="divide-y divide-brand-secondary max-h-48 overflow-y-auto">
            {bookings.length === 0 && <li className="py-2 text-sm text-brand-text">ไม่มีรายการ</li>}
            {bookings.map(b => (
                <li key={b.id} className="py-2 flex justify-between items-center text-sm">
                    <div>
                        <p className="font-medium text-brand-light">{b.guest?.fullName}</p>
                        <p className="text-brand-text">ห้อง {b.room?.roomNumber}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-brand-secondary text-brand-light">{label}</span>
                </li>
            ))}
        </ul>
    </div>
);


const DashboardView: React.FC<{ bookings: AdminBooking[], rooms: Room[] }> = ({ bookings, rooms }) => {
    const todayISO = useMemo(() => formatISODate(new Date()), []);

    const dailyData = useMemo(() => {
        const checkInsToday = bookings.filter(b => b.checkIn === todayISO);
        const checkOutsToday = bookings.filter(b => b.checkOut === todayISO);
        return { checkInsToday, checkOutsToday };
    }, [bookings, todayISO]);
    
    const occupiedCount = useMemo(() => bookings.filter(b => b.status === 'เข้าพัก').length, [bookings]);

    return (
        <div>
            <h3 className="text-2xl font-bold text-brand-light mb-4">ภาพรวมวันนี้ ({formatThaiDate(new Date())})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="การเข้าพักปัจจุบัน" value={occupiedCount} />
                <StatCard title="จำนวนห้องว่าง" value={rooms.length - occupiedCount} />
                <StatCard title="การจองล่วงหน้า" value={bookings.filter(b => b.status === 'จอง').length} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <DailyActivityList title="รายการเช็คอินวันนี้" bookings={dailyData.checkInsToday} dateKey="checkIn" label="เช็คอิน" />
                <DailyActivityList title="รายการเช็คเอาท์วันนี้" bookings={dailyData.checkOutsToday} dateKey="checkOut" label="เช็คเอาท์" />
            </div>
        </div>
    );
};

export default DashboardView;
