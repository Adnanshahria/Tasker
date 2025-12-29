import React from 'react';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';

interface HeroBannerProps {
    welcomeText: string;
    userName: string;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ welcomeText, userName }) => (
    <div className="relative h-16 md:h-36 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-2 md:p-5 w-full">
            <div className="flex items-center gap-2 md:gap-4">
                <div className="w-8 h-8 md:w-14 md:h-14 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-xl">
                    <Sparkles size={16} className="text-indigo-600 md:hidden" />
                    <Sparkles size={28} className="text-indigo-600 hidden md:block" />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-sm md:text-2xl font-bold text-white truncate">{welcomeText}, {userName}</h1>
                    <p className="text-white/70 font-medium text-[10px] md:text-sm">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
                </div>
            </div>
        </div>
    </div>
);

export default HeroBanner;
