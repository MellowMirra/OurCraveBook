import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader('Allow','POST'); return res.status(405).end('Method Not Allowed'); }
  try {
    const { uid = "anon", type = "purchase", itemId = null, amount = 2000, title = "Wishlist Item", referral = {} } = req.body || {};
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      allow_promotion_codes: true,
      line_items: [{ price_data: { currency: 'usd', product_data: { name: title }, unit_amount: amount }, quantity: 1 }],
      success_url: `${req.headers.origin}/?success=true&kind=purchase`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      metadata: { type, uid, itemId, amount: String(amount), ...Object.fromEntries(Object.entries(referral).map(([k,v])=>[`ref_${k}`, v])) }
    });
    res.status(200).json({ id: session.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
