

import React, { useMemo } from 'react';
import { AdminBooking } from '../../types';
import { formatThaiDate } from '../../services/utils';
import { EditIcon } from '../icons/EditIcon';

interface BookingListViewProps {
    bookings: AdminBooking[];
    onEdit: (booking: AdminBooking) => void;
    onCheckIn: (id: string) => void;
}

const BookingListView: React.FC<BookingListViewProps> = ({ bookings, onEdit, onCheckIn }) => {
    const upcomingBookings = useMemo(() => {
        return [...bookings]
            .filter(b => b.status === 'จอง')
            .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
    }, [bookings]);

    return (
        <div>
            {upcomingBookings.length === 0 ? (
                <div className="text-center p-10 bg-primary rounded-xl text-text-muted border border-border">ไม่มีข้อมูลการจองล่วงหน้า</div>
            ) : (
                <div className="space-y-3">
                    {upcomingBookings.map(b => (
                        <div key={b.id} className="bg-primary rounded-xl shadow-md p-4 border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="grid grid-cols-[max-content,1fr] items-center gap-x-4 gap-y-1 text-sm w-full">
                                <div className="font-semibold text-text-muted text-xs">ลูกค้า</div>
                                <div className="text-text-main font-semibold text-base">{b.guest?.fullName}</div>

                                <div className="font-semibold text-text-muted text-xs">ห้อง</div>
                                <div className="text-text-main font-medium">{b.room?.roomNumber} ({b.room?.roomType})</div>

                                <div className="font-semibold text-text-muted text-xs">วันเวลา</div>
                                <div className="text-text-main">{formatThaiDate(b.checkIn)} - {formatThaiDate(b.checkOut)}</div>
                            </div>
                            <div className="flex items-center gap-2 ml-4 self-end sm:self-center">
                                <button onClick={() => onEdit(b)} className="text-yellow-500 hover:text-yellow-400 p-2 rounded-lg hover:bg-secondary transition-colors" title="แก้ไขการจอง">
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() => onCheckIn(b.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
                                >
                                    เช็คอิน
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookingListView;