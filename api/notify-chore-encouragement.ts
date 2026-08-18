import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { finisherName, memberIdsToNotify } = req.body || {};
    if (!finisherName || !Array.isArray(memberIdsToNotify) || memberIdsToNotify.length === 0) {
      return res.json({ success: true, sent: 0 }); // nothing to do, not an error
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!supabaseUrl || !supabaseKey || !vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({ success: false, error: "Push notifications aren't configured" });
    }

    webpush.setVapidDetails("mailto:jellicekw@gmail.com", vapidPublicKey, vapidPrivateKey);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("member_id", memberIdsToNotify);

    if (error) {
      console.error("Error fetching subscriptions:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    const payload = JSON.stringify({
      title: `🎉 ${finisherName} just finished their chores!`,
      body: `Time to catch up on yours 💪`,
      url: "/",
      tag: "chore-encouragement"
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
          console.error("Encouragement push failed:", pushErr.message);
        }
      }
    }

    if (deadSubIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", deadSubIds);
    }

    return res.json({ success: true, sent });
  } catch (error: any) {
    console.error("Error in /api/notify-chore-encouragement:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to send notification" });
  }
}

