import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Globe, LogOut, Menu, Settings, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Card from './Card';

const pageTitles = {
    '/': 'Dashboard',
    '/diabetes': 'Diabetes Check',
    '/chat': 'AI Doctor',
    '/predict': 'Symptom Checker',
    '/prescription': 'Prescriptions',
    '/health': 'Health Records',
    '/hospitals': 'Hospitals',
    '/emergency': 'Emergency SOS',
    '/profile': 'Profile',
};

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Navbar({ onMenuClick }) {
    const { currentLanguage, changeLanguage, languages } = useLanguage();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [langOpen, setLangOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const langRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const closeDropdowns = (event) => {
            if (langRef.current && !langRef.current.contains(event.target)) setLangOpen(false);
            if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', closeDropdowns);
        return () => document.removeEventListener('mousedown', closeDropdowns);
    }, []);

    const title = pageTitles[location.pathname] || 'SehatSaathi';
    const firstName = user?.name?.split(' ')[0] || 'User';

    return (
        <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl px-4 md:px-6 shadow-xl shadow-zinc-200/30">
            <div className="h-16 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={onMenuClick}
                        className="md:hidden p-2 rounded-lg text-zinc-500 hover:bg-white ring-1 ring-zinc-200/70 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <Menu size={18} />
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 truncate">{title}</h2>
                        <p className="text-xs text-zinc-500 hidden sm:block">
                            {getGreeting()}, {firstName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div ref={langRef} className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setLangOpen((prev) => !prev);
                                setProfileOpen(false);
                            }}
                            className="flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-xl px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200/70 hover:bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <Globe size={15} />
                            <span className="hidden sm:inline">{currentLanguage.flag}</span>
                            <ChevronDown size={14} />
                        </button>
                        {langOpen && (
                            <Card className="absolute right-0 mt-2 w-56 p-1 z-50">
                                {languages.map((language) => (
                                    <button
                                        key={language.code}
                                        type="button"
                                        onClick={() => {
                                            changeLanguage(language.code);
                                            setLangOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-300 ease-out ${
                                            language.code === currentLanguage.code
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-zinc-700 hover:bg-zinc-50'
                                        }`}
                                    >
                                        <span>{language.flag}</span>
                                        <span>{language.nativeName}</span>
                                    </button>
                                ))}
                            </Card>
                        )}
                    </div>

                    <button
                        type="button"
                        className="relative p-2 rounded-lg bg-white/90 backdrop-blur-xl text-zinc-500 ring-1 ring-zinc-200/70 hover:bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <Bell size={16} />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
                    </button>

                    <div ref={profileRef} className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setProfileOpen((prev) => !prev);
                                setLangOpen(false);
                            }}
                            className="flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-xl pl-2 pr-3 py-1.5 text-zinc-700 ring-1 ring-zinc-200/70 hover:bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-semibold grid place-items-center">
                                {firstName[0]?.toUpperCase()}
                            </div>
                            <ChevronDown size={14} />
                        </button>
                        {profileOpen && (
                            <Card className="absolute right-0 mt-2 w-60 p-2 z-50">
                                <div className="px-2 py-2 border-b border-zinc-200">
                                    <p className="text-sm font-semibold text-zinc-900">{user?.name || 'User'}</p>
                                    <p className="text-xs text-zinc-500">{user?.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigate('/profile');
                                        setProfileOpen(false);
                                    }}
                                    className="mt-1 w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                                >
                                    <User size={15} /> Profile
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigate('/profile');
                                        setProfileOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                                >
                                    <Settings size={15} /> Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        logout();
                                        setProfileOpen(false);
                                    }}
                                    className="mt-1 w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                >
                                    <LogOut size={15} /> Sign out
                                </button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}


