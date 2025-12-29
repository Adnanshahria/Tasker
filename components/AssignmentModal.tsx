import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import DatePicker from './ui/DatePicker';
import TimePicker from './ui/TimePicker';
import DurationPicker from './ui/DurationPicker';
import AnimatedTimeDisplay from './ui/AnimatedTimeDisplay';

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
    en: { title: 'Title', description: 'Description', subject: 'Subject', dueDate: 'Due', type: 'Type', priority: 'Priority', status: 'Status', startTime: 'Start', endTime: 'End', duration: 'Duration', cancel: 'Cancel', save: 'Save', editTitle: 'Edit Task', newTitle: 'New Task', placeholder: 'Task name', descPlaceholder: 'Description (optional)', select: 'Select...', selectDate: 'Select date', selectTime: 'Select time' },
    bn: { title: 'শিরোনাম', description: 'বিবরণ', subject: 'বিষয়', dueDate: 'তারিখ', type: 'ধরন', priority: 'গুরুত্ব', status: 'স্ট্যাটাস', startTime: 'শুরু', endTime: 'শেষ', duration: 'সময়কাল', cancel: 'বাতিল', save: 'সংরক্ষণ', editTitle: 'সম্পাদনা', newTitle: 'নতুন টাস্ক', placeholder: 'টাস্কের নাম', descPlaceholder: 'বিবরণ (ঐচ্ছিক)', select: 'নির্বাচন...', selectDate: 'তারিখ নির্বাচন', selectTime: 'সময় নির্বাচন' }
};

// Helper: Calculate duration in minutes from start and end times
const calcDurationMinutes = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    return mins;
};

