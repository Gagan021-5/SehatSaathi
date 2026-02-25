import { AlertTriangle } from 'lucide-react';

export default function ServiceOfflineBanner({ message = 'Service is temporarily offline. Please try again shortly.' }) {
    return (
        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50/95 to-red-50/90 px-4 py-3 text-rose-800 shadow-[0_14px_30px_rgba(244,63,94,0.14)] backdrop-blur-xl flex items-start gap-2.5 transition-all duration-300 ease-out">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{message}</p>
        </div>
    );
}
