import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface Product {
  id: string;
  name: string;
  type?: string;
  types?: string[];
  brand?: string;
  model?: string;
  year?: string;
  fitments?: { brand: string; model: string; year: string }[];
  price: number;
  stock: number;
  varieties: string;
  varietyStocks?: { name: string; stock: number }[];
  image: string;
  description: string;
}

const allCarBrands = ["All Car Brands", "Universal"];

const getTypes = (product: Product) => product.types?.length ? product.types : product.type ? [product.type] : [];
const getFitments = (product: Product) => product.fitments?.length
  ? product.fitments
  : [{ brand: product.brand || "", model: product.model || "", year: product.year || "" }];

const isUniversalFitment = (fitment: { brand?: string }) => allCarBrands.some((label) => label.toLowerCase() === String(fitment.brand || "").toLowerCase());
const fitsAllCars = (product: Product) => getFitments(product).some(isUniversalFitment);

const getFitLabel = (product: Product) => {
  if (fitsAllCars(product)) {
    return "All car brands, models, and years";
  }

  return getFitments(product)
    .map((fitment) => [fitment.brand, fitment.model, fitment.year].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("; ");
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedModel, setSelectedModel] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const availableModels = selectedBrand === "All"
    ? ["All"]
    : ["All", ...new Set(products.flatMap((product) => getFitments(product).filter((fitment) => fitment.brand === selectedBrand).map((fitment) => fitment.model)).filter(Boolean))];

  const availableYears = selectedModel === "All"
    ? ["All"]
    : ["All", ...new Set(products.flatMap((product) => getFitments(product).filter((fitment) => fitment.model === selectedModel).map((fitment) => fitment.year)).filter(Boolean))];

  const productTypes = ["All", ...new Set(products.flatMap(getTypes).filter(Boolean))];
  const carBrands = [
    "All",
    ...new Set(
      products
        .flatMap(getFitments)
        .map((fitment) => fitment.brand)
        .filter((brand) => brand && !allCarBrands.some((label) => label.toLowerCase() === brand.toLowerCase()))
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const fitments = getFitments(product);
    const productFitsSelection = fitments.some((fitment) => {
      if (isUniversalFitment(fitment)) return true;
      if (selectedBrand !== "All" && fitment.brand !== selectedBrand) return false;
      if (selectedModel !== "All" && fitment.model !== selectedModel) return false;
      if (selectedYear !== "All" && fitment.year !== selectedYear) return false;
      return true;
    });

    if (selectedType !== "All" && !getTypes(product).includes(selectedType)) return false;
    if (!productFitsSelection) return false;
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
                disabled={selectedBrand === "All"}
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
                disabled={selectedModel === "All"}
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
            <p className="text-gray-600 dark:text-gray-400 text-lg">No products are listed yet.</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">New products will appear here once the admin adds real inventory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`text-left bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden transition-all ${
                  product.stock === 0
                    ? "opacity-60"
                    : "hover:border-red-600"
                }`}
              >
                <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-800">
                  {product.image ? (
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                      No product image
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">OUT OF STOCK</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
                  <span className="text-red-600 font-bold text-lg">PHP {product.price}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-black text-gray-900 dark:text-white w-full max-w-4xl rounded-lg overflow-hidden">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded"
                aria-label="Close product details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-0">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                {selectedProduct.image ? (
                  <ImageWithFallback
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No product image
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-red-600 font-semibold mb-2">{getTypes(selectedProduct).join(", ")}</p>
                <h2 className="text-3xl font-bold mb-3">{selectedProduct.name}</h2>
                <p className="text-2xl font-bold text-red-600 mb-5">PHP {selectedProduct.price}</p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-5">
                  <p><span className="text-gray-500">For:</span> {getFitLabel(selectedProduct)}</p>
                  {selectedProduct.varietyStocks?.length ? (
                    <p>
                      <span className="text-gray-500">Varieties:</span>{" "}
                      {selectedProduct.varietyStocks.map((variety) => `${variety.name} (${variety.stock})`).join(", ")}
                    </p>
                  ) : selectedProduct.varieties && (
                    <p><span className="text-gray-500">Varieties:</span> {selectedProduct.varieties}</p>
                  )}
                  <p><span className="text-gray-500">Stock:</span> {selectedProduct.stock} available</p>
                </div>
                {selectedProduct.description && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedProduct.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
