import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import DatePicker from './ui/DatePicker';
import TimePicker from './ui/TimePicker';

interface AssignmentModalProps {
    isOpen: boolean;
    editingId: string | null;
    title: string;
    description: string;
    subject: string;
    date: string;
    type: string;
    priority: string;
    status: string;
    startTime: string;
    endTime: string;
    setTitle: (v: string) => void;
    setDescription: (v: string) => void;
    setSubject: (v: string) => void;
    setDate: (v: string) => void;
    setType: (v: string) => void;
    setPriority: (v: string) => void;
    setStatus: (v: string) => void;
    setStartTime: (v: string) => void;
    setEndTime: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    subjects: string[];
    types: string[];
    statuses: string[];
    priorities: string[];
    lang: 'en' | 'bn';
}

const T = {
    en: { title: 'Title', description: 'Description', subject: 'Subject', dueDate: 'Due', type: 'Type', priority: 'Priority', status: 'Status', startTime: 'Start (opt)', endTime: 'End (opt)', duration: 'Duration', cancel: 'Cancel', save: 'Save', editTitle: 'Edit Task', newTitle: 'New Task', placeholder: 'Task name', descPlaceholder: 'Description (optional)', select: 'Select...', selectDate: 'Select date', selectTime: 'Select time' },
    bn: { title: 'শিরোনাম', description: 'বিবরণ', subject: 'বিষয়', dueDate: 'তারিখ', type: 'ধরন', priority: 'গুরুত্ব', status: 'স্ট্যাটাস', startTime: 'শুরু (ঐচ্ছিক)', endTime: 'শেষ (ঐচ্ছিক)', duration: 'সময়কাল', cancel: 'বাতিল', save: 'সংরক্ষণ', editTitle: 'সম্পাদনা', newTitle: 'নতুন টাস্ক', placeholder: 'টাস্কের নাম', descPlaceholder: 'বিবরণ (ঐচ্ছিক)', select: 'নির্বাচন...', selectDate: 'তারিখ নির্বাচন', selectTime: 'সময় নির্বাচন' }
};

const calcDur = (s: string, e: string) => {
    if (!s || !e) return '-';
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    let m = (eh * 60 + em) - (sh * 60 + sm);
    if (m < 0) m += 24 * 60;
    const h = Math.floor(m / 60);
    return h ? (m % 60 ? `${h}h ${m % 60}m` : `${h}h`) : `${m}m`;
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const AssignmentModal: React.FC<AssignmentModalProps> = ({
    isOpen, editingId, title, description, subject, date, type, priority, status, startTime, endTime,
    setTitle, setDescription, setSubject, setDate, setType, setPriority, setStatus, setStartTime, setEndTime,
    onSubmit, onClose, subjects, types, statuses, priorities, lang = 'bn'
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    if (!isOpen) return null;
    const t = T[lang];

    const inputCls = "w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all";
    const labelCls = "block text-xs uppercase font-bold text-slate-400 mb-1";
    const clickableInputCls = "w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm cursor-pointer hover:border-indigo-500/50 transition-all flex items-center justify-between gap-2";

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">{editingId ? t.editTitle : t.newTitle}</h3>
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className={labelCls}>{t.title}</label>
                            <input required value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder={t.placeholder} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelCls}>{t.description}</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls + " resize-none"} placeholder={t.descPlaceholder} />
                        </div>

                        {/* Subject + Due Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>{t.subject}</label>
                                <select required value={subject} onChange={e => setSubject(e.target.value)} className={inputCls}>
                                    <option value="">{t.select}</option>
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>{t.dueDate}</label>
                                <button
                                    type="button"
                                    onClick={() => setShowDatePicker(true)}
                                    className={clickableInputCls}
                                >
                                    <span className={date ? 'text-white' : 'text-slate-500'}>
                                        {date ? formatDate(date) : t.selectDate}
                                    </span>
                                    <Calendar size={16} className="text-indigo-400" />
                                </button>
                            </div>
                        </div>

                        {/* Start Time + End Time + Duration */}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className={labelCls}>{t.startTime}</label>
                                <button
                                    type="button"
                                    onClick={() => setShowStartTimePicker(true)}
                                    className={clickableInputCls}
                                >
                                    <span className={startTime ? 'text-white' : 'text-slate-500'}>
                                        {startTime ? formatTime(startTime) : '--:--'}
                                    </span>
                                    <Clock size={14} className="text-indigo-400" />
                                </button>
                            </div>
                            <div>
                                <label className={labelCls}>{t.endTime}</label>
                                <button
                                    type="button"
                                    onClick={() => setShowEndTimePicker(true)}
                                    className={clickableInputCls}
                                >
                                    <span className={endTime ? 'text-white' : 'text-slate-500'}>
                                        {endTime ? formatTime(endTime) : '--:--'}
                                    </span>
                                    <Clock size={14} className="text-indigo-400" />
                                </button>
                            </div>
                            <div>
                                <label className={labelCls}>{t.duration}</label>
                                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-indigo-400 text-sm font-mono text-center">
                                    {calcDur(startTime, endTime)}
                                </div>
                            </div>
                        </div>

                        {/* Type + Priority + Status */}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className={labelCls}>{t.type}</label>
                                <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>{t.priority}</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>{t.status}</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-medium">
                                {t.cancel}
                            </button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 font-medium shadow-lg shadow-indigo-500/25">
                                {t.save}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Custom Date Picker */}
            <DatePicker
                isOpen={showDatePicker}
                value={date}
                onChange={setDate}
                onClose={() => setShowDatePicker(false)}
            />

            {/* Custom Time Pickers */}
            <TimePicker
                isOpen={showStartTimePicker}
                value={startTime}
                onChange={setStartTime}
                onClose={() => setShowStartTimePicker(false)}
                label="Start Time"
            />

            <TimePicker
                isOpen={showEndTimePicker}
                value={endTime}
                onChange={setEndTime}
                onClose={() => setShowEndTimePicker(false)}
                label="End Time"
            />
        </>
    );
};

export default AssignmentModal;
