
export type BorderColor = 'blue' | 'red' | 'white' | 'none' | 'yellow' | 'cyan' | 'purple' | 'green' | 'orange' | 'pink';

// Get border style object for inline styles (more reliable than Tailwind arbitrary values)
export const getBorderStyle = (borderColor: BorderColor) => {
    switch (borderColor) {
        case 'blue': return { borderColor: 'rgb(59, 130, 246)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' };
        case 'red': return { borderColor: 'rgb(239, 68, 68)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' };
        case 'white': return { borderColor: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)' };
        case 'yellow': return { borderColor: 'rgb(234, 179, 8)', boxShadow: '0 0 15px rgba(234, 179, 8, 0.5)' };
        case 'cyan': return { borderColor: 'rgb(6, 182, 212)', boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)' };
        case 'purple': return { borderColor: 'rgb(168, 85, 247)', boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)' };
        case 'green': return { borderColor: 'rgb(34, 197, 94)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' };
        case 'orange': return { borderColor: 'rgb(249, 115, 22)', boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)' };
        case 'pink': return { borderColor: 'rgb(236, 72, 153)', boxShadow: '0 0 15px rgba(236, 72, 153, 0.5)' };
        default: return { borderColor: 'rgba(255, 255, 255, 0.05)', boxShadow: 'none' };
    }
};

// Get border classes (kept for backward compatibility, but use getBorderStyle for better results)
export const getBorderClass = (borderColor: BorderColor, baseClass: string = '') => {
    // Just return base class with border, actual glow should use inline styles via getBorderStyle
    return `${baseClass}`.trim();
};
