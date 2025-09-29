import React, { useState, useMemo } from 'react';
import { AdminBooking } from '../../types';
import { FormSelect } from '../AdminPanel';

const MunicipalityReport: React.FC<{ bookings: AdminBooking[] }> = ({ bookings }) => {
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
            return acc;
        }, { totalAmount: 0 });
    }, [reportData]);
    
    return (
        <div>
            <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormSelect label="เลือกเดือน" value={month.toString()} onChange={e => setMonth(parseInt(e.target.value, 10))} options={monthOptions} />
                    <FormSelect label="เลือกปี (พ.ศ.)" value={year.toString()} onChange={e => setYear(parseInt(e.target.value, 10))} options={yearOptions} />
                </div>

                <div className="text-center mb-4">
                    <h4 className="text-xl font-bold">บัญชีผู้เข้าพักสำหรับแจ้งเทศบาล</h4>
                    <p className="text-sm text-brand-text">เจ้าของ/เจ้าสำนักโรงแรม วิพัฒน์โฮเทลดีเวลลอปเม้นท์จำกัด</p>
                    <p className="text-sm text-brand-text">ประจำเดือน {monthOptions.find(m => m.value === month.toString())?.label} พ.ศ. {year + 543}</p>
                </div>
                
                <div className="">
                     <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="hidden md:table-header-group bg-brand-secondary">
                            <tr>
                                <th className="p-2 text-xs uppercase text-brand-text tracking-wider">ที่</th>
                                <th className="p-2 text-xs uppercase text-brand-text tracking-wider">ชื่อ-สกุล</th>
                                <th className="p-2 text-xs uppercase text-brand-text tracking-wider">วันเวลาที่เข้าพัก</th>
                                <th className="p-2 text-center text-xs uppercase text-brand-text tracking-wider">รวมจำนวนวัน</th>
                                <th className="p-2 text-right text-xs uppercase text-brand-text tracking-wider">ราคาห้องพัก (บาท)</th>
                                <th className="p-2 text-right text-xs uppercase text-brand-text tracking-wider">รวมค่าเช่า (บาท)</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group">
                            {reportData.map((b, index) => {
                                const duration = getDuration(b.checkIn, b.checkOut);
                                return (
                                    <tr key={b.id} className="block p-3 mb-3 bg-brand-secondary rounded-lg md:table-row md:p-0 md:mb-0 md:bg-transparent md:border-b md:border-brand-primary">
                                        <td className="flex justify-between items-center py-1 md:table-cell md:p-2"><span className="font-semibold text-brand-text md:hidden">ที่</span><span>{index + 1}</span></td>
                                        <td className="flex justify-between items-center py-1 md:table-cell md:p-2"><span className="font-semibold text-brand-text md:hidden">ชื่อ-สกุล</span><span>{b.guest?.fullName}</span></td>
                                        <td className="flex justify-between items-center py-1 md:table-cell md:p-2"><span className="font-semibold text-brand-text md:hidden">วันที่เข้าพัก</span><span>{new Date(b.checkIn).toLocaleDateString('th-TH')}</span></td>
                                        <td className="flex justify-between items-center py-1 md:table-cell md:p-2 md:text-center"><span className="font-semibold text-brand-text md:hidden">รวมวัน</span><span>{duration}</span></td>
                                        <td className="flex justify-between items-center py-1 md:table-cell md:p-2 md:text-right"><span className="font-semibold text-brand-text md:hidden">ราคาห้องพัก</span><span>{b.room?.price.toFixed(2)}</span></td>
                                        <td className="flex justify-between items-center py-1 md:table-cell md:p-2 md:text-right"><span className="font-semibold text-brand-text md:hidden">รวมค่าเช่า</span><span>{b.totalAmount.toFixed(2)}</span></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot className="hidden md:table-footer-group bg-brand-secondary font-bold">
                            <tr>
                                <td colSpan={5} className="p-2 text-right">รวมทั้งสิ้น</td>
                                <td className="p-2 text-right">{totals.totalAmount.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                     <div className="md:hidden mt-4 p-4 bg-brand-secondary rounded-lg font-bold text-sm">
                        <div className="flex justify-between py-1"><span>รวมค่าเช่าทั้งสิ้น</span><span>{totals.totalAmount.toFixed(2)}</span></div>
                    </div>
                </div>
                 <div className="mt-6 text-right">
                    <button className="bg-brand-accent text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-90">
                        Export เป็น PDF
                    </button>
                </div>
            </div>
        </div>
    )
};

export default MunicipalityReport;