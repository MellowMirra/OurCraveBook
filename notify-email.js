
export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try{
    const { to, subject, text } = req.body || {};
    if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok:true, skipped:true });
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM || "OurCraveBook <no-reply@ourcravebook.com>", to, subject, text })
    });
    const json = await r.json(); res.status(200).json(json);
  }catch(e){ res.status(500).json({ error: e.message }); }
}
