import React, { useState, useMemo } from 'react';
import { Task } from '../../types';
import { formatISODate } from '../../services/utils';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface TasksViewProps {
    tasks: Task[];
    onEditTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
}

const TaskCard: React.FC<{ task: Task; onEdit: () => void; onDelete: () => void; }> = ({ task, onEdit, onDelete }) => {
    const priorityClasses: Record<Task['priority'], { bg: string, text: string, border: string }> = {
        High: { bg: 'bg-red-100 dark:bg-red-900/70', text: 'text-red-800 dark:text-red-300', border: 'border-red-500' },
        Medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/70', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-500' },
        Low: { bg: 'bg-green-100 dark:bg-green-900/70', text: 'text-green-800 dark:text-green-300', border: 'border-green-500' },
    };

    const p = priorityClasses[task.priority];
    const isDoneOrCancelled = task.status === 'Done' || task.status === 'Cancelled';

    return (
        <div className={`bg-secondary p-3 rounded-lg border-l-4 ${p.border} shadow-sm ${isDoneOrCancelled ? 'opacity-70' : ''}`}>
            <div className={`text-sm font-semibold mb-1 ${isDoneOrCancelled ? 'line-through text-text-muted' : 'text-text-main'}`}>{task.title}</div>
            <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-text-muted">
                    <span>{task.assignee?.name || 'N/A'}</span>
                    {task.room && <span className="font-bold">| {task.room.roomNumber}</span>}
                </div>
                 <div className="flex items-center gap-1.5">
                    <button onClick={onEdit} className="p-2 text-yellow-500 hover:text-yellow-400 transition-colors"><EditIcon/></button>
                    <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-400 transition-colors"><TrashIcon/></button>
                </div>
            </div>
        </div>
    );
};


const TasksView: React.FC<TasksViewProps> = ({ tasks, onEditTask, onDeleteTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { weekDates, monthYearLabel } = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        
        const firstDay = dates[0];
        const lastDay = dates[6];
        const label = firstDay.getMonth() === lastDay.getMonth()
            ? `${firstDay.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}`
            : `${firstDay.toLocaleString('th-TH', { day: 'numeric', month: 'short' })} - ${lastDay.toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;

        return { weekDates: dates, monthYearLabel: label };
    }, [currentDate]);

    const tasksByDate = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const dateKey = task.dueDate;
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);

    const goToPreviousWeek = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    };

    const goToNextWeek = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    };

    const weekDayLabels = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-4 gap-3">
                 <div className="flex items-center gap-2">
                    <button onClick={goToPreviousWeek} className="px-4 py-2 bg-primary rounded-md hover:bg-opacity-80 border border-border">{"<"}</button>
                    <span className="w-auto sm:w-48 text-center font-semibold text-text-main">
                        {monthYearLabel}
                    </span>
                    <button onClick={goToNextWeek} className="px-4 py-2 bg-primary rounded-md hover:bg-opacity-80 border border-border">{">"}</button>
                </div>
            </div>
            
            {/* Desktop View: 7-day grid */}
            <div className="hidden md:grid flex-1 grid-cols-7 gap-3 min-h-[60vh]">
                {weekDates.map((date, index) => {
                    const isoDate = formatISODate(date);
                    const dayTasks = tasksByDate[isoDate] || [];
                    const isToday = formatISODate(new Date()) === isoDate;
                    
                    return (
                        <div key={isoDate} className="bg-primary rounded-xl border border-border flex flex-col p-3">
                            <div className="text-center mb-3">
                                <p className="text-xs font-semibold text-text-muted">{weekDayLabels[index]}</p>
                                <p className={`font-bold text-lg ${isToday ? 'text-accent' : 'text-text-main'}`}>{date.getDate()}</p>
                            </div>
                            <div className="space-y-2 flex-1 overflow-y-auto">
                                {dayTasks.length > 0 ? (
                                    dayTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={() => onEditTask(task)} onDelete={() => onDeleteTask(task)} />
                                    ))
                                ) : (
                                    <div className="text-center text-xs text-text-muted pt-4">ไม่มีงาน</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile View: Vertical List */}
            <div className="md:hidden flex-1 space-y-3 overflow-y-auto pb-4">
                 {weekDates.map((date, index) => {
                    const isoDate = formatISODate(date);
                    const dayTasks = tasksByDate[isoDate] || [];
                    const isToday = formatISODate(new Date()) === isoDate;

                    return (
                        <div key={isoDate} className="bg-primary rounded-xl border border-border p-3">
                            <div className={`flex items-baseline gap-2 mb-2 pb-2 border-b border-border`}>
                                <h4 className={`font-bold text-lg ${isToday ? 'text-accent' : 'text-text-main'}`}>{date.getDate()}</h4>
                                <span className={`font-semibold text-sm ${isToday ? 'text-accent' : 'text-text-muted'}`}>{weekDayLabels[index]}</span>
                            </div>
                            <div className="space-y-2">
                                {dayTasks.length > 0 ? (
                                    dayTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={() => onEditTask(task)} onDelete={() => onDeleteTask(task)} />
                                    ))
                                ) : (
                                    <p className="text-center text-xs text-text-muted py-2">ไม่มีงาน</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TasksView;