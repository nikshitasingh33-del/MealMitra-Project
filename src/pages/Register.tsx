import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartHandshake, Loader2, Mail, Lock, User, Phone, Building2, Utensils, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/types";

export default function Register() {
  const { signUp } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>("donor");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NGO-only fields
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [capacity, setCapacity] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !phone || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (role === "ngo") {
      if (!orgName || !orgAddress || !orgCity || !serviceArea || !capacity || !contactPerson) {
        setError("Please complete all NGO organization fields.");
        return;
      }
    }

    setLoading(true);
    const { error: signUpError } = await signUp({
      email,
      password,
      role,
      fullName,
      phone,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError);
      push(signUpError, "error");
      return;
    }

    // If NGO, insert the ngo_profiles row.
    if (role === "ngo") {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (uid) {
        const { error: ngoErr } = await supabase.from("ngo_profiles").insert({
          user_id: uid,
          org_name: orgName,
          address: orgAddress,
          city: orgCity,
          contact_person: contactPerson,
          service_area: serviceArea,
          capacity_kg: parseInt(capacity, 10) || 0,
          registration_number: registrationNumber || null,
        });
        if (ngoErr) {
          push("Account created, but NGO profile save failed: " + ngoErr.message, "error");
        }
      }
    }

    setLoading(false);
    push("Account created successfully!", "success");
    navigate(role === "ngo" ? "/ngo-dashboard" : "/donor-dashboard");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-emerald-50 to-stone-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-900">
              Meal<span className="text-emerald-600">Mitra</span>
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Join MealMitra as a donor or an NGO.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {/* Role selector */}
          <div>
            <label className="label">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("donor")}
                className={`rounded-xl border p-4 text-left transition ${
                  role === "donor" ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Utensils className={`w-5 h-5 mb-2 ${role === "donor" ? "text-emerald-600" : "text-slate-400"}`} />
                <p className="font-semibold text-sm text-slate-900">Donor</p>
                <p className="text-xs text-slate-500 mt-0.5">Restaurant, hotel, event, individual</p>
              </button>
              <button
                type="button"
                onClick={() => setRole("ngo")}
                className={`rounded-xl border p-4 text-left transition ${
                  role === "ngo" ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Building2 className={`w-5 h-5 mb-2 ${role === "ngo" ? "text-emerald-600" : "text-slate-400"}`} />
                <p className="font-semibold text-sm text-slate-900">NGO</p>
                <p className="text-xs text-slate-500 mt-0.5">Charitable organization</p>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-10" placeholder="Jane Doe" />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input pl-10" placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="Min 6 characters" />
              </div>
            </div>
            <div>
              <label className="label">Confirm password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input pl-10" placeholder="Re-enter password" />
              </div>
            </div>
          </div>

          {role === "ngo" && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Building2 className="w-4 h-4" />
                <p className="text-sm font-semibold">Organization details</p>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                New NGOs start as <strong>Unverified</strong>. An admin must verify your organization before you can accept donations.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Organization name</label>
                  <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="input" placeholder="Hope Foundation" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <input value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} className="input" placeholder="123 Charity Road" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input value={orgCity} onChange={(e) => setOrgCity(e.target.value)} className="input" placeholder="Bengaluru" />
                </div>
                <div>
                  <label className="label">Service area</label>
                  <input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="input" placeholder="South Bengaluru, 10km radius" />
                </div>
                <div>
                  <label className="label">Contact person</label>
                  <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="input" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="label">Food handling capacity (meals/day)</label>
                  <input type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="input" placeholder="200" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Registration number (optional)</label>
                  <input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="input" placeholder="NGO-REG-2024-001" />
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
          </button>

          <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> By signing up you agree to use MealMitra responsibly.
          </p>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-700 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
