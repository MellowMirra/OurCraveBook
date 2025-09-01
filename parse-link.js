
import cheerio from "cheerio";
export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try{
    const { url } = req.body || {}; if(!url) return res.status(400).json({ error: "Missing url" });
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 OurCraveBot" } });
    const html = await r.text();
    const $ = cheerio.load(html);
    const og = (p) => $(`meta[property="og:${p}"]`).attr("content") || $(`meta[name="og:${p}"]`).attr("content");
    const tw = (p) => $(`meta[name="twitter:${p}"]`).attr("content");
    const any = (sel) => $(sel).attr("content");
    let title = (og("title") || $("title").text() || tw("title") || "").trim();
    const image = og("image") || tw("image") || any('meta[name="image"]') || "";
    let price = null; const meta = $('meta[itemprop="price"]').attr("content") || $('meta[property="product:price:amount"]').attr("content") || $('meta[name="price"]').attr("content");
    if (meta) price = parseInt(String(meta).replace(/[^0-9]/g,""), 10) || null;
    if (!price){ const m = html.match(/\$\s?([0-9]{1,5})([\.,][0-9]{2})?/); if (m) price = parseInt(m[1],10); }
    res.status(200).json({ title, image, price });
  }catch(e){ res.status(200).json({ title:"", image:"", price:null, error: e.message }); }
}
