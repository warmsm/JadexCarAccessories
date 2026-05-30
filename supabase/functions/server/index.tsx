import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();
const ADMIN_ACCOUNT_PREFIX = "adminAccount:";
const ADMIN_SESSION_PREFIX = "adminSession:";

const defaultAdminAccounts = [
  { username: "cashteoxon", password: "tatiisabel", role: "executive" },
  { username: "kenmorillo", password: "kadeaustin", role: "executive" },
];

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
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a4dcf20c/health", (c) => {
  return c.json({ status: "ok" });
});

const hashPassword = async (password: string) => {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const ensureDefaultAdminAccounts = async () => {
  for (const account of defaultAdminAccounts) {
    const id = `${ADMIN_ACCOUNT_PREFIX}${account.username}`;
    const existing = await kv.get(id);
    if (!existing) {
      await kv.set(id, {
        id,
        username: account.username,
        passwordHash: await hashPassword(account.password),
        role: account.role,
        createdAt: new Date().toISOString(),
      });
    } else if (existing.role !== account.role) {
      await kv.set(id, { ...existing, role: account.role, updatedAt: new Date().toISOString() });
    }
  }
};

const requireAdmin = async (c: any) => {
  const token = c.req.header("X-Admin-Token");
  if (!token) {
    return null;
  }

  const session = await kv.get(`${ADMIN_SESSION_PREFIX}${token}`);
  if (!session) {
    return null;
  }

  return session;
};

const requireExecutive = async (c: any) => {
  const admin = await requireAdmin(c);
  if (!admin || admin.role !== "executive") {
    return null;
  }

  return admin;
};

// Admin auth routes
app.post("/make-server-a4dcf20c/admin/login", async (c) => {
  try {
    await ensureDefaultAdminAccounts();

    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: "Missing username or password" }, 400);
    }

    const account = await kv.get(`${ADMIN_ACCOUNT_PREFIX}${username}`);
    const passwordHash = await hashPassword(password);
    if (!account || account.passwordHash !== passwordHash) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    const token = crypto.randomUUID();
    await kv.set(`${ADMIN_SESSION_PREFIX}${token}`, {
      token,
      username,
      role: account.role || "employee",
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, token, username, role: account.role || "employee" });
  } catch (error) {
    console.log(`Error logging admin in: ${error}`);
    return c.json({ error: "Failed to log in" }, 500);
  }
});

app.post("/make-server-a4dcf20c/admin/accounts", async (c) => {
  try {
    const admin = await requireExecutive(c);
    if (!admin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: "Missing username or password" }, 400);
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    if (!normalizedUsername || String(password).length < 6) {
      return c.json({ error: "Username is required and password must be at least 6 characters" }, 400);
    }

    const id = `${ADMIN_ACCOUNT_PREFIX}${normalizedUsername}`;
    const existing = await kv.get(id);
    if (existing) {
      return c.json({ error: "Username already exists" }, 409);
    }

    await kv.set(id, {
      id,
      username: normalizedUsername,
      passwordHash: await hashPassword(String(password)),
      role: "employee",
      createdBy: admin.username,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, username: normalizedUsername });
  } catch (error) {
    console.log(`Error creating admin account: ${error}`);
    return c.json({ error: "Failed to create admin account" }, 500);
  }
});

app.get("/make-server-a4dcf20c/admin/accounts", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await ensureDefaultAdminAccounts();
    const accounts = await kv.getByPrefix(ADMIN_ACCOUNT_PREFIX);
    return c.json({
      accounts: (accounts || []).map((account) => ({
        id: account.id,
        username: account.username,
        role: account.role || "employee",
        createdAt: account.createdAt,
      })),
    });
  } catch (error) {
    console.log(`Error fetching admin accounts: ${error}`);
    return c.json({ error: "Failed to fetch admin accounts" }, 500);
  }
});

app.put("/make-server-a4dcf20c/admin/accounts/:username", async (c) => {
  try {
    const admin = await requireExecutive(c);
    if (!admin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const username = c.req.param("username");
    const updates = await c.req.json();
    const id = `${ADMIN_ACCOUNT_PREFIX}${username}`;
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: "Account not found" }, 404);
    }

    const role = updates.role === "executive" ? "executive" : "employee";
    await kv.set(id, { ...existing, role, updatedBy: admin.username, updatedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating admin account ${c.req.param("username")}: ${error}`);
    return c.json({ error: "Failed to update admin account" }, 500);
  }
});

app.delete("/make-server-a4dcf20c/admin/accounts/:username", async (c) => {
  try {
    const admin = await requireExecutive(c);
    if (!admin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const username = c.req.param("username");
    if (username === admin.username) {
      return c.json({ error: "You cannot delete your own account" }, 400);
    }

    await kv.del(`${ADMIN_ACCOUNT_PREFIX}${username}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting admin account ${c.req.param("username")}: ${error}`);
    return c.json({ error: "Failed to delete admin account" }, 500);
  }
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
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

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
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

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

app.put("/make-server-a4dcf20c/products/:id/decrement-stock", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (!admin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: "Product not found" }, 404);
    }

    const stock = Math.max(0, Number(existing.stock || 0) - 1);
    await kv.set(id, { ...existing, stock, updatedBy: admin.username, updatedAt: new Date().toISOString() });
    return c.json({ success: true, stock });
  } catch (error) {
    console.log(`Error decrementing product stock ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to decrement stock" }, 500);
  }
});

