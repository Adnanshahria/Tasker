import React from 'react';
import { Plus, Trash2, Edit2, Check, X, BookOpen, FileText, Activity, Flag } from 'lucide-react';

type Category = 'subjects' | 'types' | 'statuses' | 'priorities';

interface CategorySectionProps {
    category: Category;
    items: string[];
    config: { label: string; color: string; bg: string; border: string };
    t: Record<string, string>;
    editingItem: { category: Category; index: number; value: string } | null;
    newItem: { category: Category; value: string } | null;
    onStartEdit: (category: Category, index: number, value: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onEditChange: (value: string) => void;
    onStartNew: (category: Category) => void;
    onSaveNew: (category: Category) => void;
    onCancelNew: () => void;
    onNewChange: (value: string) => void;
    onDelete: (category: Category, index: number) => void;
}

const ICONS = { subjects: BookOpen, types: FileText, statuses: Activity, priorities: Flag };

const CategorySection: React.FC<CategorySectionProps> = ({
    category, items, config, t, editingItem, newItem,
    onStartEdit, onSaveEdit, onCancelEdit, onEditChange,
    onStartNew, onSaveNew, onCancelNew, onNewChange, onDelete
}) => {
    const Icon = ICONS[category];
    return (
        <div className={`bg-gradient-to-r ${config.bg} border ${config.border} rounded-xl overflow-hidden`}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Icon size={20} className={config.color} />
                    <h2 className="font-bold text-white">{config.label}</h2>
                    <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full">{items.length} {t.items}</span>
                </div>
                <button onClick={() => onStartNew(category)} className={`flex items-center gap-1 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all border border-slate-700 hover:border-slate-600`}>
                    {t.add}
                </button>
            </div>
            <div className="p-4">
                {items.length === 0 && <p className="text-slate-500 text-sm text-center py-4">{t.noItems}</p>}
                <div className="flex flex-wrap gap-2">
                    {items.map((item, idx) => (
                        <div key={idx} className="group flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 hover:border-slate-500 transition-all">
                            {editingItem?.category === category && editingItem?.index === idx ? (
                                <>
                                    <input autoFocus value={editingItem.value} onChange={e => onEditChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSaveEdit()} className="bg-transparent text-white text-sm outline-none border-b border-indigo-500 w-24" />
                                    <button onClick={onSaveEdit} className="p-1 text-green-400 hover:bg-green-500/10 rounded"><Check size={14} /></button>
                                    <button onClick={onCancelEdit} className="p-1 text-slate-400 hover:bg-slate-700 rounded"><X size={14} /></button>
                                </>
                            ) : (
                                <>
                                    <span className="text-slate-200 text-sm">{item}</span>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 ml-1 transition-opacity">
                                        <button onClick={() => onStartEdit(category, idx, item)} className="p-1 text-slate-400 hover:text-indigo-400 rounded"><Edit2 size={12} /></button>
                                        <button onClick={() => onDelete(category, idx)} className="p-1 text-slate-400 hover:text-red-400 rounded"><Trash2 size={12} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {newItem?.category === category && (
                        <div className="flex items-center gap-1 bg-slate-800 border-2 border-indigo-500/50 rounded-lg px-3 py-2">
                            <input autoFocus value={newItem.value} onChange={e => onNewChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSaveNew(category)} placeholder={t.enterName} className="bg-transparent text-white text-sm outline-none w-24 placeholder:text-slate-500" />
                            <button onClick={() => onSaveNew(category)} className="p-1 text-green-400 hover:bg-green-500/10 rounded"><Check size={14} /></button>
                            <button onClick={onCancelNew} className="p-1 text-slate-400 hover:bg-slate-700 rounded"><X size={14} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategorySection;
