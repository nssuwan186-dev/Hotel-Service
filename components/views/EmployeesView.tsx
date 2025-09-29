import React from 'react';
import { Employee } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface EmployeesViewProps {
    employees: Employee[];
    onAdd: () => void;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
}

const EmployeesView: React.FC<EmployeesViewProps> = ({ employees, onAdd, onEdit, onDelete }) => {
    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <button onClick={onAdd} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มพนักงานใหม่</button>
            </div>
            <div className="bg-brand-primary rounded-lg shadow-lg">
                <table className="w-full text-left whitespace-nowrap text-sm">
                    <thead className="hidden md:table-header-group border-b border-brand-secondary">
                        <tr>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">พนักงาน</th>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">ประเภทการจ้าง</th>
                            <th className="p-4 font-semibold text-right text-xs sm:text-sm uppercase text-brand-text tracking-wider">อัตราจ้าง (บาท)</th>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">ข้อมูลบัญชี</th>
                            <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-brand-text tracking-wider">สถานะ</th>
                            <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-brand-text tracking-wider">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                        {employees.length === 0 && (
                            <tr><td colSpan={6} className="p-4 text-center text-brand-text block md:table-cell">ไม่มีข้อมูลพนักงาน</td></tr>
                        )}
                        {employees.map(emp => (
                             <tr key={emp.id} className="block p-4 mb-4 bg-brand-secondary rounded-lg md:table-row md:p-0 md:mb-0 md:bg-transparent md:border-b md:border-brand-primary last:md:border-b-0">
                                <td className="block text-center md:table-cell md:p-4 md:text-left border-b border-brand-primary pb-2 mb-2 md:border-none">
                                    <div className="font-medium text-lg md:text-base">{emp.name}</div>
                                    <div className="text-xs text-brand-text">{emp.position}</div>
                                </td>
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4"><span className="font-semibold text-brand-text md:hidden">ประเภทการจ้าง</span><span>{emp.employmentType === 'monthly' ? 'รายเดือน' : 'รายวัน'}</span></td>
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4 md:text-right"><span className="font-semibold text-brand-text md:hidden">อัตราจ้าง (บาท)</span><span>{emp.baseRate.toLocaleString()}</span></td>
                                <td className="flex justify-between items-center py-1 text-sm text-brand-text md:table-cell md:p-4"><span className="font-semibold text-brand-light md:hidden">ข้อมูลบัญชี</span><span className="truncate max-w-[150px] sm:max-w-xs">{`${emp.accountInfo.bank} ${emp.accountInfo.accountNumber}`}</span></td>
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4 md:text-center">
                                    <span className="font-semibold text-brand-text md:hidden">สถานะ</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        emp.status === 'active' ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'
                                    }`}>
                                        {emp.status === 'active' ? 'ปัจจุบัน' : 'พ้นสภาพ'}
                                    </span>
                                </td>
                                <td className="pt-3 mt-2 border-t border-brand-primary md:table-cell md:p-4 md:border-none md:pt-4 md:mt-0">
                                    <div className="flex justify-end items-center gap-2 md:justify-center">
                                        <button onClick={() => onEdit(emp)} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"><EditIcon /></button>
                                        {emp.status === 'active' && <button onClick={() => onDelete(emp)} className="p-2 text-red-500 hover:text-red-400 transition-colors"><TrashIcon /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeesView;