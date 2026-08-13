import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, Utensils, Users, Check } from 'lucide-react';
import { CalendarEvent, FamilyMember, EventCategory, Recipe } from '../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
  recipes: Recipe[];
  eventToEdit?: CalendarEvent | null;
  defaultDate?: string;
  onSaveEvent: (event: Partial<CalendarEvent>) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  members,
  recipes,
  eventToEdit,
  defaultDate,
  onSaveEvent,
}) => {
  const [title, setTitle] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [category, setCategory] = useState<EventCategory>('general');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isMealPlan, setIsMealPlan] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setSelectedMemberIds(eventToEdit.memberIds || []);
      setDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime || '18:00');
      setEndTime(eventToEdit.endTime || '19:00');
      setCategory(eventToEdit.category || 'general');
      setLocation(eventToEdit.location || '');
      setNotes(eventToEdit.notes || '');
      setIsMealPlan(!!eventToEdit.isMealPlan);
      setSelectedRecipeId(eventToEdit.recipeId || '');
    } else {
      setTitle('');
      setSelectedMemberIds(members.map(m => m.id)); // Default to all members
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('18:00');
      setEndTime('19:00');
      setCategory('general');
      setLocation('');
      setNotes('');
      setIsMealPlan(false);
      setSelectedRecipeId('');
    }
  }, [eventToEdit, defaultDate, isOpen, members]);

  if (!isOpen) return null;

  const toggleMemberSelection = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter(mId => mId !== id));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedMemberIds.length === 0) return;

    let recipeTitle = undefined;
    if (isMealPlan && selectedRecipeId) {
      const rec = recipes.find(r => r.id === selectedRecipeId);
      if (rec) recipeTitle = rec.title;
    }

    onSaveEvent({
      id: eventToEdit ? eventToEdit.id : undefined,
      title: title.trim(),
      memberIds: selectedMemberIds,
      date,
      startTime,
      endTime,
      category,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      isMealPlan,
      mealType: isMealPlan ? 'dinner' : undefined,
      recipeId: selectedRecipeId || undefined,
      recipeTitle
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {eventToEdit ? 'Edit Calendar Event' : 'Add Family Event'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Event Title:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Leo Soccer Practice, Family Dinner, Dentist Appointment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            />
          </div>

          {/* Color Coded Family Member Selector */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Assign Family Members (Color Coded):
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {members.map(m => {
                const isSelected = selectedMemberIds.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleMemberSelection(m.id)}
                    className={`px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1.5 transition-all ${
                      isSelected
                        ? `${m.badgeClass} ring-2 ring-violet-500 shadow-xs`
                        : `${m.bgClass} opacity-60 hover:opacity-100`
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isSelected ? '#ffffff' : m.color }} />
                    <span>{m.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="general">General</option>
                <option value="sports">Sports & Activities</option>
                <option value="school">School & Education</option>
                <option value="work">Work & Career</option>
                <option value="meals">Meals & Dining</option>
                <option value="health">Health & Medical</option>
                <option value="chores">Chores & House</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Date:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Start Time:
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                End Time:
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Location (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Lincoln School, Home, Community Field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Option to Tag as Family Meal */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-600" /> Attach Family Recipe / Meal Plan
              </span>
              <input
                type="checkbox"
                checked={isMealPlan}
                onChange={(e) => {
                  setIsMealPlan(e.target.checked);
                  if (e.target.checked) setCategory('meals');
                }}
                className="w-4 h-4 text-amber-600 rounded"
              />
            </div>

            {isMealPlan && (
              <select
                value={selectedRecipeId}
                onChange={(e) => {
                  setSelectedRecipeId(e.target.value);
                  const selectedRec = recipes.find(r => r.id === e.target.value);
                  if (selectedRec && !title) {
                    setTitle(`Dinner: ${selectedRec.title}`);
                  }
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold"
              >
                <option value="">Select a recipe from your collection...</option>
                {recipes.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.category})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Notes:
            </label>
            <textarea
              rows={2}
              placeholder="Any details or reminders..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-violet-600 text-white rounded-xl font-extrabold shadow-sm hover:bg-violet-700"
            >
              Save Event
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
