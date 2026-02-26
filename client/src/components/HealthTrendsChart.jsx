import { useEffect, useMemo, useState } from 'react';
import { Activity, LineChart as LineChartIcon } from 'lucide-react';
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Card from './common/Card';

function toDateKey(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseVitalValue(rawValue, type) {
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) return rawValue;
    if (rawValue == null) return null;

    const value = String(rawValue).trim();
    if (!value) return null;

    if (type === 'blood_pressure' && value.includes('/')) {
        const systolic = Number(value.split('/')[0]);
        return Number.isFinite(systolic) ? systolic : null;
    }

    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
}

function formatXAxisDate(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTooltipDate(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatRecordsForTrends(records, vitalTypes) {
    const allowedTypes = new Set(vitalTypes.map((vital) => vital.type));
    const sorted = [...records].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
    const grouped = new Map();

    for (const record of sorted) {
        if (!record || !allowedTypes.has(record.type)) continue;
        const dateKey = toDateKey(record.createdAt || record.updatedAt || Date.now());
        if (!dateKey) continue;

        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, { date: dateKey });
        }

        const numericValue = parseVitalValue(record.value, record.type);
        if (numericValue == null) continue;
        grouped.get(dateKey)[record.type] = numericValue;
    }

    return [...grouped.values()].sort((left, right) => new Date(left.date) - new Date(right.date));
}

function computeAxisDomain(chartData, activeVitals) {
    const values = [];
    for (const row of chartData) {
        for (const vital of activeVitals) {
            const value = row[vital.type];
            if (typeof value === 'number' && Number.isFinite(value)) values.push(value);
        }
    }

    if (values.length === 0) return [0, 1];

    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
        const padding = Math.max(1, Math.abs(min) * 0.05);
        return [min - padding, max + padding];
    }

    const spread = max - min;
    const padding = Math.max(spread * 0.15, 1);
    return [Math.max(0, min - padding), max + padding];
}

function PremiumTooltip({ active, payload, vitalMap }) {
    if (!active || !payload || payload.length === 0) return null;

    const rows = payload
        .filter((entry) => typeof entry.value === 'number' && Number.isFinite(entry.value))
        .map((entry) => vitalMap.get(entry.dataKey))
        .filter(Boolean);

    if (rows.length === 0) return null;

    const dateLabel = payload?.[0]?.payload?.date;

    return (
        <div className="rounded-2xl border border-white/40 bg-white/75 p-3 shadow-2xl backdrop-blur-xl">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                {dateLabel ? formatTooltipDate(dateLabel) : 'Trend'}
            </p>
            <div className="space-y-1.5">
                {rows.map((vital) => {
                    const value = payload?.[0]?.payload?.[vital.type];
                    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
                    return (
                        <div key={vital.type} className="flex items-center justify-between gap-4 text-sm">
                            <span className="inline-flex items-center gap-2 font-semibold text-zinc-700">
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: vital.stroke }}
                                />
                                {vital.label}
                            </span>
                            <span className="font-black text-zinc-900">
                                {value} {vital.unit}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EmptyTrendsState() {
    return (
        <div className="rounded-2xl border border-dashed border-white/50 bg-white/40 p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-blue-600 shadow-sm">
                <LineChartIcon size={22} />
            </div>
            <p className="text-base font-black text-zinc-800">Need more data for trends</p>
            <p className="mt-1 text-sm font-medium text-zinc-500">
                Add at least two dated readings to unlock your multi-day vital trajectory.
            </p>
        </div>
    );
}

export default function HealthTrendsChart({ records = [], vitalTypes = [] }) {
    const chartData = useMemo(() => formatRecordsForTrends(records, vitalTypes), [records, vitalTypes]);
    const [visibleTypes, setVisibleTypes] = useState(() => new Set(vitalTypes.map((vital) => vital.type)));

    useEffect(() => {
        setVisibleTypes(new Set(vitalTypes.map((vital) => vital.type)));
    }, [vitalTypes]);

    const activeVitals = useMemo(
        () => vitalTypes.filter((vital) => visibleTypes.has(vital.type)),
        [vitalTypes, visibleTypes]
    );

    const leftVitals = useMemo(
        () => activeVitals.filter((vital) => vital.axis === 'left'),
        [activeVitals]
    );
    const rightVitals = useMemo(
        () => activeVitals.filter((vital) => vital.axis === 'right'),
        [activeVitals]
    );

    const leftDomain = useMemo(
        () => computeAxisDomain(chartData, leftVitals),
        [chartData, leftVitals]
    );
    const rightDomain = useMemo(
        () => computeAxisDomain(chartData, rightVitals),
        [chartData, rightVitals]
    );

    const vitalMap = useMemo(
        () => new Map(vitalTypes.map((vital) => [vital.type, vital])),
        [vitalTypes]
    );

    const toggleTypeVisibility = (type) => {
        setVisibleTypes((previous) => {
            const next = new Set(previous);
            if (next.has(type)) {
                if (next.size === 1) return next;
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    };

    if (chartData.length <= 1) {
        return (
            <Card className="overflow-hidden border border-white/20 bg-gradient-to-br from-blue-100/45 to-teal-100/30 p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-xl bg-white/70 p-2 text-blue-600 shadow-sm">
                        <Activity size={17} />
                    </div>
                    <p className="text-lg font-black text-zinc-900">Vital Trends Dashboard</p>
                </div>
                <EmptyTrendsState />
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border border-white/20 bg-gradient-to-br from-blue-100/45 to-teal-100/30 p-6 backdrop-blur-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-white/70 p-2 text-blue-600 shadow-sm">
                        <Activity size={17} />
                    </div>
                    <p className="text-lg font-black text-zinc-900">Vital Trends Dashboard</p>
                </div>
                <p className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                    Click a vital to focus
                </p>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {vitalTypes.map((vital) => {
                    const active = visibleTypes.has(vital.type);
                    return (
                        <button
                            key={vital.type}
                            type="button"
                            onClick={() => toggleTypeVisibility(vital.type)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                                active
                                    ? 'border-white/80 bg-white/80 text-zinc-900 shadow-sm'
                                    : 'border-white/40 bg-white/35 text-zinc-500'
                            }`}
                        >
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: vital.stroke }} />
                            {vital.label}
                        </button>
                    );
                })}
            </div>

            <div className="h-[330px] rounded-2xl border border-white/45 bg-white/35 p-3 backdrop-blur-xl">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatXAxisDate}
                            stroke="#64748b"
                            tick={{ fontSize: 12, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            domain={leftDomain}
                            hide={leftVitals.length === 0}
                            stroke="#64748b"
                            tick={{ fontSize: 12, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            width={52}
                        />
                        <YAxis
                            yAxisId="right"
                            domain={rightDomain}
                            hide={rightVitals.length === 0}
                            orientation="right"
                            stroke="#64748b"
                            tick={{ fontSize: 12, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            width={52}
                        />
                        <Tooltip
                            content={<PremiumTooltip vitalMap={vitalMap} />}
                            cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                        />
                        {activeVitals.map((vital) => (
                            <Line
                                key={vital.type}
                                yAxisId={vital.axis}
                                type="monotone"
                                dataKey={vital.type}
                                stroke={vital.stroke}
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: vital.stroke }}
                                connectNulls
                                style={{
                                    filter: `drop-shadow(0 0 8px ${vital.stroke}66)`,
                                }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