// Helper: Format minutes to display string
const formatDuration = (mins: number): string => {
    if (mins <= 0) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

// Helper: Add minutes to a time string
const addMinutesToTime = (time: string, mins: number): string => {
    if (!time || mins <= 0) return '';
    const [h, m] = time.split(':').map(Number);
    let totalMins = h * 60 + m + mins;
    totalMins = totalMins % (24 * 60);
    const newH = Math.floor(totalMins / 60);
    const newM = totalMins % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
};

// Helper: Subtract minutes from a time string
const subtractMinutesFromTime = (time: string, mins: number): string => {
    if (!time || mins <= 0) return '';
    const [h, m] = time.split(':').map(Number);
    let totalMins = h * 60 + m - mins;
    if (totalMins < 0) totalMins += 24 * 60;
    const newH = Math.floor(totalMins / 60);
    const newM = totalMins % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AssignmentModal: React.FC<AssignmentModalProps> = ({
    isOpen, editingId, title, description, subject, date, type, priority, status, startTime, endTime,
    setTitle, setDescription, setSubject, setDate, setType, setPriority, setStatus, setStartTime, setEndTime,
    onSubmit, onClose, subjects, types, statuses, priorities, lang = 'bn'
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState(0);

    // Track which field was auto-calculated
    const [autoCalcField, setAutoCalcField] = useState<'start' | 'end' | 'duration' | null>(null);
    const prevStartRef = useRef(startTime);
    const prevEndRef = useRef(endTime);

    // Calculate duration whenever start/end times change
    useEffect(() => {
        if (startTime && endTime) {
            setDurationMinutes(calcDurationMinutes(startTime, endTime));
        }
    }, [startTime, endTime]);

    if (!isOpen) return null;
    const t = T[lang];

    const inputCls = "w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all";
    const labelCls = "block text-xs uppercase font-bold text-slate-400 mb-1";
    const clickableInputCls = "w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm cursor-pointer hover:border-indigo-500/50 transition-all flex items-center justify-between gap-2 min-h-[42px]";

    // Handle start time change with auto-calculation
    const handleStartTimeChange = (newStart: string) => {
        prevStartRef.current = startTime;
        setStartTime(newStart);
        setAutoCalcField(null);

        // If we have a duration but no end, calculate end
        if (durationMinutes > 0 && !endTime) {
            setAutoCalcField('end');
            setEndTime(addMinutesToTime(newStart, durationMinutes));
        }
    };

    // Handle end time change with auto-calculation
    const handleEndTimeChange = (newEnd: string) => {
        prevEndRef.current = endTime;
        setEndTime(newEnd);
        setAutoCalcField(null);

        // If we have a duration but no start, calculate start
        if (durationMinutes > 0 && !startTime) {
            setAutoCalcField('start');
            setStartTime(subtractMinutesFromTime(newEnd, durationMinutes));
        }
    };

    // Handle duration change with auto-calculation
    const handleDurationChange = (mins: number) => {
        setDurationMinutes(mins);
        if (mins <= 0) return;

        // Priority: If start exists, calculate end. Else if end exists, calculate start.
        if (startTime) {
            prevEndRef.current = endTime;
            setAutoCalcField('end');
            setEndTime(addMinutesToTime(startTime, mins));
        } else if (endTime) {
            prevStartRef.current = startTime;
            setAutoCalcField('start');
            setStartTime(subtractMinutesFromTime(endTime, mins));
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
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

                        {/* Start Time + End Time + Duration - All Editable with Animations */}
                        <div className="grid grid-cols-3 gap-2">
                            {/* Start Time */}
                            <div>
                                <label className={labelCls}>{t.startTime}</label>
                                <button
                                    type="button"
                                    onClick={() => setShowStartTimePicker(true)}
                                    className={clickableInputCls}
                                >
                                    {startTime ? (
                                        <AnimatedTimeDisplay
                                            time={startTime}
                                            isAutoCalculated={autoCalcField === 'start'}
                                            className="text-white"
                                        />
                                    ) : (
                                        <span className="text-slate-500">--:--</span>
                                    )}
                                    <Clock size={14} className="text-indigo-400 flex-shrink-0" />
                                </button>
                            </div>

                            {/* End Time */}
                            <div>
                                <label className={labelCls}>{t.endTime}</label>
                                <button
                                    type="button"
                                    onClick={() => setShowEndTimePicker(true)}
                                    className={clickableInputCls}
                                >
                                    {endTime ? (
                                        <AnimatedTimeDisplay
                                            time={endTime}
                                            isAutoCalculated={autoCalcField === 'end'}
                                            className="text-white"
                                        />
                                    ) : (
                                        <span className="text-slate-500">--:--</span>
                                    )}
                                    <Clock size={14} className="text-indigo-400 flex-shrink-0" />
                                </button>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className={labelCls}>{t.duration}</label>
                                <button
                                    type="button"
                                    onClick={() => setShowDurationPicker(true)}
                                    className={clickableInputCls}
                                >
                                    <motion.span
                                        key={durationMinutes}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                        className={durationMinutes > 0 ? 'text-indigo-400 font-mono' : 'text-slate-500'}
                                    >
                                        {formatDuration(durationMinutes)}
                                    </motion.span>
                                    <Timer size={14} className="text-indigo-400 flex-shrink-0" />
                                </button>
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
                </motion.div>
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
                onChange={handleStartTimeChange}
                onClose={() => setShowStartTimePicker(false)}
                label={lang === 'en' ? 'Start Time' : 'শুরুর সময়'}
            />

            <TimePicker
                isOpen={showEndTimePicker}
                value={endTime}
                onChange={handleEndTimeChange}
                onClose={() => setShowEndTimePicker(false)}
                label={lang === 'en' ? 'End Time' : 'শেষ সময়'}
            />

            {/* Duration Picker */}
            <DurationPicker
                isOpen={showDurationPicker}
                value={durationMinutes}
                onChange={handleDurationChange}
                onClose={() => setShowDurationPicker(false)}
                label={lang === 'en' ? 'Duration' : 'সময়কাল'}
            />
        </>
    );
};

export default AssignmentModal;
