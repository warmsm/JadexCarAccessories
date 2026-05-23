import { MessageCircle } from "lucide-react";

export default function MessengerButton() {
  return (
    <a
      href="https://m.me/jadexcaraccessories"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50"
      aria-label="Message us on Facebook"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
