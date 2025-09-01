
import Stripe from "stripe";
import * as admin from "firebase-admin";
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!admin.apps.length){
  admin.initializeApp({ credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  })});
}
const db = admin.firestore();
export const config = { api: { bodyParser: false } };
function buffer(req){ return new Promise((resolve, reject)=>{ const chunks=[]; req.on('data',c=>chunks.push(c)); req.on('end',()=>resolve(Buffer.concat(chunks))); req.on('error',reject); }); }
export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event; const sig = req.headers['stripe-signature']; const buf = await buffer(req);
  try{ event = stripe.webhooks.constructEvent(buf, sig, endpointSecret); }catch(err){ return res.status(400).send(`Webhook Error: ${err.message}`); }
  if (event.type === "checkout.session.completed"){
    const session = event.data.object; const meta = session.metadata || {};
    const uid = meta.uid || "anon"; const type = meta.type || "donation"; const itemId = meta.itemId || null; const amount = parseInt(meta.amount || "0",10);
    try{
      await db.collection("stats").doc("global").set({ [type]: admin.firestore.FieldValue.increment(1) }, { merge: true });
      if (uid && uid !== "anon"){ await db.collection("users").doc(uid).collection("meta").doc("stats").set({ [type]: admin.firestore.FieldValue.increment(1) }, { merge: true }); }
      if (uid && itemId && amount>0){ await db.collection("users").doc(uid).collection("wishlist").doc(itemId).set({ contributed: admin.firestore.FieldValue.increment(amount) }, { merge: true }); }
      const refFields = Object.keys(meta).filter(k=>k.startsWith("ref_"));
      if (refFields.length){ const updates = {}; refFields.forEach(k=>{ const key = `counts.${meta[k]}`; updates[key] = admin.firestore.FieldValue.increment(1); }); await db.collection("stats").doc("referrals").set(updates, { merge: true }); }
    }catch(e){}
  }
  res.json({ received: true });
}
