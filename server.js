const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // test key: sk_test_...
const app = express();
app.use(bodyParser.json());

// Basit doğrulama: apiKeyHeader ile istek gelmeli (ESP ile paylaşacağın kısa token)
const API_TOKEN = process.env.API_TOKEN || "topsecret_esp_token";

app.post('/create-checkout', async (req, res) => {
  try {
    if (req.headers['x-api-token'] !== API_TOKEN) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    let {amount, currency, description} = req.body;
    // input validation
    amount = Number(amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({error:'invalid amount'});
    currency = (currency || 'try').toLowerCase();
    // Stripe expects integer in minor units (ör: kuruş). Burada örnek için 2 ondalık varsay.
    const unit_amount = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: { name: description || 'Ödeme' },
          unit_amount: unit_amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://your-domain.com/cancel',
    });

    res.json({url: session.url});
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  }
});

app.listen(3000, ()=>console.log('server on 3000'));
