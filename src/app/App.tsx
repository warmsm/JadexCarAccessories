import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MessengerButton from "./components/MessengerButton";
import ThemeToggle from "./components/ThemeToggle";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Booking from "./pages/Booking";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppShell />
      </Router>
    </ThemeProvider>
  );
}

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col transition-colors">
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <MessengerButton />}
      <ThemeToggle />
    </div>
  );
}
