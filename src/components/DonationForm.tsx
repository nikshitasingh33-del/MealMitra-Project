import { useState, type FormEvent } from "react";
import { Loader2, Utensils, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import type { DietaryType, Urgency } from "@/lib/types";

interface Props {
  onCreated: () => void;
  onClose: () => void;
}

const CATEGORIES = ["Cooked meals", "Raw groceries", "Grains & rice", "Dairy", "Bakery", "Fruits & vegetables", "Packaged", "Beverages", "Other"];

export default function DonationForm({ onCreated, onClose }: Props) {
  const { push } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    food_name: "",
    category: CATEGORIES[0],
    quantity: "",
    quantity_unit: "portions",
    dietary_type: "veg" as DietaryType,
    prepared_at: "",
    safe_until: "",
    pickup_address: "",
    city: "",
    pickup_contact: "",
    notes: "",
    urgency: "medium" as Urgency,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!form.food_name || !form.quantity || !form.prepared_at || !form.safe_until || !form.pickup_address || !form.city || !form.pickup_contact) {
      push("Please fill in all required fields.", "error");
      return;
    }
    if (new Date(form.safe_until) <= new Date(form.prepared_at)) {
      push("Safe consumption deadline must be after preparation time.", "error");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("donations").insert({
      food_name: form.food_name,
      category: form.category,
      quantity: parseInt(form.quantity, 10),
      quantity_unit: form.quantity_unit,
      dietary_type: form.dietary_type,
      prepared_at: new Date(form.prepared_at).toISOString(),
      safe_until: new Date(form.safe_until).toISOString(),
      pickup_address: form.pickup_address,
      city: form.city,
      pickup_contact: form.pickup_contact,
      notes: form.notes || null,
      urgency: form.urgency,
    });

    setLoading(false);
    if (error) {
      push(error.message, "error");
    } else {
      push("Donation posted successfully!", "success");
      onCreated();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900">New food donation</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Food name *</label>
              <input value={form.food_name} onChange={(e) => set("food_name", e.target.value)} className="input" placeholder="e.g. Veg biryani, sandwiches" />
            </div>
            <div>
              <label className="label">Category *</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="input" placeholder="50" />
            </div>
            <div>
              <label className="label">Unit</label>
              <select value={form.quantity_unit} onChange={(e) => set("quantity_unit", e.target.value)} className="input">
                <option value="portions">portions</option>
                <option value="kg">kg</option>
                <option value="boxes">boxes</option>
                <option value="litres">litres</option>
                <option value="packs">packs</option>
              </select>
            </div>
            <div>
              <label className="label">Dietary type *</label>
              <select value={form.dietary_type} onChange={(e) => set("dietary_type", e.target.value as DietaryType)} className="input">
                <option value="veg">Veg</option>
                <option value="non_veg">Non-Veg</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Prepared at *</label>
              <input type="datetime-local" value={form.prepared_at} onChange={(e) => set("prepared_at", e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Safe until *</label>
              <input type="datetime-local" value={form.safe_until} onChange={(e) => set("safe_until", e.target.value)} className="input" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Pickup address *</label>
              <input value={form.pickup_address} onChange={(e) => set("pickup_address", e.target.value)} className="input" placeholder="Street, landmark, area" />
            </div>
            <div>
              <label className="label">City *</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} className="input" placeholder="Bengaluru" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Pickup contact *</label>
              <input value={form.pickup_contact} onChange={(e) => set("pickup_contact", e.target.value)} className="input" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="label">Urgency</label>
              <select value={form.urgency} onChange={(e) => set("urgency", e.target.value as Urgency)} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="input" placeholder="Allergens, packaging, pickup instructions..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post donation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
