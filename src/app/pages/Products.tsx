import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

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

const productTypes = ["All", "Dashcam", "LED Lights", "Wipers", "Tints", "Accessories"];
const carBrands = ["All", "Universal", "Toyota", "Honda", "Mitsubishi", "Nissan", "Ford", "Hyundai"];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedModel, setSelectedModel] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/products`;
      console.log("Fetching products from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Products data:", data);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const availableModels = selectedBrand === "All" || selectedBrand === "Universal"
    ? ["All"]
    : ["All", ...new Set(products.filter(p => p.brand === selectedBrand).map(p => p.model))];

  const availableYears = selectedModel === "All" || selectedBrand === "Universal"
    ? ["All"]
    : ["All", ...new Set(products.filter(p => p.model === selectedModel).map(p => p.year))];

  const filteredProducts = products.filter((product) => {
    if (selectedType !== "All" && product.type !== selectedType) return false;
    if (selectedBrand !== "All" && product.brand !== selectedBrand) return false;
    if (selectedModel !== "All" && product.brand !== "Universal" && product.model !== selectedModel) return false;
    if (selectedYear !== "All" && product.brand !== "Universal" && product.year !== selectedYear) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="text-gray-900 dark:text-white text-xl">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Our Products</h1>

        <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
            <Filter className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold">Filter Products</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Product Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-red-600"
              >
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Car Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel("All");
                  setSelectedYear("All");
                }}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-red-600"
              >
                {carBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Car Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setSelectedYear("All");
                }}
                disabled={selectedBrand === "All" || selectedBrand === "Universal"}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Model Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={selectedModel === "All" || selectedBrand === "Universal"}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No products found matching your filters.</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Try adjusting your filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden transition-all ${
                  product.stock === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-red-600"
                }`}
              >
                <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
                  <ImageWithFallback
                    src={product.image || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">OUT OF STOCK</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
                    <span className="text-red-600 font-bold text-lg">₱{product.price}</span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <p><span className="text-gray-500 dark:text-gray-500">Type:</span> {product.type}</p>
                    <p>
                      <span className="text-gray-500 dark:text-gray-500">For:</span>{" "}
                      {product.brand === "Universal"
                        ? "All Car Models"
                        : `${product.brand} ${product.model} ${product.year}`}
                    </p>
                    {product.varieties && (
                      <p><span className="text-gray-500 dark:text-gray-500">Varieties:</span> {product.varieties}</p>
                    )}
                    <p><span className="text-gray-500 dark:text-gray-500">Stock:</span> {product.stock} available</p>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">{product.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
