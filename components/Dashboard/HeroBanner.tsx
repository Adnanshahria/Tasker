import React from 'react';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';

interface HeroBannerProps {
    welcomeText: string;
    userName: string;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ welcomeText, userName }) => (
    <div className="relative h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 w-full">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                    <Sparkles size={32} className="text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">{welcomeText}, {userName}</h1>
                    <p className="text-white/70 font-medium">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
                </div>
            </div>
        </div>
    </div>
);

export default HeroBanner;
