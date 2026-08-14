import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { memberId, subscription } = req.body || {};

    if (!memberId || !subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, error: "memberId and a valid subscription are required" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: "Supabase isn't configured" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // endpoint is unique per browser/device — upsert so re-subscribing doesn't create duplicates
    const { error } = await supabase.from("push_subscriptions").upsert({
      id: subscription.endpoint,
      member_id: memberId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    if (error) {
      console.error("Error saving push subscription:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error in /api/save-push-subscription:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to save subscription" });
  }
}

