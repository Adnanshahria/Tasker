import React from 'react';
import { Play, Pause } from 'lucide-react';

interface TimerControlsProps {
    isActive: boolean;
    onToggle: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({ isActive, onToggle }) => {
    return (
        <div className="flex justify-center">
            <button
                onClick={onToggle}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-400 active:scale-95 transition-all shadow-lg shadow-blue-500/25"
            >
                {isActive ? (
                    <Pause size={24} className="text-white" fill="white" />
                ) : (
                    <Play size={24} className="text-white ml-1" fill="white" />
                )}
            </button>
        </div>
    );
};

export default TimerControls;
