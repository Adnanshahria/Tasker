// Style utilities for Assignment Tracker - Compact & Colorful

export const getPriorityStyle = (priority: string) => {
    const p = priority?.toLowerCase() || '';
    if (p.includes('urgent') || p.includes('জরুরি') || p.includes('high')) {
        return {
            text: 'text-red-300',
            pillBg: 'bg-red-500/25',
            border: 'border-l-red-500',
            rowBg: 'border-l-2 border-l-red-500',
            glow: '0 0 8px rgba(239, 68, 68, 0.4)'
        };
    }
    if (p.includes('medium') || p.includes('মাঝারি')) {
        return {
            text: 'text-amber-300',
            pillBg: 'bg-amber-500/25',
            border: 'border-l-amber-500',
            rowBg: 'border-l-2 border-l-amber-400',
            glow: '0 0 8px rgba(245, 158, 11, 0.3)'
        };
    }
    return {
        text: 'text-emerald-300',
        pillBg: 'bg-emerald-500/20',
        border: 'border-l-emerald-600',
        rowBg: 'border-l-2 border-l-emerald-600',
        glow: '0 0 6px rgba(16, 185, 129, 0.2)'
    };
};

export const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete') || s.includes('সম্পন্ন') || s.includes('done')) {
        return 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20';
    }
    if (s.includes('progress') || s.includes('চলছে') || s.includes('ongoing')) {
        return 'bg-amber-500/30 text-amber-300 border-amber-400/50 shadow-amber-500/20';
    }
    return 'bg-slate-500/30 text-slate-300 border-slate-400/50';
};

export const getTypeStyle = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('exam') || t.includes('পরীক্ষা')) {
        return { bg: 'bg-rose-500/25', text: 'text-rose-300', border: 'border-rose-500/40' };
    }
    if (t.includes('quiz') || t.includes('কুইজ')) {
        return { bg: 'bg-amber-500/25', text: 'text-amber-300', border: 'border-amber-500/40' };
    }
    if (t.includes('project') || t.includes('প্রজেক্ট')) {
        return { bg: 'bg-indigo-500/25', text: 'text-indigo-300', border: 'border-indigo-500/40' };
    }
    if (t.includes('assignment') || t.includes('অ্যাসাইনমেন্ট')) {
        return { bg: 'bg-blue-500/25', text: 'text-blue-300', border: 'border-blue-500/40' };
    }
    if (t.includes('lab') || t.includes('ল্যাব')) {
        return { bg: 'bg-cyan-500/25', text: 'text-cyan-300', border: 'border-cyan-500/40' };
    }
    if (t.includes('presentation') || t.includes('প্রেজেন্টেশন')) {
        return { bg: 'bg-purple-500/25', text: 'text-purple-300', border: 'border-purple-500/40' };
    }
    return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' };
};

// Legacy function for backward compatibility
export const getTypeColor = (type: string) => {
    const style = getTypeStyle(type);
    return style.text;
};
