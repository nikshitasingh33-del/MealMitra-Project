import { Link } from "react-router-dom";
import { Utensils, Building2, Truck, CheckCircle2, ShieldCheck, Clock, MapPin, ArrowRight, HeartHandshake } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    { icon: <Utensils className="w-6 h-6" />, title: "1. Donor submits a request", text: "A donor (restaurant, hotel, event, individual) fills in the donation form: food name, category, quantity, dietary type (veg/non-veg), preparation time, safe consumption deadline, pickup address, city, and contact number." },
    { icon: <Building2 className="w-6 h-6" />, title: "2. MealMitra shows it to NGOs", text: "The request appears on NGO dashboards. NGOs can filter by city, food category, dietary type, and urgency. Donor contact details are hidden until an NGO accepts." },
    { icon: <CheckCircle2 className="w-6 h-6" />, title: "3. A verified NGO accepts", text: "Only admin-verified NGOs can accept. Acceptance is atomic at the database level — only one NGO can accept each donation, preventing conflicts." },
    { icon: <Truck className="w-6 h-6" />, title: "4. NGO collects the food", text: "Once accepted, MealMitra shares contact details with both parties. The NGO directly contacts the donor and arranges pickup. Status moves to 'Pickup in Progress'." },
    { icon: <HeartHandshake className="w-6 h-6" />, title: "5. NGO distributes & marks Delivered", text: "The NGO independently distributes the food to people in need, then updates the status to 'Delivered'. The donor sees the successful donation in their history." },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900">How MealMitra works</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          A transparent, rule-based flow from surplus to served. No delivery agents, no payments — just coordination.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="card p-6 flex items-start gap-5 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">{s.icon}</div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">{s.title}</h2>
              <p className="mt-1.5 text-slate-600 leading-relaxed">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-5">
          <Clock className="w-6 h-6 text-amber-600 mb-2" />
          <h3 className="font-semibold text-slate-900 text-sm">Deadline & expiry</h3>
          <p className="text-xs text-slate-600 mt-1">Each donation has a safe consumption deadline. Donations not collected in time are marked Expired.</p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
          <h3 className="font-semibold text-slate-900 text-sm">NGO verification</h3>
          <p className="text-xs text-slate-600 mt-1">New NGOs start Unverified. An admin verifies them before they can accept any donation.</p>
        </div>
        <div className="rounded-xl bg-sky-50 border border-sky-100 p-5">
          <MapPin className="w-6 h-6 text-sky-600 mb-2" />
          <h3 className="font-semibold text-slate-900 text-sm">Rule-based matching</h3>
          <p className="text-xs text-slate-600 mt-1">Matching uses city, food category, dietary type, NGO capacity, and urgency. Not AI — just clear rules.</p>
        </div>
      </div>

      <div className="text-center mt-12">
        <Link to="/register" className="btn-primary text-base px-6 py-3.5">
          Get started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
