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
        className="w-full bg-brand-primary text-brand-light p-1.5 rounded-md text-right border border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
        {...props}
    />
);

const PayrollDetailRow: React.FC<{ label: string, children: React.ReactNode, isLarge?: boolean, isInput?: boolean }> = ({ label, children, isLarge = false, isInput = false }) => (
    <div className={`flex justify-between items-center py-1 ${isLarge ? 'py-2' : ''}`}>
        <p className="text-brand-text">{label}</p>
        <div className={isInput ? 'w-28' : ''}>{children}</div>
    </div>
);


const PayrollTable: React.FC<{
    data: PayrollCalculationRow[];
    onDataChange: (index: number, field: keyof PayrollCalculationRow, value: any) => void;
    onPrint: () => void;
}> = ({ data, onDataChange, onPrint }) => {

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
        <div className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="flex justify-end items-center mb-4">
                <button onClick={onPrint} className="flex items-center gap-2 text-sm bg-brand-accent hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    <PrintIcon /> พิมพ์สรุป
                </button>
            </div>
             <div className="space-y-4">
                {data.map((row, index) => {
                    const { totalIncome, netPay } = calculateRow(row);
                    return (
                        <div key={row.employeeId} className="bg-brand-secondary p-4 rounded-lg">
                            <div className="text-center mb-3 pb-3 border-b border-brand-primary/50">
                                <p className="font-semibold text-brand-light text-lg">{row.name}</p>
                                <p className="text-sm text-brand-text">{row.position}</p>
                            </div>

                            <div className="space-y-1.5 text-sm">
                                <PayrollDetailRow label="อัตราจ้าง">
                                    <span>{row.baseRate.toLocaleString()} <span className="text-xs text-brand-text">/ {row.employmentType === 'monthly' ? 'เดือน' : 'วัน'}</span></span>
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
                                    <span className="font-semibold text-green-400">{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </PayrollDetailRow>
                                
                                <hr className="border-t border-brand-primary/50 !my-3" />

                                <PayrollDetailRow label="หัก ปกส." isInput>
                                    <PayrollInput value={row.deductionSocialSecurity ?? ''} onChange={e => onDataChange(index, 'deductionSocialSecurity', e.target.value)} placeholder="0.00" />
                                </PayrollDetailRow>
                                <PayrollDetailRow label="หัก ขาด/ลา" isInput>
                                    <PayrollInput value={row.deductionAbsence ?? ''} onChange={e => onDataChange(index, 'deductionAbsence', e.target.value)} placeholder="0.00" />
                                </PayrollDetailRow>
                                <PayrollDetailRow label="หัก อื่นๆ" isInput>
                                    <PayrollInput value={row.deductionOther ?? ''} onChange={e => onDataChange(index, 'deductionOther', e.target.value)} placeholder="0.00" />
                                </PayrollDetailRow>

                                <hr className="border-t border-brand-primary/50 !my-3" />
                                
                                <PayrollDetailRow label="ยอดจ่ายจริง" isLarge>
                                    <span className="font-bold text-yellow-400 text-xl">{netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </PayrollDetailRow>
                            </div>
                        </div>
                    );
                })}
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

    return (
         <div className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-lg">
            <h4 className="font-semibold text-xl text-brand-light mb-4">สรุปยอดจ่ายเงินเดือน ({monthName})</h4>
            <div className="space-y-4">
                {summaryData.map((row) => (
                    <div key={row.employeeId} className="bg-brand-secondary p-4 rounded-lg">
                        <div className="text-center mb-3 pb-3 border-b border-brand-primary/50">
                            <p className="font-semibold text-brand-light text-lg">{row.name}</p>
                            <p className="text-sm text-brand-text">{row.position}</p>
                        </div>
                        <div className="space-y-1.5 text-sm">
                             <PayrollDetailRow label="เลขที่บัญชี">
                                <span>{`${row.accountInfo.bank} ${row.accountInfo.accountNumber}`}</span>
                            </PayrollDetailRow>
                             <PayrollDetailRow label="ยอดจ่าย (รอบ 1)">
                                <span className="font-semibold text-yellow-400">{row.netPayPeriod1.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </PayrollDetailRow>
                             <PayrollDetailRow label="ยอดจ่าย (รอบ 2)">
                                <span className="font-semibold text-yellow-400">{row.netPayPeriod2.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </PayrollDetailRow>
                            <hr className="border-t border-brand-primary/50 !my-3" />
                             <PayrollDetailRow label="รวมยอดจ่าย" isLarge={true}>
                                <span className="font-bold text-green-400 text-xl">{row.totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </PayrollDetailRow>
                        </div>
                    </div>
                ))}
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
    const [activeSubPeriod, setActiveSubPeriod] = useState<'period1' | 'period2'>('period1');
    const [mainActiveTab, setMainActiveTab] = useState<'payslip' | 'summary'>('payslip');

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
        }).filter(Boolean) as any[];
    }, [period1Data, period2Data]);


    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    }
    
    const tabBaseClass = "px-4 py-3 text-sm font-medium border-b-2 transition-colors";
    const activeTabClass = "border-brand-accent text-brand-accent";
    const inactiveTabClass = "border-transparent text-brand-text hover:border-brand-text/50 hover:text-brand-light";

    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <div className="flex items-center gap-2">
                    <FormSelect label="" value={selectedMonth.toString()} onChange={e => setSelectedMonth(parseInt(e.target.value))} options={monthOptions} />
                    <FormSelect label="" value={selectedYear.toString()} onChange={e => setSelectedYear(parseInt(e.target.value))} options={yearOptions} />
                </div>
            </div>
            
            <div className="mb-6 border-b border-brand-primary">
                <nav className="-mb-px flex space-x-2 sm:space-x-6">
                    <button 
                        onClick={() => setMainActiveTab('payslip')} 
                        className={`${tabBaseClass} ${mainActiveTab === 'payslip' ? activeTabClass : inactiveTabClass}`}
                    >
                        สลีปเงินเดือน
                    </button>
                    <button 
                        onClick={() => setMainActiveTab('summary')} 
                        className={`${tabBaseClass} ${mainActiveTab === 'summary' ? activeTabClass : inactiveTabClass}`}
                    >
                        สรุปยอดจ่ายเงินเดือน
                    </button>
                </nav>
            </div>

            {mainActiveTab === 'payslip' && (
                <>
                    <div className="mb-6">
                        <nav className="flex space-x-2 sm:space-x-6">
                            <button 
                                onClick={() => setActiveSubPeriod('period1')} 
                                className={`${tabBaseClass} ${activeSubPeriod === 'period1' ? activeTabClass : inactiveTabClass}`}
                            >
                                รอบวันที่ 1-15
                            </button>
                            <button 
                                onClick={() => setActiveSubPeriod('period2')} 
                                className={`${tabBaseClass} ${activeSubPeriod === 'period2' ? activeTabClass : inactiveTabClass}`}
                            >
                                รอบวันที่ 16 - สิ้นเดือน
                            </button>
                        </nav>
                    </div>

                    <div className="mb-8">
                        {activeSubPeriod === 'period1' && (
                            <PayrollTable 
                                data={period1Data}
                                onDataChange={(index, field, value) => handlePeriodDataChange('period1', index, field, value)}
                                onPrint={() => handlePrint('period1')}
                            />
                        )}
                        {activeSubPeriod === 'period2' && (
                            <PayrollTable 
                                data={period2Data}
                                onDataChange={(index, field, value) => handlePeriodDataChange('period2', index, field, value)}
                                onPrint={() => handlePrint('period2')}
                            />
                        )}
                    </div>
                    
                    <div className="mt-8 text-right">
                        <button onClick={handleSaveChanges} className="bg-green-600 text-white font-bold py-3 px-8 rounded-md hover:bg-green-700 transition-colors text-lg">
                            บันทึกการเปลี่ยนแปลงทั้งหมด
                        </button>
                    </div>
                </>
            )}

            {mainActiveTab === 'summary' && (
                <MonthlySummaryTable 
                    summaryData={monthlySummaryData} 
                    monthName={thaiMonthsFull[selectedMonth]} 
                />
            )}
        </div>
    );
};

export default PayrollView;