import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  UserCheck, 
  Calendar, 
  ShoppingCart, 
  Edit3, 
  Trash2, 
  ShieldAlert, 
  Heart,
  X,
  Bell,
  BellRing,
  Share,
  PlusSquare,
  CheckCircle2
} from 'lucide-react';
import { FamilyMember, CalendarEvent, ShoppingItem } from '../types';
import { subscribeMemberToPush, isStandalone } from '../utils/pushNotifications';

interface FamilyMembersViewProps {
  members: FamilyMember[];
  events: CalendarEvent[];
  shoppingList: ShoppingItem[];
  onAddMember: (member: Partial<FamilyMember>) => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
}

export const FamilyMembersView: React.FC<FamilyMembersViewProps> = ({
  members,
  events,
  shoppingList,
  onAddMember,
  onEditMember,
  onDeleteMember,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [subscribedMemberIds, setSubscribedMemberIds] = useState<Set<string>>(new Set());
  const [showIOSInstallHelp, setShowIOSInstallHelp] = useState(false);

  const refreshNotificationStatus = async () => {
    try {
      const res = await fetch('/api/notification-status');
      const data = await res.json();
      if (data.success) {
        setSubscribedMemberIds(new Set(data.subscribedMemberIds));
      }
    } catch (err) {
      console.error('Failed to check notification status:', err);
    }
  };

  // Pull real subscription status from the database on load, instead of relying on
  // local browser memory — that way it's accurate even after a refresh or on a
  // different device checking someone else's status.
  useEffect(() => {
    refreshNotificationStatus();
  }, []);

  const [name, setName] = useState('');
  const [role, setRole] = useState<FamilyMember['role']>('Son');
  const [color, setColor] = useState('#ec4899'); // Default Pink
  const [dietaryNotes, setDietaryNotes] = useState('');

  const colorPalette = [
    { hex: '#8b5cf6', label: 'Violet', bgClass: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-700', badgeClass: 'bg-violet-600 text-white' },
    { hex: '#2563eb', label: 'Blue', bgClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700', badgeClass: 'bg-blue-600 text-white' },
    { hex: '#059669', label: 'Emerald', bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700', badgeClass: 'bg-emerald-600 text-white' },
    { hex: '#d97706', label: 'Amber', bgClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700', badgeClass: 'bg-amber-600 text-white' },
    { hex: '#ec4899', label: 'Pink', bgClass: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/60 dark:text-pink-200 dark:border-pink-700', badgeClass: 'bg-pink-600 text-white' },
    { hex: '#06b6d4', label: 'Cyan', bgClass: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-700', badgeClass: 'bg-cyan-600 text-white' },
    { hex: '#f97316', label: 'Orange', bgClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-700', badgeClass: 'bg-orange-600 text-white' }
  ];

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName('');
    setRole('Son');
    setColor('#ec4899');
    setDietaryNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: FamilyMember) => {
    setEditingMember(m);
    setName(m.name);
    setRole(m.role);
    setColor(m.color);
    setDietaryNotes(m.dietaryNotes || '');
    setShowAddModal(true);
  };

  const handleEnableNotifications = async (memberId: string, memberName: string) => {
    const confirmed = window.confirm(
      `Is this ${memberName}'s phone?\n\nNotifications will be enabled for ${memberName} on this specific device. Only confirm if you're ${memberName}, or holding their phone right now.`
    );
    if (!confirmed) return;

    setSubscribingId(memberId);
    const result = await subscribeMemberToPush(memberId);
    setSubscribingId(null);

    if (result.status === 'subscribed') {
      await refreshNotificationStatus();
    } else if (result.status === 'needs-install') {
      setShowIOSInstallHelp(true);
    } else if (result.status === 'permission-denied') {
      alert('Notifications were blocked. To enable them, check your phone\'s Settings for this app and allow notifications, then try again.');
    } else if (result.status === 'unsupported') {
      alert('This browser doesn\'t support push notifications.');
    } else {
      alert(`Couldn't enable notifications: ${result.status === 'error' ? result.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedPalette = colorPalette.find(p => p.hex === color) || colorPalette[0];

    if (editingMember) {
      onEditMember({
        ...editingMember,
        name: name.trim(),
        role,
        color,
        bgClass: matchedPalette.bgClass,
        badgeClass: matchedPalette.badgeClass,
        dietaryNotes: dietaryNotes.trim() || undefined
      });
    } else {
      onAddMember({
        name: name.trim(),
        role,
        color,
        bgClass: matchedPalette.bgClass,
        badgeClass: matchedPalette.badgeClass,
        dietaryNotes: dietaryNotes.trim() || undefined
      });
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-violet-200" />
            <h2 className="text-xl font-extrabold tracking-tight">Family Members & Color Organization</h2>
          </div>
          <p className="text-xs sm:text-sm text-violet-100 max-w-xl">
            Assign unique colors to every family member to easily distinguish soccer practices, doctor checkups, and errands on the shared calendar.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-100 pt-1">
            <Bell className="w-3.5 h-3.5" />
            <span>
              🔔 {subscribedMemberIds.size} of {members.length} family members have notifications enabled
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-white text-violet-900 hover:bg-violet-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Family Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {members.map(member => {
          const memberEvents = events.filter(e => e.memberIds.includes(member.id));
          const memberShopping = shoppingList.filter(s => s.assignedToMemberId === member.id && !s.isCompleted);

          return (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                
                {/* Header Avatar & Name */}
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0)}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                      {member.name}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Role: {member.role}
                    </span>
                  </div>
                </div>

                {/* Dietary Notes */}
                {member.dietaryNotes && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300 font-medium flex items-start space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{member.dietaryNotes}</span>
                  </div>
                )}

                {/* Event & Errands Stats */}
                <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="block text-lg font-black text-slate-900 dark:text-white">
                      {memberEvents.length}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Events
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="block text-lg font-black text-slate-900 dark:text-white">
                      {memberShopping.length}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Errands
                    </span>
                  </div>
                </div>

                {/* Chore Reminder Notifications */}
                <button
                  onClick={() => handleEnableNotifications(member.id, member.name)}
                  disabled={subscribingId === member.id}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    subscribedMemberIds.has(member.id)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  {subscribedMemberIds.has(member.id) ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Notifications Enabled</span>
                    </>
                  ) : subscribingId === member.id ? (
                    <span>Enabling...</span>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Enable Chore Reminders</span>
                    </>
                  )}
                </button>

              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(member)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-violet-600 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>

                {members.length > 1 && (
                  <button
                    onClick={() => onDeleteMember(member.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {editingMember ? 'Edit Family Member' : 'Add Family Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leo, Sarah, Grandma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Role in Family:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as FamilyMember['role'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Mom">Mom</option>
                  <option value="Dad">Dad</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Pet">Pet</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Assigned Calendar Color Code:
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  {colorPalette.map(p => (
                    <button
                      type="button"
                      key={p.hex}
                      onClick={() => setColor(p.hex)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === p.hex ? 'ring-2 ring-offset-2 ring-violet-600 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Dietary Restrictions / Preferences (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gluten-Free, Peanut Allergy, Vegetarian"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 text-white rounded-xl font-extrabold shadow-sm hover:bg-violet-700"
                >
                  Save Profile
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* iOS "Add to Home Screen First" instructions */}
      {showIOSInstallHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowIOSInstallHelp(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-cyan-600">
              <BellRing className="w-5 h-5" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">One Quick Step First</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              On iPhone, notifications only work after adding this app to your Home Screen. It only takes a few seconds:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  Tap the <Share className="w-3.5 h-3.5 inline text-blue-500" /> Share button at the bottom of Safari
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline" /> "Add to Home Screen"
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Close Safari, then open the app from the new icon on your Home Screen
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center flex-shrink-0">4</div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Go to Family Members and tap "Enable Chore Reminders" again — it'll work this time!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstallHelp(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-extrabold"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

