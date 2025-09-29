
import React, { useState, useMemo } from 'react';
import { AdminBooking, Room } from '../../types';
import { formatISODate } from '../../services/utils';

const RoomsView: React.FC<{ rooms: Room[], bookings: AdminBooking[] }> = ({ rooms, bookings }) => {
    const [weekOffset, setWeekOffset] = useState(0);

    const { weekDates, weekLabel } = useMemo(() => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (weekOffset * 7));
        const dates = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            return date;
        });
        const firstDay = dates[0];
        const lastDay = dates[6];
        const label = `${firstDay.getDate()} ${firstDay.toLocaleString('th-TH', { month: 'short' })} - ${lastDay.getDate()} ${lastDay.toLocaleString('th-TH', { month: 'short' })} ${lastDay.getFullYear() + 543}`;
        return { weekDates: dates, weekLabel: label };
    }, [weekOffset]);

    const bookingsByRoomId = useMemo(() => {
        return bookings.reduce((acc, booking) => {
            if (!acc[booking.roomId]) {
                acc[booking.roomId] = [];
            }
            acc[booking.roomId].push(booking);
            return acc;
        }, {} as Record<string, AdminBooking[]>);
    }, [bookings]);

    const getBookingForCell = (roomId: string, date: Date) => {
        const roomBookings = bookingsByRoomId[roomId] || [];
        const isoDate = formatISODate(date);
        return roomBookings.find(b => {
             const checkIn = new Date(b.checkIn);
             const checkOut = new Date(b.checkOut);
             checkIn.setHours(0,0,0,0);
             checkOut.setHours(0,0,0,0);
             const targetDate = new Date(isoDate);
             targetDate.setHours(0,0,0,0);
             return targetDate >= checkIn && targetDate < checkOut;
        });
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-brand-light">ปฏิทินห้องพัก</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setWeekOffset(weekOffset - 1)} className="px-4 py-2 bg-brand-primary rounded-md hover:bg-opacity-80">{"<"}</button>
                    <span className="w-48 text-center font-semibold">{weekLabel}</span>
                    <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-4 py-2 bg-brand-primary rounded-md hover:bg-opacity-80">{">"}</button>
                </div>
            </div>
            <div className="bg-brand-primary rounded-lg overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-brand-secondary">
                            <th className="sticky left-0 bg-brand-primary p-3 text-left w-28">ห้อง</th>
                            {weekDates.map(date => (
                                <th key={date.toISOString()} className="p-3 font-semibold text-center min-w-[100px]">
                                    <div>{date.toLocaleString('th-TH', { weekday: 'short' })}</div>
                                    <div className="text-2xl">{date.getDate()}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map(room => (
                            <tr key={room.id} className="border-b border-brand-secondary last:border-0">
                                <td className="sticky left-0 bg-brand-primary p-3 font-bold">{room.roomNumber}</td>
                                {weekDates.map((date, dateIndex) => {
                                    const booking = getBookingForCell(room.id, date);
                                    if (booking && formatISODate(new Date(booking.checkIn)) === formatISODate(date)) {
                                        const duration = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000);
                                        const colSpan = Math.min(duration, 7 - dateIndex);
                                        const cellsToRender = Array.from({ length: 7 - dateIndex });

                                        if (cellsToRender.length < duration) {
                                            // Booking spans across weeks, render only till end of current week
                                        }

                                        return (
                                            <td key={date.toISOString()} colSpan={colSpan > 0 ? colSpan : 1} className="p-1">
                                                <div className={`rounded-md p-2 h-16 text-white text-xs overflow-hidden ${booking.status === 'เข้าพัก' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                                    <p className="font-bold truncate">{booking.guest?.fullName}</p>
                                                    <p className="truncate">{booking.status}</p>
                                                </div>
                                            </td>
                                        );
                                    }
                                    if(booking) return null; // This cell is covered by a colSpan
                                    return <td key={date.toISOString()} className="h-16 border-l border-brand-secondary"></td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoomsView;
