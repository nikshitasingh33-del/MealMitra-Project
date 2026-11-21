// Modal form for creating or editing an NGO profile from the dashboard.
// Used when the profile is missing (after registration failed) or when editing.

import { useState, type FormEvent } from "react";
import { Loader2, Building2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { NgoProfile } from "@/lib/types";

interface Props {
  existing: NgoProfile | null;
  onSaved: () => void;
  onClose: () => void;
}

export default function NgoProfileForm({ existing, onSaved, onClose }: Props) {
  const { user } = useAuth();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    org_name: existing?.org_name ?? "",
    address: existing?.address ?? "",
    city: existing?.city ?? "",
    contact_person: existing?.contact_person ?? "",
    service_area: existing?.service_area ?? "",
    capacity_kg: existing?.capacity_kg?.toString() ?? "",
    registration_number: existing?.registration_number ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!form.org_name || !form.address || !form.city || !form.contact_person || !form.service_area || !form.capacity_kg) {
      push("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    const payload = {
      org_name: form.org_name,
      address: form.address,
      city: form.city,
      contact_person: form.contact_person,
      service_area: form.service_area,
      capacity_kg: parseInt(form.capacity_kg, 10) || 0,
      registration_number: form.registration_number || null,
    };

    let error: { message: string } | null = null;
    if (existing) {
      const res = await supabase.from("ngo_profiles").update(payload).eq("user_id", user.id);
      error = res.error;
    } else {
      const res = await supabase.from("ngo_profiles").insert({ user_id: user.id, ...payload });
      error = res.error;
    }

    setLoading(false);
    if (error) {
      push(error.message, "error");
    } else {
      push(existing ? "NGO profile updated." : "NGO profile created.", "success");
      onSaved();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {existing ? "Edit organization details" : "Complete your NGO profile"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!existing && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Your organization profile was not saved during registration. Please complete it below. New NGOs start as <strong>Unverified</strong> — an admin must verify you before you can accept donations.
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Organization name *</label>
              <input value={form.org_name} onChange={(e) => set("org_name", e.target.value)} className="input" placeholder="Hope Foundation" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address *</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className="input" placeholder="123 Charity Road" />
            </div>
            <div>
              <label className="label">City *</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} className="input" placeholder="Bengaluru" />
            </div>
            <div>
              <label className="label">Service area *</label>
              <input value={form.service_area} onChange={(e) => set("service_area", e.target.value)} className="input" placeholder="South Bengaluru, 10km radius" />
            </div>
            <div>
              <label className="label">Contact person *</label>
              <input value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} className="input" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label">Food handling capacity (meals/day) *</label>
              <input type="number" min="0" value={form.capacity_kg} onChange={(e) => set("capacity_kg", e.target.value)} className="input" placeholder="200" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Registration number (optional)</label>
              <input value={form.registration_number} onChange={(e) => set("registration_number", e.target.value)} className="input" placeholder="NGO-REG-2024-001" />
            </div>
          </div>

          {existing?.verification_status && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
              Verification status: <strong className="capitalize">{existing.verification_status}</strong>
              {existing.verified_at && <span className="text-slate-400"> (verified {new Date(existing.verified_at).toLocaleDateString()})</span>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : existing ? "Save changes" : "Create profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
