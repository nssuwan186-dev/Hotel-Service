import React, { useState, useMemo } from 'react';
import { AdminBooking, Room } from '../../types';
import { formatISODate } from '../../services/utils';

// Helper to get all days for a calendar month grid
const getCalendarDays = (year: number, month: number) => {
    const days = [];
    const firstDayOfMonth = new Date(year, month, 1);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay()); // Start from Sunday

    // 6 weeks * 7 days = 42 cells
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        days.push({
            date: date,
            isCurrentMonth: date.getMonth() === month,
        });
    }
    return days;
};


const RoomsView: React.FC<{ rooms: Room[], bookings: AdminBooking[] }> = ({ rooms, bookings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const calendarDays = useMemo(() => {
        return getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
    }, [currentDate]);

    const bookingsByDate = useMemo(() => {
        const bookingMap = new Map<string, AdminBooking[]>();
        for (const booking of bookings) {
            if (booking.status === 'ยกเลิก') continue;
            
            let dateIterator = new Date(booking.checkIn);
            const endDate = new Date(booking.checkOut);

            while (dateIterator < endDate) {
                const isoDate = formatISODate(dateIterator);
                const existing = bookingMap.get(isoDate) || [];
                bookingMap.set(isoDate, [...existing, booking]);
                dateIterator.setDate(dateIterator.getDate() + 1);
            }
        }
        return bookingMap;
    }, [bookings]);

    const weekDayLabels = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={goToPreviousMonth} className="px-3 py-1 sm:px-4 sm:py-2 bg-brand-primary rounded-md hover:bg-opacity-80">{"<"}</button>
                    <span className="w-40 sm:w-48 text-center text-sm sm:text-base font-semibold">
                        {currentDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={goToNextMonth} className="px-3 py-1 sm:px-4 sm:py-2 bg-brand-primary rounded-md hover:bg-opacity-80">{">"}</button>
                </div>
            </div>

            <div className="bg-brand-primary rounded-lg grid grid-cols-7 border-t border-l border-brand-secondary">
                {/* Weekday Headers */}
                {weekDayLabels.map(label => (
                    <div key={label} className="p-2 text-center font-semibold text-brand-text border-r border-b border-brand-secondary bg-brand-secondary/30 text-xs sm:text-sm">
                        {label}
                    </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map(({ date, isCurrentMonth }) => {
                    const isoDate = formatISODate(date);
                    const dayBookings = bookingsByDate.get(isoDate) || [];
                    const isToday = formatISODate(new Date()) === isoDate;

                    return (
                        <div 
                            key={isoDate} 
                            className="relative p-1 min-h-[120px] border-r border-b border-brand-secondary"
                        >
                            <span className={`
                                flex items-center justify-center w-6 h-6 text-sm font-semibold
                                ${isToday ? 'bg-brand-accent text-white rounded-full' : ''}
                                ${isCurrentMonth ? 'text-brand-light' : 'text-brand-text/30'}
                            `}>
                                {date.getDate()}
                            </span>
                            <div className="absolute top-8 left-1 right-1 space-y-1">
                                {dayBookings.slice(0, 3).map(booking => (
                                    <div 
                                        key={booking.id}
                                        className={`
                                            rounded p-1 text-white text-xs overflow-hidden
                                            ${booking.status === 'เข้าพัก' ? 'bg-red-600' : 'bg-blue-600'}
                                        `}
                                        title={`${booking.room?.roomNumber}: ${booking.guest?.fullName}`}
                                    >
                                        <p className="font-bold truncate">{booking.room?.roomNumber}: {booking.guest?.fullName}</p>
                                    </div>
                                ))}
                                {dayBookings.length > 3 && (
                                    <p className="text-xs text-center text-brand-text mt-1">
                                        + {dayBookings.length - 3} รายการ
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RoomsView;