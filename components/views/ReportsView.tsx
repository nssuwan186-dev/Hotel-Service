
import React, { useState, useMemo } from 'react';
import { AdminBooking, Expense } from '../../types';
import { formatISODate } from '../../services/utils';

const ReportsView: React.FC<{
    bookings: AdminBooking[],
    expenses: Record<string, Expense[]>,
    onAddExpenseClick: (date: string) => void,
    onPaoReportClick: () => void,
    onMunicipalityReportClick: () => void
}> = ({ bookings, expenses, onAddExpenseClick, onPaoReportClick, onMunicipalityReportClick }) => {
    const [selectedDate, setSelectedDate] = useState(() => formatISODate(new Date()));

    const reportData = useMemo(() => {
        const checkIns = bookings.filter(b => b.checkIn === selectedDate);
        const checkOuts = bookings.filter(b => b.checkOut === selectedDate);
        const dailyExpenses = expenses[selectedDate] || [];
        const expenseTotal = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);
        return { checkIns, checkOuts, dailyExpenses, expenseTotal };
    }, [selectedDate, expenses, bookings]);

    return (
         <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-3xl font-bold text-brand-light">รายงาน</h3>
                <div className="flex items-center gap-2 flex-wrap">
                     <button onClick={onPaoReportClick} className="border border-brand-accent text-brand-accent font-bold py-2 px-4 rounded-md hover:bg-brand-accent/10">
                        สร้างรายงาน อบจ.
                    </button>
                    <button onClick={onMunicipalityReportClick} className="border border-green-500 text-green-500 font-bold py-2 px-4 rounded-md hover:bg-green-500/10">
                        สร้างรายงานเทศบาล
                    </button>
                </div>
            </div>
            
            <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h4 className="font-semibold text-xl text-brand-light">รายงานประจำวัน</h4>
                     <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <button onClick={() => onAddExpenseClick(selectedDate)} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มรายจ่าย</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    <div>
                        <h5 className="font-semibold text-brand-light mb-2">เช็คอิน ({reportData.checkIns.length})</h5>
                        <ul className="text-sm max-h-48 overflow-y-auto text-brand-text bg-brand-secondary/50 p-2 rounded-md">
                            {reportData.checkIns.length === 0 ? <li className="py-1">ไม่มี</li> : reportData.checkIns.map(s => <li key={s.id} className="py-1">{s.guest?.fullName} ในห้อง {s.room?.roomNumber}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h5 className="font-semibold text-brand-light mb-2">เช็คเอาท์ ({reportData.checkOuts.length})</h5>
                        <ul className="text-sm max-h-48 overflow-y-auto text-brand-text bg-brand-secondary/50 p-2 rounded-md">
                            {reportData.checkOuts.length === 0 ? <li className="py-1">ไม่มี</li> : reportData.checkOuts.map(s => <li key={s.id} className="py-1">{s.guest?.fullName} จากห้อง {s.room?.roomNumber}</li>)}
                        </ul>
                    </div>
                     <div className="lg:col-span-2">
                        <div className="flex justify-between items-center">
                            <h5 className="font-semibold text-brand-light">รายจ่าย ({reportData.dailyExpenses.length})</h5>
                            <p className="font-bold text-lg text-brand-light">฿{reportData.expenseTotal.toFixed(2)}</p>
                        </div>
                         <ul className="text-sm max-h-48 overflow-y-auto mt-2 divide-y divide-brand-secondary text-brand-text bg-brand-secondary/50 p-2 rounded-md">
                            {reportData.dailyExpenses.length === 0 && <li className="pt-2">ไม่มีรายจ่ายสำหรับวันนี้</li>}
                            {reportData.dailyExpenses.map(e => <li key={e.id} className="py-2 flex justify-between"><span>{e.category}{e.note && `: ${e.note}`}</span><span className="text-brand-light">฿{e.amount.toFixed(2)}</span></li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
