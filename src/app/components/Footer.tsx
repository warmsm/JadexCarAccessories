import { Facebook, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-black text-gray-900 dark:text-white border-t border-gray-300 dark:border-gray-800 mt-auto transition-colors">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-red-600">Jadex Car Accessories</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your trusted partner for premium car accessories and services.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Contact Us</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                <span>123 Main Street, City, Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>+63 123 456 7890</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Follow Us</h4>
            <a
              href="https://facebook.com/jadexcaraccessories"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors text-sm"
            >
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Jadex Car Accessories. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
