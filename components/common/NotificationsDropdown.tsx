import React from 'react';
import { Notification } from '../../types';
import { timeAgo } from '../../services/utils';

interface NotificationsDropdownProps {
    notifications: Notification[];
    onClearAll: () => void;
}

const NotificationTypeIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    const colors = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    };
    return <div className={`w-2.5 h-2.5 mt-1.5 rounded-full ${colors[type]}`}></div>
};

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ notifications, onClearAll }) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-80 max-w-sm bg-primary rounded-lg shadow-2xl border border-border z-50">
            <div className="flex justify-between items-center p-3 border-b border-border">
                <h4 className="font-semibold text-text-main">การแจ้งเตือน</h4>
                {notifications.length > 0 && (
                    <button onClick={onClearAll} className="text-xs text-accent hover:underline">
                        ล้างทั้งหมด
                    </button>
                )}
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="text-center py-10 px-4 text-text-muted">
                        <p className="text-sm">ไม่มีการแจ้งเตือนในขณะนี้</p>
                    </div>
                ) : (
                    <ul>
                        {notifications.map(notif => (
                            <li key={notif.id} className="border-b border-border last:border-b-0 hover:bg-secondary transition-colors">
                                <div className="p-3 flex gap-3">
                                    <NotificationTypeIcon type={notif.type} />
                                    <div>
                                        <p className="text-sm text-text-main leading-snug">{notif.message}</p>
                                        <p className="text-xs text-text-muted mt-1">{timeAgo(notif.timestamp)}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationsDropdown;