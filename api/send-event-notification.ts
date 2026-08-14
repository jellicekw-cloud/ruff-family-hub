import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { title, dateLabel, memberNames, category } = req.body || {};
    if (!title) {
      return res.status(400).json({ success: false, error: "title is required" });
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

    // Broadcast: every subscribed device gets this, not just the members assigned to the event
    const { data: subs, error } = await supabase.from("push_subscriptions").select("*");
    if (error) {
      console.error("Error fetching push subscriptions:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    const categoryEmoji: Record<string, string> = {
      school: "🎒",
      work: "💼",
      sports: "⚽",
      meals: "🍽️",
      health: "🩺",
      chores: "🧹",
      travel: "✈️",
      general: "📅"
    };
    const emoji = categoryEmoji[category] || "📅";

    const payload = JSON.stringify({
      title: `${emoji} New Event: ${title}`,
      body: `${memberNames || "The family"} — ${dateLabel || "date TBD"}`,
      url: "/",
      tag: "calendar-event"
    });

    let sent = 0;
    let failed = 0;
    const deadSubIds: string[] = [];

    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (pushErr: any) {
        failed++;
        if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
          deadSubIds.push(sub.id);
        } else {
          console.error("Event push failed for a subscriber:", pushErr.message);
        }
      }
    }

    if (deadSubIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", deadSubIds);
    }

    return res.json({ success: true, sent, failed });
  } catch (error: any) {
    console.error("Error in /api/send-event-notification:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to send notification" });
  }
}

