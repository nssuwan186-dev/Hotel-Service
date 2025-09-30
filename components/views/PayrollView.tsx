

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PayrollCalculationRow } from '../../types';
import * as adminService from '../../services/adminService';
import { FormSelect } from '../AdminPanel';
import Spinner from '../common/Spinner';
import { PrintIcon } from '../icons/PrintIcon';
import { thaiMonthsFull } from '../../services/utils';
import { generatePayrollPDF, generatePayrollSummaryPDF } from '../../services/payrollPdfService';

const PayrollInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        type="number"
        className="w-full bg-primary text-text-main p-1.5 rounded-md text-right border border-border focus:outline-none focus:ring-1 focus:ring-accent"
        {...props}
    />
);

const PayrollDetailRow: React.FC<{ label: string, children: React.ReactNode, isLarge?: boolean, isInput?: boolean }> = ({ label, children, isLarge = false, isInput = false }) => (
    <div className={`flex justify-between items-center py-1 ${isLarge ? 'py-2' : ''}`}>
        <p className="text-text-muted">{label}</p>
        <div className={isInput ? 'w-28' : ''}>{children}</div>
    </div>
);

const PayrollContent: React.FC<{
    data: PayrollCalculationRow[];
    onDataChange: (index: number, field: keyof PayrollCalculationRow, value: any) => void;
}> = ({ data, onDataChange }) => {

    const calculateRow = (row: PayrollCalculationRow) => {
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
        
        return { totalIncome, netPay };
    };

    return (
        <div className="space-y-4">
            {data.map((row, index) => {
                const { totalIncome, netPay } = calculateRow(row);
                return (
                    <div key={row.employeeId} className="bg-secondary p-4 rounded-lg border border-border">
                        <div className="text-center mb-3 pb-3 border-b border-border">
                            <p className="font-semibold text-text-main text-lg">{row.name}</p>
                            <p className="text-sm text-text-muted">{row.position}</p>
                        </div>

                        <div className="space-y-1.5 text-sm">
                            <PayrollDetailRow label="อัตราจ้าง">
                                <span>{row.baseRate.toLocaleString()} <span className="text-xs text-text-muted">/ {row.employmentType === 'monthly' ? 'เดือน' : 'วัน'}</span></span>
                            </PayrollDetailRow>
                            <PayrollDetailRow label="รายได้อื่น" isInput>
                                <PayrollInput value={row.otherIncome ?? ''} onChange={e => onDataChange(index, 'otherIncome', e.target.value)} placeholder="0.00" />
                            </PayrollDetailRow>
                            {row.employmentType === 'daily' && (
                                <PayrollDetailRow label="วันทำงาน" isInput>
                                    <PayrollInput value={row.workDays ?? ''} onChange={e => onDataChange(index, 'workDays', e.target.value)} placeholder="0" />
                                </PayrollDetailRow>
                            )}
                            <PayrollDetailRow label="รวมเงิน">
                                <span className="font-semibold text-green-500">{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </PayrollDetailRow>
                            
                            <hr className="border-t border-border !my-3" />

                            <PayrollDetailRow label="หัก ปกส." isInput>
                                <PayrollInput value={row.deductionSocialSecurity ?? ''} onChange={e => onDataChange(index, 'deductionSocialSecurity', e.target.value)} placeholder="0.00" />
                            </PayrollDetailRow>
                            <PayrollDetailRow label="หัก ขาด/ลา" isInput>
                                <PayrollInput value={row.deductionAbsence ?? ''} onChange={e => onDataChange(index, 'deductionAbsence', e.target.value)} placeholder="0.00" />
                            </PayrollDetailRow>
                            <PayrollDetailRow label="หัก อื่นๆ" isInput>
                                <PayrollInput value={row.deductionOther ?? ''} onChange={e => onDataChange(index, 'deductionOther', e.target.value)} placeholder="0.00" />
                            </PayrollDetailRow>

                            <hr className="border-t border-border !my-3" />
                            
                            <PayrollDetailRow label="ยอดจ่ายจริง" isLarge>
                                <span className="font-bold text-yellow-400 text-xl">{netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </PayrollDetailRow>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface MonthlySummaryTableProps {
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
    onPrintSummary: () => void;
}

const MonthlySummaryTable: React.FC<MonthlySummaryTableProps> = ({ summaryData, monthName, onPrintSummary }) => {
    const totals = useMemo(() => {
        return summaryData.reduce((acc, row) => {
            acc.netPayPeriod1 += row.netPayPeriod1;
            acc.netPayPeriod2 += row.netPayPeriod2;
            acc.totalNetPay += row.totalNetPay;
            return acc;
        }, { netPayPeriod1: 0, netPayPeriod2: 0, totalNetPay: 0 });
    }, [summaryData]);

    return (
         <div className="bg-primary p-4 sm:p-6 rounded-lg shadow-lg border border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h4 className="font-semibold text-xl text-text-main">สรุปยอดจ่ายเงินเดือน ({monthName})</h4>
                 <button 
                    onClick={onPrintSummary} 
                    className="flex items-center gap-2 text-sm bg-accent hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors self-end sm:self-center"
                >
                    <PrintIcon /> พิมพ์สรุป
                </button>
            </div>
            <div className="space-y-4">
                {summaryData.map((row) => (
                    <div key={row.employeeId} className="bg-secondary p-4 rounded-lg border border-border">
                        <div className="text-center mb-3 pb-3 border-b border-border">
                            <p className="font-semibold text-text-main text-lg">{row.name}</p>
                            <p className="text-sm text-text-muted">{row.position}</p>
                        </div>
                        <div className="space-y-1.5 text-sm">
                            <PayrollDetailRow label="ยอดจ่าย (รอบ 1-15)">
                                <span>{row.netPayPeriod1.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </PayrollDetailRow>
                             <PayrollDetailRow label="ยอดจ่าย (รอบ 16 - สิ้นเดือน)">
                                <span>{row.netPayPeriod2.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </PayrollDetailRow>
                             <PayrollDetailRow label="รวมยอดจ่ายทั้งเดือน" isLarge>
                                <span className="font-bold text-yellow-400 text-xl">{row.totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </PayrollDetailRow>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border font-bold bg-secondary p-4 rounded-lg">
                <PayrollDetailRow label="รวมจ่ายรอบ 1">
                    <span>{totals.netPayPeriod1.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </PayrollDetailRow>
                <PayrollDetailRow label="รวมจ่ายรอบ 2">
                     <span>{totals.netPayPeriod2.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </PayrollDetailRow>
                 <PayrollDetailRow label="รวมจ่ายทั้งเดือน" isLarge>
                    <span className="text-yellow-400 text-xl">{totals.totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </PayrollDetailRow>
            </div>
        </div>
    );
};


const PayrollView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [activeTab, setActiveTab] = useState<'period1' | 'period2' | 'summary'>('period1');
    const [payrollData, setPayrollData] = useState<{ period1: PayrollCalculationRow[], period2: PayrollCalculationRow[] }>({ period1: [], period2: [] });
    const isSaving = useRef(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getPayrollData(selectedYear, selectedMonth);
            setPayrollData(data);
        } catch (error) {
            console.error("Failed to fetch payroll data:", error);
            setPayrollData({ period1: [], period2: [] });
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDataChange = (index: number, field: keyof PayrollCalculationRow, value: any) => {
        if (activeTab === 'summary') return;
        setPayrollData(prev => {
            const newPeriodData = [...prev[activeTab]];
            newPeriodData[index] = { ...newPeriodData[index], [field]: value };
            return { ...prev, [activeTab]: newPeriodData };
        });
    };
    
    const handleSaveChanges = async () => {
        if (isSaving.current) return;
        isSaving.current = true;
        try {
            await adminService.savePayrollData(selectedYear, selectedMonth, payrollData);
            alert('บันทึกข้อมูลสำเร็จ');
        } catch (error) {
            console.error("Failed to save payroll data:", error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            isSaving.current = false;
        }
    };
    
    const calculateNetPay = (row: PayrollCalculationRow) => {
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
        return totalIncome - totalDeductions;
    };

    const handlePrintPeriod = () => {
        if (activeTab === 'summary') return;
        const periodTitle = `ใบจ่ายเงินเดือน ${activeTab === 'period1' ? 'รอบวันที่ 1-15' : 'รอบวันที่ 16 - สิ้นเดือน'} ${thaiMonthsFull[selectedMonth]} ${selectedYear + 543}`;
        
        const rowsWithTotals = payrollData[activeTab].map(row => {
            const base = Number(row.baseRate) || 0;
            const otherIncome = Number(row.otherIncome || 0);
            let totalIncome = 0;

            if (row.employmentType === 'monthly') {
                totalIncome = base + otherIncome;
            } else {
                const workDays = Number(row.workDays || 0);
                totalIncome = (base * workDays) + otherIncome;
            }
            const netPay = calculateNetPay(row);
            return {...row, totalIncome, netPay };
        });
        
        generatePayrollPDF({ periodTitle, rows: rowsWithTotals });
    };

    const summaryData = useMemo(() => {
        const employeeMap = new Map<string, any>();

        payrollData.period1.forEach(row => {
            employeeMap.set(row.employeeId, {
                ...row,
                netPayPeriod1: calculateNetPay(row),
                netPayPeriod2: 0,
            });
        });

        payrollData.period2.forEach(row => {
            const netPay2 = calculateNetPay(row);
            if (employeeMap.has(row.employeeId)) {
                employeeMap.get(row.employeeId).netPayPeriod2 = netPay2;
            } else {
                employeeMap.set(row.employeeId, {
                    ...row,
                    netPayPeriod1: 0,
                    netPayPeriod2: netPay2,
                });
            }
        });

        const result = Array.from(employeeMap.values());
        result.forEach(row => {
            row.totalNetPay = row.netPayPeriod1 + row.netPayPeriod2;
        });

        return result;
    }, [payrollData]);

    const handlePrintSummary = () => {
        generatePayrollSummaryPDF({
            monthName: thaiMonthsFull[selectedMonth],
            yearBE: selectedYear + 543,
            summaryData: summaryData,
        });
    };
    
    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: (new Date().getFullYear() - i).toString(), label: (new Date().getFullYear() - i + 543).toString() }));
    const monthOptions = thaiMonthsFull.map((name, index) => ({ value: index.toString(), label: name }));

    const TabButton: React.FC<{ tabId: 'period1' | 'period2' | 'summary'; label: string }> = ({ tabId, label }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 py-3 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tabId
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-secondary text-text-muted hover:bg-border'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-primary p-4 rounded-lg shadow-lg border border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormSelect label="เลือกปี (พ.ศ.)" value={selectedYear.toString()} onChange={e => setSelectedYear(parseInt(e.target.value, 10))} options={yearOptions} />
                    <FormSelect label="เลือกเดือน" value={selectedMonth.toString()} onChange={e => setSelectedMonth(parseInt(e.target.value, 10))} options={monthOptions} />
                </div>
                <div className="flex bg-primary rounded-lg p-1 space-x-1">
                    <TabButton tabId="period1" label="รอบวันที่ 1-15" />
                    <TabButton tabId="period2" label="รอบวันที่ 16 - สิ้นเดือน" />
                    <TabButton tabId="summary" label="สรุปยอดจ่าย" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20"><Spinner size="lg" /></div>
            ) : (
                <div>
                    {activeTab !== 'summary' && (
                        <div className="flex justify-end items-center mb-4 gap-3">
                             <button onClick={handleSaveChanges} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                บันทึกข้อมูล
                            </button>
                             <button onClick={handlePrintPeriod} className="flex items-center gap-2 text-sm bg-accent hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                <PrintIcon /> พิมพ์รอบนี้
                            </button>
                        </div>
                    )}

                    {activeTab === 'period1' && <PayrollContent data={payrollData.period1} onDataChange={handleDataChange} />}
                    {activeTab === 'period2' && <PayrollContent data={payrollData.period2} onDataChange={handleDataChange} />}
                    {activeTab === 'summary' && <MonthlySummaryTable summaryData={summaryData} monthName={thaiMonthsFull[selectedMonth]} onPrintSummary={handlePrintSummary} />}
                </div>
            )}
        </div>
    );
};

export default PayrollView;