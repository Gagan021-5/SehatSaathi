import { useLanguage } from '../../context/LanguageContext';

function joinClasses(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function AppLogo({
    className = '',
    iconClassName = 'h-10 w-10',
    nameClassName = 'text-base font-bold text-slate-900 leading-tight',
    taglineClassName = 'text-[10px] font-bold uppercase tracking-widest text-blue-600/80',
    showTagline = false,
    tagline,
}) {
    const { t } = useLanguage();
    const taglineText = tagline ?? t('app.tagline');

    return (
        <div className={joinClasses('inline-flex items-center gap-3', className)}>
            <img
                src="/ShayakSaarthi.jpeg"
                alt={t('app.name')}
                className={joinClasses(
                    'rounded-xl object-cover shadow-lg ring-1 ring-white/50',
                    iconClassName
                )}
            />
            <div className="text-left">
                <p className={nameClassName}>{t('app.name')}</p>
                {showTagline ? <p className={taglineClassName}>{taglineText}</p> : null}
            </div>
        </div>
    );
}
