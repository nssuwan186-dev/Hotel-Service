import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface EmployeesViewProps {
    employees: Employee[];
    onAdd: () => void;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
}

const EmployeesView: React.FC<EmployeesViewProps> = ({ employees, onAdd, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) {
            return employees;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return employees.filter(emp => 
            emp.name.toLowerCase().includes(lowercasedTerm) ||
            emp.position.toLowerCase().includes(lowercasedTerm)
        );
    }, [employees, searchTerm]);
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
                <div className="relative w-full sm:w-72">
                    <input 
                        type="text"
                        placeholder="ค้นหา (ชื่อ, ตำแหน่ง, ...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-primary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent pl-10"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
                <button onClick={onAdd} className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 whitespace-nowrap shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <PlusIcon /> เพิ่มพนักงานใหม่
                </button>
            </div>
            <div className="bg-primary rounded-xl shadow-lg border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-sm">
                        <thead className="border-b border-border">
                            <tr>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">พนักงาน</th>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">ประเภทการจ้าง</th>
                                <th className="p-4 font-semibold text-right text-xs sm:text-sm uppercase text-text-muted tracking-wider">อัตราจ้าง (บาท)</th>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">ข้อมูลบัญชี</th>
                                <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-text-muted tracking-wider">สถานะ</th>
                                <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-text-muted tracking-wider">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-center text-text-muted">
                                    {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : "ไม่มีข้อมูลพนักงาน"}
                                </td></tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="border-b border-border last:border-b-0 hover:bg-secondary transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium">{emp.name}</div>
                                            <div className="text-xs text-text-muted">{emp.position}</div>
                                        </td>
                                        <td className="p-4">{emp.employmentType === 'monthly' ? 'รายเดือน' : 'รายวัน'}</td>
                                        <td className="p-4 text-right">{emp.baseRate.toLocaleString()}</td>
                                        <td className="p-4 truncate max-w-xs">{`${emp.accountInfo.bank} ${emp.accountInfo.accountNumber}`}</td>
                                        <td className="p-4 text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                                emp.status === 'active' ? 'bg-green-100 dark:bg-green-900/70 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-300'
                                            }`}>
                                                {emp.status === 'active' ? 'ปัจจุบัน' : 'พ้นสภาพ'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => onEdit(emp)} className="p-2 text-yellow-500 hover:text-yellow-400 rounded-lg hover:bg-primary transition-colors"><EditIcon /></button>
                                                {emp.status === 'active' && <button onClick={() => onDelete(emp)} className="p-2 text-red-500 hover:text-red-400 rounded-lg hover:bg-primary transition-colors"><TrashIcon /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeesView;