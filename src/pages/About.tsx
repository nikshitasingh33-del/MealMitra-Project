import { Link } from "react-router-dom";
import { HeartHandshake, Target, Eye, Leaf, Users, Building2, ArrowRight } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold mb-4">
          <HeartHandshake className="w-3.5 h-3.5" /> About Us
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900">We're bridging the food gap</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          MealMitra exists because perfectly good food is thrown away every day while people nearby go hungry.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="card p-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900">Our Mission</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            To reduce food wastage by making it effortless for anyone with surplus food — a restaurant,
            an event organizer, a household — to connect with a verified NGO that can collect and
            distribute that food to people who need it.
          </p>
        </div>
        <div className="card p-8">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Eye className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900">Our Vision</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            A world where no edible food ends up in a bin while a neighbour goes hungry. We believe
            coordination — not new infrastructure — is the missing piece.
          </p>
        </div>
      </div>

      <div className="card p-8 mb-12">
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">Who we serve</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: <Users className="w-5 h-5" />, title: "Donors", text: "Individuals & households, restaurants, hotels, and event organizers with surplus food." },
            { icon: <Building2 className="w-5 h-5" />, title: "NGOs", text: "Charitable organizations that collect and distribute food to people in need." },
          ].map((g) => (
            <div key={g.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <div className="w-10 h-10 rounded-lg bg-white text-emerald-600 flex items-center justify-center flex-shrink-0">{g.icon}</div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{g.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{g.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-8 text-center">
        <Leaf className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold text-slate-900">An important boundary</h2>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
          MealMitra is a coordination and matching platform, not a food delivery company. We do not
          provide delivery agents, GPS tracking, or payment gateways. NGOs and their volunteers are
          responsible for collecting and distributing food independently.
        </p>
        <Link to="/register" className="btn-primary mt-6">
          Join us <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
