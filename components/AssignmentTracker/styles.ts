// Style utilities for Assignment Tracker

export const getPriorityStyle = (priority: string) => {
    const p = priority?.toLowerCase() || '';
    if (p.includes('urgent') || p.includes('জরুরি') || p.includes('high')) {
        return { text: 'text-red-400', pillBg: 'bg-red-500/20', border: 'border-l-red-500', rowBg: 'border-l-4 border-l-red-500' };
    }
    if (p.includes('medium') || p.includes('মাঝারি')) {
        return { text: 'text-amber-400', pillBg: 'bg-amber-500/20', border: 'border-l-amber-500', rowBg: 'border-l-4 border-l-amber-500' };
    }
    return { text: 'text-slate-400', pillBg: 'bg-slate-500/20', border: 'border-l-slate-600', rowBg: 'border-l-4 border-l-slate-600' };
};

export const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete') || s.includes('সম্পন্ন') || s.includes('done')) {
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
    if (s.includes('progress') || s.includes('চলছে') || s.includes('ongoing')) {
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

export const getTypeColor = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('exam') || t.includes('পরীক্ষা')) return 'text-rose-400';
    if (t.includes('quiz') || t.includes('কুইজ')) return 'text-amber-400';
    if (t.includes('project') || t.includes('প্রজেক্ট')) return 'text-indigo-400';
    if (t.includes('lab') || t.includes('ল্যাব')) return 'text-cyan-400';
    if (t.includes('presentation') || t.includes('প্রেজেন্টেশন')) return 'text-purple-400';
    return 'text-slate-400';
};
