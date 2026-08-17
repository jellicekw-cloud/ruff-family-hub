import React, { useState } from 'react';
import { Gift, Zap, Plus, Trash2, History, Sparkles, X, Check, Clock, PackageCheck } from 'lucide-react';
import { FamilyMember, ChoreItem, Reward, RewardRedemption } from '../types';

interface RewardsViewProps {
  members: FamilyMember[];
  chores: ChoreItem[];
  rewards: Reward[];
  redemptions: RewardRedemption[];
  onRedeem: (memberId: string, reward: Reward) => void;
  onAddReward: (reward: Reward) => void;
  onDeleteReward: (rewardId: string) => void;
  onFulfillRedemption: (redemptionId: string) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  members,
  chores,
  rewards,
  redemptions,
  onRedeem,
  onAddReward,
  onDeleteReward,
  onFulfillRedemption,
}) => {
  const [showAddReward, setShowAddReward] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState<number>(50);
  const [newEmoji, setNewEmoji] = useState('🎁');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Same date-range helper used in ChoresView, for daily-tracked chores
  const getChoreWeekDates = (chore: ChoreItem): string[] => {
    if (!chore.weekStartDate) return [];
    const dates: string[] = [];
    const start = new Date(chore.weekStartDate + 'T00:00:00');
    const end = new Date(chore.dueDate + 'T00:00:00');
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  // Lifetime points earned per member (same calculation as the Chores leaderboard) —
  // daily-tracked chores award points proportionally to days completed.
  const earnedMap: Record<string, number> = {};
  members.forEach(m => { earnedMap[m.id] = 0; });
  chores.forEach(c => {
    if (!c.assignedMemberId || earnedMap[c.assignedMemberId] === undefined) return;
    if (c.weekStartDate) {
      const totalDays = getChoreWeekDates(c).length || 1;
      const doneDays = (c.completedDates || []).length;
      earnedMap[c.assignedMemberId] += Math.round(((c.points || 10) / totalDays) * doneDays);
    } else if (c.isCompleted) {
      earnedMap[c.assignedMemberId] += c.points || 10;
    }
  });

  // Points spent per member
  const spentMap: Record<string, number> = {};
  members.forEach(m => { spentMap[m.id] = 0; });
  redemptions.forEach(r => {
    if (spentMap[r.memberId] !== undefined) {
      spentMap[r.memberId] += r.pointsCost;
    }
  });

  const availableMap: Record<string, number> = {};
  members.forEach(m => { availableMap[m.id] = (earnedMap[m.id] || 0) - (spentMap[m.id] || 0); });

  const handleAddRewardSubmit = () => {
    if (!newTitle.trim() || newCost <= 0) return;
    onAddReward({
      id: `rwd-${Date.now()}`,
      title: newTitle.trim(),
      pointsCost: newCost,
      emoji: newEmoji.trim() || '🎁'
    });
    setNewTitle('');
    setNewCost(50);
    setNewEmoji('🎁');
    setShowAddReward(false);
  };

  const sortedRedemptions = [...redemptions].sort(
    (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );

  const pendingRedemptions = sortedRedemptions.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <Gift className="w-6 h-6" />
            <span>Rewards</span>
          </h2>
          <p className="text-fuchsia-100 text-xs sm:text-sm mt-1">
            Cash in chore points for real rewards. Points are earned from completed chores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center space-x-2 whitespace-nowrap backdrop-blur border border-white/20"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
          <button
            onClick={() => setShowAddReward(true)}
            className="bg-white text-fuchsia-900 hover:bg-fuchsia-50 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center space-x-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reward</span>
          </button>
        </div>
      </div>

      {/* Pending Redemptions — things that still need to be physically handed over */}
      {pendingRedemptions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-3xl p-5">
          <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Pending — Waiting to Be Given ({pendingRedemptions.length})</span>
          </h3>
          <div className="space-y-2">
            {pendingRedemptions.map(r => {
              const member = members.find(m => m.id === r.memberId);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: member?.color || '#94a3b8' }}
                    >
                      {member?.name.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {member?.name || 'Someone'} redeemed: {r.rewardTitle}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(r.redeemedAt).toLocaleDateString()} · {r.pointsCost} pts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onFulfillRedemption(r.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-extrabold shadow-sm flex items-center gap-1.5 flex-shrink-0 ml-2"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Mark as Given</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Points Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {members.map(m => {
          const available = availableMap[m.id] || 0;
          const isExpanded = expandedMemberId === m.id;

          return (
            <div key={m.id} className={`rounded-2xl border ${m.bgClass} overflow-hidden`}>
              <button
                onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-xs"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-sm leading-tight">{m.name}</h4>
                    <span className="text-[11px] opacity-70">Tap to redeem</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black flex items-center justify-end gap-1 text-fuchsia-700 dark:text-fuchsia-300">
                    <Zap className="w-4 h-4 fill-fuchsia-500 text-fuchsia-500" />
                    <span>{available}</span>
                  </div>
                  <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider">available</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-black/5 dark:border-white/10 p-3 space-y-2 bg-white/40 dark:bg-black/10">
                  {rewards.length === 0 && (
                    <p className="text-xs text-center py-2 opacity-60">No rewards in the catalog yet.</p>
                  )}
                  {rewards.map(reward => {
                    const canAfford = available >= reward.pointsCost;
                    return (
                      <button
                        key={reward.id}
                        disabled={!canAfford}
                        onClick={() => onRedeem(m.id, reward)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          canAfford
                            ? 'bg-white dark:bg-slate-800 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-900 cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-left">
                          <span>{reward.emoji}</span>
                          <span>{reward.title}</span>
                        </span>
                        <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Zap className="w-3 h-3 fill-current" />
                          {reward.pointsCost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rewards Catalog (editable list) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fuchsia-500" />
          <span>Rewards Catalog</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rewards.map(reward => (
            <div
              key={reward.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>{reward.emoji}</span>
                <span>{reward.title}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-black text-fuchsia-600 dark:text-fuchsia-400">
                  <Zap className="w-3 h-3 fill-current" />
                  {reward.pointsCost}
                </span>
                <button
                  onClick={() => onDeleteReward(reward.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Reward Modal */}
      {showAddReward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowAddReward(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-fuchsia-500" />
              <span>Add a Reward</span>
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="🎁"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  maxLength={2}
                  className="w-14 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-lg"
                />
                <input
                  type="text"
                  placeholder="e.g. Pick Sunday Brunch Spot"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Points Cost
                </label>
                <input
                  type="number"
                  min={1}
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddReward(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRewardSubmit}
                disabled={!newTitle.trim() || newCost <= 0}
                className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-extrabold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Add Reward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redemption History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[80vh] flex flex-col">
            <button
              onClick={() => setShowHistory(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-fuchsia-500" />
              <span>Redemption History</span>
            </h3>

            <div className="overflow-y-auto space-y-2 flex-1">
              {sortedRedemptions.length === 0 && (
                <p className="text-xs text-center py-6 text-slate-400">Nothing redeemed yet.</p>
              )}
              {sortedRedemptions.map(r => {
                const member = members.find(m => m.id === r.memberId);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.rewardTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        {member?.name || 'Someone'} · {new Date(r.redeemedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        r.status === 'fulfilled'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {r.status === 'fulfilled' ? 'Given' : 'Pending'}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-black text-fuchsia-600 dark:text-fuchsia-400">
                        <Zap className="w-3 h-3 fill-current" />
                        -{r.pointsCost}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

