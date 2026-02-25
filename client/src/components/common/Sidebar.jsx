import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    Bot,
    Brain,
    Building2,
    FileText,
    LayoutDashboard,
    LogOut,
    Sparkles,
    Stethoscope,
    X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Card from './Card';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
    { path: '/diabetes', icon: Stethoscope, label: 'nav.diabetes' },
    { path: '/chat', icon: Bot, label: 'nav.chat' },
    { path: '/predict', icon: Brain, label: 'nav.predict' },
    { path: '/prescription', icon: FileText, label: 'nav.prescription' },
    { path: '/health', icon: Activity, label: 'nav.health' },
    { path: '/hospitals', icon: Building2, label: 'nav.hospitals' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}
            <aside
                className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 border-r border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-zinc-200/30 transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}
            >
                <div className="h-full p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => {
                                navigate('/');
                                onClose();
                            }}
                            className="flex items-center gap-3 transition-all duration-300 ease-out hover:-translate-y-0.5"
                        >
                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                                <Sparkles size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-base font-semibold tracking-tight text-zinc-900">SehatSaathi</p>
                                <p className="text-[11px] text-zinc-500">Medical Premium 2025</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="md:hidden p-2 rounded-lg text-zinc-500 ring-1 ring-zinc-200/70 hover:bg-zinc-50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <Card className="p-2 flex-1 overflow-y-auto">
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = location.pathname === item.path;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ease-out ${
                                            active
                                                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-lg shadow-blue-500/10'
                                                : 'text-zinc-700 hover:bg-zinc-50 hover:-translate-y-0.5 hover:shadow-lg'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        <span>{t(item.label) || item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>
                    </Card>

                    <button
                        type="button"
                        onClick={() => {
                            navigate('/emergency');
                            onClose();
                        }}
                        className="rounded-xl bg-gradient-to-r from-rose-600 to-red-500 text-white px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/30 active:translate-y-0 active:scale-95"
                    >
                        <AlertTriangle size={16} /> Emergency SOS
                    </button>

                    {user && (
                        <Card className="p-3">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-semibold grid place-items-center">
                                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-zinc-900 truncate">{user.name || 'User'}</p>
                                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="p-2 rounded-xl text-zinc-500 hover:bg-rose-50 hover:text-rose-600"
                                    title="Sign out"
                                >
                                    <LogOut size={15} />
                                </button>
                            </div>
                        </Card>
                    )}
                </div>
            </aside>
        </>
    );
}


