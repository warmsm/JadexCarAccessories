import { Facebook, MapPin, Phone } from "lucide-react";
import { businessInfo } from "../businessInfo";

export default function Footer() {
  const fullAddress = `${businessInfo.address} (${businessInfo.addressNote})`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

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
                <span>{fullAddress}</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-red-600" />
                <div className="flex flex-col">
                  {businessInfo.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone}`}
                      className="hover:text-red-600 transition-colors"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Follow Us</h4>
            <div className="space-y-2">
              {[
                ["Jadex Car Accessories", businessInfo.facebookLinks.jadex],
                ["MarcoLED Philippines", businessInfo.facebookLinks.marcoLed],
                ["Dashcam Pilipinas", businessInfo.facebookLinks.dashcamPilipinas],
                ["Diamond Nano Ceramic Tint Cavite", businessInfo.facebookLinks.diamondNanoCeramicTint],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors text-sm"
                >
                  <Facebook className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h4 className="text-sm font-semibold">Find Us</h4>
            <a
              href={businessInfo.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-500 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Open in Google Maps
            </a>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-900">
            <iframe
              title="Jadex Car Accessories location map"
              src={mapEmbedUrl}
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={businessInfo.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0"
              aria-label="Open Jadex Car Accessories in Google Maps"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Jadex Car Accessories. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
