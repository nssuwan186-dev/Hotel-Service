import React, { useState, useMemo } from 'react';
import { Room } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface RoomsDBViewProps {
    rooms: Room[];
    onAdd: () => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
}

const RoomsDBView: React.FC<RoomsDBViewProps> = ({ rooms, onAdd, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRooms = useMemo(() => {
        const sorted = [...rooms].sort((a,b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
        if (!searchTerm) {
            return sorted;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return sorted.filter(room => 
            room.roomNumber.toLowerCase().includes(lowercasedTerm) ||
            room.roomType.toLowerCase().includes(lowercasedTerm)
        );
    }, [rooms, searchTerm]);

    const statusStyle = (status: Room['status']) => {
        switch (status) {
            case 'ว่าง': return 'bg-green-100 dark:bg-green-900/70 text-green-800 dark:text-green-300';
            case 'ไม่ว่าง': return 'bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-300';
            case 'ทำความสะอาด': return 'bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-300';
            case 'ปิดปรับปรุง': return 'bg-yellow-100 dark:bg-yellow-900/70 text-yellow-800 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
                <div className="relative w-full sm:w-72">
                    <input 
                        type="text"
                        placeholder="ค้นหา (เลขห้อง, ประเภท...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-primary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent pl-10"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
                <button onClick={onAdd} className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 whitespace-nowrap shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <PlusIcon /> เพิ่มห้องใหม่
                </button>
            </div>
            <div className="bg-primary rounded-xl shadow-lg border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-sm">
                        <thead className="border-b border-border">
                            <tr>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">เลขห้อง</th>
                                <th className="p-4 font-semibold text-xs sm:text-sm uppercase text-text-muted tracking-wider">ประเภท</th>
                                <th className="p-4 font-semibold text-right text-xs sm:text-sm uppercase text-text-muted tracking-wider">ราคา (บาท)</th>
                                <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-text-muted tracking-wider">สถานะ</th>
                                <th className="p-4 font-semibold text-center text-xs sm:text-sm uppercase text-text-muted tracking-wider">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRooms.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-text-muted">
                                     {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : "ไม่มีข้อมูลห้องพัก"}
                                </td></tr>
                            ) : (
                                filteredRooms.map((room) => (
                                    <tr key={room.id} className="border-b border-border last:border-b-0 hover:bg-secondary transition-colors">
                                        <td className="p-4 font-medium">{room.roomNumber}</td>
                                        <td className="p-4">{room.roomType}</td>
                                        <td className="p-4 text-right">{room.price.toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusStyle(room.status)}`}>
                                                {room.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => onEdit(room)} className="p-2 text-yellow-500 hover:text-yellow-400 rounded-lg hover:bg-primary transition-colors"><EditIcon /></button>
                                                <button onClick={() => onDelete(room)} className="p-2 text-red-500 hover:text-red-400 rounded-lg hover:bg-primary transition-colors"><TrashIcon /></button>
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

export default RoomsDBView;