import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Home, User, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { ChoreItem, FamilyMember, ChoreArea, ChoreFrequency } from '../types';

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chore: Partial<ChoreItem>) => void;
  choreToEdit?: ChoreItem | null;
  members: FamilyMember[];
}

export const AddChoreModal: React.FC<AddChoreModalProps> = ({
  isOpen,
  onClose,
  onSave,
  choreToEdit,
  members
}) => {
  const [title, setTitle] = useState('');
  const [area, setArea] = useState<ChoreArea>('Kitchen');
  const [assignedMemberId, setAssignedMemberId] = useState<string>('');
  const [frequency, setFrequency] = useState<ChoreFrequency>('Weekly');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [points, setPoints] = useState<number>(20);
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (choreToEdit) {
      setTitle(choreToEdit.title);
      setArea(choreToEdit.area);
      setAssignedMemberId(choreToEdit.assignedMemberId || '');
      setFrequency(choreToEdit.frequency);
      setDueDate(choreToEdit.dueDate);
      setPriority(choreToEdit.priority);
      setPoints(choreToEdit.points || 20);
      setNotes(choreToEdit.notes || '');
    } else {
      setTitle('');
      setArea('Kitchen');
      setAssignedMemberId(members[0]?.id || '');
      setFrequency('Weekly');
      setDueDate(todayStr);
      setPriority('Medium');
      setPoints(20);
      setNotes('');
    }
  }, [choreToEdit, isOpen, members, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...(choreToEdit ? { id: choreToEdit.id } : {}),
      title: title.trim(),
      area,
      assignedMemberId: assignedMemberId || undefined,
      frequency,
      dueDate: dueDate || todayStr,
      priority,
      points: Number(points) || 15,
      notes: notes.trim() || undefined,
      isCompleted: choreToEdit ? choreToEdit.isCompleted : false
    });

    onClose();
  };

  const presetChores = [
    { title: 'Sanitize Kitchen Countertops', area: 'Kitchen' as ChoreArea, points: 15 },
    { title: 'Vacuum & Mop Living Room', area: 'Living Room' as ChoreArea, points: 25 },
    { title: 'Clear & Wipe Dining Table', area: 'Dining Room' as ChoreArea, points: 15 },
    { title: 'Scrub Sink, Mirror & Sweep Foyer', area: 'Half Bathroom & Foyer' as ChoreArea, points: 20 },
    { title: 'Wash, Fold & Organize Laundry', area: 'Laundry Room' as ChoreArea, points: 20 },
    { title: 'Vacuum & Wipe Down Staircase', area: 'Staircase' as ChoreArea, points: 15 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 flex items-center justify-center font-bold">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                {choreToEdit ? 'Edit Chore' : 'Add Family Chore'}
              </h3>
              <p className="text-xs text-slate-500">Set room area, assignee, and reward points</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        {!choreToEdit && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Quick Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetChores.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(p.title);
                    setArea(p.area);
                    setPoints(p.points);
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-cyan-950 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors text-left"
                >
                  + {p.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Chore Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chore Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Deep clean kitchen oven & stove top"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Room Area & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Room Area
              </label>
              <select
                value={area}
                onChange={e => setArea(e.target.value as ChoreArea)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="Kitchen">Kitchen</option>
                <option value="Living Room">Living Room</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Half Bathroom & Foyer">Half Bathroom & Foyer</option>
                <option value="Laundry Room">Laundry Room</option>
                <option value="Staircase">Staircase</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as ChoreFrequency)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Seasonal">Seasonal</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Member
              </label>
              <select
                value={assignedMemberId}
                onChange={e => setAssignedMemberId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Priority & Reward Points */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
                {(['Low', 'Medium', 'High'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1 rounded-lg transition-all ${
                      priority === p
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Reward Points</span>
                <span className="text-amber-500 font-extrabold flex items-center gap-0.5">
                  <Zap className="w-3 h-3 fill-amber-500" /> +{points}
                </span>
              </label>
              <input
                type="number"
                min="5"
                max="100"
                step="5"
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Instructions / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Specific cleaning products to use or extra details..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1"
            >
              <Check className="w-4 h-4" />
              <span>{choreToEdit ? 'Save Changes' : 'Create Chore'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

