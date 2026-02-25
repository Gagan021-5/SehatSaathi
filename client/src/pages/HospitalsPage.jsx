import HospitalsMap from '../components/hospitals/HospitalsMap';
import PageTransition from '../components/common/PageTransition';
import Card from '../components/common/Card';

export default function HospitalsPage() {
    return (
        <PageTransition className="mx-auto max-w-7xl space-y-4">
            <Card className="p-6">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Nearby Hospital Finder</h1>
                <p className="text-sm text-zinc-500 leading-relaxed mt-1">
                    Discover nearby hospitals and pharmacies with map routing, call, and message actions.
                </p>
            </Card>
            <HospitalsMap />
        </PageTransition>
    );
}

