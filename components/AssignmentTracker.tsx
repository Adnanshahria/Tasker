import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Assignment, AssignmentStatus, AssignmentPriority } from '../types';
import { format, isBefore, addDays } from 'date-fns';
import { Plus, Trash2, Edit2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AssignmentTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<AssignmentPriority>('Medium');
  const [status, setStatus] = useState<AssignmentStatus>('Not Started');

  useEffect(() => {
    if (!currentUser) return;
    setError(null);

    // Simplified query: Filter by User ID only.
    // Client-side sorting is used to avoid needing a composite index.
    const q = query(
      collection(db, 'assignments'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
      
      // Client-side Sort
      data.sort((a, b) => a.dueDate.seconds - b.dueDate.seconds);
      
      setAssignments(data);
    }, (err) => {
      console.error("Assignment listener error:", err);
      if (err.code === 'permission-denied') {
        setError("Permission denied. Check Firestore Rules.");
      }
    });

    return unsubscribe;
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const assignmentData = {
        userId: currentUser.uid,
        title,
        subject,
        dueDate: Timestamp.fromDate(new Date(date)),
        priority,
        status
      };

      if (editingId) {
        await updateDoc(doc(db, 'assignments', editingId), assignmentData);
      } else {
        await addDoc(collection(db, 'assignments'), assignmentData);
      }
      closeModal();
    } catch (err: any) {
      alert("Error saving assignment: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteDoc(doc(db, 'assignments', id));
      } catch (err: any) {
         alert("Error deleting: " + err.message);
      }
    }
  };

  const openEdit = (assignment: Assignment) => {
    setTitle(assignment.title);
    setSubject(assignment.subject);
    setDate(format(assignment.dueDate.toDate(), 'yyyy-MM-dd'));
    setPriority(assignment.priority);
    setStatus(assignment.status);
    setEditingId(assignment.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setTitle('');
    setSubject('');
    setDate('');
    setPriority('Medium');
    setStatus('Not Started');
    setEditingId(null);
    setIsModalOpen(false);
  };

  // Conditional Logic Helpers
  const getRowStyle = (assignment: Assignment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = assignment.dueDate.toDate();
    const isCompleted = assignment.status === 'Completed';
    const isOverdue = isBefore(dueDate, today) && !isCompleted;

    if (isCompleted) return 'bg-green-900/10 text-green-300 border-green-500/10 hover:bg-green-900/20';
    if (isOverdue) return 'bg-red-900/10 text-red-300 border-red-500/10 hover:bg-red-900/20';
    return 'bg-slate-800/40 text-slate-300 border-white/5 hover:bg-slate-800/60';
  };

  const getUrgencyBadge = (assignment: Assignment) => {
     if (assignment.status === 'Completed') return null;
     
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     const dueDate = assignment.dueDate.toDate();
     const threeDaysFromNow = addDays(today, 3);
     
     if (isBefore(dueDate, today)) {
         return <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full"><AlertCircle size={12} /> Overdue</span>;
     }
     
     if (isBefore(dueDate, threeDaysFromNow)) {
         return <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full"><Clock size={12} /> Due Soon</span>;
     }
     return null;
  };

  if (error) {
     return <div className="text-red-400 bg-red-900/10 p-4 rounded-xl border border-red-900/20 text-center">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Assignments</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} /> Add Assignment
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {assignments.map((item) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`transition-colors ${getRowStyle(item)}`}
                  >
                    <td className="p-4">
                      <button 
                        onClick={async () => {
                           try {
                             const newStatus = item.status === 'Completed' ? 'In Progress' : 'Completed';
                             await updateDoc(doc(db, 'assignments', item.id), { status: newStatus });
                           } catch (e: any) { alert(e.message) }
                        }}
                        className={`p-1 rounded-full border ${item.status === 'Completed' ? 'bg-green-500 border-green-500 text-slate-900' : 'border-slate-500 text-transparent hover:border-indigo-400'}`}
                      >
                        <CheckCircle size={16} fill="currentColor" />
                      </button>
                    </td>
                    <td className="p-4 font-medium">
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        {getUrgencyBadge(item)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md bg-white/5 text-xs border border-white/10">
                        {item.subject}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-mono opacity-80">
                      {format(item.dueDate.toDate(), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.priority === 'Urgent' ? 'text-red-400 bg-red-400/10' :
                        item.priority === 'Medium' ? 'text-blue-400 bg-blue-400/10' :
                        'text-slate-400 bg-slate-400/10'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No assignments found. Time to relax or add some work!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-4">{editingId ? 'Edit Assignment' : 'New Assignment'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Calculus Midterm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Subject</label>
                  <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Math" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Due Date</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none">
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-medium">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AssignmentTracker;