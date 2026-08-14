import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

interface Assignment {
  memberId: string;
  memberName: string;
  areas: string[];
  totalTasks: number;
  dueDateLabel: string; // e.g. "Sunday, Aug 17"
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { assignments } = req.body as { assignments: Assignment[] };
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ success: false, error: "assignments array is required" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: "Supabase isn't configured" });
    }
    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({ success: false, error: "Push notifications aren't configured (missing VAPID keys)" });
    }

    webpush.setVapidDetails("mailto:jellicekw@gmail.com", vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const results: { memberId: string; sent: number; failed: number }[] = [];

    for (const assignment of assignments) {
      const { data: subs, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("member_id", assignment.memberId);

      if (error) {
        console.error(`Error fetching subscriptions for ${assignment.memberId}:`, error.message);
        results.push({ memberId: assignment.memberId, sent: 0, failed: 0 });
        continue;
      }

      let sent = 0;
      let failed = 0;

      const areaList = assignment.areas.join(" & ");
      const payload = JSON.stringify({
        title: `🏠 You've got chores this week!`,
        body: `${areaList} (${assignment.totalTasks} tasks). Complete by ${assignment.dueDateLabel}!`,
        url: "/",
        tag: "chore-assignment"
      });

      for (const sub of subs || []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            payload
          );
          sent++;
        } catch (pushErr: any) {
          failed++;
          // 404/410 means the subscription is dead (uninstalled, expired) — clean it up
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            console.error(`Push failed for ${assignment.memberId}:`, pushErr.message);
          }
        }
      }

      results.push({ memberId: assignment.memberId, sent, failed });
    }

    return res.json({ success: true, results });
  } catch (error: any) {
    console.error("Error in /api/send-chore-notifications:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to send notifications" });
  }
}

