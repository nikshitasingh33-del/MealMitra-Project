import { useEffect, useState, useCallback } from "react";
import { Plus, Utensils, Loader2, Inbox, MapPin, Phone, Building2, Clock, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { StatusBadge, UrgencyBadge, DietaryBadge } from "@/components/Badges";
import { formatDateTime, hoursUntil } from "@/lib/utils";
import DonationForm from "@/components/DonationForm";
import type { Donation, NgoProfile } from "@/lib/types";

export default function DonorDashboard() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Donation | null>(null);
  const [ngoForSelected, setNgoForSelected] = useState<NgoProfile | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      push(error.message, "error");
    } else {
      setDonations((data as Donation[]) ?? []);
    }
  }, [user, push]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    async function fetchNgo() {
      if (selected?.ngo_id && selected.status !== "pending") {
        const { data } = await supabase
          .from("ngo_profiles")
          .select("*")
          .eq("user_id", selected.ngo_id)
          .maybeSingle();
        setNgoForSelected((data as NgoProfile) ?? null);
      } else {
        setNgoForSelected(null);
      }
    }
    fetchNgo();
  }, [selected]);

  const active = donations.filter((d) => ["pending", "accepted", "pickup_in_progress"].includes(d.status));
  const history = donations.filter((d) => ["delivered", "expired"].includes(d.status));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Donor dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {profile?.full_name || user?.email}.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> New donation
        </button>
      </div>

      {/* quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <MiniStat icon={<Package className="w-5 h-5" />} label="Active" value={active.length} color="emerald" />
        <MiniStat icon={<Inbox className="w-5 h-5" />} label="Pending" value={donations.filter((d) => d.status === "pending").length} color="amber" />
        <MiniStat icon={<Utensils className="w-5 h-5" />} label="Delivered" value={donations.filter((d) => d.status === "delivered").length} color="sky" />
        <MiniStat icon={<Clock className="w-5 h-5" />} label="Expired" value={donations.filter((d) => d.status === "expired").length} color="slate" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
      ) : donations.length === 0 ? (
        <EmptyState onAction={() => setShowForm(true)} />
      ) : (
        <>
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Active donations</h2>
            {active.length === 0 ? (
              <p className="text-sm text-slate-500 card p-6 text-center">No active donations right now.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {active.map((d) => <DonationCard key={d.id} d={d} onOpen={() => setSelected(d)} />)}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Donation history</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {history.map((d) => <DonationCard key={d.id} d={d} onOpen={() => setSelected(d)} faded />)}
              </div>
            </section>
          )}
        </>
      )}

      {showForm && <DonationForm onCreated={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}

      {selected && (
        <DonationDetail
          donation={selected}
          ngo={ngoForSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function DonationCard({ d, onOpen, faded }: { d: Donation; onOpen: () => void; faded?: boolean }) {
  const hrsLeft = hoursUntil(d.safe_until);
  const expiredSoon = d.status === "pending" && hrsLeft < 4 && hrsLeft > 0;
  return (
    <button
      onClick={onOpen}
      className={`card p-5 text-left hover:shadow-md hover:border-emerald-200 transition w-full ${faded ? "opacity-75" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-slate-900">{d.food_name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{d.category} • {d.quantity} {d.quantity_unit}</p>
        </div>
        <StatusBadge status={d.status} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <DietaryBadge dietary={d.dietary_type} />
        <UrgencyBadge urgency={d.urgency} />
        {expiredSoon && <span className="badge bg-red-100 text-red-700">Expires in {Math.round(hrsLeft)}h</span>}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <MapPin className="w-3.5 h-3.5" /> {d.city}
        <span className="mx-1">•</span>
        <Clock className="w-3.5 h-3.5" /> Safe until {formatDateTime(d.safe_until)}
      </div>
    </button>
  );
}

function DonationDetail({ donation, ngo, onClose }: { donation: Donation; ngo: NgoProfile | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">{donation.food_name}</h2>
              <p className="text-sm text-emerald-100 mt-0.5">{donation.category} • {donation.quantity} {donation.quantity_unit}</p>
            </div>
            <StatusBadge status={donation.status} />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Dietary" value={donation.dietary_type === "veg" ? "Vegetarian" : "Non-Veg"} />
            <Detail label="Urgency" value={donation.urgency} />
            <Detail label="Prepared at" value={formatDateTime(donation.prepared_at)} />
            <Detail label="Safe until" value={formatDateTime(donation.safe_until)} />
            <Detail label="City" value={donation.city} />
            <Detail label="Created" value={formatDateTime(donation.created_at)} />
          </div>
          <div>
            <p className="label">Pickup address</p>
            <p className="text-sm text-slate-700">{donation.pickup_address}</p>
          </div>
          <div>
            <p className="label">Pickup contact</p>
            <p className="text-sm text-slate-700 flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-600" /> {donation.pickup_contact}</p>
          </div>
          {donation.notes && (
            <div>
              <p className="label">Notes</p>
              <p className="text-sm text-slate-700">{donation.notes}</p>
            </div>
          )}

          {donation.status !== "pending" && donation.ngo_id && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <Building2 className="w-4 h-4" />
                <p className="text-sm font-semibold">Accepting NGO</p>
              </div>
              {ngo ? (
                <div className="text-sm text-slate-700 space-y-1">
                  <p><strong>{ngo.org_name}</strong></p>
                  <p>{ngo.address}, {ngo.city}</p>
                  <p>Service area: {ngo.service_area}</p>
                  <p>Capacity: {ngo.capacity_kg} meals/day</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Loading NGO details...</p>
              )}
            </div>
          )}

          {donation.status === "pending" && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              Waiting for a verified NGO to accept your donation. You'll see the NGO's details here once accepted.
            </div>
          )}

          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5 capitalize">{value}</p>
    </div>
  );
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
        <Utensils className="w-8 h-8" />
      </div>
      <h3 className="font-display text-lg font-bold text-slate-900">No donations yet</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Post your first food donation and a verified NGO near you will be able to accept it.</p>
      <button onClick={onAction} className="btn-primary mt-5">
        <Plus className="w-5 h-5" /> Post a donation
      </button>
    </div>
  );
}
