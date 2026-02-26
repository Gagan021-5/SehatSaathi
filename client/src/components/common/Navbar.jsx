import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from '../language/LanguageSelector';

const routeMeta = {
    '/': { title: 'nav.dashboard', breadcrumb: 'navbar.breadcrumbs.workspace' },
    '/diabetes': { title: 'nav.predict', breadcrumb: 'navbar.breadcrumbs.screening' },
    '/chat': { title: 'nav.chat', breadcrumb: 'navbar.breadcrumbs.consultation' },
    '/prescription': { title: 'nav.prescription', breadcrumb: 'navbar.breadcrumbs.records' },
    '/health': { title: 'nav.health', breadcrumb: 'navbar.breadcrumbs.vitals' },
    '/hospitals': { title: 'nav.hospitals', breadcrumb: 'navbar.breadcrumbs.locator' },
    '/emergency': { title: 'nav.emergency', breadcrumb: 'navbar.breadcrumbs.rapidAccess' },
    '/first-aid': { title: 'nav.firstAid', breadcrumb: 'navbar.breadcrumbs.care' },
    '/medicines': { title: 'nav.medicines', breadcrumb: 'navbar.breadcrumbs.care' },
    '/rural-outreach': { title: 'nav.ruralOutreach', breadcrumb: 'navbar.breadcrumbs.community' },
    '/reports': { title: 'nav.reports', breadcrumb: 'navbar.breadcrumbs.records' },
    '/family-vault': { title: 'nav.familyVault', breadcrumb: 'navbar.breadcrumbs.records' },
    '/health-tools': { title: 'nav.healthTools', breadcrumb: 'navbar.breadcrumbs.utilities' },
    '/profile': { title: 'nav.profile', breadcrumb: 'navbar.breadcrumbs.account' },
};

function getRouteConfig(pathname) {
    if (routeMeta[pathname]) return routeMeta[pathname];
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
        <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
            <div className="flex h-20 items-center gap-4 px-4 md:px-8">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-900 md:hidden"
                    aria-label={t('navbar.openSidebar')}
                >
                    <Menu size={18} />
                </button>

                <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <span>{breadcrumb}</span>
                        <ChevronRight size={12} />
                        <span className="truncate">{title}</span>
                    </div>
                    <h2 className="truncate text-xl font-bold text-slate-900">{title}</h2>
                </div>

                <LanguageSelector className="ml-auto" />

                <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300"
                >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                        {userInitial}
                    </div>
                    <div className="hidden text-left sm:block">
                        <p className="max-w-[160px] truncate text-sm font-semibold text-slate-900">
                            {user?.name || t('nav.profile')}
                        </p>
                        <p className="max-w-[180px] truncate text-xs text-slate-500">
                            {user?.email || t('navbar.manageAccount')}
                        </p>
                    </div>
                </Link>
            </div>
        </header>
    );
}
