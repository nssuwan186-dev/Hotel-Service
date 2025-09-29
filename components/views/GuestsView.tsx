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
            <div className="flex justify-end items-center mb-6">
                <button onClick={onAdd} className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90">+ เพิ่มผู้เข้าพักใหม่</button>
            </div>
            <div className="bg-brand-primary rounded-lg shadow-lg">
                <table className="w-full text-left whitespace-nowrap text-sm">
                    <thead className="hidden md:table-header-group border-b border-brand-secondary">
                        <tr>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">ชื่อ-สกุล</th>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">เบอร์โทรศัพท์</th>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">เลขบัตรประชาชน</th>
                            <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-brand-text tracking-wider">ที่อยู่</th>
                            <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-brand-text tracking-wider">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                        {guests.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-brand-text block md:table-cell">ไม่มีข้อมูลผู้เข้าพัก</td></tr>
                        )}
                        {guests.map(guest => (
                             <tr key={guest.id} className="block p-4 mb-4 bg-brand-secondary rounded-lg md:table-row md:p-0 md:mb-0 md:bg-transparent md:border-b md:border-brand-primary last:md:border-b-0">
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4"><span className="font-semibold text-brand-text md:hidden">ชื่อ-สกุล</span><span>{guest.fullName}</span></td>
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4"><span className="font-semibold text-brand-text md:hidden">เบอร์โทรศัพท์</span><span>{guest.phoneNumber || '-'}</span></td>
                                <td className="flex justify-between items-center py-1 md:table-cell md:p-4"><span className="font-semibold text-brand-text md:hidden">เลขบัตรฯ</span><span>{guest.idCardNumber || '-'}</span></td>
                                <td className="flex justify-between items-start py-1 md:table-cell md:p-4">
                                    <span className="font-semibold text-brand-text md:hidden whitespace-nowrap mr-2">ที่อยู่</span>
                                    <span className="truncate max-w-[150px] sm:max-w-xs text-right md:text-left">{guest.address || '-'}</span>
                                </td>
                                <td className="pt-3 mt-2 border-t border-brand-primary md:table-cell md:p-4 md:border-none md:pt-4 md:mt-0">
                                    <div className="flex justify-end items-center gap-2 md:justify-center">
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