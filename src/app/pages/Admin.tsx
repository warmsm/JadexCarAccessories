import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  Package,
  Plus,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface Fitment {
  brand: string;
  model: string;
  year: string;
}

interface Product {
  id: string;
  name: string;
  type?: string;
  types?: string[];
  brand?: string;
  model?: string;
  year?: string;
  fitments?: Fitment[];
  price: number;
  stock: number;
  varieties: string;
  varietyStocks?: { name: string; stock: number }[];
  image: string;
  description: string;
}

interface Booking {
  id: string;
  date: string;
  timeSlot: string;
  verified: boolean;
  customerName: string;
  customerPhone: string;
  customerFacebook: string;
  paymentProof?: string;
}

interface ClosedDate {
  id: string;
  date: string;
  reason: string;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  product: string;
  visible: boolean;
  sortOrder: number;
}

interface Account {
  username: string;
  role: "executive" | "employee";
  createdAt?: string;
}

interface PasswordRequest {
  id: string;
  username: string;
  status: "pending" | "approved" | "completed";
  otp?: string;
  requestedBy: string;
  approvedBy?: string;
}

type Role = "executive" | "employee";
type Tab = "products" | "stock" | "bookings" | "closedDates" | "reviews" | "accounts";

const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c`;
const headers = { Authorization: `Bearer ${publicAnonKey}` };
const emptyFitment = { brand: "", model: "", year: "" };
const emptyVariety = { name: "", stock: 0 };
const emptyProduct = {
  name: "",
  type: "",
  fitments: [{ ...emptyFitment }],
  price: 0,
  stock: 0,
  varieties: "",
  varietyStocks: [{ ...emptyVariety }],
  image: "",
  description: "",
};
const emptyReview = { name: "", rating: 5, comment: "", date: "", product: "", visible: true, sortOrder: 0 };

export default function Admin() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("jadexAdminToken") || "");
  const [adminUsername, setAdminUsername] = useState(() => localStorage.getItem("jadexAdminUsername") || "");
  const [adminRole, setAdminRole] = useState<Role>(() => (localStorage.getItem("jadexAdminRole") as Role) || "employee");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("stock");
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [passwordRequests, setPasswordRequests] = useState<PasswordRequest[]>([]);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newClosedDate, setNewClosedDate] = useState({ startDate: "", endDate: "", reason: "" });
  const [newReview, setNewReview] = useState(emptyReview);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newAccount, setNewAccount] = useState({ username: "", password: "" });
  const [passwordCompletion, setPasswordCompletion] = useState<Record<string, { otp: string; newPassword: string }>>({});

  const isExecutive = adminRole === "executive";

  useEffect(() => {
    if (!adminToken) return;
    fetchProducts();
    if (isExecutive) {
      fetchBookings();
      fetchClosedDates();
      fetchReviews();
      fetchAccounts();
      fetchPasswordRequests();
    } else {
      setActiveTab("stock");
    }
  }, [adminToken, adminRole]);

  useEffect(() => {
    if (!adminToken || !isExecutive) return;

    const interval = window.setInterval(() => {
      fetchPasswordRequests();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [adminToken, adminRole]);

  const requestJson = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(adminToken ? { "X-Admin-Token": adminToken } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
    return data;
  };

  const handleLogin = async () => {
    setLoginError("");
    try {
      const response = await fetch(`${apiBase}/admin/login`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Login failed");
      const role = (data.role || "employee") as Role;
      localStorage.setItem("jadexAdminToken", data.token);
      localStorage.setItem("jadexAdminUsername", data.username);
      localStorage.setItem("jadexAdminRole", role);
      setAdminToken(data.token);
      setAdminUsername(data.username);
      setAdminRole(role);
      setActiveTab(role === "executive" ? "products" : "stock");
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      console.error("Error logging in:", error);
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jadexAdminToken");
    localStorage.removeItem("jadexAdminUsername");
    localStorage.removeItem("jadexAdminRole");
    setAdminToken("");
    setAdminUsername("");
    setAdminRole("employee");
  };

  const fetchProducts = async () => {
    try {
      const data = await requestJson("/products");
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    }
  };
  const fetchBookings = async () => setBookings((await requestJson("/bookings")).bookings || []);
  const fetchClosedDates = async () => setClosedDates((await requestJson("/closed-dates")).closedDates || []);
  const fetchReviews = async () => setReviews((await requestJson("/reviews")).reviews || []);
  const fetchAccounts = async () => setAccounts((await requestJson("/admin/accounts")).accounts || []);
  const fetchPasswordRequests = async () => setPasswordRequests((await requestJson("/admin/password-requests")).requests || []);

  const cleanProduct = () => {
    const varietyStocks = newProduct.varietyStocks
      .map((variety) => ({ name: variety.name.trim(), stock: Number(variety.stock || 0) }))
      .filter((variety) => variety.name);
    const stock = varietyStocks.length
      ? varietyStocks.reduce((total, variety) => total + Number(variety.stock || 0), 0)
      : Number(newProduct.stock || 0);
    const fitments = newProduct.fitments
      .map((fitment) => ({
        brand: fitment.brand.trim(),
        model: fitment.model.trim(),
        year: fitment.year.trim(),
      }))
      .filter((fitment) => fitment.brand || fitment.model || fitment.year);
    return {
      ...newProduct,
      type: newProduct.type.trim(),
      types: newProduct.type.trim() ? [newProduct.type.trim()] : [],
      brand: fitments[0]?.brand || "",
      model: fitments[0]?.model || "",
      year: fitments[0]?.year || "",
      fitments,
      varietyStocks,
      varieties: varietyStocks.map((variety) => variety.name).join(", "),
      stock,
    };
  };

  const handleAddProduct = async () => {
    try {
      await requestJson("/products", { method: "POST", body: JSON.stringify(cleanProduct()) });
      setShowAddProduct(false);
      setNewProduct(emptyProduct);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    }
  };

  const handleSetStock = async (productId: string, stock: number) => {
    await requestJson(`/products/${productId}`, { method: "PUT", body: JSON.stringify({ stock }) });
    fetchProducts();
  };

  const handleSubtractStock = async (productId: string, varietyIndex?: number) => {
    await requestJson(`/products/${productId}/decrement-stock`, {
      method: "PUT",
      body: JSON.stringify(typeof varietyIndex === "number" ? { varietyIndex } : {}),
    });
    fetchProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Remove this product?")) return;
    await requestJson(`/products/${productId}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleVerifyBooking = async (bookingId: string) => {
    await requestJson(`/bookings/${bookingId}/verify`, { method: "PUT" });
    fetchBookings();
  };

  const handleViewPaymentProof = async (fileName: string) => {
    const data = await requestJson(`/payment-proof/${encodeURIComponent(fileName)}`);
    window.open(data.url, "_blank", "noopener,noreferrer");
  };

  const handleAddClosedDate = async () => {
    if (!newClosedDate.startDate) return alert("Please choose a start date");
    await requestJson("/closed-dates", { method: "POST", body: JSON.stringify(newClosedDate) });
    setNewClosedDate({ startDate: "", endDate: "", reason: "" });
    fetchClosedDates();
  };

  const handleDeleteClosedDate = async (date: string) => {
    await requestJson(`/closed-dates/${date}`, { method: "DELETE" });
    fetchClosedDates();
  };

  const handleAddReview = async () => {
    await requestJson("/reviews", { method: "POST", body: JSON.stringify(newReview) });
    setShowAddReview(false);
    setNewReview(emptyReview);
    fetchReviews();
  };

  const handleUpdateReview = async (reviewId: string, updates: Partial<Review>) => {
    await requestJson(`/reviews/${reviewId}`, { method: "PUT", body: JSON.stringify(updates) });
    fetchReviews();
  };

  const handleAddAccount = async () => {
    await requestJson("/admin/accounts", { method: "POST", body: JSON.stringify(newAccount) });
    setNewAccount({ username: "", password: "" });
    fetchAccounts();
  };

  const handleSetRole = async (username: string, role: Role) => {
    await requestJson(`/admin/accounts/${username}`, { method: "PUT", body: JSON.stringify({ role }) });
    fetchAccounts();
  };

  const handleDeleteAccount = async (username: string) => {
    if (!confirm(`Delete ${username}?`)) return;
    await requestJson(`/admin/accounts/${username}`, { method: "DELETE" });
    fetchAccounts();
  };

  const handleRequestPasswordChange = async (username: string) => {
    await requestJson("/admin/password-requests", { method: "POST", body: JSON.stringify({ username }) });
    fetchPasswordRequests();
  };

  const handleApprovePasswordRequest = async (requestId: string) => {
    await requestJson(`/admin/password-requests/${encodeURIComponent(requestId)}/approve`, { method: "PUT" });
    fetchPasswordRequests();
  };

  const handleCompletePasswordRequest = async (requestId: string) => {
    const completion = passwordCompletion[requestId];
    await requestJson(`/admin/password-requests/${encodeURIComponent(requestId)}/complete`, {
      method: "PUT",
      body: JSON.stringify(completion),
    });
    setPasswordCompletion({ ...passwordCompletion, [requestId]: { otp: "", newPassword: "" } });
    fetchPasswordRequests();
  };

  const tabs = isExecutive
    ? [
        { id: "products" as const, label: "Products", icon: Package },
        { id: "stock" as const, label: "Stock", icon: Package },
        { id: "bookings" as const, label: "Bookings", icon: Calendar },
        { id: "closedDates" as const, label: "Closed Dates", icon: Calendar },
        { id: "reviews" as const, label: "Reviews", icon: Star },
        { id: "accounts" as const, label: "Accounts", icon: Shield },
      ]
    : [{ id: "stock" as const, label: "Stock", icon: Package }];

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6">
          <p className="text-sm text-red-600 font-semibold mb-2">Admin Portal</p>
          <h1 className="text-3xl font-bold mb-6">Jadex Car Accessories</h1>
          <div className="space-y-4">
            <TextInput label="Username" value={loginForm.username} onChange={(username) => setLoginForm({ ...loginForm, username })} />
            <PasswordInput label="Password" value={loginForm.password} onChange={(password) => setLoginForm({ ...loginForm, password })} onEnter={handleLogin} />
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button onClick={handleLogin} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg">
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
      <div className="border-b border-gray-300 dark:border-gray-800 bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-5">
          <p className="text-sm text-red-600 font-semibold">Admin Portal</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold">Jadex Car Accessories</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>{adminUsername}</span>
              <span className="rounded bg-gray-200 dark:bg-gray-800 px-2 py-1">{adminRole}</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-500 font-semibold">Log out</button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === tab.id ? "bg-red-600 text-white" : "bg-white dark:bg-black text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "products" && isExecutive && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Manage Products</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Put "Universal" for products that are good for all vehicles.</p>
              </div>
              <button onClick={() => setShowAddProduct(true)} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg">
                <Plus className="w-5 h-5" /> Add Product
              </button>
            </div>

            {showAddProduct && (
              <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Product Name" value={newProduct.name} onChange={(name) => setNewProduct({ ...newProduct, name })} />
                  <TextInput label="Product Type" value={newProduct.type} onChange={(type) => setNewProduct({ ...newProduct, type })} />
                  <NumberInput label="Price" value={newProduct.price} onChange={(price) => setNewProduct({ ...newProduct, price })} />
                  <div className="md:col-span-2">
                    <TextInput label="Image URL" value={newProduct.image} onChange={(image) => setNewProduct({ ...newProduct, image })} />
                  </div>
                  <div className="md:col-span-2">
                    <TextareaInput label="Description" value={newProduct.description} onChange={(description) => setNewProduct({ ...newProduct, description })} />
                  </div>
                </div>

                <VarietyFields varieties={newProduct.varietyStocks} onChange={(varietyStocks) => setNewProduct({ ...newProduct, varietyStocks })} />
                <FitmentFields fitments={newProduct.fitments} onChange={(fitments) => setNewProduct({ ...newProduct, fitments })} />

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddProduct(false)} className="flex-1 bg-gray-300 dark:bg-gray-800 py-2 rounded">Cancel</button>
                  <button onClick={handleAddProduct} className="flex-1 bg-red-600 text-white py-2 rounded">Add Product</button>
                </div>
              </div>
            )}

            <ProductTable products={products} executive onSetStock={handleSetStock} onSubtract={handleSubtractStock} onDelete={handleDeleteProduct} />
          </section>
        )}

        {activeTab === "stock" && (
          <section>
            <h2 className="text-2xl font-bold mb-2">Stock Adjustment</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Employees can view stock and subtract one item at a time.
            </p>
            <ProductTable products={products} executive={isExecutive} onSetStock={handleSetStock} onSubtract={handleSubtractStock} />
          </section>
        )}

        {activeTab === "bookings" && isExecutive && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Tint Bookings</h2>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{booking.customerName}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <p>Date: {booking.date}</p>
                        <p>Time: {booking.timeSlot}</p>
                        <p>Phone: {booking.customerPhone}</p>
                        <a href={booking.customerFacebook} target="_blank" rel="noopener noreferrer" className="text-red-600 underline">Facebook Profile</a>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {booking.paymentProof && (
                        <button onClick={() => handleViewPaymentProof(booking.paymentProof!)} className="border border-gray-300 dark:border-gray-800 px-4 py-2 rounded inline-flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Payment Proof
                        </button>
                      )}
                      {!booking.verified && (
                        <button onClick={() => handleVerifyBooking(booking.id)} className="bg-green-600 text-white px-4 py-2 rounded inline-flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "closedDates" && isExecutive && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Closed Dates</h2>
            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-[220px_220px_1fr_auto] gap-4 items-end">
                <DateInput label="Start Date" value={newClosedDate.startDate} onChange={(startDate) => setNewClosedDate({ ...newClosedDate, startDate, endDate: newClosedDate.endDate || startDate })} />
                <DateInput label="End Date" value={newClosedDate.endDate} onChange={(endDate) => setNewClosedDate({ ...newClosedDate, endDate })} />
                <TextInput label="Reason" value={newClosedDate.reason} onChange={(reason) => setNewClosedDate({ ...newClosedDate, reason })} />
                <button onClick={handleAddClosedDate} className="bg-red-600 text-white px-4 py-2 rounded-lg">Block Date</button>
              </div>
            </div>
            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
              {closedDates.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">No closed dates yet</div>
              ) : (
                closedDates.map((closedDate) => (
                  <div key={closedDate.id} className="flex flex-wrap items-center justify-between gap-3 p-4 border-t first:border-t-0 border-gray-300 dark:border-gray-800">
                    <span>{closedDate.date} - {closedDate.reason || "Closed"}</span>
                    <button onClick={() => handleDeleteClosedDate(closedDate.date)} className="text-red-600 inline-flex items-center gap-2 text-sm">
                      <Trash2 className="w-4 h-4" /> Reopen
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "reviews" && isExecutive && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold">Website Reviews</h2>
              <button onClick={() => setShowAddReview(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Review
              </button>
            </div>
            {showAddReview && (
              <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Customer Name" value={newReview.name} onChange={(name) => setNewReview({ ...newReview, name })} />
                  <TextInput label="Product or Service" value={newReview.product} onChange={(product) => setNewReview({ ...newReview, product })} />
                  <TextInput label="Date Label" value={newReview.date} onChange={(date) => setNewReview({ ...newReview, date })} />
                  <NumberInput label="Display Order" value={newReview.sortOrder} onChange={(sortOrder) => setNewReview({ ...newReview, sortOrder })} />
                  <NumberInput label="Rating" value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating: Math.max(1, Math.min(5, rating)) })} />
                  <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-7">
                    <input type="checkbox" checked={newReview.visible} onChange={(event) => setNewReview({ ...newReview, visible: event.target.checked })} />
                    Show on website
                  </label>
                  <div className="md:col-span-2">
                    <TextareaInput label="Review" value={newReview.comment} onChange={(comment) => setNewReview({ ...newReview, comment })} />
                  </div>
                </div>
                <button onClick={handleAddReview} className="mt-5 bg-red-600 text-white px-4 py-2 rounded-lg">Add Review</button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-5">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg">{review.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.product || "General review"}</p>
                    </div>
                    <button onClick={() => handleUpdateReview(review.id, { visible: !review.visible })} className="p-2 border border-gray-300 dark:border-gray-800 rounded">
                      {review.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm mt-3">"{review.comment}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "accounts" && isExecutive && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Admin Accounts</h2>
            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                <TextInput label="Username" value={newAccount.username} onChange={(username) => setNewAccount({ ...newAccount, username })} />
                <PasswordInput label="Password" value={newAccount.password} onChange={(password) => setNewAccount({ ...newAccount, password })} />
                <button onClick={handleAddAccount} className="bg-red-600 text-white px-4 py-2 rounded-lg">Add Employee</button>
              </div>
            </div>
            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
              {accounts.map((account) => (
                <div key={account.username} className="flex flex-wrap items-center justify-between gap-3 p-4 border-t first:border-t-0 border-gray-300 dark:border-gray-800">
                  <div>
                    <p className="font-semibold">{account.username}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{account.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRequestPasswordChange(account.username)} className="border border-gray-300 dark:border-gray-800 px-3 py-2 rounded text-sm">
                      Change Password
                    </button>
                    <button onClick={() => handleSetRole(account.username, account.role === "executive" ? "employee" : "executive")} className="border border-gray-300 dark:border-gray-800 px-3 py-2 rounded text-sm">
                      {account.role === "executive" ? "Make Employee" : "Promote"}
                    </button>
                    <button onClick={() => handleDeleteAccount(account.username)} className="text-red-600 border border-gray-300 dark:border-gray-800 px-3 py-2 rounded text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-bold mt-8 mb-4">Password Change Requests</h3>
            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
              {passwordRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">No password change requests</div>
              ) : (
                passwordRequests.map((request) => {
                  const completion = passwordCompletion[request.id] || { otp: request.otp || "", newPassword: "" };
                  return (
                    <div key={request.id} className="p-4 border-t first:border-t-0 border-gray-300 dark:border-gray-800">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{request.username}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {request.status} requested by {request.requestedBy}
                            {request.approvedBy ? `, approved by ${request.approvedBy}` : ""}
                          </p>
                          {request.status === "approved" && request.otp && (
                            <p className="text-sm text-red-600 mt-1">OTP: {request.otp}</p>
                          )}
                        </div>
                        {request.status === "pending" && (
                          <button onClick={() => handleApprovePasswordRequest(request.id)} className="bg-green-600 text-white px-3 py-2 rounded text-sm">
                            Approve and Generate OTP
                          </button>
                        )}
                      </div>
                      {request.status === "approved" && (
                        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-3 mt-4 items-end">
                          <TextInput
                            label="OTP"
                            value={completion.otp}
                            onChange={(otp) => setPasswordCompletion({ ...passwordCompletion, [request.id]: { ...completion, otp } })}
                          />
                          <PasswordInput
                            label="New Password"
                            value={completion.newPassword}
                            onChange={(newPassword) => setPasswordCompletion({ ...passwordCompletion, [request.id]: { ...completion, newPassword } })}
                          />
                          <button onClick={() => handleCompletePasswordRequest(request.id)} className="bg-red-600 text-white px-3 py-2 rounded text-sm">
                            Update Password
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ProductTable({
  products,
  executive,
  onSetStock,
  onSubtract,
  onDelete,
}: {
  products: Product[];
  executive: boolean;
  onSetStock: (id: string, stock: number) => void;
  onSubtract: (id: string, varietyIndex?: number) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead className="bg-gray-200 dark:bg-gray-800">
          <tr className="text-left text-gray-600 dark:text-gray-400 text-sm">
            <th className="p-4">Product</th>
            <th className="p-4">Types</th>
            <th className="p-4">Stock</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-gray-300 dark:border-gray-800">
              <td className="p-4 font-semibold">{product.name}</td>
              <td className="p-4 text-gray-600 dark:text-gray-400">{getTypes(product).join(", ") || "Uncategorized"}</td>
              <td className="p-4">
                {executive ? (
                  <input
                    type="number"
                    value={product.stock}
                    onChange={(event) => onSetStock(product.id, Number(event.target.value))}
                    className="w-24 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
                  />
                ) : (
                  product.stock
                )}
              </td>
              <td className="p-4">
                <div className="flex flex-wrap gap-3">
                  {product.varietyStocks?.length ? (
                    product.varietyStocks.map((variety, index) => (
                      <button
                        key={`${variety.name}-${index}`}
                        onClick={() => onSubtract(product.id, index)}
                        disabled={Number(variety.stock || 0) <= 0}
                        className="bg-red-600 disabled:opacity-50 text-white px-3 py-2 rounded text-sm"
                      >
                        {variety.name}: -1 ({variety.stock})
                      </button>
                    ))
                  ) : (
                    <button onClick={() => onSubtract(product.id)} disabled={product.stock <= 0} className="bg-red-600 disabled:opacity-50 text-white px-3 py-2 rounded text-sm">
                      Subtract 1
                    </button>
                  )}
                  {executive && onDelete && (
                    <button onClick={() => onDelete(product.id)} className="text-red-600 inline-flex items-center gap-2 text-sm">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-gray-600 dark:text-gray-400">No products yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function getTypes(product: Product) {
  return product.types?.length ? product.types : product.type ? [product.type] : [];
}

function VarietyFields({ varieties, onChange }: { varieties: { name: string; stock: number }[]; onChange: (varieties: { name: string; stock: number }[]) => void }) {
  return (
    <div className="mt-5">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Varieties and Stock</p>
      <div className="space-y-3">
        {varieties.map((variety, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-3">
            <input
              type="text"
              value={variety.name}
              placeholder="Variety name"
              onChange={(event) => onChange(varieties.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)))}
              className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
            />
            <input
              type="number"
              value={variety.stock}
              placeholder="Stock"
              onChange={(event) => onChange(varieties.map((item, itemIndex) => (itemIndex === index ? { ...item, stock: Number(event.target.value) } : item)))}
              className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
            />
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...varieties, { ...emptyVariety }])} className="mt-2 text-sm text-red-600">Add more</button>
    </div>
  );
}

function FitmentFields({ fitments, onChange }: { fitments: Fitment[]; onChange: (fitments: Fitment[]) => void }) {
  return (
    <div className="mt-5">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Vehicle Fitment</p>
      <p className="text-xs text-gray-500 mb-3">Put "Universal" for products that are good for all vehicles.</p>
      <div className="space-y-3">
        {fitments.map((fitment, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["brand", "model", "year"] as const).map((field) => (
              <input
                key={field}
                type="text"
                value={fitment[field]}
                placeholder={field[0].toUpperCase() + field.slice(1)}
                onChange={(event) => onChange(fitments.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: event.target.value } : item)))}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
              />
            ))}
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...fitments, { ...emptyFitment }])} className="mt-2 text-sm text-red-600">Add more</button>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2" />
    </label>
  );
}

function PasswordInput({ label, value, onChange, onEnter }: { label: string; value: string; onChange: (value: string) => void; onEnter?: () => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onEnter) onEnter();
        }}
        className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
      />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2" />
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2" />
    </label>
  );
}

function TextareaInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2" />
    </label>
  );
}
