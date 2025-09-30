

import React, { useState, useMemo } from 'react';
import { Expense } from '../../types';
import { formatISODate, formatThaiDate } from '../../services/utils';
import { SearchIcon } from '../icons/SearchIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface ExpenseHistoryViewProps {
    allExpenses: Record<string, Expense[]>;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
}

const getDefaultDateRange = (allExpenses: Record<string, Expense[]>) => {
    const expenseDates = Object.keys(allExpenses);
    if (expenseDates.length === 0) {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return {
            firstDay: formatISODate(firstDay),
            lastDay: formatISODate(lastDay),
        };
    }

    const firstDay = expenseDates.reduce((a, b) => a < b ? a : b, expenseDates[0]);
    const lastDay = expenseDates.reduce((a, b) => a > b ? a : b, expenseDates[0]);
    
    return { firstDay, lastDay };
};


const ExpenseHistoryView: React.FC<ExpenseHistoryViewProps> = ({ allExpenses, onEdit, onDelete }) => {
    const initialDateRange = useMemo(() => getDefaultDateRange(allExpenses), [allExpenses]);

    const [startDate, setStartDate] = useState(initialDateRange.firstDay);
    const [endDate, setEndDate] = useState(initialDateRange.lastDay);
    const [searchTerm, setSearchTerm] = useState('');

    const { groupedExpenses, totalAmount } = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        let total = 0;
        const filtered: Expense[] = [];

        Object.keys(allExpenses).forEach(date => {
            if (date >= startDate && date <= endDate) {
                allExpenses[date].forEach(expense => {
                    if (
                        expense.category.toLowerCase().includes(lowercasedTerm) ||
                        expense.note.toLowerCase().includes(lowercasedTerm)
                    ) {
                        filtered.push(expense);
                        total += expense.amount;
                    }
                });
            }
        });

        const grouped = filtered
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .reduce((acc, expense) => {
                const dateKey = expense.date;
                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push(expense);
                return acc;
            }, {} as Record<string, Expense[]>);

        return { groupedExpenses: grouped, totalAmount: total };
    }, [allExpenses, startDate, endDate, searchTerm]);
    
    const hasExpenses = Object.keys(groupedExpenses).length > 0;

    return (
        <div>
            {/* Filter and Control Bar */}
            <div className="bg-primary p-4 rounded-xl shadow-lg border border-border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">ตั้งแต่วันที่</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">ถึงวันที่</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                    </div>
                     <div className="relative">
                         <label className="block text-sm font-medium text-text-muted mb-1">ค้นหา</label>
                        <input 
                            type="text"
                            placeholder="ค้นหาหมวดหมู่, หมายเหตุ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-secondary border border-border text-text-main px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent pl-10"
                        />
                        <div className="absolute bottom-2.5 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary and Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div className="bg-primary p-3 rounded-lg border border-border shadow-sm">
                    <span className="text-text-muted">ยอดรวมค่าใช้จ่าย: </span>
                    <span className="font-bold text-xl text-red-500">฿{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>


            {/* Expense List */}
            <div className="space-y-4">
                {!hasExpenses ? (
                    <div className="text-center p-10 bg-primary rounded-xl text-text-muted border border-border">ไม่มีข้อมูลค่าใช้จ่ายในช่วงเวลาที่เลือก</div>
                ) : (
                    Object.entries(groupedExpenses).map(([date, expensesOnDate]) => (
                        <div key={date} className="bg-primary p-4 rounded-xl shadow-lg border border-border">
                            <h4 className="font-semibold text-text-main mb-3 border-b border-border pb-2">
                                {formatThaiDate(date)}
                            </h4>
                            <div className="space-y-2">
                                {/* FIX: Cast expensesOnDate to Expense[] to resolve an error where `expense` was inferred as `unknown`, preventing access to `expense.amount`. */}
                                {(expensesOnDate as Expense[]).map(expense => (
                                    <div key={expense.id} className="flex justify-between items-center bg-secondary p-3 rounded-lg border border-border">
                                        <div>
                                            <p className="font-medium text-text-main">{expense.category}</p>
                                            {expense.note && <p className="text-xs text-text-muted">{expense.note}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-red-500 whitespace-nowrap">฿{expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            <button onClick={() => onEdit(expense)} className="p-2 text-yellow-500 hover:text-yellow-400 transition-colors"><EditIcon /></button>
                                            <button onClick={() => onDelete(expense)} className="p-2 text-red-500 hover:text-red-400 transition-colors"><TrashIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
};

export default ExpenseHistoryView;
