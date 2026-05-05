import type { Config } from "@netlify/functions";

// Jadwal: setiap hari pukul 00:00 WIB = 17:00 UTC
export const config: Config = {
  schedule: "10 3 * * *",
};

export default async (): Promise<void> => {
  // Netlify menyediakan env var URL secara otomatis saat deploy
  const siteUrl = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl || !cronSecret) {
    console.error("[cron-monthly] Missing URL or CRON_SECRET env vars");
    return;
  }

  try {
    const res = await fetch(`${siteUrl}/api/cron/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret,
      },
    });

    const data = await res.json();
    console.log("[cron-monthly] Result:", JSON.stringify(data));
  } catch (err) {
    console.error("[cron-monthly] Error:", err);
  }
};
