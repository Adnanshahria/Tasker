import React from 'react';

interface TimerDisplayProps {
    formattedTime: string;
    isActive: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ formattedTime, isActive }) => {
    return (
        <div className="text-center py-6">
            <span
                className="text-6xl font-extralight text-white tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {formattedTime}
            </span>

            {isActive && (
                <div className="flex justify-center mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
            )}
        </div>
    );
};

export default TimerDisplay;
