
import { getFirestore, collection, addDoc } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
if (!admin.apps.length){
  admin.initializeApp({ credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  })});
}
const db = getFirestore();
export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try{
    const { uid } = req.body || {}; if(!uid) return res.status(400).json({ error: "Missing uid" });
    const demo = [
      { title:"Amina Muaddi Heels", url:"https://example.com/heels", price:890, image:"https://placekitten.com/220/220", category:"Fashion", notes:"Size 38" },
      { title:"Dyson Airwrap", url:"https://example.com/airwrap", price:599, image:"https://placekitten.com/221/220", category:"Beauty", notes:"Complete set" },
      { title:"MacBook Pro 16”", url:"https://example.com/macbook", price:2499, image:"https://placekitten.com/222/220", category:"Tech", notes:"M3 Max" }
    ];
    for(const item of demo){ await addDoc(collection(db,"users",uid,"wishlist"), { ...item, createdAt:Date.now(), order:Date.now(), contributed:0 }); }
    res.json({ ok:true, count: demo.length });
  }catch(e){ res.status(500).json({ error: e.message }); }
}
