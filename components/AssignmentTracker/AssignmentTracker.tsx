import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { getAssignments, saveAssignment, updateAssignment, deleteAssignment, LocalAssignment } from '../../services/dataService';
import { getSettings } from '../../services/settings';

import AssignmentModal from '../AssignmentModal';
import ConfirmModal from '../ui/ConfirmModal';
import Toolbar from './Toolbar';
import Table from './Table';
import { T } from './translations';
import { createInitialFormState } from './types';

const AssignmentTracker: React.FC = () => {
    const { currentUser } = useAuth();
    const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [lang, setLang] = useState<'en' | 'bn'>('bn');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [priorities, setPriorities] = useState<string[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [form, setForm] = useState(createInitialFormState());

    const loadData = () => {
        if (!currentUser) return;
        setAssignments(getAssignments(currentUser.uid));
        const s = getSettings(currentUser.uid);
        setSubjects(s.subjects); setTypes(s.types); setStatuses(s.statuses); setPriorities(s.priorities);
        setLang(s.language || 'bn');
        setForm(f => ({ ...f, type: s.types[0] || '', priority: s.priorities[1] || s.priorities[0] || '', status: s.statuses[0] || '' }));
    };

    useEffect(() => { loadData(); }, [currentUser]);

    const t = T[lang];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        const data = { userId: currentUser.uid, title: form.title, description: form.description, subject: form.subject, dueDate: new Date(form.date).getTime(), priority: form.priority, status: form.status, type: form.type, startTime: form.startTime, endTime: form.endTime };
        if (editingId) updateAssignment(editingId, data); else saveAssignment(data);
        loadData(); closeModal();
    };

    const handleDelete = (id: string) => { deleteAssignment(id); loadData(); setDeleteConfirm(null); };

    const toggleStatus = (item: LocalAssignment) => {
        const idx = statuses.indexOf(item.status);
        updateAssignment(item.id, { status: statuses[(idx + 1) % statuses.length] });
        loadData();
    };

    const openEdit = (a: LocalAssignment) => {
        setForm({ title: a.title, description: a.description || '', subject: a.subject, date: format(new Date(a.dueDate), 'yyyy-MM-dd'), priority: a.priority, status: a.status, type: a.type || '', startTime: a.startTime || '', endTime: a.endTime || '' });
        setEditingId(a.id); setIsModalOpen(true);
    };

    const closeModal = () => { setForm(createInitialFormState()); setEditingId(null); setIsModalOpen(false); };

    const filtered = assignments.filter(a => {
        const matchSub = subjectFilter === 'All' || a.subject === subjectFilter;
        const matchStat = statusFilter === 'All' || (statusFilter === 'Pending' ? a.status !== statuses[statuses.length - 1] : a.status === statusFilter);
        return matchSub && matchStat;
    });

    return (
        <div className="h-full flex flex-col space-y-4">
            <Toolbar title={t.title} subjectFilter={subjectFilter} statusFilter={statusFilter} subjects={[...new Set(assignments.map(a => a.subject))]} onSubjectChange={setSubjectFilter} onStatusChange={setStatusFilter} onAddClick={() => setIsModalOpen(true)} t={t} />
            <Table assignments={filtered} t={t} lang={lang} onEdit={openEdit} onDelete={setDeleteConfirm} onToggleStatus={toggleStatus} onAddClick={() => setIsModalOpen(true)} />
            <AssignmentModal isOpen={isModalOpen} editingId={editingId} title={form.title} description={form.description} subject={form.subject} date={form.date} type={form.type} priority={form.priority} status={form.status} startTime={form.startTime} endTime={form.endTime} setTitle={v => setForm(f => ({ ...f, title: v }))} setDescription={v => setForm(f => ({ ...f, description: v }))} setSubject={v => setForm(f => ({ ...f, subject: v }))} setDate={v => setForm(f => ({ ...f, date: v }))} setType={v => setForm(f => ({ ...f, type: v }))} setPriority={v => setForm(f => ({ ...f, priority: v }))} setStatus={v => setForm(f => ({ ...f, status: v }))} setStartTime={v => setForm(f => ({ ...f, startTime: v }))} setEndTime={v => setForm(f => ({ ...f, endTime: v }))} onSubmit={handleSubmit} onClose={closeModal} subjects={subjects} types={types} statuses={statuses} priorities={priorities} lang={lang} />
            <ConfirmModal isOpen={!!deleteConfirm} title={t.deleteTitle} message={t.deleteMsg} confirmText={t.delete} cancelText={t.cancel} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} />
        </div>
    );
};

export default AssignmentTracker;
