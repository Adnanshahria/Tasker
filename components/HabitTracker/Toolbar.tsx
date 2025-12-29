import React from 'react';
import { Plus, Check, ChevronDown } from 'lucide-react';
import { MONTHS } from './translations';

interface ToolbarProps {
    title: string;
    addLabel: string;
    selectedMonth: number;
    selectedYear: number;
    showPicker: boolean;
    yearOptions: number[];
    onPickerToggle: () => void;
    onMonthSelect: (m: number) => void;
    onYearSelect: (y: number) => void;
    onAddClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    title, addLabel, selectedMonth, selectedYear, showPicker, yearOptions,
    onPickerToggle, onMonthSelect, onYearSelect, onAddClick
}) => (
    <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/10 border border-emerald-500/20 p-2 md:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 md:gap-4 shadow-lg">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <h2 className="text-xs md:text-lg font-bold text-white px-2 md:px-3 border-r border-white/10 flex items-center gap-1.5 md:gap-2">
                <span className="w-6 h-6 md:w-8 md:h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Check size={12} strokeWidth={3} className="md:hidden" />
                    <Check size={18} strokeWidth={3} className="hidden md:block" />
                </span>
                <span className="hidden sm:inline">{title}</span>
            </h2>
            <div className="relative">
                <button onClick={onPickerToggle} className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-xs md:text-sm font-medium hover:bg-slate-700">
                    {MONTHS[selectedMonth]} {selectedYear}
                    <ChevronDown size={14} className="md:hidden transition-transform" style={{ transform: showPicker ? 'rotate(180deg)' : 'none' }} />
                    <ChevronDown size={16} className="hidden md:block transition-transform" style={{ transform: showPicker ? 'rotate(180deg)' : 'none' }} />
                </button>
                {showPicker && (
                    <div className="absolute top-full mt-2 left-0 bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-2xl z-50 min-w-[280px]">
                        <select value={selectedYear} onChange={e => onYearSelect(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none mb-3">
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="grid grid-cols-3 gap-2">
                            {MONTHS.map((m, i) => (
                                <button key={m} onClick={() => onMonthSelect(i)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedMonth === i ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    {m.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
        <button onClick={onAddClick} className="flex items-center gap-1 md:gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-2 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all shrink-0">
            <Plus size={12} className="md:hidden" />
            <Plus size={16} className="hidden md:block" />
            <span className="hidden sm:inline">{addLabel}</span>
            <span className="sm:hidden">+</span>
        </button>
    </div>
);

export default Toolbar;
