import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, Globe, ChevronDown, User, Settings, LogOut } from 'lucide-react';

const pageTitles = {
    '/': 'Dashboard', '/diabetes': 'Diabetes Check', '/chat': 'AI Doctor',
    '/predict': 'Symptom Checker', '/prescription': 'Prescriptions',
    '/health': 'Health Records', '/hospitals': 'Find Hospitals',
    '/emergency': 'Emergency SOS', '/profile': 'Profile',
};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Navbar({ onMenuClick }) {
    const { t, currentLanguage, changeLanguage, languages } = useLanguage();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [langOpen, setLangOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const langRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const title = pageTitles[location.pathname] || 'SehatSaathi';
    const firstName = user?.name?.split(' ')[0] || 'User';

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 md:px-6">
            {/* Left */}
            <div className="flex items-center gap-3">
                <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                    <Menu size={20} />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <p className="text-xs text-gray-400 hidden sm:block">{getGreeting()}, {firstName} 👋</p>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Language */}
                <div ref={langRef} className="relative">
                    <button onClick={() => { setLangOpen(!langOpen); setProfileOpen(false); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-all">
                        <Globe size={16} />
                        <span className="hidden sm:inline">{currentLanguage.flag}</span>
                        <ChevronDown size={14} />
                    </button>
                    {langOpen && (
                        <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeInDown">
                            {languages.map((l) => (
                                <button key={l.code} onClick={() => { changeLanguage(l.code); setLangOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${l.code === currentLanguage.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}>
                                    <span className="text-lg">{l.flag}</span>
                                    <span>{l.nativeName}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notification */}
                <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 relative">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Profile */}
                <div ref={profileRef} className="relative">
                    <button onClick={() => { setProfileOpen(!profileOpen); setLangOpen(false); }}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {firstName[0]?.toUpperCase()}
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {profileOpen && (
                        <div className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeInDown">
                            <div className="px-4 py-3 border-b border-gray-50">
                                <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-400">{user?.email}</p>
                            </div>
                            <button onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <User size={16} /> Profile
                            </button>
                            <button onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Settings size={16} /> Settings
                            </button>
                            <div className="border-t border-gray-50 mt-1 pt-1">
                                <button onClick={() => { logout(); setProfileOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
