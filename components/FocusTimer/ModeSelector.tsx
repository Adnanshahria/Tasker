import React from 'react';
import { TimerMode } from '../../types';

interface ModeSelectorProps {
    currentMode: TimerMode;
    onModeChange: (mode: TimerMode) => void;
    isActive: boolean;
}

const modes: { mode: TimerMode; label: string }[] = [
    { mode: 'pomodoro', label: 'Focus' },
    { mode: 'shortBreak', label: 'Short' },
    { mode: 'longBreak', label: 'Long' },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({
    currentMode,
    onModeChange,
    isActive,
}) => {
    return (
        <div className="flex bg-slate-800/60 rounded-lg p-0.5">
            {modes.map(({ mode, label }) => {
                const isSelected = currentMode === mode;

                return (
                    <button
                        key={mode}
                        onClick={() => !isActive && onModeChange(mode)}
                        disabled={isActive}
                        className={`
              px-4 py-1.5 text-xs font-medium rounded-md transition-all
              ${isSelected
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-slate-200'}
              ${isActive ? 'cursor-not-allowed opacity-50' : ''}
            `}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
};

export default ModeSelector;
