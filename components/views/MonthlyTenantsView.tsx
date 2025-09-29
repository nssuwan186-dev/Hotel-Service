import React, { useState, useEffect, useMemo } from 'react';
import { Tenant, MeterReadingsData, UtilityRates, MeterReading } from '../../types';
import { FormSelect } from '../AdminPanel';
import { PrintIcon } from '../icons/PrintIcon';
import { generateUtilityBillPDF } from '../../services/utilityBillService';
import { thaiMonthsFull } from '../../services/utils';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface MonthlyTenantsViewProps {
    tenants: Tenant[];
    meterReadings: Record<string, MeterReadingsData>;
    utilityRates: UtilityRates | null;
    onSave: (tenantId: string, readings: MeterReadingsData) => void;
    onAdd: () => void;
    onEdit: (tenant: Tenant) => void;
    onDelete: (tenant: Tenant) => void;
}

const MonthlyTenantsView: React.FC<MonthlyTenantsViewProps> = ({ tenants, meterReadings, utilityRates, onSave, onAdd, onEdit, onDelete }) => {
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [currentReadings, setCurrentReadings] = useState<MeterReadingsData>({});

    useEffect(() => {
        if (selectedTenant && meterReadings[selectedTenant.id]) {
            setCurrentReadings(JSON.parse(JSON.stringify(meterReadings[selectedTenant.id])));
        } else {
            setCurrentReadings({});
        }
    }, [selectedTenant, meterReadings]);
    
    const handleSelectTenantForMeters = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        // Scroll to the meter section if it's already open for another tenant
        const meterSection = document.getElementById('meter-management-section');
        if (meterSection) {
            meterSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleReadingChange = (month: number, type: 'water' | 'electricity', value: string) => {
        if (!selectedTenant) return;
        const yearStr = selectedYear.toString();
        const monthStr = month.toString();
        const numericValue = value === '' ? null : parseInt(value, 10);

        setCurrentReadings(prev => {
            const updatedReadings = { ...prev };
            if (!updatedReadings[yearStr]) updatedReadings[yearStr] = {};
            if (!updatedReadings[yearStr][monthStr]) updatedReadings[yearStr][monthStr] = { water: null, electricity: null };
            
            updatedReadings[yearStr][monthStr][type] = isNaN(numericValue!) ? null : numericValue;
            return updatedReadings;
        });
    };

    const handleSaveChanges = () => {
        if (!selectedTenant) return;
        onSave(selectedTenant.id, currentReadings);
        alert('บันทึกข้อมูลมิเตอร์เรียบร้อยแล้ว');
    };

    const handlePrintInvoice = (month: number) => {
        if (!selectedTenant || !utilityRates) return;

        const year = selectedYear;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevMonthYear = month === 0 ? year - 1 : year;
        
        const currentReading = currentReadings[year.toString()]?.[month.toString()];
        const prevReading = currentReadings[prevMonthYear.toString()]?.[prevMonth.toString()];

        if (!currentReading || currentReading.water === null || currentReading.electricity === null) {
            alert('กรุณากรอกข้อมูลมิเตอร์สำหรับเดือนปัจจุบันให้ครบถ้วน');
            return;
        }
        
        generateUtilityBillPDF({
            tenant: selectedTenant,
            utilityRates,
            year,
            month,
            currentReading,
            prevReading,
        });
    };
    
    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: (new Date().getFullYear() - i).toString(), label: (new Date().getFullYear() - i + 543).toString() }));
    const months = thaiMonthsFull;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-brand-light">จัดการผู้เช่ารายเดือน</h3>
                <button onClick={onAdd} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มผู้เช่าใหม่</button>
            </div>
            
            {/* Tenants List Table */}
            <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
                <h4 className="font-semibold text-xl text-brand-light mb-4">รายชื่อผู้เช่าปัจจุบัน</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="border-b border-brand-secondary">
                            <tr>
                                <th className="p-3 font-semibold">ชื่อ-สกุล</th>
                                <th className="p-3 font-semibold">ห้อง</th>
                                <th className="p-3 font-semibold text-right">ค่าเช่า (บาท)</th>
                                <th className="p-3 font-semibold text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="border-b border-brand-secondary last:border-b-0 hover:bg-brand-secondary/30">
                                    <td className="p-3 font-medium">{tenant.name}</td>
                                    <td className="p-3">{tenant.roomNumber}</td>
                                    <td className="p-3 text-right">{tenant.rent.toLocaleString()}</td>
                                    <td className="p-3">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => handleSelectTenantForMeters(tenant)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md transition-colors">
                                                จัดการมิเตอร์
                                            </button>
                                            <button onClick={() => onEdit(tenant)} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"><EditIcon /></button>
                                            <button onClick={() => onDelete(tenant)} className="p-2 text-red-500 hover:text-red-400 transition-colors"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Meter Management Section */}
            {selectedTenant && (
                 <div id="meter-management-section" className="bg-brand-primary p-6 rounded-lg shadow-lg mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                             <h4 className="font-semibold text-xl text-brand-light">จัดการมิเตอร์สำหรับ: <span className="text-brand-accent">{selectedTenant.name}</span></h4>
                             <p className="text-brand-text">ห้อง {selectedTenant.roomNumber}</p>
                        </div>
                        <button onClick={() => setSelectedTenant(null)} className="text-2xl text-brand-text hover:text-brand-light">&times;</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <FormSelect label="เลือกปี (พ.ศ.)" value={selectedYear.toString()} onChange={e => setSelectedYear(parseInt(e.target.value, 10))} options={yearOptions} />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="border-b border-brand-secondary">
                                <tr>
                                    <th className="p-3 font-semibold">เดือน</th>
                                    <th className="p-3 font-semibold text-center">มิเตอร์น้ำ (หน่วย)</th>
                                    <th className="p-3 font-semibold text-center">มิเตอร์ไฟ (หน่วย)</th>
                                    <th className="p-3 font-semibold text-center">ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {months.map((monthName, index) => {
                                    const reading = currentReadings[selectedYear.toString()]?.[index.toString()] || { water: null, electricity: null };
                                    return (
                                        <tr key={index} className="border-b border-brand-secondary last:border-b-0">
                                            <td className="p-2 font-medium">{monthName}</td>
                                            <td className="p-2">
                                                <input type="number" className="w-full bg-brand-secondary text-brand-light p-2 rounded-md text-center" value={reading.water ?? ''} onChange={e => handleReadingChange(index, 'water', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" className="w-full bg-brand-secondary text-brand-light p-2 rounded-md text-center" value={reading.electricity ?? ''} onChange={e => handleReadingChange(index, 'electricity', e.target.value)} />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => handlePrintInvoice(index)} className="flex items-center justify-center gap-2 w-full text-sm bg-brand-secondary hover:bg-opacity-80 text-brand-light font-bold py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={reading.water === null || reading.electricity === null}>
                                                    <PrintIcon /> พิมพ์ใบแจ้งหนี้
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 text-right">
                        <button onClick={handleSaveChanges} className="bg-brand-accent text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-90">
                            บันทึกการเปลี่ยนแปลงมิเตอร์
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyTenantsView;