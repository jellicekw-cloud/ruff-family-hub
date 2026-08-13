import React from 'react';
import { Megaphone } from 'lucide-react';

interface AnnouncementBannerProps {
  messages: string[];
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ messages }) => {
  if (!messages || messages.length === 0) return null;

  // Joined once, then rendered twice back-to-back so the marquee loop is seamless
  // (the CSS animation slides from 0% to -50%, i.e. exactly one full copy).
  const joined = messages.join('   •   ');

  return (
    <div className="bg-slate-900 dark:bg-black border-b border-slate-800 text-white overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 font-extrabold text-xs uppercase tracking-wide z-10">
          <Megaphone className="w-4 h-4" />
          <span>Announcement</span>
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap py-2">
          <div className="inline-flex marquee-track">
            <span className="px-6 text-base font-bold tracking-wide announcement-flash">{joined}</span>
            <span className="px-6 text-base font-bold tracking-wide announcement-flash" aria-hidden="true">{joined}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

