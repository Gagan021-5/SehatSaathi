export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
    return (
        <Tag
            className={`rounded-[1.75rem] border border-white/65 bg-white/72 backdrop-blur-2xl ring-1 ring-slate-900/[0.02] shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_64px_rgba(59,130,246,0.14)] ${className}`}
            {...props}
        >
            {children}
        </Tag>
    );
}

