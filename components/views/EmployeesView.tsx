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
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-brand-light">ทะเบียนพนักงาน</h3>
                <button onClick={onAdd} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มพนักงานใหม่</button>
            </div>
            <div className="bg-brand-primary rounded-lg overflow-x-auto shadow-lg">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="border-b border-brand-secondary">
                        <tr>
                            <th className="p-4 font-semibold">พนักงาน</th>
                            <th className="p-4 font-semibold">ประเภทการจ้าง</th>
                            <th className="p-4 font-semibold text-right">อัตราจ้าง (บาท)</th>
                            <th className="p-4 font-semibold">ข้อมูลบัญชี</th>
                            <th className="p-4 font-semibold text-center">สถานะ</th>
                            <th className="p-4 font-semibold text-center">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 && (
                            <tr><td colSpan={6} className="p-4 text-center text-brand-text">ไม่มีข้อมูลพนักงาน</td></tr>
                        )}
                        {employees.map(emp => (
                             <tr key={emp.id} className="border-b border-brand-secondary last:border-b-0 hover:bg-brand-secondary/30">
                                <td className="p-4">
                                    <div className="font-medium">{emp.name}</div>
                                    <div className="text-xs text-brand-text">{emp.position}</div>
                                </td>
                                <td className="p-4">{emp.employmentType === 'monthly' ? 'รายเดือน' : 'รายวัน'}</td>
                                <td className="p-4 text-right">{emp.baseRate.toLocaleString()}</td>
                                <td className="p-4 text-sm text-brand-text truncate max-w-xs">{`${emp.accountInfo.bank} ${emp.accountInfo.accountNumber}`}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        emp.status === 'active' ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'
                                    }`}>
                                        {emp.status === 'active' ? 'ปัจจุบัน' : 'พ้นสภาพ'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center items-center gap-2">
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