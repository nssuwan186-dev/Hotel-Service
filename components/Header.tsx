import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '../types';
import NotificationsDropdown from './common/NotificationsDropdown';
import { MenuIcon } from './icons/MenuIcon';
import { BellIcon } from './icons/BellIcon';
import { UserIcon } from './icons/UserIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface HeaderProps {
    onToggleSidebar: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    notifications: Notification[];
    onNotificationsUpdate: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, theme, onToggleTheme, notifications, onNotificationsUpdate }) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleToggleNotifications = () => {
        setIsNotificationsOpen(prev => {
            const willBeOpen = !prev;
            if (willBeOpen && unreadCount > 0) {
                onNotificationsUpdate(currentNotifications => 
                    currentNotifications.map(n => ({ ...n, read: true }))
                );
            }
            return willBeOpen;
        });
    };
    
    const handleClearNotifications = () => {
        onNotificationsUpdate([]);
        setIsNotificationsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-primary/80 backdrop-blur-lg p-4 flex justify-between items-center shadow-sm border-b border-border sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button
                    className="text-text-main md:hidden p-2 rounded-lg hover:bg-secondary"
                    onClick={onToggleSidebar}
                    aria-label="Open menu"
                >
                    <MenuIcon />
                </button>
                <h1 className="text-xl font-bold text-text-main hidden sm:block">ระบบจัดการโรงแรมวิพัฒน์</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <button 
                    onClick={onToggleTheme} 
                    className="text-text-main p-2 hover:bg-secondary rounded-full transition-colors"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                <div className="relative" ref={notificationsRef}>
                    <button onClick={handleToggleNotifications} className="relative text-text-main p-2 hover:bg-secondary rounded-full transition-colors">
                        <BellIcon />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 block h-5 w-5 rounded-full ring-2 ring-primary bg-red-500 text-white text-xs flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <NotificationsDropdown 
                            notifications={notifications} 
                            onClearAll={handleClearNotifications}
                        />
                    )}
                </div>
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white shadow-inner">
                   <UserIcon />
                </div>
            </div>
        </header>
    );
};

export default Header;