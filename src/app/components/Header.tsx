import { Facebook } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logo1 from "../../imports/1.png";
import logo2 from "../../imports/2.png";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const location = useLocation();
  const { theme } = useTheme();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Book a Tint", path: "/booking" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-black text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <ImageWithFallback
            src={theme === "dark" ? logo2 : logo1}
            alt="Jadex Car Accessories"
            className="h-16 w-auto object-contain"
          />
        </Link>

        <nav className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-red-600 ${
                isActive(item.path) ? "text-red-600" : "text-gray-900 dark:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}

          <a
            href="https://facebook.com/jadexcaraccessories"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 dark:text-white hover:text-red-600 transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </nav>
      </div>
    </header>
  );
}
