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
      { path: "/diabetes", icon: Stethoscope, labelKey: "nav.predict" },
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
      {
        path: "/rural-outreach",
        icon: MessageSquareText,
        labelKey: "nav.ruralOutreach",
      },
    ],
  },
  {
    groupKey: "sidebar.groups.documents",
    items: [
      { path: "/reports", icon: FileText, labelKey: "nav.reports" },
      { path: "/family-vault", icon: FolderKanban, labelKey: "nav.familyVault" },
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex h-full w-72 flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-3xl transition-transform duration-500 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Section */}
        <div className="flex h-20 items-center justify-between px-6">
          <button
            onClick={() => {
              navigate("/");
              onClose();
            }}
            className="group"
          >
            <AppLogo
              iconClassName="h-10 w-10"
              showTagline
              tagline={t("sidebar.premium")}
              nameClassName="text-base font-bold text-slate-900 leading-tight"
              taglineClassName="text-[10px] font-bold uppercase tracking-widest text-blue-600/80"
            />
          </button>
          <button onClick={onClose} className="md:hidden p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Nav Groups Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-8">
              <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
                {t(group.groupKey)}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`group relative flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        active
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={
                            active
                              ? "text-white"
                              : "text-slate-400 group-hover:text-blue-600"
                          }
                        />
                        <span>{t(item.labelKey) || item.labelKey}</span>
                      </div>
                      {!active && (
                        <ChevronRight
                          size={14}
                          className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                        />
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="mt-auto p-4 space-y-3">
          <button
            onClick={() => {
              navigate("/emergency");
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 hover:shadow-rose-500/40 active:scale-95"
          >
            <AlertTriangle size={18} className="animate-pulse" />
            <span>{t("nav.emergency")}</span>
          </button>

          {user && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/50 bg-slate-50/50 p-3 ring-1 ring-white/50">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user.name || t("common.user")}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {user.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
