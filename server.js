import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const app = express();
app.use(cors());
app.use(express.json());

async function getOrCreateCustomer(userId, name) {
  // Search customer by supabase_user_id
  const existingCustomers = await stripe.customers.search({
    query: `metadata['supabase_user_id']:'${userId}'`,
  });
  
  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }
  
  // Create if not exists
  return await stripe.customers.create({
    name: name || 'User',
    metadata: { supabase_user_id: userId }
  });
}

app.get('/payment-methods', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const existingCustomers = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${userId}'`,
    });
    
    if (existingCustomers.data.length === 0) {
      return res.json({ paymentMethods: [] });
    }
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: existingCustomers.data[0].id,
      type: 'card',
    });
    
    res.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, userId, name, saveCard, paymentMethodId } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const customer = await getOrCreateCustomer(userId, name);

    if (paymentMethodId) {
      // Using a saved card (Direct charge)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: currency || 'idr',
        customer: customer.id,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
      });
      return res.json({ paymentIntent });
    } else {
      // Using a new card
      const params = {
        amount: amount * 100,
        currency: currency || 'idr',
        customer: customer.id,
        automatic_payment_methods: { enabled: true },
      };
      
      // If user opted to save the card for future use
      if (saveCard) {
        params.setup_future_usage = 'off_session';
      }

      const paymentIntent = await stripe.paymentIntents.create(params);
      res.json({ clientSecret: paymentIntent.client_secret });
    }
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(400).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Stripe Node server running on port ${PORT}`));
