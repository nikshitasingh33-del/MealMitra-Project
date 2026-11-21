import { Link } from "react-router-dom";
import { HeartHandshake, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">
              Meal<span className="text-emerald-400">Mitra</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            A food donation coordination platform connecting generous donors with verified NGOs
            to rescue surplus food and serve those who need it most. Together, we reduce waste and
            nourish communities.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-emerald-400 transition">Home</Link></li>
            <li><Link to="/how-it-works" className="hover:text-emerald-400 transition">How It Works</Link></li>
            <li><Link to="/impact" className="hover:text-emerald-400 transition">Impact Dashboard</Link></li>
            <li><Link to="/about" className="hover:text-emerald-400 transition">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Get in touch</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-400" /> hello@mealmitra.org</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /> Bengaluru, India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MealMitra. Built with care to reduce food waste. A college engineering project.
      </div>
    </footer>
  );
}
