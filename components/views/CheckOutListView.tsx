
import React, { useMemo } from 'react';
import { AdminBooking } from '../../types';
import { formatThaiDate } from '../../services/utils';

interface CheckOutListViewProps {
    bookings: AdminBooking[];
}

const CheckOutListView: React.FC<CheckOutListViewProps> = ({ bookings }) => {
    const pastBookings = useMemo(() => {
        return [...bookings]
            .filter(b => b.status === 'เช็คเอาท์แล้ว' || b.status === 'ยกเลิก')
            .sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());
    }, [bookings]);

    return (
        <div>
            {pastBookings.length === 0 ? (
                <div className="text-center p-10 bg-brand-primary rounded-lg text-brand-text">ไม่มีข้อมูลประวัติการเข้าพัก</div>
            ) : (
                <div className="space-y-3">
                    {pastBookings.map(b => (
                        <div key={b.id} className={`bg-brand-primary rounded-lg shadow-lg p-3 ${b.status === 'ยกเลิก' ? 'opacity-60' : ''}`}>
                            <div className="flex justify-between items-center">
                                <div className="grid grid-cols-[max-content,1fr] items-center gap-x-4 gap-y-1 text-sm">
                                    <div className="font-semibold text-brand-text text-xs">ลูกค้า</div>
                                    <div className="text-brand-light font-medium">{b.guest?.fullName}</div>

                                    <div className="font-semibold text-brand-text text-xs">ห้อง</div>
                                    <div className="text-brand-light font-medium">{b.room?.roomNumber}</div>

                                    <div className="font-semibold text-brand-text text-xs">วันเวลา</div>
                                    <div className="text-brand-light">{formatThaiDate(b.checkIn)} - {formatThaiDate(b.checkOut)}</div>
                                </div>
                                <div>
                                    {b.status === 'ยกเลิก' ? (
                                        <span className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded-full">ยกเลิก</span>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">เช็คเอาท์แล้ว</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CheckOutListView;
