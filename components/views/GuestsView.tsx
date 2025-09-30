import React, { useState, useMemo } from 'react';
import { Guest } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface GuestsViewProps {
    guests: Guest[];
    onAdd: () => void;
    onEdit: (guest: Guest) => void;
    onDelete: (guest: Guest) => void;
}

const GuestsView: React.FC<GuestsViewProps> = ({ guests, onAdd, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredGuests = useMemo(() => {
        if (!searchTerm) {
            return guests;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return guests.filter(guest => 
            guest.fullName.toLowerCase().includes(lowercasedTerm) ||
            guest.phoneNumber?.toLowerCase().includes(lowercasedTerm) ||
            guest.idCardNumber?.toLowerCase().includes(lowercasedTerm) ||
            guest.address?.toLowerCase().includes(lowercasedTerm)
        );
    }, [guests, searchTerm]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
                <div className="relative w-full sm:w-72">
                    <input 
                        type="text"
                        placeholder="ค้นหา (ชื่อ, เบอร์โทร, ...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-primary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent pl-10"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
                <button onClick={onAdd} className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 whitespace-nowrap shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <PlusIcon /> เพิ่มผู้เข้าพักใหม่
                </button>
            </div>
            <div className="bg-primary rounded-xl shadow-lg border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-sm">
                        <thead className="border-b border-border">
                            <tr>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">ชื่อ-สกุล</th>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">เบอร์โทรศัพท์</th>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">เลขบัตรประชาชน</th>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">ที่อยู่</th>
                                <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-text-muted tracking-wider">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-text-muted">
                                    {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : "ไม่มีข้อมูลผู้เข้าพัก"}
                                </td></tr>
                            ) : (
                                filteredGuests.map(guest => (
                                    <tr key={guest.id} className="border-b border-border last:border-b-0 hover:bg-secondary transition-colors">
                                        <td className="p-4 font-medium">{guest.fullName}</td>
                                        <td className="p-4">{guest.phoneNumber || '-'}</td>
                                        <td className="p-4">{guest.idCardNumber || '-'}</td>
                                        <td className="p-4 truncate max-w-xs">{guest.address || '-'}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => onEdit(guest)} className="p-2 text-yellow-500 hover:text-yellow-400 rounded-lg hover:bg-primary transition-colors"><EditIcon /></button>
                                                {guest.status === 'active' && <button onClick={() => onDelete(guest)} className="p-2 text-red-500 hover:text-red-400 rounded-lg hover:bg-primary transition-colors"><TrashIcon /></button>}
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

export default GuestsView;