import { useEffect, useState, useCallback } from "react";
import { Loader2, Inbox, MapPin, Clock, Phone, Building2, Filter, CheckCircle2, Truck, Package, ShieldCheck, ShieldAlert, X, Pencil, BadgeCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { StatusBadge, UrgencyBadge, DietaryBadge } from "@/components/Badges";
import { formatDateTime, hoursUntil, cn } from "@/lib/utils";
import type { AvailableDonation, Donation, NgoProfile } from "@/lib/types";
import NgoProfileForm from "@/components/NgoProfileForm";

export default function NgoDashboard() {
  const { user, profile, ngoProfile, refreshProfile } = useAuth();
  const { push } = useToast();
  const [available, setAvailable] = useState<AvailableDonation[]>([]);
  const [mine, setMine] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [tab, setTab] = useState<"available" | "active" | "history">("available");
  const [detail, setDetail] = useState<Donation | null>(null);
  const [filters, setFilters] = useState({ city: "", category: "", dietary: "", urgency: "" });
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showVerifyBox, setShowVerifyBox] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");

  const loadAvailable = useCallback(async () => {
    const { data, error } = await supabase
      .from("available_donations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      push(error.message, "error");
    } else {
      setAvailable((data as AvailableDonation[]) ?? []);
    }
  }, [push]);

  const loadMine = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("ngo_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      push(error.message, "error");
    } else {
      setMine((data as Donation[]) ?? []);
    }
  }, [user, push]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadAvailable(), loadMine()]);
      setLoading(false);
    })();
  }, [loadAvailable, loadMine]);

  const isVerified = ngoProfile?.verification_status === "verified";

  async function handleAccept(id: string) {
    setAccepting(id);
    const { data, error } = await supabase.rpc("accept_donation", { p_donation: id });
    setAccepting(null);
    if (error) {
      push(error.message, "error");
    } else {
      push("Donation accepted! Contact the donor to arrange pickup.", "success");
      await Promise.all([loadAvailable(), loadMine()]);
      setDetail((data as Donation) ?? null);
      setTab("active");
    }
  }

  async function handleStatusUpdate(id: string, status: "pickup_in_progress" | "delivered") {
    const { error } = await supabase.rpc("update_donation_status", { p_donation: id, p_status: status });
    if (error) {
      push(error.message, "error");
    } else {
      push(status === "delivered" ? "Marked as delivered. Thank you!" : "Status updated to Pickup in Progress.", "success");
      await Promise.all([loadAvailable(), loadMine()]);
      // refresh detail if open
      setDetail((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
    }
  }

  const filtered = available.filter((d) => {
    if (filters.city && !d.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.category && d.category !== filters.category) return false;
    if (filters.dietary && d.dietary_type !== filters.dietary) return false;
    if (filters.urgency && d.urgency !== filters.urgency) return false;
    return true;
  });

  const activeMine = mine.filter((d) => ["accepted", "pickup_in_progress"].includes(d.status));
  const historyMine = mine.filter((d) => ["delivered", "expired"].includes(d.status));

  const categories = Array.from(new Set(available.map((d) => d.category)));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">NGO dashboard</h1>
          <p className="text-slate-500 mt-1">{profile?.full_name || user?.email}</p>
        </div>
        {ngoProfile && (
          <div className={cn(
            "badge px-3 py-1.5 text-sm",
            isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
          )}>
            {isVerified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {isVerified ? "Verified NGO" : "Unverified — awaiting admin approval"}
          </div>
        )}
      </div>

      {!isVerified && ngoProfile && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-800">
          <p className="font-semibold mb-1">Your organization is pending verification.</p>
          <p>An administrator must verify your NGO before you can accept donations. You can still browse available donations below.</p>
        </div>
      )}

      {!ngoProfile && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6 text-sm text-red-800">
          <p className="font-semibold mb-1">NGO profile missing.</p>
          <p>Your organization details were not saved. Please complete your profile to continue.</p>
          <button onClick={() => setShowProfileForm(true)} className="btn-primary mt-3 text-sm">
            <Building2 className="w-4 h-4" /> Complete profile
          </button>
        </div>
      )}

      {ngoProfile && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setShowProfileForm(true)} className="btn-ghost text-sm border border-slate-200">
            <Pencil className="w-4 h-4" /> Edit organization details
          </button>
          {!isVerified && (
            <button onClick={() => setShowVerifyBox((v) => !v)} className="btn-ghost text-sm border border-slate-200">
              <BadgeCheck className="w-4 h-4" /> Demo verify
            </button>
          )}
        </div>
      )}

      {showVerifyBox && !isVerified && ngoProfile && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="text-sm font-semibold text-amber-800 mb-2">Demo verification (for testing)</p>
          <p className="text-xs text-amber-700 mb-3">Enter the NGO account email to verify. In production, only an admin would do this.</p>
          <div className="flex gap-2">
            <input
              value={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.value)}
              className="input py-2 text-sm flex-1"
              placeholder="ngo@example.com"
            />
            <button
              onClick={async () => {
                if (!verifyEmail.trim()) { push("Enter an email address.", "error"); return; }
                setVerifying(true);
                const { error } = await supabase.rpc("demo_verify_ngo", { p_email: verifyEmail.trim() });
                setVerifying(false);
                if (error) { push(error.message, "error"); }
                else { push("NGO verified successfully!", "success"); setShowVerifyBox(false); await refreshProfile(); }
              }}
              disabled={verifying}
              className="btn-primary text-sm"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
            </button>
          </div>
        </div>
      )}

      {/* tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {([
          { k: "available", label: `Available (${filtered.length})` },
          { k: "active", label: `Active (${activeMine.length})` },
          { k: "history", label: `History (${historyMine.length})` },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition",
              tab === t.k ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
      ) : tab === "available" ? (
        <>
          {/* filters */}
          <div className="card p-4 mb-6 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mr-2">
              <Filter className="w-4 h-4" /> Filters
            </div>
            <div>
              <label className="label">City</label>
              <input value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} className="input py-2 w-40" placeholder="Any city" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="input py-2 w-44">
                <option value="">All</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dietary</label>
              <select value={filters.dietary} onChange={(e) => setFilters((f) => ({ ...f, dietary: e.target.value }))} className="input py-2 w-32">
                <option value="">All</option>
                <option value="veg">Veg</option>
                <option value="non_veg">Non-Veg</option>
              </select>
            </div>
            <div>
              <label className="label">Urgency</label>
              <select value={filters.urgency} onChange={(e) => setFilters((f) => ({ ...f, urgency: e.target.value }))} className="input py-2 w-32">
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            {(filters.city || filters.category || filters.dietary || filters.urgency) && (
              <button onClick={() => setFilters({ city: "", category: "", dietary: "", urgency: "" })} className="btn-ghost text-sm">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900">No available donations</h3>
              <p className="text-sm text-slate-500 mt-1">Check back soon — new donations appear here in real time.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((d) => (
                <AvailableCard
                  key={d.id}
                  d={d}
                  canAccept={isVerified}
                  accepting={accepting === d.id}
                  onAccept={() => handleAccept(d.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : tab === "active" ? (
        activeMine.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900">No active pickups</h3>
            <p className="text-sm text-slate-500 mt-1">Accept a donation from the Available tab to start a pickup.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activeMine.map((d) => (
              <ActiveCard
                key={d.id}
                d={d}
                onOpen={() => setDetail(d)}
                onUpdate={(s) => handleStatusUpdate(d.id, s)}
              />
            ))}
          </div>
        )
      ) : historyMine.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900">No history yet</h3>
          <p className="text-sm text-slate-500 mt-1">Your completed and expired donations will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {historyMine.map((d) => <ActiveCard key={d.id} d={d} onOpen={() => setDetail(d)} faded />)}
        </div>
      )}

      {detail && <NgoDetail donation={detail} onClose={() => setDetail(null)} onUpdate={(s) => handleStatusUpdate(detail.id, s)} />}

      {showProfileForm && (
        <NgoProfileForm
          existing={ngoProfile}
          onSaved={async () => { setShowProfileForm(false); await refreshProfile(); }}
          onClose={() => setShowProfileForm(false)}
        />
      )}
    </div>
  );
}

