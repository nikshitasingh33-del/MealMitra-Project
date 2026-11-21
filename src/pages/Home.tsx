import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HeartHandshake, Utensils, Truck, ShieldCheck, Sparkles, Leaf, Clock, MapPin,
  Users, Building2, ArrowRight, HandPlatter, CheckCircle2, Sprout,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Stats {
  deliveredCount: number;
  totalQuantity: number;
  donorCount: number;
  ngoCount: number;
}

const DEFAULT_STATS: Stats = { deliveredCount: 0, totalQuantity: 0, donorCount: 0, ngoCount: 0 };

export default function Home() {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, n, del, ngo] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "donor"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "ngo"),
          supabase.from("donations").select("quantity").eq("status", "delivered"),
          supabase.from("ngo_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "verified"),
        ]);
        setStats({
          donorCount: d.count ?? 0,
          ngoCount: ngo.count ?? 0,
          deliveredCount: del.data?.length ?? 0,
          totalQuantity: (del.data ?? []).reduce((s, r: { quantity: number }) => s + r.quantity, 0),
        });
      } catch {
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-stone-50 to-stone-50 bg-grid">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 -left-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold mb-5">
              <Sprout className="w-3.5 h-3.5" /> Rescue food. Nourish lives.
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1]">
              Turn surplus food into <span className="text-emerald-600">shared meals</span>.
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-xl">
              MealMitra connects restaurants, hotels, event organizers, and households with verified
              NGOs — so surplus food reaches people who need it, instead of a landfill.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary text-base px-6 py-3.5">
                <HeartHandshake className="w-5 h-5" /> Donate Food
              </Link>
              <Link to="/how-it-works" className="btn-secondary text-base px-6 py-3.5">
                How it works <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified NGOs</div>
              <div className="flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-600" /> Reduce waste</div>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="relative rounded-3xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Live donation</p>
                    <p className="text-xs text-slate-500">Restaurant surplus lunch</p>
                  </div>
                </div>
                <span className="badge bg-amber-100 text-amber-800">High urgency</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <HandPlatter className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-slate-700">50 veg meals — cooked 2 hrs ago</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-slate-700">Safe to eat for 4 more hours</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">Accepted by Hope Foundation NGO</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-5 rounded-2xl bg-amber-500 text-white p-4 shadow-lg animate-float">
              <p className="text-2xl font-bold leading-none">{stats.deliveredCount || "120+"}</p>
              <p className="text-xs mt-1 text-amber-50">meals rescued</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<CheckCircle2 className="w-6 h-6" />} value={loading ? "—" : stats.deliveredCount} label="Completed donations" color="emerald" />
          <StatCard icon={<Utensils className="w-6 h-6" />} value={loading ? "—" : stats.totalQuantity} label="Meals / portions donated" color="amber" />
          <StatCard icon={<Users className="w-6 h-6" />} value={loading ? "—" : stats.donorCount} label="Registered donors" color="sky" />
          <StatCard icon={<Building2 className="w-6 h-6" />} value={loading ? "—" : stats.ngoCount} label="Verified NGOs" color="indigo" />
        </div>
      </section>

      {/* ABOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">About MealMitra</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Food wastage is a serious problem. Restaurants, hotels, events, and households often
              have surplus edible food, while many people struggle to access sufficient meals.
            </p>
            <p className="mt-4 text-slate-600 leading-relaxed">
              MealMitra bridges this gap by connecting food donors with NGOs that can collect and
              distribute surplus food to people in need. We are a coordination platform — not a
              delivery company. NGOs and their volunteers handle collection and distribution.
            </p>
            <Link to="/about" className="mt-6 inline-flex items-center gap-1 text-emerald-700 font-semibold hover:gap-2 transition-all">
              Learn more about us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <HeartHandshake className="w-5 h-5" />, title: "Trusted matching", text: "Rule-based matching by location, food type, and urgency." },
              { icon: <ShieldCheck className="w-5 h-5" />, title: "Verified NGOs", text: "Only admin-verified organizations can accept donations." },
              { icon: <Clock className="w-5 h-5" />, title: "Time-aware", text: "Safe consumption deadlines and expiry tracking built in." },
              { icon: <MapPin className="w-5 h-5" />, title: "City-scoped", text: "Find donations near your service area, fast." },
            ].map((f) => (
              <div key={f.title} className="card p-5 hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 text-sm">{f.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-600">Four simple steps from surplus to served.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: "01", icon: <Utensils className="w-6 h-6" />, title: "Donor posts food", text: "Enter food name, quantity, dietary type, and pickup details." },
              { n: "02", icon: <Building2 className="w-6 h-6" />, title: "NGO browses & accepts", text: "Verified NGOs filter by city, category, and urgency, then accept." },
              { n: "03", icon: <Truck className="w-6 h-6" />, title: "NGO collects food", text: "Contact details are shared. The NGO picks up the food." },
              { n: "04", icon: <CheckCircle2 className="w-6 h-6" />, title: "Food is delivered", text: "NGO distributes to people in need and marks it Delivered." },
            ].map((s) => (
              <div key={s.n} className="relative card p-6 hover:shadow-md transition">
                <span className="absolute -top-3 -right-3 text-4xl font-bold text-emerald-100 font-display">{s.n}</span>
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4">{s.icon}</div>
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/how-it-works" className="btn-secondary">See detailed guide <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">Features & benefits</h2>
          <p className="mt-3 text-slate-600">Everything you need to rescue food responsibly.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <HeartHandshake className="w-6 h-6" />, title: "Donor dashboard", text: "Post donations, track status in real time, and see your impact history." },
            { icon: <Building2 className="w-6 h-6" />, title: "NGO dashboard", text: "Browse and filter available donations, accept with one click, update status." },
            { icon: <ShieldCheck className="w-6 h-6" />, title: "Atomic acceptance", text: "Database-level protection ensures only one NGO can accept each donation." },
            { icon: <Clock className="w-6 h-6" />, title: "Deadline tracking", text: "Safe consumption deadlines are tracked; expired donations are flagged." },
            { icon: <Sparkles className="w-6 h-6" />, title: "AI assistant", text: "A floating chatbot guides you through donating, registering, and food safety." },
            { icon: <MapPin className="w-6 h-6" />, title: "Smart matching", text: "Rule-based matching on city, category, dietary type, and urgency." },
          ].map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md hover:border-emerald-200 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">{f.icon}</div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-10 sm:p-14 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Ready to rescue your next meal?</h2>
            <p className="mt-3 text-emerald-50 max-w-xl mx-auto">Join MealMitra today. It takes less than two minutes to register and post your first donation.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition">
                <HeartHandshake className="w-5 h-5" /> Get started
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number | string; label: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
