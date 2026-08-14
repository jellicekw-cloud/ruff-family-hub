import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { memberName, rewardTitle, pointsCost, emoji } = req.body || {};

    if (!memberName || !rewardTitle) {
      return res.status(400).json({ success: false, error: "memberName and rewardTitle are required" });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars");
      return res.status(500).json({ success: false, error: "Email notifications aren't configured yet" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    await transporter.sendMail({
      from: `"The Ruffs Family Hub" <${gmailUser}>`,
      to: gmailUser,
      subject: `${emoji || "🎁"} Reward Redeemed: ${rewardTitle}`,
      text: `${memberName} just redeemed "${rewardTitle}" for ${pointsCost} points.\n\nMark it as given once you've handed it over: check the Rewards tab in the Family Hub app.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #a21caf;">${emoji || "🎁"} Reward Redeemed</h2>
          <p><strong>${memberName}</strong> just redeemed:</p>
          <p style="font-size: 18px; font-weight: bold;">${rewardTitle}</p>
          <p style="color: #6b7280;">Cost: ${pointsCost} points</p>
          <p style="margin-top: 20px; padding: 12px; background: #fef3c7; border-radius: 8px; color: #92400e;">
            This is pending until you mark it as given in the Rewards tab.
          </p>
        </div>
      `
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error sending redemption notification email:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to send notification" });
  }
}

