

import React, { useMemo, useState } from 'react';
import { AdminBooking } from '../../types';
import { formatThaiDate, formatISODate } from '../../services/utils';
import { PrintIcon } from '../icons/PrintIcon';
import { SearchIcon } from '../icons/SearchIcon';

interface CheckOutListViewProps {
    bookings: AdminBooking[];
    onPrintInvoice: (booking: AdminBooking) => void;
}

const CheckOutListView: React.FC<CheckOutListViewProps> = ({ bookings, onPrintInvoice }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const [startDate, setStartDate] = useState(formatISODate(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(formatISODate(today));

    const pastBookings = useMemo(() => {
        return [...bookings]
            .filter(b => b.status === 'เช็คเอาท์แล้ว' || b.status === 'ยกเลิก')
            .sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());
    }, [bookings]);
    
    const filteredPastBookings = useMemo(() => {
        let filtered = pastBookings;

        // Apply date filter if both dates are set
        if (startDate && endDate) {
            filtered = filtered.filter(b => b.checkOut >= startDate && b.checkOut <= endDate);
        }

        // Apply search term filter
        if (searchTerm.trim()) {
            const lowercasedTerm = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(b =>
                b.guest?.fullName.toLowerCase().includes(lowercasedTerm) ||
                b.room?.roomNumber.toLowerCase().includes(lowercasedTerm) ||
                b.room?.roomType.toLowerCase().includes(lowercasedTerm)
            );
        }

        return filtered;
    }, [pastBookings, searchTerm, startDate, endDate]);


    return (
        <div>
             {/* Filter Section */}
            <div className="bg-primary p-4 rounded-xl shadow-lg border border-border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">เช็คเอาท์ ตั้งแต่</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">ถึง</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                    </div>
                     <div className="relative">
                         <label className="block text-sm font-medium text-text-muted mb-1">ค้นหา</label>
                        <input
                            type="text"
                            placeholder="ชื่อ, ห้อง, ประเภท..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent pl-10"
                        />
                        <div className="absolute bottom-2.5 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon />
                        </div>
                    </div>
                </div>
            </div>

            {filteredPastBookings.length === 0 ? (
                <div className="text-center p-10 bg-primary rounded-xl text-text-muted border border-border">
                    {searchTerm || (startDate && endDate) ? `ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไขการค้นหา` : "ไม่มีข้อมูลประวัติการเข้าพัก"}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPastBookings.map(b => (
                        <div key={b.id} className={`bg-primary rounded-xl shadow-md p-4 border border-border ${b.status === 'ยกเลิก' ? 'opacity-60' : ''}`}>
                             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                               <div className="grid grid-cols-[max-content,1fr] items-center gap-x-4 gap-y-1 text-sm w-full">
                                    <div className="font-semibold text-text-muted text-xs">ลูกค้า</div>
                                    <div className="text-text-main font-semibold text-base">{b.guest?.fullName}</div>

                                    <div className="font-semibold text-text-muted text-xs">ห้อง</div>
                                    <div className="text-text-main font-medium">{b.room?.roomNumber} ({b.room?.roomType})</div>

                                    <div className="font-semibold text-text-muted text-xs">วันเวลา</div>
                                    <div className="text-text-main">{formatThaiDate(b.checkIn)} - {formatThaiDate(b.checkOut)}</div>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-center">
                                    {b.status === 'ยกเลิก' ? (
                                        <span className="text-xs font-bold text-red-400 bg-red-900/50 px-3 py-1 rounded-full">ยกเลิก</span>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => onPrintInvoice(b)}
                                                className="text-accent hover:text-blue-400 p-2 rounded-lg hover:bg-secondary transition-colors"
                                                title="พิมพ์ใบแจ้งหนี้"
                                            >
                                                <PrintIcon />
                                            </button>
                                            <span className="text-xs font-bold text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">เช็คเอาท์แล้ว</span>
                                        </>
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