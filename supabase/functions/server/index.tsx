import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Create Supabase client for storage
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize storage bucket for payment proofs
const BUCKET_NAME = 'make-a4dcf20c-payments';
(async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  }
})();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a4dcf20c/health", (c) => {
  return c.json({ status: "ok" });
});

// Products routes
app.get("/make-server-a4dcf20c/products", async (c) => {
  try {
    const products = await kv.getByPrefix("product:");
    return c.json({ products: products || [] });
  } catch (error) {
    console.log(`Error fetching products: ${error}`);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

app.post("/make-server-a4dcf20c/products", async (c) => {
  try {
    const product = await c.req.json();
    const id = `product:${Date.now()}`;
    await kv.set(id, { ...product, id, createdAt: new Date().toISOString() });
    return c.json({ success: true, id });
  } catch (error) {
    console.log(`Error creating product: ${error}`);
    return c.json({ error: "Failed to create product" }, 500);
  }
});

app.put("/make-server-a4dcf20c/products/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: "Product not found" }, 404);
    }
    await kv.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating product ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to update product" }, 500);
  }
});

// Bookings routes
app.get("/make-server-a4dcf20c/bookings", async (c) => {
  try {
    const bookings = await kv.getByPrefix("booking:");
    return c.json({ bookings: bookings || [] });
  } catch (error) {
    console.log(`Error fetching bookings: ${error}`);
    return c.json({ error: "Failed to fetch bookings" }, 500);
  }
});

app.post("/make-server-a4dcf20c/bookings", async (c) => {
  try {
    const booking = await c.req.json();
    const id = `booking:${Date.now()}`;
    await kv.set(id, {
      ...booking,
      id,
      verified: false,
      createdAt: new Date().toISOString()
    });
    return c.json({ success: true, id });
  } catch (error) {
    console.log(`Error creating booking: ${error}`);
    return c.json({ error: "Failed to create booking" }, 500);
  }
});

app.put("/make-server-a4dcf20c/bookings/:id/verify", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: "Booking not found" }, 404);
    }
    await kv.set(id, { ...existing, verified: true, verifiedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error verifying booking ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to verify booking" }, 500);
  }
});

// Upload payment proof
app.post("/make-server-a4dcf20c/upload-payment", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const bookingId = formData.get('bookingId') as string;

    if (!file || !bookingId) {
      return c.json({ error: "Missing file or bookingId" }, 400);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${bookingId}-${Date.now()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
      });

    if (error) {
      console.log(`Error uploading payment proof for booking ${bookingId}: ${error.message}`);
      return c.json({ error: "Failed to upload file" }, 500);
    }

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    // Update booking with payment proof
    const booking = await kv.get(bookingId);
    if (booking) {
      await kv.set(bookingId, {
        ...booking,
        paymentProof: fileName,
        paymentProofUrl: urlData?.signedUrl,
        paymentUploadedAt: new Date().toISOString()
      });
    }

    return c.json({ success: true, url: urlData?.signedUrl });
  } catch (error) {
    console.log(`Error in upload-payment endpoint: ${error}`);
    return c.json({ error: "Failed to upload payment proof" }, 500);
  }
});

// Get signed URL for payment proof
app.get("/make-server-a4dcf20c/payment-proof/:fileName", async (c) => {
  try {
    const fileName = c.req.param("fileName");
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60 * 60); // 1 hour

    if (!data?.signedUrl) {
      return c.json({ error: "File not found" }, 404);
    }

    return c.json({ url: data.signedUrl });
  } catch (error) {
    console.log(`Error fetching payment proof ${c.req.param("fileName")}: ${error}`);
    return c.json({ error: "Failed to fetch payment proof" }, 500);
  }
});

Deno.serve(app.fetch);