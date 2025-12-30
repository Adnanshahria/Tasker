import React, { useRef, useEffect } from 'react';

interface TimePickerProps {
    hour: number;
    minute: number;
    ampm: 'am' | 'pm';
    onChange: (hour: number, minute: number, ampm: 'am' | 'pm') => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ hour, minute, ampm, onChange }) => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    const periods = ['am', 'pm'] as const;

    // Scroll refs
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const ampmRef = useRef<HTMLDivElement>(null);

    // Helper to scroll to selected item
    const scrollToItem = (container: HTMLDivElement | null, index: number) => {
        if (!container) return;
        const itemHeight = 40; // Height of each item
        container.scrollTop = index * itemHeight;
    };

    // Initial scroll position
    useEffect(() => {
        if (hourRef.current) scrollToItem(hourRef.current, hours.indexOf(hour));
    }, [hour]);

    useEffect(() => {
        if (minuteRef.current) scrollToItem(minuteRef.current, minutes.indexOf(minute));
    }, [minute]);

    useEffect(() => {
        if (ampmRef.current) scrollToItem(ampmRef.current, periods.indexOf(ampm));
    }, [ampm]);

    const Column = ({
        items,
        value,
        onSelect,
        formatItem = (i: any) => i
    }: {
        items: any[],
        value: any,
        onSelect: (val: any) => void,
        formatItem?: (val: any) => React.ReactNode
    }) => (
        <div className="flex-1 h-40 relative overflow-hidden bg-slate-800/50 rounded-xl border border-slate-700/50">
            {/* Selection Highlight */}
            <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-blue-600/20 border-y border-blue-500/30 pointer-events-none z-10" />

            {/* Scrollable list */}
            <div
                className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[60px]"
                onScroll={(e) => {
                    const container = e.target as HTMLDivElement;
                    const itemHeight = 40;
                    const index = Math.round(container.scrollTop / itemHeight);
                    const selectedItem = items[index];
                    if (selectedItem !== undefined && selectedItem !== value) {
                        // Debounce or check if we want to update dynamically
                        // For now, let's just highlight. 
                        // To make it fully interactive scroll, we'd need more complex logic.
                        // Simpler approach: On click only? Or nice scroll?
                        // Let's rely on click for reliability first, scroll for view.
                    }
                }}
            >
                {items.map((item) => (
                    <button
                        key={item}
                        onClick={() => onSelect(item)}
                        className={`w-full h-10 flex items-center justify-center snap-center transition-colors ${item === value ? 'text-white font-bold scale-110' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {formatItem(item)}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex items-center gap-2">
            {/* Hour Column */}
            <div className="flex-1 h-40 relative overflow-hidden bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-blue-600/20 border-y border-blue-500/30 pointer-events-none z-0" />
                <div className="h-full overflow-y-auto no-scrollbar py-[60px] text-center">
                    {hours.map((h) => (
                        <button
                            key={h}
                            onClick={() => onChange(h, minute, ampm)}
                            className={`w-full h-10 flex items-center justify-center transition-all ${h === hour
                                ? 'text-blue-400 font-bold text-xl'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {String(h).padStart(2, '0')}
                        </button>
                    ))}
                </div>
            </div>

            <span className="text-2xl text-slate-600 font-light">:</span>

            {/* Minute Column */}
            <div className="flex-1 h-40 relative overflow-hidden bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-blue-600/20 border-y border-blue-500/30 pointer-events-none z-0" />
                <div className="h-full overflow-y-auto no-scrollbar py-[60px] text-center">
                    {minutes.map((m) => (
                        <button
                            key={m}
                            onClick={() => onChange(hour, m, ampm)}
                            className={`w-full h-10 flex items-center justify-center transition-all ${m === minute
                                ? 'text-blue-400 font-bold text-xl'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {String(m).padStart(2, '0')}
                        </button>
                    ))}
                </div>
            </div>

            {/* AM/PM Toggle (Vertical List) */}
            <div className="w-20 h-40 relative overflow-hidden bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-blue-600/20 border-y border-blue-500/30 pointer-events-none z-0" />
                <div className="h-full flex flex-col items-center justify-center gap-2">
                    <button
                        onClick={() => onChange(hour, minute, 'am')}
                        className={`w-full h-10 flex items-center justify-center transition-all ${ampm === 'am' ? 'text-blue-400 font-bold text-lg' : 'text-slate-500'
                            }`}
                    >
                        AM
                    </button>
                    <button
                        onClick={() => onChange(hour, minute, 'pm')}
                        className={`w-full h-10 flex items-center justify-center transition-all ${ampm === 'pm' ? 'text-blue-400 font-bold text-lg' : 'text-slate-500'
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
