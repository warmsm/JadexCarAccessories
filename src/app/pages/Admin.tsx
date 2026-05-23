import { useEffect, useState } from "react";
import { Package, Calendar, CheckCircle, X, Plus } from "lucide-react";
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
  paymentProofUrl?: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"products" | "bookings">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    type: "Dashcam",
    brand: "Universal",
    model: "All Models",
    year: "All Years",
    price: 0,
    stock: 0,
    varieties: "",
    image: "",
    description: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchBookings();
  }, []);

  const fetchProducts = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/products`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/bookings`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    }
  };

  const handleAddProduct = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(newProduct),
        }
      );

      const result = await response.json();
      if (result.success) {
        setShowAddProduct(false);
        setNewProduct({
          name: "",
          type: "Dashcam",
          brand: "Universal",
          model: "All Models",
          year: "All Years",
          price: 0,
          stock: 0,
          varieties: "",
          image: "",
          description: "",
        });
        fetchProducts();
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ stock: newStock }),
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchProducts();
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock");
    }
  };

  const handleVerifyBooking = async (bookingId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/bookings/${bookingId}/verify`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchBookings();
      }
    } catch (error) {
      console.error("Error verifying booking:", error);
      alert("Failed to verify booking");
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-8 transition-colors">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "products"
                ? "bg-red-600 text-white"
                : "bg-white dark:bg-black text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-800"
            }`}
          >
            <Package className="w-5 h-5" />
            Products
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "bookings"
                ? "bg-red-600 text-white"
                : "bg-white dark:bg-black text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-800"
            }`}
          >
            <Calendar className="w-5 h-5" />
            Bookings
          </button>
        </div>

        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Products</h2>
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>

            {showAddProduct && (
              <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Type</label>
                    <select
                      value={newProduct.type}
                      onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                    >
                      <option>Dashcam</option>
                      <option>LED Lights</option>
                      <option>Wipers</option>
                      <option>Tints</option>
                      <option>Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Brand</label>
                    <select
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                    >
                      <option>Universal</option>
                      <option>Toyota</option>
                      <option>Honda</option>
                      <option>Mitsubishi</option>
                      <option>Nissan</option>
                      <option>Ford</option>
                      <option>Hyundai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Model</label>
                    <input
                      type="text"
                      value={newProduct.model}
                      onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Year</label>
                    <input
                      type="text"
                      value={newProduct.year}
                      onChange={(e) => setNewProduct({ ...newProduct, year: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Price</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Stock</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Varieties</label>
                    <input
                      type="text"
                      value={newProduct.varieties}
                      onChange={(e) => setNewProduct({ ...newProduct, varieties: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                      placeholder="Red, Blue, Black"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Image URL</label>
                    <input
                      type="text"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="flex-1 bg-gray-300 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProduct}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
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
                <tbody className="text-gray-900 dark:text-white">
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-gray-300 dark:border-gray-800">
                      <td className="p-4 font-semibold">{product.name}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{product.type}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {product.brand === "Universal" ? "All Models" : `${product.brand} ${product.model}`}
                      </td>
                      <td className="p-4 text-red-600">₱{product.price}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => handleUpdateStock(product.id, Number(e.target.value))}
                          className="w-20 bg-gray-900 border border-gray-700 text-white rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleUpdateStock(product.id, product.stock)}
                          className="text-sm text-red-600 hover:text-red-500"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Bookings</h2>

            <div className="space-y-4">
              {bookings
                .filter((b) => !b.verified)
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{booking.customerName}</h3>
                          {booking.verified ? (
                            <span className="px-3 py-1 bg-green-900/30 text-green-500 text-xs font-semibold rounded-full">
                              Verified
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-yellow-900/30 text-yellow-500 text-xs font-semibold rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="text-gray-500 dark:text-gray-500">Date:</span> {booking.date}
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-500">Time:</span> {booking.timeSlot}
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-500">Phone:</span> {booking.customerPhone}
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-500">Facebook:</span>{" "}
                            <a
                              href={booking.customerFacebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 hover:text-red-500 underline"
                            >
                              Profile
                            </a>
                          </div>
                        </div>
                        {booking.paymentProofUrl && (
                          <div className="mt-4">
                            <a
                              href={booking.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 hover:text-red-500 text-sm"
                            >
                              View Payment Proof →
                            </a>
                          </div>
                        )}
                      </div>
                      {!booking.verified && (
                        <button
                          onClick={() => handleVerifyBooking(booking.id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                ))}

              {bookings.filter((b) => !b.verified).length === 0 && (
                <div className="text-center py-16 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <p>No pending bookings</p>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Verified Bookings</h3>
              {bookings
                .filter((b) => b.verified)
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 opacity-60"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{booking.customerName}</h3>
                          <span className="px-3 py-1 bg-green-900/30 text-green-500 text-xs font-semibold rounded-full">
                            Verified
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="text-gray-500 dark:text-gray-500">Date:</span> {booking.date}
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-500">Time:</span> {booking.timeSlot}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
