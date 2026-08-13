import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Plus, 
  Filter, 
  Calendar as CalendarIcon, 
  Trash2, 
  Edit2, 
  Trophy, 
  Zap, 
  Clock, 
  Home, 
  RotateCw,
  Shuffle,
  Award,
  AlertCircle
} from 'lucide-react';
import { ChoreItem, FamilyMember, ChoreArea, ChoreFrequency } from '../types';

interface ChoresViewProps {
  chores: ChoreItem[];
  members: FamilyMember[];
  onToggleChore: (id: string) => void;
  onAddChore: () => void;
  onEditChore: (chore: ChoreItem) => void;
  onDeleteChore: (id: string) => void;
  onSyncChoresToCalendar?: () => void;
  onRandomizeWeeklyChores?: () => void;
}

const areaColorMap: Record<ChoreArea, { bg: string; text: string; border: string }> = {
  'Kitchen': { bg: 'bg-amber-100 dark:bg-amber-950/70', text: 'text-amber-900 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  'Living Room': { bg: 'bg-indigo-100 dark:bg-indigo-950/70', text: 'text-indigo-900 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700' },
  'Dining Room': { bg: 'bg-teal-100 dark:bg-teal-950/70', text: 'text-teal-900 dark:text-teal-200', border: 'border-teal-300 dark:border-teal-700' },
  'Half Bathroom & Foyer': { bg: 'bg-cyan-100 dark:bg-cyan-950/70', text: 'text-cyan-900 dark:text-cyan-200', border: 'border-cyan-300 dark:border-cyan-700' },
  'Laundry Room': { bg: 'bg-rose-100 dark:bg-rose-950/70', text: 'text-rose-900 dark:text-rose-200', border: 'border-rose-300 dark:border-rose-700' },
  'Staircase': { bg: 'bg-orange-100 dark:bg-orange-950/70', text: 'text-orange-900 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700' }
};

export const ChoresView: React.FC<ChoresViewProps> = ({
  chores,
  members,
  onToggleChore,
  onAddChore,
  onEditChore,
  onDeleteChore,
  onSyncChoresToCalendar,
  onRandomizeWeeklyChores
}) => {
  const [selectedArea, setSelectedArea] = useState<ChoreArea | 'ALL'>('ALL');
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'ALL'>('ALL');
  const [selectedFrequency, setSelectedFrequency] = useState<ChoreFrequency | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter logic
  const filteredChores = chores.filter(c => {
    if (selectedArea !== 'ALL' && c.area !== selectedArea) return false;
    if (selectedMemberId !== 'ALL' && c.assignedMemberId !== selectedMemberId) return false;
    if (selectedFrequency !== 'ALL' && c.frequency !== selectedFrequency) return false;
    if (statusFilter === 'pending' && c.isCompleted) return false;
    if (statusFilter === 'completed' && !c.isCompleted) return false;
    return true;
  });

  // Calculate statistics
  const pendingCount = chores.filter(c => !c.isCompleted).length;
  const completedCount = chores.filter(c => c.isCompleted).length;
  const overdueCount = chores.filter(c => !c.isCompleted && c.dueDate < todayStr).length;

  // Calculate points per member
  const memberPointsMap: Record<string, number> = {};
  members.forEach(m => { memberPointsMap[m.id] = 0; });

  chores.forEach(c => {
    if (c.isCompleted && c.assignedMemberId && memberPointsMap[c.assignedMemberId] !== undefined) {
      memberPointsMap[c.assignedMemberId] += c.points || 10;
    }
  });

  const areaList: ChoreArea[] = [
    'Kitchen', 
    'Living Room', 
    'Dining Room',
    'Half Bathroom & Foyer', 
    'Laundry Room',
    'Staircase'
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold uppercase tracking-wider text-cyan-100">
              <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Cleaning & Chore Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Family Cleaning Center
            </h1>
            <p className="text-cyan-100 text-sm max-w-xl">
              Track house cleaning, assign recurring chores to family members, earn reward points, and keep your home spotless.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onRandomizeWeeklyChores && (
              <button
                onClick={onRandomizeWeeklyChores}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs backdrop-blur border border-white/20 transition-all flex items-center gap-2"
                title="Randomly assign this week's chores across the family"
              >
                <Shuffle className="w-4 h-4" />
                <span>Randomize This Week</span>
              </button>
            )}

            {onSyncChoresToCalendar && (
              <button
                onClick={onSyncChoresToCalendar}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs backdrop-blur border border-white/20 transition-all flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Sync to Calendar</span>
              </button>
            )}

            <button
              onClick={onAddChore}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-cyan-50 font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-cyan-600" />
              <span>Add New Chore</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-cyan-200 font-medium">To Do Chores</div>
            <div className="text-xl font-black">{pendingCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-cyan-200 font-medium">Completed</div>
            <div className="text-xl font-black text-emerald-300">{completedCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-cyan-200 font-medium">Overdue</div>
            <div className={`text-xl font-black ${overdueCount > 0 ? 'text-rose-300' : 'text-cyan-100'}`}>
              {overdueCount}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-cyan-200 font-medium">Family Points</div>
            <div className="text-xl font-black text-amber-300 flex items-center gap-1">
              <Zap className="w-4 h-4 fill-amber-300" />
              {Object.values(memberPointsMap).reduce((a, b) => a + b, 0)} pts
            </div>
          </div>
        </div>
      </div>

      {/* Member Points Leaderboard */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Family Chore Leaderboard</span>
          </h3>
          <span className="text-xs text-slate-400">Earn points by completing chores</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...members]
            .sort((a, b) => (memberPointsMap[b.id] || 0) - (memberPointsMap[a.id] || 0))
            .map((m, rank) => {
            const pts = memberPointsMap[m.id] || 0;
            const completedForMember = chores.filter(c => c.assignedMemberId === m.id && c.isCompleted).length;
            const totalForMember = chores.filter(c => c.assignedMemberId === m.id).length;
            const medal = pts > 0 ? (['🥇', '🥈', '🥉'][rank] || null) : null;

            return (
              <div 
                key={m.id} 
                className={`relative p-3.5 rounded-2xl border flex items-center justify-between transition-all ${m.bgClass} ${rank === 0 && pts > 0 ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''}`}
              >
                {medal && (
                  <span className="absolute -top-2 -left-2 text-lg drop-shadow-sm" title={`#${rank + 1} this week`}>
                    {medal}
                  </span>
                )}
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-xs"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{m.name}</h4>
                    <span className="text-[11px] opacity-75">
                      {completedForMember}/{totalForMember} completed
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black flex items-center justify-end gap-1 text-amber-600 dark:text-amber-400">
                    <Zap className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{pts}</span>
                  </div>
                  <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider">PTS</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Status Pills & Area Scrollbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              To Do ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Done ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              All Chores ({chores.length})
            </button>
          </div>

          {/* Member selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Assignee:
            </span>
            <button
              onClick={() => setSelectedMemberId('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                selectedMemberId === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              Everyone
            </button>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                  selectedMemberId === m.id
                    ? `${m.badgeClass} ring-2 ring-slate-400`
                    : `${m.bgClass} opacity-80 hover:opacity-100`
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span>{m.name}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Room Area Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => setSelectedArea('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedArea === 'ALL'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            All Room Areas
          </button>
          {areaList.map(area => {
            const isSelected = selectedArea === area;
            const style = areaColorMap[area];
            return (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : `${style.bg} ${style.text} ${style.border} hover:opacity-100`
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>

      </div>

      {/* Chore Cards Grid */}
      <div className="space-y-4">
        {filteredChores.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">No chores found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              {statusFilter === 'pending' ? 'All caught up! No pending cleaning chores in this view.' : 'No completed chores match the selected filter.'}
            </p>
            <button
              onClick={onAddChore}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create a Chore</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChores.map(chore => {
              const assignedMember = members.find(m => m.id === chore.assignedMemberId);
              const isOverdue = !chore.isCompleted && chore.dueDate < todayStr;
              const isToday = chore.dueDate === todayStr;
              const areaStyle = areaColorMap[chore.area] || areaColorMap['Kitchen'];

              return (
                <div
                  key={chore.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between relative group ${
                    chore.isCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : isOverdue
                      ? 'border-rose-300 dark:border-rose-800 ring-1 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                  }`}
                >
                  <div className="space-y-2">
                    
                    {/* Header Row: Area & Frequency & Priority */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${areaStyle.bg} ${areaStyle.text} ${areaStyle.border}`}>
                        {chore.area}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {chore.frequency}
                        </span>

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          chore.priority === 'High' 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                            : chore.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {chore.priority}
                        </span>
                      </div>
                    </div>

                    {/* Title & Checkbox */}
                    <div className="flex items-start space-x-3 pt-1">
                      <button
                        onClick={() => onToggleChore(chore.id)}
                        className={`mt-0.5 p-1 rounded-xl transition-transform hover:scale-110 flex-shrink-0 ${
                          chore.isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-300 hover:text-cyan-600'
                        }`}
                        title={chore.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {chore.isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>

                      <div className="flex-1">
                        <h4 className={`font-bold text-slate-900 dark:text-white text-base leading-snug ${
                          chore.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}>
                          {chore.title}
                        </h4>

                        {chore.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {chore.notes}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Footer Row: Assignee, Due Date, Points & Controls */}
                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    
                    {/* Assignee */}
                    <div className="flex items-center space-x-2">
                      {assignedMember ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${assignedMember.bgClass}`}>
                          <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: assignedMember.color }} />
                          {assignedMember.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </div>

                    {/* Date & Points */}
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center gap-1 font-semibold ${
                        isOverdue ? 'text-rose-600 font-bold' : isToday ? 'text-amber-600 font-bold' : 'text-slate-500'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isToday ? 'Today' : chore.dueDate}</span>
                      </div>

                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-md font-extrabold flex items-center gap-0.5">
                        <Zap className="w-3 h-3 fill-amber-500" /> +{chore.points || 15} pts
                      </span>

                      {/* Edit / Delete on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        <button
                          onClick={() => onEditChore(chore)}
                          className="p-1 text-slate-400 hover:text-cyan-600"
                          title="Edit Chore"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteChore(chore.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete Chore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

