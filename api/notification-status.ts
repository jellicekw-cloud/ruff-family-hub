import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: "Supabase isn't configured" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("push_subscriptions").select("member_id");

    if (error) {
      console.error("Error fetching notification status:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    const subscribedMemberIds = Array.from(new Set((data || []).map(r => r.member_id)));
    return res.json({ success: true, subscribedMemberIds });
  } catch (error: any) {
    console.error("Error in /api/notification-status:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to check notification status" });
  }
}

