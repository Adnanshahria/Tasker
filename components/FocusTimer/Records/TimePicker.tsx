import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
    hour: number;
    minute: number;
    ampm: 'am' | 'pm';
    onChange: (hour: number, minute: number, ampm: 'am' | 'pm') => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ hour, minute, ampm, onChange }) => {
    const incrementHour = () => {
        const newHour = hour === 12 ? 1 : hour + 1;
        onChange(newHour, minute, ampm);
    };

    const decrementHour = () => {
        const newHour = hour === 1 ? 12 : hour - 1;
        onChange(newHour, minute, ampm);
    };

    const incrementMinute = () => {
        const newMinute = minute >= 55 ? 0 : minute + 5;
        onChange(hour, newMinute, ampm);
    };

    const decrementMinute = () => {
        const newMinute = minute <= 0 ? 55 : minute - 5;
        onChange(hour, newMinute, ampm);
    };

    const toggleAmPm = () => {
        onChange(hour, minute, ampm === 'am' ? 'pm' : 'am');
    };

    const SpinButton = ({
        value,
        onIncrement,
        onDecrement,
        label
    }: {
        value: string;
        onIncrement: () => void;
        onDecrement: () => void;
        label: string;
    }) => (
        <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</span>
            <div className="relative flex flex-col items-center bg-slate-800/80 rounded-2xl border border-slate-700/50 overflow-hidden">
                <button
                    onClick={onIncrement}
                    className="w-full p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all active:scale-95"
                >
                    <ChevronUp size={20} className="mx-auto" />
                </button>
                <div className="px-6 py-3 text-3xl font-bold text-white tabular-nums bg-gradient-to-b from-slate-700/30 to-slate-800/30 border-y border-slate-600/30">
                    {value}
                </div>
                <button
                    onClick={onDecrement}
                    className="w-full p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all active:scale-95"
                >
                    <ChevronDown size={20} className="mx-auto" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex items-center justify-center gap-2">
            {/* Hour */}
            <SpinButton
                value={String(hour).padStart(2, '0')}
                onIncrement={incrementHour}
                onDecrement={decrementHour}
                label="Hour"
            />

            {/* Separator */}
            <div className="text-3xl font-bold text-slate-500 mt-5">:</div>

            {/* Minute */}
            <SpinButton
                value={String(minute).padStart(2, '0')}
                onIncrement={incrementMinute}
                onDecrement={decrementMinute}
                label="Min"
            />

            {/* AM/PM Toggle */}
            <div className="flex flex-col items-center ml-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Period</span>
                <div className="flex flex-col bg-slate-800/80 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <button
                        onClick={() => ampm !== 'am' && onChange(hour, minute, 'am')}
                        className={`px-4 py-3 text-sm font-bold transition-all ${ampm === 'am'
                                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-inner'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
                            }`}
                    >
                        AM
                    </button>
                    <div className="h-px bg-slate-700/50" />
                    <button
                        onClick={() => ampm !== 'pm' && onChange(hour, minute, 'pm')}
                        className={`px-4 py-3 text-sm font-bold transition-all ${ampm === 'pm'
                                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-inner'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
                            }`}
                    >
                        PM
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimePicker;
