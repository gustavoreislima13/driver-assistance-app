import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Stripe lazily
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key, { apiVersion: "2023-10-16" as any });
  }
  return stripeClient;
}

// Webhook must use raw body
app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).send("Missing signature or secret");
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    
    // Here we would ideally update Firestore directly from the backend using firebase-admin
    // But since we don't have firebase-admin configured, we will handle it via the frontend
    // or set up firebase-admin.
    // Actually, setting up firebase-admin requires a service account key which we don't have.
    // So we'll just acknowledge the webhook. The frontend will verify the session.
    console.log("Payment successful for user:", userId);
  }

  res.json({ received: true });
});

app.use(cors());
app.use(express.json());

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Acesso Premium - Calculadora Particular",
              description: "Acesso completo ao sistema de gestão e calculadora de corridas",
            },
            unit_amount: 2990, // R$ 29,90
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      client_reference_id: userId,
      customer_email: email,
      success_url: `${req.protocol}://${req.get("host")}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get("host")}/?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({ error: "Chave da API da Stripe inválida. Por favor, verifique a chave secreta (STRIPE_SECRET_KEY) nas configurações." });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/verify-session", async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: "Session ID required" });
    
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id as string);
    
    res.json({ 
      status: session.payment_status,
      userId: session.client_reference_id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
