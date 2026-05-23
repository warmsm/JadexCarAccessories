import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  Package,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface Product {
  id: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  year: string;
  price: number;
  stock: number;
  varieties: string;
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

interface ClosedDate {
  id: string;
  date: string;
  reason: string;
}

type Tab = "products" | "bookings" | "closedDates" | "reviews" | "accounts";

const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c`;
const headers = {
  Authorization: `Bearer ${publicAnonKey}`,
};

const emptyProduct = {
  name: "",
  type: "Dashcam",
  brand: "All Car Brands",
  model: "All Models",
  year: "All Years",
  price: 0,
  stock: 0,
  varieties: "",
  image: "",
  description: "",
};

const emptyReview = {
  name: "",
  rating: 5,
  comment: "",
  date: "",
  product: "",
  visible: true,
  sortOrder: 0,
};

export default function Admin() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("jadexAdminToken") || "");
  const [adminUsername, setAdminUsername] = useState(() => localStorage.getItem("jadexAdminUsername") || "");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [newClosedDate, setNewClosedDate] = useState({ date: "", reason: "" });
  const [newReview, setNewReview] = useState(emptyReview);
  const [newAccount, setNewAccount] = useState({ username: "", password: "" });

  useEffect(() => {
    if (!adminToken) return;

    fetchProducts();
    fetchBookings();
    fetchClosedDates();
    fetchReviews();
  }, [adminToken]);

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
    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    return data;
  };

  const handleLogin = async () => {
    setLoginError("");

    try {
      const response = await fetch(`${apiBase}/admin/login`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("jadexAdminToken", data.token);
      localStorage.setItem("jadexAdminUsername", data.username);
      setAdminToken(data.token);
      setAdminUsername(data.username);
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      console.error("Error logging in:", error);
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jadexAdminToken");
    localStorage.removeItem("jadexAdminUsername");
    setAdminToken("");
    setAdminUsername("");
  };

  const handleAddAccount = async () => {
    try {
      await requestJson("/admin/accounts", {
        method: "POST",
        body: JSON.stringify(newAccount),
      });
      setNewAccount({ username: "", password: "" });
      alert("Admin account added");
    } catch (error) {
      console.error("Error adding admin account:", error);
      alert("Failed to add admin account");
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await requestJson("/products");
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await requestJson("/bookings");
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await requestJson("/reviews");
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  };

  const fetchClosedDates = async () => {
    try {
      const data = await requestJson("/closed-dates");
      setClosedDates(data.closedDates || []);
    } catch (error) {
      console.error("Error fetching closed dates:", error);
      setClosedDates([]);
    }
  };

  const handleAddProduct = async () => {
    try {
      await requestJson("/products", {
        method: "POST",
        body: JSON.stringify(newProduct),
      });
      setShowAddProduct(false);
      setNewProduct(emptyProduct);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    }
  };

  const handleUpdateStock = async (productId: string, stock: number) => {
    try {
      await requestJson(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ stock }),
      });
      fetchProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Remove this product from the website?")) return;

    try {
      await requestJson(`/products/${productId}`, { method: "DELETE" });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!confirm("Remove all current products from the website?")) return;

    try {
      await requestJson("/products", { method: "DELETE" });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting products:", error);
      alert("Failed to delete products");
    }
  };

  const handleVerifyBooking = async (bookingId: string) => {
    try {
      await requestJson(`/bookings/${bookingId}/verify`, { method: "PUT" });
      fetchBookings();
    } catch (error) {
      console.error("Error verifying booking:", error);
      alert("Failed to verify booking");
    }
  };

  const handleAddClosedDate = async () => {
    if (!newClosedDate.date) {
      alert("Please choose a date to block");
      return;
    }

    try {
      await requestJson("/closed-dates", {
        method: "POST",
        body: JSON.stringify(newClosedDate),
      });
      setNewClosedDate({ date: "", reason: "" });
      fetchClosedDates();
    } catch (error) {
      console.error("Error adding closed date:", error);
      alert("Failed to block date");
    }
  };

  const handleDeleteClosedDate = async (date: string) => {
    try {
      await requestJson(`/closed-dates/${date}`, { method: "DELETE" });
      fetchClosedDates();
    } catch (error) {
      console.error("Error deleting closed date:", error);
      alert("Failed to reopen date");
    }
  };

  const handleViewPaymentProof = async (fileName: string) => {
    try {
      const data = await requestJson(`/payment-proof/${encodeURIComponent(fileName)}`);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening payment proof:", error);
      alert("Failed to open payment proof");
    }
  };

  const handleAddReview = async () => {
    try {
      await requestJson("/reviews", {
        method: "POST",
        body: JSON.stringify(newReview),
      });
      setShowAddReview(false);
      setNewReview(emptyReview);
      fetchReviews();
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to add review");
    }
  };

  const handleUpdateReview = async (reviewId: string, updates: Partial<Review>) => {
    try {
      await requestJson(`/reviews/${reviewId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review?")) return;

    try {
      await requestJson(`/reviews/${reviewId}`, { method: "DELETE" });
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  const tabs = [
    { id: "products" as const, label: "Products", icon: Package },
    { id: "bookings" as const, label: "Bookings", icon: Calendar },
    { id: "closedDates" as const, label: "Closed Dates", icon: Calendar },
    { id: "reviews" as const, label: "Reviews", icon: Star },
    { id: "accounts" as const, label: "Accounts", icon: Plus },
  ];

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6">
          <p className="text-sm text-red-600 font-semibold mb-2">Admin Portal</p>
          <h1 className="text-3xl font-bold mb-6">Jadex Car Accessories</h1>

          <div className="space-y-4">
            <TextInput
              label="Username"
              value={loginForm.username}
              onChange={(username) => setLoginForm({ ...loginForm, username })}
            />
            <label className="block">
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleLogin();
                }}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
              />
            </label>
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg"
            >
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
              <button onClick={handleLogout} className="text-red-600 hover:text-red-500 font-semibold">
                Log out
              </button>
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
                  activeTab === tab.id
                    ? "bg-red-600 text-white"
                    : "bg-white dark:bg-black text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "products" && (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Manage Products</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Products listed here are the only products shown on the public website.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAllProducts}
                  disabled={products.length === 0}
                  className="flex items-center gap-2 border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Products
                </button>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              </div>
            </div>

            {showAddProduct && (
              <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Product Name" value={newProduct.name} onChange={(name) => setNewProduct({ ...newProduct, name })} />
                  <SelectInput label="Type" value={newProduct.type} options={["Dashcam", "LED Lights", "Wipers", "Tints", "Accessories"]} onChange={(type) => setNewProduct({ ...newProduct, type })} />
                  <SelectInput label="Brand" value={newProduct.brand} options={["All Car Brands", "Toyota", "Honda", "Mitsubishi", "Nissan", "Ford", "Hyundai"]} onChange={(brand) => setNewProduct({ ...newProduct, brand })} />
                  <TextInput label="Model" value={newProduct.model} onChange={(model) => setNewProduct({ ...newProduct, model })} />
                  <TextInput label="Year" value={newProduct.year} onChange={(year) => setNewProduct({ ...newProduct, year })} />
                  <NumberInput label="Price" value={newProduct.price} onChange={(price) => setNewProduct({ ...newProduct, price })} />
                  <NumberInput label="Stock" value={newProduct.stock} onChange={(stock) => setNewProduct({ ...newProduct, stock })} />
                  <TextInput label="Varieties" value={newProduct.varieties} onChange={(varieties) => setNewProduct({ ...newProduct, varieties })} />
                  <div className="md:col-span-2">
                    <TextInput label="Image URL" value={newProduct.image} onChange={(image) => setNewProduct({ ...newProduct, image })} />
                  </div>
                  <div className="md:col-span-2">
                    <TextareaInput label="Description" value={newProduct.description} onChange={(description) => setNewProduct({ ...newProduct, description })} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddProduct(false)} className="flex-1 bg-gray-300 dark:bg-gray-800 py-2 rounded">
                    Cancel
                  </button>
                  <button onClick={handleAddProduct} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded">
                    Add Product
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead className="bg-gray-200 dark:bg-gray-800">
                  <tr className="text-left text-gray-600 dark:text-gray-400 text-sm">
                    <th className="p-4">Product</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">For</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-gray-300 dark:border-gray-800">
                      <td className="p-4 font-semibold">{product.name}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{product.type}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {["All Car Brands", "Universal"].includes(product.brand) ? "All car brands, models, and years" : `${product.brand} ${product.model} ${product.year}`}
                      </td>
                      <td className="p-4 text-red-600">PHP {product.price}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(event) => handleUpdateStock(product.id, Number(event.target.value))}
                          className="w-24 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-600 dark:text-gray-400">
                        No products yet. Add real inventory when you are ready.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "bookings" && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Tint Bookings</h2>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">{booking.customerName}</h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          booking.verified ? "bg-green-900/30 text-green-500" : "bg-yellow-900/30 text-yellow-500"
                        }`}>
                          {booking.verified ? "Verified" : "Pending"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <p><span className="text-gray-500">Date:</span> {booking.date}</p>
                        <p><span className="text-gray-500">Time:</span> {booking.timeSlot}</p>
                        <p><span className="text-gray-500">Phone:</span> {booking.customerPhone}</p>
                        <p>
                          <span className="text-gray-500">Facebook:</span>{" "}
                          <a href={booking.customerFacebook} target="_blank" rel="noopener noreferrer" className="text-red-600 underline">
                            Profile
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {booking.paymentProof && (
                        <button
                          onClick={() => handleViewPaymentProof(booking.paymentProof!)}
                          className="border border-gray-300 dark:border-gray-800 px-4 py-2 rounded inline-flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Payment Proof
                        </button>
                      )}
                      {!booking.verified && (
                        <button
                          onClick={() => handleVerifyBooking(booking.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="text-center py-16 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <p>No bookings yet</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "closedDates" && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Closed Dates</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Block dates when the shop is closed. Customers cannot book blocked dates.
              </p>
            </div>

            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-4 items-end">
                <label className="block">
                  <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Date</span>
                  <input
                    type="date"
                    value={newClosedDate.date}
                    onChange={(event) => setNewClosedDate({ ...newClosedDate, date: event.target.value })}
                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
                  />
                </label>
                <TextInput
                  label="Reason"
                  value={newClosedDate.reason}
                  onChange={(reason) => setNewClosedDate({ ...newClosedDate, reason })}
                />
                <button
                  onClick={handleAddClosedDate}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Block Date
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
              {closedDates.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">No closed dates yet</div>
              ) : (
                closedDates
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((closedDate) => (
                    <div
                      key={closedDate.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 border-t first:border-t-0 border-gray-300 dark:border-gray-800"
                    >
                      <div>
                        <p className="font-semibold">{closedDate.date}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{closedDate.reason || "Closed"}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteClosedDate(closedDate.date)}
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-500 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Reopen
                      </button>
                    </div>
                  ))
              )}
            </div>
          </section>
        )}

        {activeTab === "reviews" && (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Website Reviews</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Only visible reviews appear on the public homepage.
                </p>
              </div>
              <button
                onClick={() => setShowAddReview(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Review
              </button>
            </div>

            {showAddReview && (
              <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Add Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="Customer Name" value={newReview.name} onChange={(name) => setNewReview({ ...newReview, name })} />
                  <TextInput label="Product or Service" value={newReview.product} onChange={(product) => setNewReview({ ...newReview, product })} />
                  <TextInput label="Date Label" value={newReview.date} onChange={(date) => setNewReview({ ...newReview, date })} />
                  <NumberInput label="Display Order" value={newReview.sortOrder} onChange={(sortOrder) => setNewReview({ ...newReview, sortOrder })} />
                  <NumberInput label="Rating" value={newReview.rating} onChange={(rating) => setNewReview({ ...newReview, rating: Math.max(1, Math.min(5, rating)) })} />
                  <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-7">
                    <input
                      type="checkbox"
                      checked={newReview.visible}
                      onChange={(event) => setNewReview({ ...newReview, visible: event.target.checked })}
                    />
                    Show on website
                  </label>
                  <div className="md:col-span-2">
                    <TextareaInput label="Review" value={newReview.comment} onChange={(comment) => setNewReview({ ...newReview, comment })} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddReview(false)} className="flex-1 bg-gray-300 dark:bg-gray-800 py-2 rounded">
                    Cancel
                  </button>
                  <button onClick={handleAddReview} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded">
                    Add Review
                  </button>
                </div>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateReview(review.id, { visible: !review.visible })}
                        className="p-2 border border-gray-300 dark:border-gray-800 rounded"
                        aria-label={review.visible ? "Hide review" : "Show review"}
                      >
                        {review.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-2 border border-gray-300 dark:border-gray-800 rounded text-red-600"
                        aria-label="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 my-3">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`w-4 h-4 ${
                          index < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 dark:text-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">"{review.comment}"</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                    <span>{review.visible ? "Visible" : "Hidden"}</span>
                    <span>Order: {review.sortOrder ?? 0}</span>
                    {review.date && <span>{review.date}</span>}
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="lg:col-span-2 text-center py-16 text-gray-600 dark:text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <p>No reviews yet</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "accounts" && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Admin Accounts</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new username and password for another admin.
              </p>
            </div>

            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Username"
                  value={newAccount.username}
                  onChange={(username) => setNewAccount({ ...newAccount, username })}
                />
                <label className="block">
                  <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Password</span>
                  <input
                    type="password"
                    value={newAccount.password}
                    onChange={(event) => setNewAccount({ ...newAccount, password: event.target.value })}
                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
                  />
                </label>
              </div>
              <button
                onClick={handleAddAccount}
                className="mt-5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Add Account
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
      />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextareaInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
      />
    </label>
  );
}
