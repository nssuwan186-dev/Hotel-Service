import React, { useMemo, useState } from 'react';
import { AdminBooking } from '../../types';
import { formatThaiDate, formatISODate } from '../../services/utils';
import { generateInvoicePDF } from '../../services/pdfService';
import { PrintIcon } from '../icons/PrintIcon';

type BookingFilter = 'upcoming' | 'current' | 'past';

const BookingsView: React.FC<{ bookings: AdminBooking[], onCancel: (id: string) => void, onAddClick: () => void }> = ({ bookings, onCancel, onAddClick }) => {
    const [filter, setFilter] = useState<BookingFilter>('upcoming');

    const handlePrintReceipt = (booking: AdminBooking) => {
        generateInvoicePDF(booking);
    };

    const filteredBookings = useMemo(() => {
        switch (filter) {
            case 'upcoming':
                return [...bookings].filter(b => b.status === 'จอง').sort((a,b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
            case 'current':
                return [...bookings].filter(b => b.status === 'เข้าพัก');
            case 'past':
                return [...bookings].filter(b => b.status === 'เช็คเอาท์แล้ว' || b.status === 'ยกเลิก').sort((a,b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());
            default:
                return [];
        }
    }, [bookings, filter]);
    
    const filterOptions: { key: BookingFilter, label: string }[] = [
        { key: 'upcoming', label: 'การจองล่วงหน้า' },
        { key: 'current', label: 'กำลังเข้าพัก' },
        { key: 'past', label: 'ประวัติการเข้าพัก' },
    ];

    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-brand-light">การจอง</h3>
                <button onClick={onAddClick} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มการจอง</button>
            </div>
             <div className="mb-4 flex gap-2 border-b border-brand-primary">
                {filterOptions.map(opt => (
                    <button key={opt.key} onClick={() => setFilter(opt.key)} className={`py-2 px-4 font-semibold transition-colors ${filter === opt.key ? 'border-b-2 border-brand-accent text-brand-light' : 'text-brand-text hover:text-white'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>
            <div className="bg-brand-primary rounded-lg overflow-x-auto shadow-lg">
                 <table className="w-full text-left">
                    <thead className="border-b border-brand-secondary">
                        <tr>
                            <th className="p-4 font-semibold">ลูกค้า</th>
                            <th className="p-4 font-semibold">ห้อง</th>
                            <th className="p-4 font-semibold">วันเวลา</th>
                            <th className="p-4 font-semibold">สถานะ</th>
                            <th className="p-4 font-semibold">ใบเสร็จ</th>
                            <th className="p-4 font-semibold text-right">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.length === 0 && (
                            <tr><td colSpan={6} className="p-4 text-center text-brand-text">ไม่มีข้อมูล</td></tr>
                        )}
                        {filteredBookings.map(b => (
                             <tr key={b.id} className="border-b border-brand-secondary last:border-b-0">
                                <td className="p-4">{b.guest?.fullName}</td>
                                <td className="p-4">{b.room?.roomNumber}</td>
                                <td className="p-4">{formatThaiDate(b.checkIn)} - {formatThaiDate(b.checkOut)}</td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        b.status === 'ยกเลิก' ? 'bg-red-900/70 text-red-300' : 'bg-brand-secondary text-brand-text'
                                    }`}>
                                        {b.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {(filter === 'current' || filter === 'past') && b.status !== 'ยกเลิก' && b.status !== 'จอง' && (
                                         <button onClick={() => handlePrintReceipt(b)} className="flex items-center gap-2 text-sm bg-brand-secondary hover:bg-opacity-80 text-brand-light font-bold py-1 px-3 rounded-md transition-colors">
                                            <PrintIcon />
                                            พิมพ์
                                         </button>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {b.status === 'จอง' && <button onClick={() => onCancel(b.id)} className="text-yellow-500 hover:text-yellow-400 font-semibold">ยกเลิก</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingsView;