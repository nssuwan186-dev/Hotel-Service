import React, { useState, useMemo } from 'react';
import { AdminBooking, Expense } from '../../types';
import { formatISODate } from '../../services/utils';

const ReportsView: React.FC<{
    bookings: AdminBooking[],
    expenses: Record<string, Expense[]>,
}> = ({ bookings, expenses }) => {
    const getMonthRange = () => {
        const date = new Date();
        const firstDay = formatISODate(new Date(date.getFullYear(), date.getMonth(), 1));
        const lastDay = formatISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
        return { firstDay, lastDay };
    }

    const [startDate, setStartDate] = useState(getMonthRange().firstDay);
    const [endDate, setEndDate] = useState(getMonthRange().lastDay);

    const reportData = useMemo(() => {
        const summary = {
            totalIncome: 0,
            incomeByCash: 0,
            incomeByTransfer: 0,
            totalExpenses: 0,
            expenseByCategory: {} as Record<string, number>,
            netProfit: 0,
        };

        // Calculate Income from bookings that CHECKED OUT within the date range
        const bookingsInRange = bookings.filter(b => 
            (b.status === 'เช็คเอาท์แล้ว' || b.status === 'เข้าพัก') &&
            b.checkOut >= startDate && 
            b.checkOut <= endDate
        );

        bookingsInRange.forEach(b => {
            summary.totalIncome += b.finalAmount;
            if (b.paymentMethod === 'เงินสด') {
                summary.incomeByCash += b.finalAmount;
            } else if (b.paymentMethod === 'เงินโอน QR') {
                summary.incomeByTransfer += b.finalAmount;
            }
        });

        // Calculate Expenses within the date range
        Object.entries(expenses).forEach(([date, dailyExpenses]) => {
            if (date >= startDate && date <= endDate) {
                dailyExpenses.forEach(expense => {
                    summary.totalExpenses += expense.amount;
                    summary.expenseByCategory[expense.category] = (summary.expenseByCategory[expense.category] || 0) + expense.amount;
                });
            }
        });

        summary.netProfit = summary.totalIncome - summary.totalExpenses;

        return summary;
    }, [startDate, endDate, expenses, bookings]);
    
    const ReportRow: React.FC<{ label: string; value: string; valueClass?: string; isSubItem?: boolean, isBold?: boolean }> = ({ label, value, valueClass, isSubItem = false, isBold = false }) => (
        <div className={`flex justify-between py-1.5 ${isSubItem ? 'pl-4 text-sm' : ''} ${isBold ? 'font-bold' : ''}`}>
            <p className="text-brand-text">{label}</p>
            <p className={`font-semibold ${valueClass}`}>{value}</p>
        </div>
    );

    return (
         <div>
            <div className="flex justify-end items-center mb-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                     <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                    <span className="text-brand-text text-center">ถึง</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-brand-secondary border border-brand-primary text-brand-light px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                </div>
            </div>
            
            <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
                <h4 className="font-semibold text-xl text-brand-light mb-4 border-b border-brand-secondary pb-3">
                    สรุปผลประกอบการ
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {/* Income & Expense Section */}
                    <div>
                         <h5 className="font-semibold text-lg text-brand-light mb-2">สรุปรายรับ</h5>
                         <div className="bg-brand-secondary/50 p-4 rounded-md">
                            <ReportRow label="เงินสด" value={`฿${reportData.incomeByCash.toLocaleString('en-US', {minimumFractionDigits: 2})}`} isSubItem valueClass="text-brand-light" />
                            <ReportRow label="เงินโอน" value={`฿${reportData.incomeByTransfer.toLocaleString('en-US', {minimumFractionDigits: 2})}`} isSubItem valueClass="text-brand-light" />
                            <ReportRow label="รายรับรวม" value={`฿${reportData.totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}`} valueClass="text-green-400 text-lg" isBold/>
                         </div>
                    </div>
                    <div>
                         <h5 className="font-semibold text-lg text-brand-light mb-2">สรุปรายจ่าย</h5>
                         <div className="bg-brand-secondary/50 p-4 rounded-md">
                            {Object.keys(reportData.expenseByCategory).length === 0 ? (
                                <p className="text-brand-text text-sm py-1">ไม่มีรายจ่ายในช่วงเวลานี้</p>
                            ) : (
                                Object.entries(reportData.expenseByCategory).map(([category, amount]) => (
                                     <ReportRow key={category} label={category} value={`฿${amount.toLocaleString('en-US', {minimumFractionDigits: 2})}`} isSubItem valueClass="text-brand-light" />
                                ))
                            )}
                            <ReportRow label="รายจ่ายรวม" value={`฿${reportData.totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})}`} valueClass="text-red-400 text-lg" isBold/>
                         </div>
                    </div>

                    {/* Grand Total Section */}
                    <div className="md:col-span-2 mt-4 pt-4 border-t border-brand-secondary">
                        <div className="flex justify-between items-center bg-brand-secondary p-4 rounded-lg">
                            <h5 className="font-bold text-xl text-brand-light">กำไรสุทธิ</h5>
                            <p className={`font-bold text-2xl ${reportData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ฿{reportData.netProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;