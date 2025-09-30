import React, { useState, useMemo } from 'react';
import { Room, AdminBooking } from '../../types';
import { formatISODate } from '../../services/utils';
import { FormSelect } from '../AdminPanel';
import { SearchIcon } from '../icons/SearchIcon';

interface AvailabilityViewProps {
    rooms: Room[];
    bookings: AdminBooking[];
    onAddBooking: (defaults: { roomId: string; checkIn: string; checkOut: string }) => void;
}

const AvailabilityView: React.FC<AvailabilityViewProps> = ({ rooms, bookings, onAddBooking }) => {
    // State for filters
    const [checkIn, setCheckIn] = useState(formatISODate(new Date()));
    const [checkOut, setCheckOut] = useState(formatISODate(new Date(Date.now() + 86400000)));
    const [zone, setZone] = useState('all');
    const [floor, setFloor] = useState('all');
    const [roomType, setRoomType] = useState('all');

    // State for results
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const roomTypeOptions = useMemo(() => {
        const types = [...new Set(rooms.map(r => r.roomType))];
        return [{ value: 'all', label: 'ทุกประเภท' }, ...types.map(t => ({ value: t, label: t }))];
    }, [rooms]);

    const handleSearch = () => {
        setHasSearched(true);
        const searchStart = new Date(checkIn);
        const searchEnd = new Date(checkOut);
        
        if (searchEnd <= searchStart) {
            alert('วันที่เช็คเอาท์ต้องอยู่หลังวันที่เช็คอิน');
            setAvailableRooms([]);
            return;
        }

        const isRoomBooked = (roomId: string) => {
            return bookings.some(booking =>
                booking.roomId === roomId &&
                booking.status !== 'ยกเลิก' &&
                new Date(booking.checkIn) < searchEnd &&
                new Date(booking.checkOut) > searchStart
            );
        };

        const getRoomZone = (roomNumber: string) => roomNumber.charAt(0).toUpperCase();
        const getRoomFloor = (roomNumber: string) => {
             const match = roomNumber.match(/[AB](\d)/);
             return match ? match[1] : null;
        };

        const results = rooms.filter(room => {
            // Filter by zone
            if (zone !== 'all' && getRoomZone(room.roomNumber) !== zone) return false;
            // Filter by floor
            if (floor !== 'all') {
                const roomFloor = getRoomFloor(room.roomNumber);
                if (!roomFloor || roomFloor !== floor) return false;
            }
             // Filter by type
            if (roomType !== 'all' && room.roomType !== roomType) return false;
            
            // Check availability
            return !isRoomBooked(room.id);
        });

        setAvailableRooms(results);
    };

    const zoneOptions = [
        { value: 'all', label: 'ทุกโซน' },
        { value: 'A', label: 'ตึก A' },
        { value: 'B', label: 'ตึก B' },
        { value: 'N', label: 'บ้านน็อคดาวน์' },
    ];
    
    const floorOptions = [
        { value: 'all', label: 'ทุกชั้น' },
        { value: '1', label: 'ชั้น 1' },
        { value: '2', label: 'ชั้น 2' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-primary p-4 rounded-xl shadow-lg border border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
                    <div className="xl:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">เช็คอิน</label>
                            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">เช็คเอาท์</label>
                            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                    </div>
                    <FormSelect label="โซน" value={zone} onChange={e => setZone(e.target.value)} options={zoneOptions} />
                    <FormSelect label="ชั้น" value={floor} onChange={e => setFloor(e.target.value)} options={floorOptions} disabled={!['A', 'B'].includes(zone) && zone !== 'all'} />
                    <FormSelect label="ประเภทห้อง" value={roomType} onChange={e => setRoomType(e.target.value)} options={roomTypeOptions} />
                    <button onClick={handleSearch} className="w-full bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                        <SearchIcon /> ค้นหา
                    </button>
                </div>
            </div>

            {hasSearched && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">ผลการค้นหา: <span className="text-accent">พบห้องว่าง {availableRooms.length} ห้อง</span></h3>
                    {availableRooms.length === 0 ? (
                        <div className="text-center p-10 bg-primary rounded-xl text-text-muted border border-border">ไม่พบห้องว่างตามเงื่อนไขที่ระบุ</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {availableRooms.map(room => (
                                <div key={room.id} className="bg-primary rounded-xl shadow-md p-4 border border-border flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="text-xl font-bold text-text-main">{room.roomNumber}</h4>
                                            <span className="text-green-500 font-semibold">ว่าง</span>
                                        </div>
                                        <p className="text-sm text-text-muted">{room.roomType}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <p className="text-lg font-bold text-right text-accent">{room.price.toLocaleString()}<span className="text-xs font-normal text-text-muted"> /คืน</span></p>
                                        <button 
                                            onClick={() => onAddBooking({ roomId: room.id, checkIn, checkOut })}
                                            className="mt-2 w-full bg-accent text-white font-bold py-2 px-3 rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                                        >
                                            จองทันที
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default AvailabilityView;