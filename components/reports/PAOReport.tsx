
import React, { useState, useMemo } from 'react';
import { AdminBooking } from '../../types';
import { FormSelect } from '../AdminPanel';

const PAOReport: React.FC<{ bookings: AdminBooking[] }> = ({ bookings }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);

    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: (currentYear - i).toString(), label: (currentYear - i + 543).toString() }));
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i.toString(), label: new Date(0, i).toLocaleString('th-TH', { month: 'long' }) }));

    const reportData = useMemo(() => {
        return bookings
            .filter(b => {
                const checkInDate = new Date(b.checkIn);
                return checkInDate.getFullYear() === year && checkInDate.getMonth() === month && b.status !== 'ยกเลิก' && b.status !== 'จอง';
            })
            .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
    }, [bookings, year, month]);

    const getDuration = (checkIn: string, checkOut: string) => {
        const duration = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
        return duration > 0 ? duration : 1;
    }

    const totals = useMemo(() => {
        return reportData.reduce((acc, b) => {
            acc.totalAmount += b.totalAmount;
            acc.feeAmount += b.feeAmount;
            return acc;
        }, { totalAmount: 0, feeAmount: 0 });
    }, [reportData]);
    
    return (
        <div>
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-brand-secondary rounded-md">
                <FormSelect label="เลือกเดือน" value={month.toString()} onChange={e => setMonth(parseInt(e.target.value, 10))} options={monthOptions} />
                <FormSelect label="เลือกปี (พ.ศ.)" value={year.toString()} onChange={e => setYear(parseInt(e.target.value, 10))} options={yearOptions} />
            </div>

            <div className="text-center mb-4">
                <h4 className="text-lg font-bold">บัญชีผู้เข้าพักและรายละเอียดในการเรียกเก็บค่าธรรมเนียมบำรุงองค์การบริหารส่วนจังหวัด</h4>
                <p>เจ้าของ/เจ้าสำนักโรงแรม วิพัฒน์โฮเทลดีเวลลอปเม้นท์จำกัด</p>
                <p>ประจำเดือน {monthOptions.find(m => m.value === month.toString())?.label} พ.ศ. {year + 543}</p>
            </div>
            
            <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-brand-secondary">
                        <tr>
                            <th className="p-2">ที่</th>
                            <th className="p-2">ชื่อ-สกุล</th>
                            <th className="p-2">วันเวลาที่เข้าพัก</th>
                            <th className="p-2 text-center">รวมจำนวนวัน</th>
                            <th className="p-2 text-right">ราคาห้องพัก (บาท)</th>
                            <th className="p-2 text-right">รวมค่าเช่า (บาท)</th>
                            <th className="p-2 text-right">ค่าธรรมเนียม (บาท)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-secondary">
                        {reportData.map((b, index) => {
                            const duration = getDuration(b.checkIn, b.checkOut);
                            return (
                                <tr key={b.id}>
                                    <td className="p-2">{index + 1}</td>
                                    <td className="p-2">{b.guest?.fullName}</td>
                                    <td className="p-2">{new Date(b.checkIn).toLocaleDateString('th-TH')}</td>
                                    <td className="p-2 text-center">{duration}</td>
                                    <td className="p-2 text-right">{b.room?.price.toFixed(2)}</td>
                                    <td className="p-2 text-right">{b.totalAmount.toFixed(2)}</td>
                                    <td className="p-2 text-right">{b.feeAmount.toFixed(2)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot className="bg-brand-secondary font-bold">
                        <tr>
                            <td colSpan={5} className="p-2 text-right">รวมทั้งสิ้น</td>
                            <td className="p-2 text-right">{totals.totalAmount.toFixed(2)}</td>
                            <td className="p-2 text-right">{totals.feeAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
             <div className="mt-6 text-right">
                <button className="bg-brand-accent text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-90">
                    Export เป็น PDF
                </button>
            </div>
        </div>
    )
};

export default PAOReport;
