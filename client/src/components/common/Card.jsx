export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
    return (
        <Tag
            className={`rounded-2xl bg-white/80 backdrop-blur-xl border border-zinc-200/60 shadow-xl shadow-zinc-200/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/10 ${className}`}
            {...props}
        >
            {children}
        </Tag>
    );
}

