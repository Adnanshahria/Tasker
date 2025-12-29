import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { getAssignments, saveAssignment, updateAssignment, deleteAssignment, getSettings, LocalAssignment, UserSettings, DEFAULT_SETTINGS } from '../../services/dataService';

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
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [form, setForm] = useState(createInitialFormState());

    const loadData = async () => {
        if (!currentUser) return;
        try {
            const [assignmentsData, settingsData] = await Promise.all([
                getAssignments(currentUser.uid),
                getSettings(currentUser.uid)
            ]);
            setAssignments(assignmentsData);
            setSettings(settingsData);
            setForm(f => ({ ...f, type: settingsData.types[0] || '', priority: settingsData.priorities[1] || '', status: settingsData.statuses[0] || '' }));
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [currentUser]);

    const lang = settings.language || 'bn';
    const t = T[lang];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        const data = { userId: currentUser.uid, title: form.title, description: form.description, subject: form.subject, dueDate: new Date(form.date).getTime(), priority: form.priority, status: form.status, type: form.type, startTime: form.startTime, endTime: form.endTime };
        try {
            if (editingId) await updateAssignment(editingId, data);
            else await saveAssignment(data);
            await loadData();
            closeModal();
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    const handleDelete = async (id: string) => {
        // Optimistic update - remove from UI immediately
        const deletedItem = assignments.find(a => a.id === id);
        setAssignments(prev => prev.filter(a => a.id !== id));
        setDeleteConfirm(null);
        try {
            await deleteAssignment(id);
        } catch (error) {
            console.error('Error deleting:', error);
            // Revert on error
            if (deletedItem) setAssignments(prev => [...prev, deletedItem]);
        }
    };

    const toggleStatus = async (item: LocalAssignment) => {
        const idx = settings.statuses.indexOf(item.status);
        const newStatus = settings.statuses[(idx + 1) % settings.statuses.length];
        // Optimistic update - update UI immediately
        setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
        try {
            await updateAssignment(item.id, { status: newStatus });
        } catch (error) {
            console.error('Error toggling status:', error);
            // Revert on error
            setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, status: item.status } : a));
        }
    };

    const openEdit = (a: LocalAssignment) => {
        setForm({ title: a.title, description: a.description || '', subject: a.subject, date: format(new Date(a.dueDate), 'yyyy-MM-dd'), priority: a.priority, status: a.status, type: a.type || '', startTime: a.startTime || '', endTime: a.endTime || '' });
        setEditingId(a.id);
        setIsModalOpen(true);
    };

    const closeModal = () => { setForm(createInitialFormState()); setEditingId(null); setIsModalOpen(false); };

    const filtered = assignments.filter(a => {
        const matchSub = subjectFilter === 'All' || a.subject === subjectFilter;
        const matchStat = statusFilter === 'All' || (statusFilter === 'Pending' ? a.status !== settings.statuses[settings.statuses.length - 1] : a.status === statusFilter);
        return matchSub && matchStat;
    });

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <Toolbar title={t.title} subjectFilter={subjectFilter} statusFilter={statusFilter} subjects={[...new Set(assignments.map(a => a.subject))]} onSubjectChange={setSubjectFilter} onStatusChange={setStatusFilter} onAddClick={() => setIsModalOpen(true)} t={t} />
            <Table assignments={filtered} t={t} lang={lang} onEdit={openEdit} onDelete={setDeleteConfirm} onToggleStatus={toggleStatus} onAddClick={() => setIsModalOpen(true)} />
            <AssignmentModal isOpen={isModalOpen} editingId={editingId} title={form.title} description={form.description} subject={form.subject} date={form.date} type={form.type} priority={form.priority} status={form.status} startTime={form.startTime} endTime={form.endTime} setTitle={v => setForm(f => ({ ...f, title: v }))} setDescription={v => setForm(f => ({ ...f, description: v }))} setSubject={v => setForm(f => ({ ...f, subject: v }))} setDate={v => setForm(f => ({ ...f, date: v }))} setType={v => setForm(f => ({ ...f, type: v }))} setPriority={v => setForm(f => ({ ...f, priority: v }))} setStatus={v => setForm(f => ({ ...f, status: v }))} setStartTime={v => setForm(f => ({ ...f, startTime: v }))} setEndTime={v => setForm(f => ({ ...f, endTime: v }))} onSubmit={handleSubmit} onClose={closeModal} subjects={settings.subjects} types={settings.types} statuses={settings.statuses} priorities={settings.priorities} lang={lang} />
            <ConfirmModal isOpen={!!deleteConfirm} title={t.deleteTitle} message={t.deleteMsg} confirmText={t.delete} cancelText={t.cancel} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} />
        </div>
    );
};

export default AssignmentTracker;
