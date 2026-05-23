import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import dashcamLogo from "../../imports/DashcamPilipines.jpg";
import marcoLogo from "../../imports/MarcoLED.jpg";
import dnctLogo from "../../imports/DNCT.jpg";

const subsidiaries = [
  {
    name: "Dashcam Pilipinas",
    description: "Premium dashcam solutions",
    logo: dashcamLogo,
    facebookUrl: "https://facebook.com/dashcampilipinas"
  },
  {
    name: "MarcoLED",
    description: "LED lighting systems",
    logo: marcoLogo,
    facebookUrl: "https://facebook.com/marcoled"
  },
  {
    name: "Diamond Nano Ceramic Tint",
    description: "Advanced window tinting",
    logo: dnctLogo,
    facebookUrl: "https://facebook.com/diamondnanotint"
  },
];

const heroImages = [
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1920&h=1080&fit=crop",
];

const reviews = [
  {
    id: 1,
    name: "Maria Santos",
    rating: 5,
    comment: "Excellent service! Got my Diamond Nano Ceramic Tint installed and it looks amazing. The team was professional and the installation was flawless.",
    date: "2 weeks ago",
    product: "Diamond Nano Ceramic Tint"
  },
  {
    id: 2,
    name: "Juan Dela Cruz",
    rating: 5,
    comment: "Very happy with my 70Mai dashcam purchase. Great quality and the staff helped me choose the perfect one for my Toyota Vios.",
    date: "1 month ago",
    product: "70Mai Pro Plus+ Dashcam"
  },
  {
    id: 3,
    name: "Carlos Reyes",
    rating: 5,
    comment: "Best car accessories shop in town! Got LED headlights for my Honda Civic and they're super bright. Installation was quick and professional.",
    date: "3 weeks ago",
    product: "LED Headlight Bulbs"
  },
  {
    id: 4,
    name: "Anna Garcia",
    rating: 5,
    comment: "Love my new tint! Heat rejection is incredible and it looks sleek. Jadex team was very accommodating and answered all my questions.",
    date: "1 week ago",
    product: "3M Crystalline Tint"
  },
  {
    id: 5,
    name: "Miguel Torres",
    rating: 5,
    comment: "Highly recommend! Got wipers and LED lights installed. Quality products and fair prices. Will definitely come back for more accessories.",
    date: "2 months ago",
    product: "Various Products"
  },
  {
    id: 6,
    name: "Sofia Ramos",
    rating: 5,
    comment: "Professional service from start to finish. The tinting was done perfectly with no bubbles. Very satisfied with the Diamond Nano Ceramic film!",
    date: "3 weeks ago",
    product: "Diamond Nano Ceramic Tint"
  }
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1">
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {heroImages.map((img, index) => (
          <div
            key={img}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: currentImageIndex === index ? 1 : 0,
            }}
          >
            <ImageWithFallback
              src={img}
              alt="Car accessories"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ))}

        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Jadex Car Accessories
          </h1>
          <div className="space-y-2 text-lg md:text-xl text-gray-200">
            <div className="flex items-center justify-center gap-2">
              <span className="text-red-600">📍</span>
              <span>123 Main Street, City, Philippines</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-red-600">📞</span>
              <span>+63 123 456 7890</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentImageIndex === index
                  ? "bg-red-600 w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="bg-gray-100 dark:bg-gray-950 py-16 transition-colors">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Our Subsidiary Companies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subsidiaries.map((sub) => (
              <a
                key={sub.name}
                href={sub.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-8 text-center hover:border-red-600 transition-all group cursor-pointer hover:shadow-lg"
              >
                <div className="mb-6 flex items-center justify-center">
                  <ImageWithFallback
                    src={sub.logo}
                    alt={sub.name}
                    className="h-32 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{sub.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{sub.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 py-16 transition-colors">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            What Our Customers Say
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Jadex Car Accessories for their vehicle needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-red-600 transition-colors"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300 dark:text-gray-700"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-4">
                  "{review.comment}"
                </p>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{review.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">{review.product}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{review.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
