import React, { useState } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  RefreshCw, 
  CheckCircle2, 
  Link2, 
  FileText, 
  Settings, 
  ShieldCheck, 
  Clock,
  Sparkles
} from 'lucide-react';
import { SyncCalendarConfig } from '../types';

interface ConnectCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncCalendarConfig;
  onUpdateSyncConfig: (config: SyncCalendarConfig) => void;
  onTriggerSyncNow: () => void;
}

export const ConnectCalendarModal: React.FC<ConnectCalendarModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateSyncConfig,
  onTriggerSyncNow,
}) => {
  const [emailInput, setEmailInput] = useState(syncConfig.accountEmail || 'family.clvrbrk@gmail.com');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = () => {
    onUpdateSyncConfig({
      ...syncConfig,
      isConnected: true,
      accountEmail: emailInput,
      lastSyncedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setSyncSuccessMessage('Connected to Google Calendar! Family events and color assignments are synchronized.');
  };

  const handleDisconnect = () => {
    onUpdateSyncConfig({
      ...syncConfig,
      isConnected: false,
      lastSyncedAt: undefined
    });
    setSyncSuccessMessage(null);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onTriggerSyncNow();
      setIsSyncing(false);
      setSyncSuccessMessage(`Calendar synced successfully at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Calendar Connection & Sync</h3>
            <p className="text-xs text-slate-500">Sync family events with Google Calendar, Outlook, or Apple iCal</p>
          </div>
        </div>

        {syncSuccessMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncSuccessMessage}</span>
          </div>
        )}

        {/* Sync Status Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Connection Status:</span>
            {syncConfig.isConnected ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                Disconnected
              </span>
            )}
          </div>

          {syncConfig.isConnected && (
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Account:</strong> {syncConfig.accountEmail}</p>
              <p className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" /> Last synced: {syncConfig.lastSyncedAt || 'Just now'}
              </p>
            </div>
          )}
        </div>

        {/* Sync Settings */}
        <div className="space-y-3 text-xs font-medium">
          <label className="block text-slate-700 dark:text-slate-300 font-bold">
            Family Account Email for Calendar Integration:
          </label>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={syncConfig.isConnected}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Auto-sync Scheduled Family Meals</span>
              <span className="text-[11px] text-slate-400">Automatically push recipe dinners to family members' calendars</span>
            </div>
            <input
              type="checkbox"
              checked={syncConfig.autoSyncMeals}
              onChange={(e) => onUpdateSyncConfig({ ...syncConfig, autoSyncMeals: e.target.checked })}
              className="w-4 h-4 rounded text-violet-600"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {syncConfig.isConnected ? (
            <button
              onClick={handleDisconnect}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Disconnect
            </button>
          ) : (
            <div />
          )}

          <div className="flex space-x-2">
            {syncConfig.isConnected ? (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-violet-700 flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Calendar Now'}</span>
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="px-5 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-violet-700"
              >
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
