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
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-brand-light">ทะเบียนผู้เช่ารายเดือน</h3>
                <button onClick={onAdd} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มผู้เช่าใหม่</button>
            </div>
            <div className="bg-brand-primary rounded-lg overflow-x-auto shadow-lg">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="border-b border-brand-secondary">
                        <tr>
                            <th className="p-4 font-semibold">ชื่อ-สกุล</th>
                            <th className="p-4 font-semibold">ห้อง</th>
                            <th className="p-4 font-semibold text-right">ค่าเช่า (บาท)</th>
                            <th className="p-4 font-semibold text-center">สถานะ</th>
                            <th className="p-4 font-semibold text-center">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-brand-text">ไม่มีข้อมูลผู้เช่า</td></tr>
                        )}
                        {tenants.map((tenant) => (
                             <tr key={tenant.id} className="border-b border-brand-secondary last:border-b-0 hover:bg-brand-secondary/30">
                                <td className="p-4">{tenant.name}</td>
                                <td className="p-4">{tenant.roomNumber}</td>
                                <td className="p-4 text-right">{tenant.rent.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        tenant.status === 'active' ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'
                                    }`}>
                                        {tenant.status === 'active' ? 'ปัจจุบัน' : 'ย้ายออกแล้ว'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center items-center gap-2">
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