app.delete("/make-server-a4dcf20c/products/:id", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: "Product not found" }, 404);
    }
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting product ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

app.delete("/make-server-a4dcf20c/products", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const products = await kv.getByPrefix("product:");
    if (products.length === 0) {
      return c.json({ success: true, deleted: 0 });
    }
    await kv.mdel(products.map((product) => product.id));
    return c.json({ success: true, deleted: products.length });
  } catch (error) {
    console.log(`Error deleting products: ${error}`);
    return c.json({ error: "Failed to delete products" }, 500);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 2);
    const requestedDate = new Date(`${booking.date}T00:00:00`);
    const closedDate = await kv.get(`closedDate:${booking.date}`);

    if (Number.isNaN(requestedDate.getTime()) || requestedDate < today || requestedDate > maxDate) {
      return c.json({ error: "Bookings are only allowed up to two months from today" }, 400);
    }

    if (closedDate) {
      return c.json({ error: "The shop is closed on this date" }, 400);
    }

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

// Shop closed dates
app.get("/make-server-a4dcf20c/closed-dates", async (c) => {
  try {
    const closedDates = await kv.getByPrefix("closedDate:");
    return c.json({ closedDates: closedDates || [] });
  } catch (error) {
    console.log(`Error fetching closed dates: ${error}`);
    return c.json({ error: "Failed to fetch closed dates" }, 500);
  }
});

app.post("/make-server-a4dcf20c/closed-dates", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { date, reason } = await c.req.json();
    if (!date) {
      return c.json({ error: "Missing date" }, 400);
    }

    const id = `closedDate:${date}`;
    await kv.set(id, {
      id,
      date,
      reason: reason || "Closed",
      createdAt: new Date().toISOString(),
    });
    return c.json({ success: true, id });
  } catch (error) {
    console.log(`Error creating closed date: ${error}`);
    return c.json({ error: "Failed to create closed date" }, 500);
  }
});

app.delete("/make-server-a4dcf20c/closed-dates/:date", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await kv.del(`closedDate:${c.req.param("date")}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting closed date ${c.req.param("date")}: ${error}`);
    return c.json({ error: "Failed to delete closed date" }, 500);
  }
});

app.put("/make-server-a4dcf20c/bookings/:id/verify", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

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

    // Store only the Storage object path in the database. Admins request
    // short-lived signed links when they need to view a proof.
    const booking = await kv.get(bookingId);
    if (booking) {
      await kv.set(bookingId, {
        ...booking,
        paymentProof: data.path,
        paymentUploadedAt: new Date().toISOString()
      });
    }

    return c.json({ success: true, fileName: data.path });
  } catch (error) {
    console.log(`Error in upload-payment endpoint: ${error}`);
    return c.json({ error: "Failed to upload payment proof" }, 500);
  }
});

// Get signed URL for payment proof
app.get("/make-server-a4dcf20c/payment-proof/:fileName", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

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

// Reviews routes
app.get("/make-server-a4dcf20c/reviews", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const reviews = await kv.getByPrefix("review:");
    return c.json({ reviews: reviews || [] });
  } catch (error) {
    console.log(`Error fetching reviews: ${error}`);
    return c.json({ error: "Failed to fetch reviews" }, 500);
  }
});

app.get("/make-server-a4dcf20c/reviews/featured", async (c) => {
  try {
    const reviews = await kv.getByPrefix("review:");
    const featured = (reviews || [])
      .filter((review) => review.visible)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return c.json({ reviews: featured });
  } catch (error) {
    console.log(`Error fetching featured reviews: ${error}`);
    return c.json({ error: "Failed to fetch featured reviews" }, 500);
  }
});

app.post("/make-server-a4dcf20c/reviews", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const review = await c.req.json();
    const id = `review:${Date.now()}`;
    await kv.set(id, {
      ...review,
      id,
      visible: Boolean(review.visible),
      createdAt: new Date().toISOString(),
    });
    return c.json({ success: true, id });
  } catch (error) {
    console.log(`Error creating review: ${error}`);
    return c.json({ error: "Failed to create review" }, 500);
  }
});

app.put("/make-server-a4dcf20c/reviews/:id", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: "Review not found" }, 404);
    }
    await kv.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating review ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to update review" }, 500);
  }
});

app.delete("/make-server-a4dcf20c/reviews/:id", async (c) => {
  try {
    if (!(await requireExecutive(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: "Review not found" }, 404);
    }
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting review ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to delete review" }, 500);
  }
});

Deno.serve(app.fetch);