function AvailableCard({ d, canAccept, accepting, onAccept }: { d: AvailableDonation; canAccept: boolean; accepting: boolean; onAccept: () => void }) {
  const hrsLeft = hoursUntil(d.safe_until);
  return (
    <div className="card p-5 flex flex-col hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-slate-900">{d.food_name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{d.category} • {d.quantity} {d.quantity_unit}</p>
        </div>
        <UrgencyBadge urgency={d.urgency} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <DietaryBadge dietary={d.dietary_type} />
        {hrsLeft > 0 && hrsLeft < 4 && <span className="badge bg-red-100 text-red-700">Expires in {Math.round(hrsLeft)}h</span>}
      </div>
      <div className="space-y-1 text-xs text-slate-500 mb-4 flex-1">
        <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {d.pickup_address}, {d.city}</p>
        <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Safe until {formatDateTime(d.safe_until)}</p>
        {d.notes && <p className="text-slate-400 italic mt-1">"{d.notes}"</p>}
      </div>
      <button
        onClick={onAccept}
        disabled={!canAccept || accepting}
        className="btn-primary w-full text-sm"
        title={!canAccept ? "Only verified NGOs can accept" : undefined}
      >
        {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {canAccept ? "Accept donation" : "Verification required"}
      </button>
    </div>
  );
}

function ActiveCard({ d, onOpen, onUpdate, faded }: { d: Donation; onOpen: () => void; onUpdate?: (s: "pickup_in_progress" | "delivered") => void; faded?: boolean }) {
  return (
    <div className={cn("card p-5", faded && "opacity-75")}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-slate-900">{d.food_name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{d.quantity} {d.quantity_unit} • {d.city}</p>
        </div>
        <StatusBadge status={d.status} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <DietaryBadge dietary={d.dietary_type} />
      </div>
      <div className="text-xs text-slate-500 space-y-1 mb-4">
        <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-emerald-600" /> {d.pickup_contact}</p>
        <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {d.pickup_address}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onOpen} className="btn-ghost text-sm flex-1 border border-slate-200">Details</button>
        {onUpdate && d.status === "accepted" && (
          <button onClick={() => onUpdate("pickup_in_progress")} className="btn-primary text-sm flex-1">
            <Truck className="w-4 h-4" /> Start pickup
          </button>
        )}
        {onUpdate && d.status === "pickup_in_progress" && (
          <button onClick={() => onUpdate("delivered")} className="btn-primary text-sm flex-1">
            <CheckCircle2 className="w-4 h-4" /> Mark delivered
          </button>
        )}
      </div>
    </div>
  );
}

function NgoDetail({ donation, onClose, onUpdate }: { donation: Donation; onClose: () => void; onUpdate: (s: "pickup_in_progress" | "delivered") => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">{donation.food_name}</h2>
              <p className="text-sm text-emerald-100 mt-0.5">{donation.quantity} {donation.quantity_unit} • {donation.category}</p>
            </div>
            <StatusBadge status={donation.status} />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> Donor contact</p>
            <p className="text-sm text-slate-700">{donation.pickup_contact}</p>
            <p className="text-sm text-slate-700 mt-1">{donation.pickup_address}, {donation.city}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Dietary" value={donation.dietary_type === "veg" ? "Vegetarian" : "Non-Veg"} />
            <Detail label="Urgency" value={donation.urgency} />
            <Detail label="Prepared at" value={formatDateTime(donation.prepared_at)} />
            <Detail label="Safe until" value={formatDateTime(donation.safe_until)} />
          </div>
          {donation.notes && (
            <div>
              <p className="label">Notes</p>
              <p className="text-sm text-slate-700">{donation.notes}</p>
            </div>
          )}

          {(donation.status === "accepted" || donation.status === "pickup_in_progress") && (
            <div className="flex gap-3">
              {donation.status === "accepted" && (
                <button onClick={() => onUpdate("pickup_in_progress")} className="btn-primary flex-1">
                  <Truck className="w-4 h-4" /> Start pickup
                </button>
              )}
              {donation.status === "pickup_in_progress" && (
                <button onClick={() => onUpdate("delivered")} className="btn-primary flex-1">
                  <CheckCircle2 className="w-4 h-4" /> Mark delivered
                </button>
              )}
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
