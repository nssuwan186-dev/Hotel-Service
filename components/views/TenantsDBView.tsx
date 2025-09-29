import React from 'react';
import { Tenant } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface TenantsDBViewProps {
    tenants: Tenant[];
    onAdd: () => void;
    onEdit: (tenant: Tenant) => void;
    onDelete: (tenant: Tenant) => void;
}

const TenantsDBView: React.FC<TenantsDBViewProps> = ({ tenants, onAdd, onEdit, onDelete }) => {
    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <button onClick={onAdd} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มผู้เช่าใหม่</button>
            </div>
            <div className="bg-brand-primary rounded-lg shadow-lg">
                <table className="w-full text-left whitespace-nowrap text-sm">
                    <thead className="hidden md:table-header-group border-b border-brand-secondary">
                        <tr>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">ชื่อ-สกุล</th>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">ห้อง</th>
                            <th className="p-4 font-semibold text-right text-xs sm:text-sm uppercase text-brand-text tracking-wider">ค่าเช่า (บาท)</th>
                            <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-brand-text tracking-wider">สถานะ</th>
                            <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-brand-text tracking-wider">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                        {tenants.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-brand-text block md:table-cell">ไม่มีข้อมูลผู้เช่า</td></tr>
                        )}
                        {tenants.map((tenant) => (
                             <tr key={tenant.id} className="block p-4 mb-4 bg-brand-secondary rounded-lg md:table-row md:p-0 md:mb-0 md:bg-transparent md:border-b md:border-brand-primary last:md:border-b-0">
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4"><span className="font-semibold text-brand-text md:hidden">ชื่อ-สกุล</span><span>{tenant.name}</span></td>
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4"><span className="font-semibold text-brand-text md:hidden">ห้อง</span><span>{tenant.roomNumber}</span></td>
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4 md:text-right"><span className="font-semibold text-brand-text md:hidden">ค่าเช่า (บาท)</span><span>{tenant.rent.toLocaleString()}</span></td>
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4 md:text-center">
                                    <span className="font-semibold text-brand-text md:hidden">สถานะ</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        tenant.status === 'active' ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'
                                    }`}>
                                        {tenant.status === 'active' ? 'ปัจจุบัน' : 'ย้ายออกแล้ว'}
                                    </span>
                                </td>
                                <td className="pt-3 mt-2 border-t border-brand-primary md:table-cell md:p-4 md:border-none md:pt-4 md:mt-0">
                                    <div className="flex justify-end items-center gap-2 md:justify-center">
                                        <button onClick={() => onEdit(tenant)} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"><EditIcon /></button>
                                        {tenant.status === 'active' && <button onClick={() => onDelete(tenant)} className="p-2 text-red-500 hover:text-red-400 transition-colors"><TrashIcon /></button>}
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

export default TenantsDBView;