import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Stethoscope, Bot, Brain, FileText,
    Activity, Building2, AlertTriangle, LogOut, X, ChevronRight, Sparkles,
} from 'lucide-react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
    { path: '/diabetes', icon: Stethoscope, label: 'nav.diabetes', badge: 'NEW' },
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

    const handleSOS = () => { onClose(); navigate('/emergency'); };

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />}
            <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Logo */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { navigate('/'); onClose(); }}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">SehatSaathi</h1>
                            <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">AI Health Companion</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path} to={item.path} onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-blue-50 text-blue-600 border-l-[3px] border-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
                                <span className="flex-1">{t(item.label) || item.label}</span>
                                {item.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full">{item.badge}</span>
                                )}
                                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
                            </NavLink>
                        );
                    })}
                </nav>

                {/* SOS Button */}
                <div className="px-4 pb-3">
                    <button
                        onClick={handleSOS}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:shadow-xl transition-all animate-pulseGlow"
                    >
                        <AlertTriangle size={18} />
                        🚨 {t('nav.emergency') || 'Emergency SOS'}
                    </button>
                </div>

                {/* User */}
                {user && (
                    <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{user.name || 'User'}</p>
                                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                            </div>
                            <button onClick={logout} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Sign Out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
