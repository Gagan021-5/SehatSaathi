import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bot,
  Building2,
  Calculator,
  FileText,
  FolderKanban,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Pill,
  Stethoscope,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import AppLogo from "./AppLogo";

const navGroups = [
  {
    groupKey: "sidebar.groups.overview",
    items: [
      { path: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
      { path: "/health", icon: Activity, labelKey: "nav.health" },
    ],
  },
  {
    groupKey: "sidebar.groups.smartFeatures",
    items: [
      { path: "/diabetes", icon: Stethoscope, labelKey: "nav.predict", badge: "AI" },
      { path: "/chat", icon: Bot, labelKey: "nav.chat" },
      { path: "/prescription", icon: FileText, labelKey: "nav.prescription" },
    ],
  },
  {
    groupKey: "sidebar.groups.dailyCareTools",
    items: [
      { path: "/first-aid", icon: HeartPulse, labelKey: "nav.firstAid" },
      { path: "/medicines", icon: Pill, labelKey: "nav.medicines" },
      { path: "/hospitals", icon: Building2, labelKey: "nav.hospitals" },
      { path: "/health-tools", icon: Calculator, labelKey: "nav.healthTools" },
      { path: "/rural-outreach", icon: MessageSquareText, labelKey: "nav.ruralOutreach" },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Overlay with high-end blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-md md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex h-full w-[290px] flex-col transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] md:static md:translate-x-0 md:m-5 md:h-[calc(100vh-2.5rem)] ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Main Glass Container */}
        <div className="flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl ring-1 ring-slate-900/5">

          {/* Header with App Branding */}
          <div className="relative flex h-24 items-center justify-between px-7">
            <button
              onClick={() => { navigate("/"); onClose(); }}
              className="group transition-transform active:scale-95"
            >
              <AppLogo
                iconClassName="h-11 w-11 drop-shadow-md"
                showTagline
                tagline={t("sidebar.premium")}
                nameClassName="text-lg font-black text-slate-900 tracking-tight"
                taglineClassName="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1"
              />
            </button>
            <button onClick={onClose} className="md:hidden p-2.5 rounded-xl bg-slate-100 text-slate-500">
              <X size={18} />
            </button>
          </div>

          {/* Nav Navigation */}
          <div className="flex-1 overflow-y-auto px-5 py-2 custom-scrollbar space-y-8">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400/80 mb-4">
                  {t(group.groupKey)}
                </h3>
                <nav className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`group relative flex items-center justify-between rounded-2xl px-4 py-3.5 text-[13px] font-bold transition-all duration-300 ${active
                            ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                            : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-lg hover:shadow-slate-200/40"
                          }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-1.5 rounded-lg transition-colors ${active ? "bg-white/10" : "bg-slate-100 group-hover:bg-blue-50"}`}>
                            <Icon size={18} className={active ? "text-white" : "text-slate-400 group-hover:text-blue-600"} />
                          </div>
                          <span className="tracking-tight">{t(item.labelKey) || item.labelKey}</span>
                        </div>

                        {item.badge && !active && (
                          <span className="flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-black text-blue-600 uppercase">
                            <Sparkles size={8} /> {item.badge}
                          </span>
                        )}

                        {active && (
                          <motion.div
                            layoutId="activeGlow"
                            className="absolute -right-1 h-5 w-1 rounded-full bg-blue-500"
                          />
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Footer: Utility & User */}
          <div className="p-6 mt-auto space-y-4">
            {/* SOS Button - Premium Pulse */}
            <button
              onClick={() => { navigate("/emergency"); onClose(); }}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] bg-rose-500 py-4 text-sm font-black text-white shadow-xl shadow-rose-500/25 transition-all hover:bg-rose-600 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <AlertTriangle size={18} className="animate-pulse" />
              <span className="uppercase tracking-widest">{t("nav.emergency")}</span>
            </button>

            {/* User Profile Card */}
            {user && (
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-white bg-white/50 p-3 shadow-sm transition-all hover:shadow-md">
                <div className="relative">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-xs shadow-lg overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      user.name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-slate-900">
                    {user.name || t("common.user")}
                  </p>
                  <p className="truncate text-[10px] font-bold text-slate-400">
                    {user.email}
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="group p-2 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all"
                >
                  <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}