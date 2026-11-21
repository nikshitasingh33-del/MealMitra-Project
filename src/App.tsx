import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import { RequireAuth } from "@/components/RequireAuth";
import Home from "@/pages/Home";
import About from "@/pages/About";
import HowItWorks from "@/pages/HowItWorks";
import Impact from "@/pages/Impact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import DonorDashboard from "@/pages/DonorDashboard";
import NgoDashboard from "@/pages/NgoDashboard";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Chatbot />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  if (typeof window !== "undefined") window.scrollTo(0, 0);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/donor-dashboard"
                element={
                  <RequireAuth role="donor">
                    <DonorDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/ngo-dashboard"
                element={
                  <RequireAuth role="ngo">
                    <NgoDashboard />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Home />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
