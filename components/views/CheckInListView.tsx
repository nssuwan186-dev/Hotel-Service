

import React, { useMemo } from 'react';
import { AdminBooking } from '../../types';
import { formatThaiDate } from '../../services/utils';
import { EditIcon } from '../icons/EditIcon';

interface CheckInListViewProps {
    bookings: AdminBooking[];
    onEdit: (booking: AdminBooking) => void;
    onCheckOut: (id: string) => void;
}

const CheckInListView: React.FC<CheckInListViewProps> = ({ bookings, onEdit, onCheckOut }) => {
    const currentStays = useMemo(() => {
        return [...bookings].filter(b => b.status === 'เข้าพัก');
    }, [bookings]);

    return (
        <div>
            {currentStays.length === 0 ? (
                <div className="text-center p-10 bg-primary rounded-xl text-text-muted border border-border">ไม่มีผู้เข้าพักในขณะนี้</div>
            ) : (
                <div className="space-y-3">
                    {currentStays.map(b => (
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
                                    onClick={() => onCheckOut(b.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
                                >
                                    เช็คเอาท์
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CheckInListView;