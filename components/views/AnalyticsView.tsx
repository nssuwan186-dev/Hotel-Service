
import React, { useMemo, useState } from 'react';
import { AdminBooking, Expense, Room } from '../../types';
import { thaiMonthsShort } from '../../services/utils';

interface AnalyticsProps {
    bookings: AdminBooking[];
    expenses: Record<string, Expense[]>;
    rooms: Room[];
}

const AnalyticsCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-primary p-4 rounded-xl shadow-md border border-border ${className}`}>
        <h4 className="font-semibold text-text-muted mb-3">{title}</h4>
        {children}
    </div>
);

const KpiCard: React.FC<{ title: string; value: string; note?: string }> = ({ title, value, note }) => (
    <div className="bg-secondary p-4 rounded-lg border border-border">
        <p className="text-sm text-text-muted">{title}</p>
        <p className="font-bold text-2xl sm:text-3xl text-text-main my-1">{value}</p>
        {note && <p className="text-xs text-text-muted">{note}</p>}
    </div>
);

const SimpleLineChart: React.FC<{ data: any[]; keys: { key: string, color: string }[] }> = ({ data, keys }) => {
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-text-muted">ไม่มีข้อมูล</div>;

    const values = data.flatMap(d => keys.map(k => d[k.key]));
    const maxVal = Math.max(...values, 1); // Avoid division by zero
    
    const points = keys.map(({ key, color }) => ({
        color,
        path: data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d[key] / maxVal) * 100;
            return `${x},${y}`;
        }).join(' ')
    }));

    return (
        <div className="w-full h-64 bg-secondary rounded-lg p-4 border border-border">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                {points.map(p => (
                    <polyline key={p.color} fill="none" stroke={p.color} strokeWidth="1" points={p.path} />
                ))}
            </svg>
        </div>
    );
};

const SimpleBarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
     if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-text-muted">ไม่มีข้อมูล</div>;
    const maxValue = Math.max(...data.map(d => d.value), 0);
    return (
        <div className="w-full h-64 bg-secondary rounded-lg p-4 border border-border flex items-end justify-around gap-2">
            {data.map(({ label, value, color }) => (
                <div key={label} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <div className="text-xs text-text-main font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {value.toLocaleString()}
                    </div>
                    <div
                        className="w-full rounded-t-md"
                        style={{ height: `${(value / maxValue) * 80}%`, backgroundColor: color }}
                        title={`${label}: ${value.toLocaleString()}`}
                    ></div>
                    <div className="text-xs text-text-muted mt-1 truncate w-full text-center">{label}</div>
                </div>
            ))}
        </div>
    );
};


const AnalyticsView: React.FC<AnalyticsProps> = ({ bookings, expenses, rooms }) => {
    
    const [monthsToShow, setMonthsToShow] = useState(12);

    const analyticsData = useMemo(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - monthsToShow + 1);
        startDate.setDate(1);

        const monthlyData: Record<string, { revenue: number, expense: number, nights: number, bookingsCount: number }> = {};
        const expenseBreakdown: Record<string, number> = {};
        const revenueByRoomType: Record<string, number> = {};
        
        // Initialize months
        for (let i = 0; i < monthsToShow; i++) {
            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
            monthlyData[monthKey] = { revenue: 0, expense: 0, nights: 0, bookingsCount: 0 };
        }
        
        // Process bookings
        bookings.forEach(b => {
            if (b.status !== 'เช็คเอาท์แล้ว') return;
            const checkOutDate = new Date(b.checkOut);
            if (checkOutDate < startDate || checkOutDate > endDate) return;

            const monthKey = `${checkOutDate.getFullYear()}-${String(checkOutDate.getMonth()).padStart(2, '0')}`;
            if (monthlyData[monthKey]) {
                const netRevenue = b.totalAmount / 1.07;
                monthlyData[monthKey].revenue += netRevenue;
                monthlyData[monthKey].bookingsCount += 1;
                
                const nights = Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000) || 1;
                monthlyData[monthKey].nights += nights;

                if (b.room?.roomType) {
                    revenueByRoomType[b.room.roomType] = (revenueByRoomType[b.room.roomType] || 0) + netRevenue;
                }
            }
        });

        // Process expenses
        Object.values(expenses).flat().forEach(e => {
            const expenseDate = new Date(e.date);
            if (expenseDate < startDate || expenseDate > endDate) return;

            const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth()).padStart(2, '0')}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].expense += e.amount;
            }
            expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
        });

        const chartData = Object.entries(monthlyData).map(([monthKey, data]) => {
            const [year, month] = monthKey.split('-');
            return {
                month: `${thaiMonthsShort[parseInt(month, 10)]} ${new Date(parseInt(year), parseInt(month)).getFullYear().toString().slice(-2)}`,
                revenue: data.revenue,
                expense: data.expense,
                profit: data.revenue - data.expense
            };
        });
        
        const totals = Object.values(monthlyData).reduce((acc, data) => {
            acc.revenue += data.revenue;
            acc.expense += data.expense;
            acc.nights += data.nights;
            acc.bookingsCount += data.bookingsCount;
            return acc;
        }, { revenue: 0, expense: 0, nights: 0, bookingsCount: 0 });
        
        const totalDays = (endDate.getTime() - startDate.getTime()) / 86400000;
        const totalRooms = rooms.length > 0 ? rooms.length : 1;
        const totalAvailableRoomNights = totalRooms * totalDays;

        const kpis = {
            netProfit: totals.revenue - totals.expense,
            adr: totals.bookingsCount > 0 ? totals.revenue / totals.bookingsCount : 0,
            occupancy: totalAvailableRoomNights > 0 ? (totals.nights / totalAvailableRoomNights) * 100 : 0,
            revpar: totalAvailableRoomNights > 0 ? totals.revenue / totalAvailableRoomNights : 0,
        };
        
        const expenseColors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#34d399', '#2dd4bf', '#60a5fa', '#818cf8', '#a78bfa'];
        const expenseChartData = Object.entries(expenseBreakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([label, value], i) => ({ label, value, color: expenseColors[i % expenseColors.length] }));

        const roomTypeColors = ['#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'];
         const roomTypeChartData = Object.entries(revenueByRoomType)
            .sort(([,a], [,b]) => b - a)
            .map(([label, value], i) => ({ label, value, color: roomTypeColors[i % roomTypeColors.length] }));


        return { kpis, chartData, expenseChartData, roomTypeChartData };

    }, [bookings, expenses, rooms, monthsToShow]);

    return (
        <div className="space-y-6">
             <AnalyticsCard title={`ภาพรวม ${monthsToShow} เดือนล่าสุด`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="กำไรสุทธิ" value={`฿${analyticsData.kpis.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
                    <KpiCard title="อัตราการเข้าพัก" value={`${analyticsData.kpis.occupancy.toFixed(1)}%`} />
                    <KpiCard title="ADR" value={`฿${analyticsData.kpis.adr.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} note="รายได้เฉลี่ยต่อห้องที่ขายได้" />
                    <KpiCard title="RevPAR" value={`฿${analyticsData.kpis.revpar.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} note="รายได้เฉลี่ยต่อห้องทั้งหมด" />
                </div>
             </AnalyticsCard>

            <AnalyticsCard title="แนวโน้มรายรับ-รายจ่าย">
                 <SimpleLineChart 
                    data={analyticsData.chartData}
                    keys={[
                        { key: 'revenue', color: '#22c55e' }, // green-500
                        { key: 'expense', color: '#ef4444' }, // red-500
                        { key: 'profit', color: '#eab308' }, // yellow-500
                    ]}
                 />
                 <div className="flex justify-center items-center gap-4 mt-3 text-xs">
                     <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500"></div><span>รายรับ</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500"></div><span>รายจ่าย</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-yellow-500"></div><span>กำไร</span></div>
                 </div>
            </AnalyticsCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsCard title="สัดส่วนค่าใช้จ่าย">
                    <SimpleBarChart data={analyticsData.expenseChartData} />
                </AnalyticsCard>
                 <AnalyticsCard title="รายได้ตามประเภทห้อง">
                    <SimpleBarChart data={analyticsData.roomTypeChartData} />
                </AnalyticsCard>
            </div>
        </div>
    );
};

export default AnalyticsView;
