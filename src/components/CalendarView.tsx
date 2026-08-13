import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Utensils, 
  Filter, 
  User, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  CalendarDays,
  ListFilter,
  Sparkles,
  Link2
} from 'lucide-react';
import { CalendarEvent, FamilyMember, EventCategory } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  members: FamilyMember[];
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onOpenMealPlanner: (date?: string) => void;
  onOpenConnectCalendar: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  members,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onOpenMealPlanner,
  onOpenConnectCalendar,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'agenda'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter events based on member selection
  const filteredEvents = events.filter(event => {
    if (selectedMemberId === 'ALL') return true;
    return event.memberIds.includes(selectedMemberId);
  });

  // Category badges color map (Vibrant theme)
  const categoryBadgeMap: Record<EventCategory, string> = {
    school: 'bg-indigo-600 text-white font-bold shadow-xs',
    work: 'bg-slate-800 text-white font-bold shadow-xs',
    sports: 'bg-emerald-600 text-white font-bold shadow-xs',
    meals: 'bg-amber-500 text-white font-bold shadow-xs',
    health: 'bg-rose-600 text-white font-bold shadow-xs',
    chores: 'bg-cyan-600 text-white font-bold shadow-xs',
    general: 'bg-violet-600 text-white font-bold shadow-xs'
  };

  const categorySoftBadgeMap: Record<EventCategory, string> = {
    school: 'bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-800',
    work: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    sports: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800',
    meals: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800',
    health: 'bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800',
    chores: 'bg-cyan-100 text-cyan-900 border-cyan-200 dark:bg-cyan-950/80 dark:text-cyan-200 dark:border-cyan-800',
    general: 'bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-950/80 dark:text-violet-200 dark:border-violet-800'
  };

  // Generate 7 days for current week view
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    start.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(start);
      next.setDate(start.getDate() + i);
      week.push(next);
    }
    return week;
  };

  // Generate days grid for month view
  const getMonthGridDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sun
    const mondayOffset = (startDayOfWeek + 6) % 7; // Monday start
    
    const gridStart = new Date(year, month, 1 - mondayOffset);
    const days = [];
    
    // Default 35 grid cells
    for (let i = 0; i < 35; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    
    // If last cell is still within month, add another week
    if (days[34].getMonth() === month && days[34].getDate() < 28) {
      for (let i = 35; i < 42; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        days.push(d);
      }
    }
    return days;
  };

  const weekDays = getWeekDates(currentDate);
  const monthGridDays = getMonthGridDays(currentDate);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handlePrevPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setCurrentDate(next);
  };

  const handleNextPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to render member color avatars / chips for an event
  const renderMemberBadges = (memberIds: string[]) => {
    const eventMembers = members.filter(m => memberIds.includes(m.id));
    return (
      <div className="flex items-center space-x-1 flex-wrap gap-y-1">
        {eventMembers.map(m => (
          <span
            key={m.id}
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${m.bgClass}`}
            title={`${m.name} (${m.role})`}
          >
            <span 
              className="w-2 h-2 rounded-full mr-1.5" 
              style={{ backgroundColor: m.color }}
            />
            {m.name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls: Member Filter & View Mode & Calendar Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Row 1: Family Member Color Filters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filter by Family Member
            </span>
            <button 
              onClick={onOpenConnectCalendar}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              <Link2 className="w-3.5 h-3.5" /> Sync Options
            </button>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedMemberId('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border whitespace-nowrap ${
                selectedMemberId === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Everyone ({events.length})</span>
            </button>

            {members.map(member => {
              const count = events.filter(e => e.memberIds.includes(member.id)).length;
              const isSelected = selectedMemberId === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border whitespace-nowrap ${
                    isSelected
                      ? `${member.badgeClass} ring-2 ring-offset-1 ring-slate-400 shadow-xs`
                      : `${member.bgClass} opacity-80 hover:opacity-100`
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: isSelected ? '#ffffff' : member.color }} 
                  />
                  <span>{member.name}</span>
                  <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Date Navigation & View Mode Selectors */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevPeriod}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Previous Period"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                Today
              </button>
              <button
                onClick={handleNextPeriod}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Next Period"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {formatMonthYear(currentDate)}
            </h2>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs font-medium">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'week' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'month' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Month Grid
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'agenda' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Agenda List
              </button>
            </div>

            <button
              onClick={() => onOpenMealPlanner()}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Plan Family Meal</span>
            </button>
          </div>

        </div>

      </div>

      {/* VIEWMODE 1: WEEK COLUMN VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dayDate, i) => {
            const dateStr = dayDate.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const dayEvents = filteredEvents.filter(e => e.date === dateStr);

            return (
              <div 
                key={dateStr} 
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                  isToday 
                    ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800'
                } p-3 flex flex-col min-h-[300px]`}
              >
                {/* Day Header */}
                <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isToday ? 'border-violet-200 dark:border-violet-800' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <div className="flex items-baseline space-x-1">
                      <span className={`text-lg font-black ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-slate-900 dark:text-white'}`}>
                        {dayDate.getDate()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenMealPlanner(dateStr)}
                    className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                    title="Add Meal or Event to this day"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Day Events List */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-0.5">
                  {dayEvents.length === 0 ? (
                    <div className="h-20 flex flex-col items-center justify-center text-center p-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-[11px] text-slate-400">No events</p>
                    </div>
                  ) : (
                    dayEvents.map(evt => (
                      <div
                        key={evt.id}
                        className={`p-2.5 rounded-xl border transition-all text-left relative group ${
                          evt.isMealPlan 
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 hover:border-amber-300' 
                            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-violet-300'
                        }`}
                      >
                        {/* Event Category & Meal Tag */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${categoryBadgeMap[evt.category] || categoryBadgeMap.general}`}>
                            {evt.category.toUpperCase()}
                          </span>

                          {evt.isMealPlan && (
                            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
                              <Utensils className="w-3 h-3" /> Meal
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">
                          {evt.title}
                        </h4>

                        {/* Time & Location */}
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                          {evt.startTime && (
                            <span className="flex items-center gap-0.5 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {evt.startTime}
                            </span>
                          )}
                          {evt.location && (
                            <span className="truncate flex items-center gap-0.5 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {evt.location}
                            </span>
                          )}
                        </div>

                        {/* Family Member Color Chips */}
                        <div className="pt-1">
                          {renderMemberBadges(evt.memberIds)}
                        </div>

                        {/* Action Buttons on Hover */}
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex items-center space-x-1 bg-white dark:bg-slate-800 p-0.5 rounded-md shadow-xs border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => onEditEvent(evt)}
                            className="p-1 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(evt.id)}
                            className="p-1 text-slate-500 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* VIEWMODE 2: AGENDA LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-violet-600" />
              Family Master Agenda ({filteredEvents.length} events)
            </h3>
            <button
              onClick={onAddEvent}
              className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No events found for this filter.
              </div>
            ) : (
              filteredEvents
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(evt => (
                  <div key={evt.id} className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-12 text-center flex-shrink-0 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">
                          {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="block text-base font-extrabold text-slate-900 dark:text-white leading-none">
                          {new Date(evt.date + 'T00:00:00').getDate()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryBadgeMap[evt.category]}`}>
                            {evt.category.toUpperCase()}
                          </span>
                          {evt.isMealPlan && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Utensils className="w-3 h-3" /> MEAL PLAN
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {evt.date} {evt.startTime ? `• ${evt.startTime} - ${evt.endTime}` : ''}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {evt.title}
                        </h4>

                        {evt.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{evt.notes}</p>
                        )}

                        <div className="pt-1">
                          {renderMemberBadges(evt.memberIds)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => onEditEvent(evt)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteEvent(evt.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* VIEWMODE 3: MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-5 shadow-xs space-y-3">
          {/* Month Header Banner */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-violet-600" />
              <span>Full Month Overview — {formatMonthYear(currentDate)}</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Click any date or event to open details
            </span>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-violet-600 dark:text-violet-400">Sat</div>
            <div className="text-rose-600 dark:text-rose-400">Sun</div>
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthGridDays.map((dayDate, idx) => {
              const dateStr = dayDate.toISOString().split('T')[0];
              const todayStr = new Date().toISOString().split('T')[0];
              const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth();
              const isToday = todayStr === dateStr;
              const dayEvents = filteredEvents.filter(e => e.date === dateStr);

              return (
                <div
                  key={dateStr + '-' + idx}
                  className={`min-h-[90px] sm:min-h-[120px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    !isCurrentMonth
                      ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/60 opacity-40'
                      : isToday
                      ? 'bg-violet-50/80 dark:bg-violet-950/40 border-violet-500 ring-2 ring-violet-500/20 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                        isToday
                          ? 'bg-violet-600 text-white shadow-xs'
                          : isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>

                    <button
                      onClick={() => onOpenMealPlanner(dateStr)}
                      className="p-0.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                      title={`Add event/meal for ${dateStr}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day events badges */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                    {dayEvents.slice(0, 3).map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => onEditEvent(evt)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-tight truncate cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between gap-1 border ${
                          categorySoftBadgeMap[evt.category] || categorySoftBadgeMap.general
                        }`}
                        title={`${evt.title} (${evt.startTime || 'All day'})`}
                      >
                        <span className="truncate">{evt.title}</span>
                        {evt.isMealPlan && <Utensils className="w-2.5 h-2.5 text-amber-600 flex-shrink-0" />}
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <button
                        onClick={() => {
                          setCurrentDate(dayDate);
                          setViewMode('week');
                        }}
                        className="w-full text-[10px] font-extrabold text-violet-600 dark:text-violet-400 hover:underline pt-0.5 text-center"
                      >
                        +{dayEvents.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
