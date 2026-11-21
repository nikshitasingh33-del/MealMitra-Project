import { useEffect, useState } from "react";
import { CheckCircle2, Utensils, Users, Building2, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ImpactData {
  deliveredCount: number;
  totalQuantity: number;
  donorCount: number;
  verifiedNgoCount: number;
  pendingCount: number;
  activeCount: number;
  cityCount: number;
}

export default function Impact() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [cities, setCities] = useState<{ city: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [donors, ngos, delivered, pending, active, verifiedNgo] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "donor"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "ngo"),
        supabase.from("donations").select("quantity, city").eq("status", "delivered"),
        supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("donations").select("id", { count: "exact", head: true }).in("status", ["accepted", "pickup_in_progress"]),
        supabase.from("ngo_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "verified"),
      ]);

      const deliveredRows = (delivered.data ?? []) as { quantity: number; city: string }[];
      const totalQuantity = deliveredRows.reduce((s, r) => s + r.quantity, 0);
      const cityMap: Record<string, number> = {};
      deliveredRows.forEach((r) => {
        cityMap[r.city] = (cityMap[r.city] ?? 0) + 1;
      });
      const cityList = Object.entries(cityMap).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 6);

      setData({
        deliveredCount: deliveredRows.length,
        totalQuantity,
        donorCount: donors.count ?? 0,
        verifiedNgoCount: verifiedNgo.count ?? 0,
        pendingCount: pending.count ?? 0,
        activeCount: active.count ?? 0,
        cityCount: cityList.length,
      });
      setCities(cityList);
    })();
  }, []);

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const cards = [
    { icon: <CheckCircle2 className="w-7 h-7" />, value: data.deliveredCount, label: "Completed donations", color: "emerald" },
    { icon: <Utensils className="w-7 h-7" />, value: data.totalQuantity, label: "Meals / portions donated", color: "amber" },
    { icon: <Users className="w-7 h-7" />, value: data.donorCount, label: "Registered donors", color: "sky" },
    { icon: <Building2 className="w-7 h-7" />, value: data.verifiedNgoCount, label: "Verified NGOs", color: "indigo" },
    { icon: <TrendingUp className="w-7 h-7" />, value: data.activeCount, label: "Active (accepted + pickup)", color: "rose" },
    { icon: <Utensils className="w-7 h-7" />, value: data.pendingCount, label: "Awaiting an NGO", color: "slate" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900">Impact dashboard</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Real numbers from the MealMitra database. As more donors and NGOs join, these grow.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map((c) => {
          const colors: Record<string, string> = {
            emerald: "from-emerald-500 to-emerald-600",
            amber: "from-amber-500 to-amber-600",
            sky: "from-sky-500 to-sky-600",
            indigo: "from-indigo-500 to-indigo-600",
            rose: "from-rose-500 to-rose-600",
            slate: "from-slate-500 to-slate-600",
          };
          return (
            <div key={c.label} className={`rounded-2xl bg-gradient-to-br ${colors[c.color]} p-6 text-white shadow-sm`}>
              <div className="opacity-90 mb-3">{c.icon}</div>
              <p className="text-3xl font-bold leading-none">{c.value}</p>
              <p className="text-sm opacity-90 mt-2">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Deliveries by city</h2>
        {cities.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No completed deliveries yet. Once donations are delivered, city breakdowns will appear here.</p>
        ) : (
          <div className="space-y-3">
            {cities.map((c) => {
              const max = cities[0].count;
              return (
                <div key={c.city} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-700 w-32 truncate">{c.city}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.max(8, (c.count / max) * 100)}%` }}>
                      <span className="text-xs text-white font-semibold">{c.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        All figures are computed live from the MealMitra Supabase database. No statistics are invented.
      </p>
    </div>
  );
}
