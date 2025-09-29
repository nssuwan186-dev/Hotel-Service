
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
                <div className="text-center p-10 bg-brand-primary rounded-lg text-brand-text">ไม่มีผู้เข้าพักในขณะนี้</div>
            ) : (
                <div className="space-y-3">
                    {currentStays.map(b => (
                        <div key={b.id} className="bg-brand-primary rounded-lg shadow-lg p-3 flex justify-between items-center">
                            <div className="grid grid-cols-[max-content,1fr] items-center gap-x-4 gap-y-1 text-sm">
                                <div className="font-semibold text-brand-text text-xs">ลูกค้า</div>
                                <div className="text-brand-light font-medium">{b.guest?.fullName}</div>

                                <div className="font-semibold text-brand-text text-xs">ห้อง</div>
                                <div className="text-brand-light font-medium">{b.room?.roomNumber}</div>

                                <div className="font-semibold text-brand-text text-xs">วันเวลา</div>
                                <div className="text-brand-light">{formatThaiDate(b.checkIn)} - {formatThaiDate(b.checkOut)}</div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button onClick={() => onEdit(b)} className="text-yellow-400 hover:text-yellow-300 p-2 rounded-md hover:bg-brand-secondary transition-colors" title="แก้ไขการจอง">
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() => onCheckOut(b.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm whitespace-nowrap"
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
