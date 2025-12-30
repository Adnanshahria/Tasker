

export type BorderColor = 'blue' | 'red' | 'white' | 'none' | 'yellow' | 'cyan' | 'purple' | 'green' | 'orange' | 'pink';

export const getBorderClass = (borderColor: BorderColor, baseClass: string = '') => {
    switch (borderColor) {
        case 'blue': return `${baseClass} border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]`;
        case 'red': return `${baseClass} border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]`;
        case 'white': return `${baseClass} border border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.3)]`;
        case 'yellow': return `${baseClass} border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]`;
        case 'cyan': return `${baseClass} border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]`;
        case 'purple': return `${baseClass} border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]`;
        case 'green': return `${baseClass} border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]`;
        case 'orange': return `${baseClass} border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]`;
        case 'pink': return `${baseClass} border border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]`;
        default: return `${baseClass} border border-white/5`;
    }
};
