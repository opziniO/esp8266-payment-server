import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Stripe from "stripe";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const API_TOKEN = process.env.API_TOKEN || "topsecret_esp_token";

// Ana sayfa
app.get("/", (req, res) => {
  res.send("ESP8266 Payment Server çalışıyor 🚀");
});

// Ödeme oturumu oluşturma
app.post("/create-checkout", async (req, res) => {
  try {
    const { amount, token } = req.body;

    // Güvenlik kontrolü (ESP8266 -> Server)
    if (token !== API_TOKEN) {
      return res.status(403).json({ error: "Geçersiz token" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "try",
            product_data: {
              name: "ESP8266 Bağlantılı Ödeme",
            },
            unit_amount: amount * 100, // TL -> kuruş
          },
          quantity: 1,
        },
      ],
      success_url: "https://esp8266-payment-server.onrender.com/success",
      cancel_url: "https://esp8266-payment-server.onrender.com/cancel",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Başarılı / iptal sayfaları
app.get("/success", (req, res) => res.send("Ödeme başarılı ✅"));
app.get("/cancel", (req, res) => res.send("Ödeme iptal edildi ❌"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor...`));
