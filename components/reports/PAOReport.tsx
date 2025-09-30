

import React, { useState, useMemo } from 'react';
import { AdminBooking } from '../../types';
import { formatISODate } from '../../services/utils';

interface PAOReportProps {
    bookings: AdminBooking[];
    onGeneratePDF: (data: any) => void;
}

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-text-muted mb-1">{label}</label>
        <input className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" {...props} />
    </div>
);

const getDefaultDateRange = (bookings: AdminBooking[]) => {
    const relevantBookings = bookings.filter(b => b.status !== 'ยกเลิก' && b.status !== 'จอง');
    if (relevantBookings.length === 0) {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return {
            firstDay: formatISODate(firstDay),
            lastDay: formatISODate(lastDay),
        };
    }

    const dates = relevantBookings.map(b => b.checkIn);
    const firstDay = dates.reduce((a, b) => a < b ? a : b, dates[0]);
    const lastDay = dates.reduce((a, b) => a > b ? a : b, dates[0]);
    
    return { firstDay, lastDay };
};

const formatThaiDateFullYear = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    // Adjust for timezone to display correct date
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const PAOReport: React.FC<PAOReportProps> = ({ bookings, onGeneratePDF }) => {
    const initialDateRange = useMemo(() => getDefaultDateRange(bookings), [bookings]);
    const [startDate, setStartDate] = useState(initialDateRange.firstDay);
    const [endDate, setEndDate] = useState(initialDateRange.lastDay);

    const getDuration = (checkIn: string, checkOut: string) => {
        const duration = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
        return duration > 0 ? duration : 1;
    }

    const reportData = useMemo(() => {
        if (!startDate || !endDate) return [];
        return bookings
            .filter(b => {
                const checkInDate = b.checkIn; // YYYY-MM-DD string
                return checkInDate >= startDate && checkInDate <= endDate && b.status !== 'ยกเลิก' && b.status !== 'จอง';
            })
            .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
            .map(b => ({
                ...b,
                duration: getDuration(b.checkIn, b.checkOut)
            }));
    }, [bookings, startDate, endDate]);


    const totals = useMemo(() => {
        return reportData.reduce((acc, b) => {
            acc.totalAmount += b.totalAmount;
            acc.feeAmount += b.feeAmount;
            return acc;
        }, { totalAmount: 0, feeAmount: 0 });
    }, [reportData]);
    
    const handleExport = () => {
        const periodTitle = `ประจำวันที่ ${formatThaiDateFullYear(startDate)} ถึง ${formatThaiDateFullYear(endDate)}`;
        onGeneratePDF({
            periodTitle,
            reportData,
            totals
        });
    }

    return (
        <div>
            <div className="bg-primary p-6 rounded-lg shadow-lg border border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormInput label="ตั้งแต่วันที่" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <FormInput label="ถึงวันที่" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>

                <div className="text-center mb-4">
                    <h4 className="text-xl font-bold">บัญชีผู้เข้าพักและรายละเอียดในการเรียกเก็บค่าธรรมเนียมบำรุงองค์การบริหารส่วนจังหวัด</h4>
                    <p className="text-sm text-text-muted">เจ้าของ/เจ้าสำนักโรงแรม วิพัฒน์โฮเทลดีเวลลอปเม้นท์จำกัด</p>
                    <p className="text-sm text-text-muted">ประจำวันที่ {formatThaiDateFullYear(startDate)} ถึง {formatThaiDateFullYear(endDate)}</p>
                </div>
                
                <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-secondary">
                            <tr>
                                <th className="p-2 text-xs uppercase text-text-muted tracking-wider">ที่</th>
                                <th className="p-2 text-xs uppercase text-text-muted tracking-wider">ชื่อ-สกุล</th>
                                <th className="p-2 text-xs uppercase text-text-muted tracking-wider">วันเวลาที่เข้าพัก</th>
                                <th className="p-2 text-center text-xs uppercase text-text-muted tracking-wider">รวมจำนวนวัน</th>
                                <th className="p-2 text-right text-xs uppercase text-text-muted tracking-wider">ราคาห้องพัก (บาท)</th>
                                <th className="p-2 text-right text-xs uppercase text-text-muted tracking-wider">รวมค่าเช่า (บาท)</th>
                                <th className="p-2 text-right text-xs uppercase text-text-muted tracking-wider">ค่าธรรมเนียม (บาท)</th>
                            </tr>
                        </thead>
                        <tbody>
                             {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-text-muted">
                                        ไม่มีข้อมูลในช่วงวันที่ที่เลือก
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((b, index) => {
                                    return (
                                        <tr key={b.id} className="border-b border-border">
                                            <td className="p-2">{index + 1}</td>
                                            <td className="p-2">{b.guest?.fullName}</td>
                                            <td className="p-2">{new Date(b.checkIn).toLocaleDateString('th-TH')}</td>
                                            <td className="p-2 text-center">{b.duration}</td>
                                            <td className="p-2 text-right">{b.room?.price.toFixed(2)}</td>
                                            <td className="p-2 text-right">{b.totalAmount.toFixed(2)}</td>
                                            <td className="p-2 text-right">{b.feeAmount.toFixed(2)}</td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                        <tfoot className="bg-secondary font-bold">
                            <tr>
                                <td colSpan={5} className="p-2 text-right">รวมทั้งสิ้น</td>
                                <td className="p-2 text-right">{totals.totalAmount.toFixed(2)}</td>
                                <td className="p-2 text-right">{totals.feeAmount.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 <div className="mt-6 text-right">
                    <button onClick={handleExport} className="bg-accent text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-90">
                        Export เป็น PDF
                    </button>
                </div>
            </div>
        </div>
    )
};

export default PAOReport;
