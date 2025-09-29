import React from 'react';
import { Guest } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface GuestsViewProps {
    guests: Guest[];
    onAdd: () => void;
    onEdit: (guest: Guest) => void;
    onDelete: (guest: Guest) => void;
}

const GuestsView: React.FC<GuestsViewProps> = ({ guests, onAdd, onEdit, onDelete }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-brand-light">ทะเบียนผู้เข้าพัก (รายวัน)</h3>
                <button onClick={onAdd} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มผู้เข้าพักใหม่</button>
            </div>
            <div className="bg-brand-primary rounded-lg overflow-x-auto shadow-lg">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="border-b border-brand-secondary">
                        <tr>
                            <th className="p-4 font-semibold">ชื่อ-สกุล</th>
                            <th className="p-4 font-semibold">เบอร์โทรศัพท์</th>
                            <th className="p-4 font-semibold">เลขบัตรประชาชน</th>
                            <th className="p-4 font-semibold">ที่อยู่</th>
                            <th className="p-4 font-semibold text-center">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guests.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-brand-text">ไม่มีข้อมูลผู้เข้าพัก</td></tr>
                        )}
                        {guests.map(guest => (
                             <tr key={guest.id} className="border-b border-brand-secondary last:border-b-0 hover:bg-brand-secondary/30">
                                <td className="p-4">{guest.fullName}</td>
                                <td className="p-4">{guest.phoneNumber || '-'}</td>
                                <td className="p-4">{guest.idCardNumber || '-'}</td>
                                <td className="p-4 truncate max-w-xs">{guest.address || '-'}</td>
                                <td className="p-4">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => onEdit(guest)} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"><EditIcon /></button>
                                        {guest.status === 'active' && <button onClick={() => onDelete(guest)} className="p-2 text-red-500 hover:text-red-400 transition-colors"><TrashIcon /></button>}
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

export default GuestsView;