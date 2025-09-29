import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PayrollCalculationRow } from '../../types';
import * as adminService from '../../services/adminService';
import { FormSelect } from '../AdminPanel';
import Spinner from '../common/Spinner';
import { PrintIcon } from '../icons/PrintIcon';
import { thaiMonthsFull } from '../../services/utils';
import { generatePayrollPDF } from '../../services/payrollPdfService';

const PayrollInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        type="number"
        className="w-full bg-brand-secondary text-brand-light p-1.5 rounded-md text-right border border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
        {...props}
    />
);

const PayrollTable: React.FC<{
    title: string;
    data: PayrollCalculationRow[];
    onDataChange: (index: number, field: keyof PayrollCalculationRow, value: any) => void;
    onPrint: () => void;
}> = ({ title, data, onDataChange, onPrint }) => {

    const calculateRow = (row: PayrollCalculationRow) => {
        const base = Number(row.baseRate) || 0;
        const otherIncome = Number(row.otherIncome || 0);
        let totalIncome = 0;

        if (row.employmentType === 'monthly') {
            // In the provided PDF, monthly salary seems to be per period, not / 2
            totalIncome = base + otherIncome;
        } else {
            const workDays = Number(row.workDays || 0);
            totalIncome = (base * workDays) + otherIncome;
        }

        const deductionSocial = Number(row.deductionSocialSecurity || 0);
        const deductionAbsence = Number(row.deductionAbsence || 0);
        const deductionOther = Number(row.deductionOther || 0);
        const totalDeductions = deductionSocial + deductionAbsence + deductionOther;
        const netPay = totalIncome - totalDeductions;
        
        return { totalIncome, netPay };
    };

    const totals = useMemo(() => {
        return data.reduce((acc, row) => {
            const { totalIncome, netPay } = calculateRow(row);
            acc.totalIncome += totalIncome;
            acc.netPay += netPay;
            return acc;
        }, { totalIncome: 0, netPay: 0 });
    }, [data]);

    return (
        <div className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-lg mb-8">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-xl text-brand-light">{title}</h4>
                <button onClick={onPrint} className="flex items-center gap-2 text-sm bg-brand-accent hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    <PrintIcon /> พิมพ์สรุปค่าจ้าง
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="border-b border-brand-secondary">
                        <tr>
                            <th className="p-2 w-8">#</th>
                            <th className="p-2 min-w-[150px]">พนักงาน</th>
                            <th className="p-2 min-w-[100px] text-right">เงินเดือน/ค่าจ้าง</th>
                            <th className="p-2 min-w-[100px] text-center">รายได้อื่น</th>
                            <th className="p-2 min-w-[100px] text-center">วันทำงาน</th>
                            <th className="p-2 min-w-[120px] text-right font-bold">รวมเงิน</th>
                            <th className="p-2 min-w-[100px] text-center">หัก ปกส.</th>
                            <th className="p-2 min-w-[100px] text-center">หัก ขาด/ลา</th>
                            <th className="p-2 min-w-[100px] text-center">หัก อื่นๆ</th>
                            <th className="p-2 min-w-[120px] text-right font-bold">ยอดจ่ายจริง</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => {
                            const { totalIncome, netPay } = calculateRow(row);
                            return (
                                <tr key={row.employeeId} className="border-b border-brand-secondary last:border-b-0 hover:bg-brand-secondary/30">
                                    <td className="p-2 text-center text-brand-text">{index + 1}</td>
                                    <td className="p-2">
                                        <div className="font-medium">{row.name}</div>
                                        <div className="text-xs text-brand-text">{row.position}</div>
                                    </td>
                                    <td className="p-2 text-right">{row.baseRate.toLocaleString()} <span className="text-xs text-brand-text">/ {row.employmentType === 'monthly' ? 'เดือน' : 'วัน'}</span></td>
                                    <td className="p-2"><PayrollInput value={row.otherIncome ?? ''} onChange={e => onDataChange(index, 'otherIncome', e.target.value)} /></td>
                                    <td className="p-2"><PayrollInput value={row.workDays ?? ''} onChange={e => onDataChange(index, 'workDays', e.target.value)} disabled={row.employmentType === 'monthly'} /></td>
                                    <td className="p-2 text-right font-semibold text-green-400">{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="p-2"><PayrollInput value={row.deductionSocialSecurity ?? ''} onChange={e => onDataChange(index, 'deductionSocialSecurity', e.target.value)} /></td>
                                    <td className="p-2"><PayrollInput value={row.deductionAbsence ?? ''} onChange={e => onDataChange(index, 'deductionAbsence', e.target.value)} /></td>
                                    <td className="p-2"><PayrollInput value={row.deductionOther ?? ''} onChange={e => onDataChange(index, 'deductionOther', e.target.value)} /></td>
                                    <td className="p-2 text-right font-bold text-lg text-yellow-400">{netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-brand-secondary font-bold">
                            <td colSpan={5} className="p-3 text-right">ยอดรวม</td>
                            <td className="p-3 text-right text-green-400">{totals.totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td colSpan={3}></td>
                            <td className="p-3 text-right text-yellow-400 text-lg">{totals.netPay.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

const MonthlySummaryTable: React.FC<{
    summaryData: {
        employeeId: string;
        name: string;
        position: string;
        accountInfo: { bank: string; accountNumber: string };
        netPayPeriod1: number;
        netPayPeriod2: number;
        totalNetPay: number;
    }[];
    monthName: string;
}> = ({ summaryData, monthName }) => {
    
    const grandTotal = useMemo(() => {
        return summaryData.reduce((sum, row) => sum + row.totalNetPay, 0);
    }, [summaryData]);

    return (
         <div className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-lg mt-8">
            <h4 className="font-semibold text-xl text-brand-light mb-4">สรุปยอดจ่ายเงินเดือน ({monthName})</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="border-b border-brand-secondary">
                        <tr>
                            <th className="p-2 w-8">#</th>
                            <th className="p-2 min-w-[150px]">พนักงาน</th>
                            <th className="p-2 min-w-[200px]">เลขที่บัญชี</th>
                            <th className="p-2 min-w-[120px] text-right">ยอดจ่ายจริง (รอบ 1)</th>
                            <th className="p-2 min-w-[120px] text-right">ยอดจ่ายจริง (รอบ 2)</th>
                            <th className="p-2 min-w-[150px] text-right font-bold">รวมยอดจ่ายทั้งเดือน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.map((row, index) => (
                            <tr key={row.employeeId} className="border-b border-brand-secondary last:border-b-0 hover:bg-brand-secondary/30">
                                <td className="p-2 text-center text-brand-text">{index + 1}</td>
                                <td className="p-2">
                                    <div className="font-medium">{row.name}</div>
                                    <div className="text-xs text-brand-text">{row.position}</div>
                                </td>
                                <td className="p-2 text-brand-text">{`${row.accountInfo.bank} ${row.accountInfo.accountNumber}`}</td>
                                <td className="p-2 text-right text-yellow-400">{row.netPayPeriod1.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="p-2 text-right text-yellow-400">{row.netPayPeriod2.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="p-2 text-right font-bold text-lg text-green-400">{row.totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-brand-secondary font-bold text-lg">
                            <td colSpan={5} className="p-3 text-right">รวมทั้งสิ้น</td>
                            <td className="p-3 text-right text-green-400">{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}

const PayrollView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [period1Data, setPeriod1Data] = useState<PayrollCalculationRow[]>([]);
    const [period2Data, setPeriod2Data] = useState<PayrollCalculationRow[]>([]);

    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: (new Date().getFullYear() - i).toString(), label: (new Date().getFullYear() - i + 543).toString() }));
    const monthOptions = thaiMonthsFull.map((m, i) => ({ value: i.toString(), label: m }));

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getPayrollData(selectedYear, selectedMonth);
            setPeriod1Data(data.period1);
            setPeriod2Data(data.period2);
        } catch (error) {
            console.error("Failed to fetch payroll data:", error);
            alert("ไม่สามารถโหลดข้อมูลเงินเดือนได้");
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePeriodDataChange = (period: 'period1' | 'period2', index: number, field: keyof PayrollCalculationRow, value: any) => {
        const updater = period === 'period1' ? setPeriod1Data : setPeriod2Data;
        updater(prev => {
            const newData = [...prev];
            // FIX: Correctly handle changes from the input to avoid type errors and invalid data.
            // An empty input value should result in an empty string in the state.
            // Any non-numeric input should also be handled gracefully, here defaulting to an empty string.
            if (value === '') {
                newData[index] = { ...newData[index], [field]: '' };
                return newData;
            }
            const numValue = parseFloat(value);
            newData[index] = { ...newData[index], [field]: isNaN(numValue) ? '' : numValue };
            return newData;
        });
    };

    const handleSaveChanges = async () => {
        if(confirm('คุณต้องการบันทึกข้อมูลเงินเดือนสำหรับเดือนนี้ใช่หรือไม่?')) {
            await adminService.savePayrollData(selectedYear, selectedMonth, { period1: period1Data, period2: period2Data });
            alert('บันทึกข้อมูลสำเร็จ');
        }
    };

    const getFullRowData = (row: PayrollCalculationRow) => {
         const base = Number(row.baseRate) || 0;
        const otherIncome = Number(row.otherIncome || 0);
        let totalIncome = 0;

        if (row.employmentType === 'monthly') {
            totalIncome = base + otherIncome;
        } else {
            const workDays = Number(row.workDays || 0);
            totalIncome = (base * workDays) + otherIncome;
        }
        const deductionSocial = Number(row.deductionSocialSecurity || 0);
        const deductionAbsence = Number(row.deductionAbsence || 0);
        const deductionOther = Number(row.deductionOther || 0);
        const totalDeductions = deductionSocial + deductionAbsence + deductionOther;
        const netPay = totalIncome - totalDeductions;
        return { ...row, totalIncome, netPay };
    };

    const handlePrint = (period: 'period1' | 'period2') => {
        const monthName = thaiMonthsFull[selectedMonth];
        const yearBE = selectedYear + 543;
        
        if(period === 'period1') {
            generatePayrollPDF({
                periodTitle: `ค่าจ้างระหว่างวันที่ 1-15 ${monthName} ${yearBE}`,
                rows: period1Data.map(getFullRowData)
            });
        } else {
            const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
            generatePayrollPDF({
                periodTitle: `ค่าจ้างระหว่างวันที่ 16-${lastDay} ${monthName} ${yearBE}`,
                rows: period2Data.map(getFullRowData)
            });
        }
    };
    
    const monthlySummaryData = useMemo(() => {
        if (period1Data.length === 0) return [];

        return period1Data.map((p1Row) => {
            const p2Row = period2Data.find(p2 => p2.employeeId === p1Row.employeeId);
            
            // Should always find a match, but handle defensively
            if (!p2Row) return null; 

            const p1Calcs = getFullRowData(p1Row);
            const p2Calcs = getFullRowData(p2Row);

            return {
                employeeId: p1Row.employeeId,
                name: p1Row.name,
                position: p1Row.position,
                accountInfo: p1Row.accountInfo,
                netPayPeriod1: p1Calcs.netPay,
                netPayPeriod2: p2Calcs.netPay,
                totalNetPay: p1Calcs.netPay + p2Calcs.netPay,
            };
        }).filter(Boolean) as any[]; // filter out nulls and assert type
    }, [period1Data, period2Data]);


    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-3xl font-bold text-brand-light">จัดการเงินเดือน</h3>
                <div className="flex items-center gap-2">
                    <FormSelect label="" value={selectedMonth.toString()} onChange={e => setSelectedMonth(parseInt(e.target.value))} options={monthOptions} />
                    <FormSelect label="" value={selectedYear.toString()} onChange={e => setSelectedYear(parseInt(e.target.value))} options={yearOptions} />
                </div>
            </div>
            
            <PayrollTable 
                title={`รอบวันที่ 1-15 ${thaiMonthsFull[selectedMonth]}`}
                data={period1Data}
                onDataChange={(index, field, value) => handlePeriodDataChange('period1', index, field, value)}
                onPrint={() => handlePrint('period1')}
            />

            <PayrollTable 
                title={`รอบวันที่ 16 - สิ้นเดือน ${thaiMonthsFull[selectedMonth]}`}
                data={period2Data}
                onDataChange={(index, field, value) => handlePeriodDataChange('period2', index, field, value)}
                onPrint={() => handlePrint('period2')}
            />
            
            <MonthlySummaryTable 
                summaryData={monthlySummaryData} 
                monthName={thaiMonthsFull[selectedMonth]} 
            />

            <div className="mt-8 text-right">
                <button onClick={handleSaveChanges} className="bg-green-600 text-white font-bold py-3 px-8 rounded-md hover:bg-green-700 transition-colors text-lg">
                    บันทึกการเปลี่ยนแปลงทั้งหมด
                </button>
            </div>
        </div>
    );
};

export default PayrollView;
