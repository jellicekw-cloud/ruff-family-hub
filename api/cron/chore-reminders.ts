import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Vercel invokes this automatically on the schedule defined in vercel.json.
// It checks every family member for incomplete chores and sends a reminder
// push to anyone who's behind — no user action triggers this, it just runs.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic protection so random public requests can't trigger this manually.
  // Only enforced if CRON_SECRET is actually set as an env var.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!supabaseUrl || !supabaseKey || !vapidPublicKey || !vapidPrivateKey) {
      console.error("Chore reminder cron: missing required env vars");
      return res.status(500).json({ success: false, error: "Not configured" });
    }

    webpush.setVapidDetails("mailto:jellicekw@gmail.com", vapidPublicKey, vapidPrivateKey);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: chores, error: choresErr } = await supabase.from("chores").select("*");
    if (choresErr) throw new Error(choresErr.message);

    const { data: members, error: membersErr } = await supabase.from("family_members").select("id, name");
    if (membersErr) throw new Error(membersErr.message);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Figure out which members have at least one incomplete day that's already
    // passed (not future days that simply haven't happened yet).
    const membersNeedingReminder = new Set<string>();

    for (const chore of chores || []) {
      if (!chore.assigned_member_id) continue;

      if (chore.week_start_date) {
        // Rotating daily-tracked chore — check for any elapsed day not yet completed
        const start = new Date(chore.week_start_date + "T00:00:00");
        const end = new Date(Math.min(new Date(chore.due_date + "T00:00:00").getTime(), today.getTime()));
        const completedDates: string[] = chore.completed_dates || [];

        const cursor = new Date(start);
        while (cursor <= end) {
          const dStr = cursor.toISOString().split("T")[0];
          if (!completedDates.includes(dStr)) {
            membersNeedingReminder.add(chore.assigned_member_id);
            break;
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      } else if (!chore.is_completed && chore.due_date < todayStr) {
        // Simple chore (e.g. Laundry Day) that's overdue
        membersNeedingReminder.add(chore.assigned_member_id);
      }
    }

    if (membersNeedingReminder.size === 0) {
      return res.json({ success: true, remindersSent: 0, note: "Everyone is caught up!" });
    }

    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("member_id", Array.from(membersNeedingReminder));
    if (subsErr) throw new Error(subsErr.message);

    const payload = JSON.stringify({
      title: "⏰ Chore Reminder",
      body: "You still have unfinished chores this week — catch up when you can!",
      url: "/",
      tag: "chore-reminder"
    });

    let sent = 0;
    const deadSubIds: string[] = [];

    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (pushErr: any) {
        if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
          deadSubIds.push(sub.id);
        } else {
          console.error("Chore reminder push failed:", pushErr.message);
        }
      }
    }

    if (deadSubIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", deadSubIds);
    }

    return res.json({
      success: true,
      membersNeedingReminder: Array.from(membersNeedingReminder).length,
      remindersSent: sent
    });
  } catch (error: any) {
    console.error("Error in chore-reminders cron:", error);
    return res.status(500).json({ success: false, error: error.message || "Cron job failed" });
  }
}

