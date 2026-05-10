"use client";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building2,
  Headphones,
  Truck as TruckIcon,
  Calculator,
  Users as UsersIcon,
  Mail,
  Lock,
  ArrowRight,
  Rocket,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth";
import { DEFAULT_LANDING } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/types";
import { toast } from "sonner";

interface RoleCard {
  role: Role;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  email: string;
  password: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconBg: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: "super_admin",
    number: 1,
    title: "SUPER ADMIN",
    subtitle: "Full system access",
    description: "Complete access to all companies, settings, users, reports and system management.",
    email: "admin@nexlogistics.demo",
    password: "Admin123!",
    icon: Shield,
    accent: "text-emerald-700",
    iconBg: "bg-emerald-50 ring-1 ring-emerald-200",
  },
  {
    role: "company_admin",
    number: 2,
    title: "COMPANY ADMIN",
    subtitle: "Company management",
    description: "Manage fleet, drivers, trips, maintenance, expenses, payroll and reports.",
    email: "operations@nexlogistics.demo",
    password: "Ops123!",
    icon: Building2,
    accent: "text-blue-700",
    iconBg: "bg-blue-50 ring-1 ring-blue-200",
  },
  {
    role: "dispatcher",
    number: 3,
    title: "DISPATCHER",
    subtitle: "Trip & dispatch management",
    description: "Create trips, assign drivers and vehicles, monitor deliveries and track in real-time.",
    email: "dispatcher@nexlogistics.demo",
    password: "Dispatch123!",
    icon: Headphones,
    accent: "text-violet-700",
    iconBg: "bg-violet-50 ring-1 ring-violet-200",
  },
  {
    role: "driver",
    number: 4,
    title: "DRIVER",
    subtitle: "Driver mobile access",
    description: "View assigned trips, update status, upload proof of delivery and manage expenses.",
    email: "driver.mark@nexlogistics.demo",
    password: "Driver123!",
    icon: TruckIcon,
    accent: "text-emerald-700",
    iconBg: "bg-emerald-50 ring-1 ring-emerald-200",
  },
  {
    role: "accounting",
    number: 5,
    title: "ACCOUNTING / HR",
    subtitle: "Payroll & financial management",
    description: "Manage payroll, attendance, expenses, deductions and financial reports.",
    email: "finance@nexlogistics.demo",
    password: "Finance123!",
    icon: Calculator,
    accent: "text-orange-700",
    iconBg: "bg-orange-50 ring-1 ring-orange-200",
  },
  {
    role: "client",
    number: 6,
    title: "CLIENT PORTAL",
    subtitle: "Client shipment visibility",
    description: "Track deliveries, view proof of delivery, invoices and shipment history.",
    email: "client@abcconstruction.demo",
    password: "Client123!",
    icon: UsersIcon,
    accent: "text-teal-700",
    iconBg: "bg-brand-teal-light ring-1 ring-brand-teal/40",
  },
];

const QUICK_ACCESS = [
  { role: "super_admin", label: "Super Admin", code: "Admin123!", icon: Shield, color: "bg-emerald-500/15 text-emerald-300" },
  { role: "company_admin", label: "Company Admin", code: "Ops123!", icon: Building2, color: "bg-blue-500/15 text-blue-300" },
  { role: "dispatcher", label: "Dispatcher", code: "Dispatch123!", icon: Headphones, color: "bg-violet-500/15 text-violet-300" },
  { role: "driver", label: "Driver", code: "Driver123!", icon: TruckIcon, color: "bg-emerald-500/15 text-emerald-300" },
  { role: "accounting", label: "Accounting / HR", code: "Finance123!", icon: Calculator, color: "bg-orange-500/15 text-orange-300" },
  { role: "client", label: "Client Portal", code: "Client123!", icon: UsersIcon, color: "bg-brand-teal/20 text-brand-teal" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const loginAsRole = useAuthStore((s) => s.loginAsRole);

  const handleLogin = (role: Role, label: string) => {
    const u = loginAsRole(role);
    if (u) {
      toast.success(`Welcome, ${u.name}!`, { description: `Signed in as ${label}.` });
      router.push(DEFAULT_LANDING[role]);
    }
  };

  return (
    <div className="min-h-screen gradient-navy text-white relative overflow-hidden">
      {/* decorative grid */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #66B2B2 1px, transparent 1px), linear-gradient(to bottom, #66B2B2 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-brand-teal flex items-center justify-center shadow-glow">
              <span className="font-extrabold text-2xl text-brand-navy">N</span>
            </div>
            <div className="text-left">
              <div className="text-3xl font-extrabold tracking-tight">
                NE<span className="text-brand-teal">X</span>
              </div>
              <div className="text-[10px] tracking-[0.3em] text-brand-teal font-semibold">LOGISTICS</div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            DEMO <span className="text-brand-teal">LOGIN</span> ACCOUNTS
          </h1>
          <p className="text-sm text-white/70 mt-3">
            Choose a role to explore the Nex Logistics system
          </p>
          <div className="mx-auto mt-4 h-px w-32 bg-gradient-to-r from-transparent via-brand-teal to-transparent" />
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLE_CARDS.map((c, i) => (
            <motion.div
              key={c.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-white text-brand-gray p-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center`}>
                  <c.icon className={`w-7 h-7 ${c.accent}`} />
                </div>
                <div className="flex-1">
                  <div className={`text-base font-extrabold ${c.accent}`}>
                    {c.number}. {c.title}
                  </div>
                  <div className="text-sm text-brand-gray font-medium">{c.subtitle}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{c.description}</p>

              <div className="rounded-xl border border-brand-border bg-gray-50/60 p-3 space-y-2 mb-4 relative">
                <div className="absolute right-3 top-3 text-gray-300">
                  <User className="w-10 h-10" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> Email
                </div>
                <div className="text-sm font-medium text-brand-navy">{c.email}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Lock className="w-3.5 h-3.5" /> Password
                </div>
                <div className="text-sm font-medium text-brand-navy">{c.password}</div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => handleLogin(c.role, c.title)}
              >
                Login as {c.title.split(" / ")[0].split(" ").map(w => w[0] + w.slice(1).toLowerCase()).join(" ")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-2xl bg-brand-navy-light/80 border border-white/5 backdrop-blur p-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3 lg:w-72 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <div className="font-semibold text-brand-teal">Quick Access</div>
                <div className="text-[11px] text-white/60">
                  Login instantly as any demo user to explore different features.
                </div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {QUICK_ACCESS.map((q) => (
                <button
                  key={q.role}
                  onClick={() => handleLogin(q.role as Role, q.label)}
                  className="flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-2 transition text-left"
                >
                  <div className={`w-7 h-7 rounded-md ${q.color} flex items-center justify-center`}>
                    <q.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{q.label}</div>
                    <div className="text-[10px] text-white/50 truncate">{q.code}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
