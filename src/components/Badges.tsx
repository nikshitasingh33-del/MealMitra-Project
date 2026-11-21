import { type DonationStatus, type Urgency } from "@/lib/types";

export function StatusBadge({ status }: { status: DonationStatus }) {
  const map: Record<DonationStatus, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-amber-100 text-amber-800" },
    accepted: { label: "Accepted", cls: "bg-blue-100 text-blue-800" },
    pickup_in_progress: { label: "Pickup in Progress", cls: "bg-indigo-100 text-indigo-800" },
    delivered: { label: "Delivered", cls: "bg-emerald-100 text-emerald-800" },
    expired: { label: "Expired", cls: "bg-slate-200 text-slate-600" },
  };
  const s = map[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const map: Record<Urgency, { label: string; cls: string }> = {
    low: { label: "Low", cls: "bg-slate-100 text-slate-600" },
    medium: { label: "Medium", cls: "bg-amber-100 text-amber-800" },
    high: { label: "High", cls: "bg-red-100 text-red-700" },
  };
  const u = map[urgency];
  return <span className={`badge ${u.cls}`}>{u.label} urgency</span>;
}

export function DietaryBadge({ dietary }: { dietary: "veg" | "non_veg" }) {
  return dietary === "veg" ? (
    <span className="badge bg-green-100 text-green-700">
      <span className="w-2 h-2 rounded-full bg-green-600 border border-green-700" /> Veg
    </span>
  ) : (
    <span className="badge bg-red-100 text-red-700">
      <span className="w-2 h-2 rounded-full bg-red-600 border border-red-700" /> Non-Veg
    </span>
  );
}
