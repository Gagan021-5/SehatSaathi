import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from '../language/LanguageSelector';

const routeMeta = {
    '/': { title: 'nav.dashboard', breadcrumb: 'navbar.breadcrumbs.workspace' },
    '/diabetes': { title: 'nav.predict', breadcrumb: 'navbar.breadcrumbs.screening' },
    '/chat': { title: 'nav.chat', breadcrumb: 'navbar.breadcrumbs.consultation' },
    // ... rest of your routeMeta
};

function getRouteConfig(pathname) {
    const root = `/${pathname.split('/')[1] || ''}`;
    return routeMeta[root] || routeMeta['/'];
}

export default function Navbar({ onMenuClick }) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const location = useLocation();

    const route = useMemo(() => getRouteConfig(location.pathname), [location.pathname]);
    const title = t(route.title) || route.title;
    const breadcrumb = t(route.breadcrumb) || route.breadcrumb;
    const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-40 w-full transition-all duration-300 md:top-4 md:px-6">
            <div className="mx-auto max-w-7xl">
                <div className="flex h-16 items-center gap-3 border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl md:h-20 md:rounded-[2.5rem] md:border md:px-8 md:shadow-2xl md:shadow-slate-200/40">

                    {/* Mobile Menu Trigger - Modernized */}
                    <button
                        type="button"
                        onClick={onMenuClick}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-all active:scale-95 md:hidden"
                    >
                        <Menu size={20} strokeWidth={2.5} />
                    </button>

                    {/* Dynamic Title Area */}
                    <div className="flex flex-col justify-center min-w-0">
                        <span className="hidden text-[10px] font-bold uppercase tracking-widest text-indigo-500 md:block">
                            {breadcrumb}
                        </span>
                        <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900 md:text-2xl">
                            {title}
                        </h2>
                    </div>

                    {/* Right Side Actions */}
                    <div className="ml-auto flex items-center gap-2 md:gap-4">
                        <div className="scale-90 md:scale-100">
                            <LanguageSelector />
                        </div>

                        <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block" />

                        {/* Profile Link - Refined for Mobile */}
                        <Link
                            to="/profile"
                            className="group flex items-center gap-2 rounded-full p-1 transition-all hover:bg-slate-50 md:rounded-2xl md:bg-slate-50 md:pr-4"
                        >
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-transform group-hover:scale-105 md:h-10 md:w-10 md:rounded-xl overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    userInitial
                                )}
                                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 md:h-3 md:w-3" />
                            </div>

                            {/* Desktop Profile Info */}
                            <div className="hidden text-left md:block">
                                <p className="max-w-[120px] truncate text-xs font-bold text-slate-900">
                                    {user?.name || t('nav.profile')}
                                </p>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">
                                    {t('navbar.manageAccount')}
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}