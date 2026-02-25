import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDate(value) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString();
}

export function generateHealthReportPdf({ profile, vitals, medications }) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const generatedOn = new Date();
    const generatedOnText = generatedOn.toLocaleDateString();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFillColor(20, 184, 166);
    doc.circle(16, 18, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('SehatSaathi Health Report', 26, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Patient: ${profile?.name || 'Unknown'}`, 14, 30);
    doc.text(`Date: ${generatedOnText}`, 150, 30);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`Age: ${profile?.age || '--'}   Blood Group: ${profile?.bloodGroup || '--'}`, 14, 48);
    doc.text(`Email: ${profile?.email || '--'}`, 14, 54);

    autoTable(doc, {
        startY: 62,
        head: [['Date', 'Vital', 'Value', 'Status']],
        body: (vitals || []).map((item) => [formatDate(item.date), item.type || '--', item.value || '--', item.status || '--']),
        theme: 'striped',
        styles: {
            fontSize: 9,
            textColor: [30, 41, 59],
            lineColor: [226, 232, 240],
            lineWidth: 0.15,
        },
        headStyles: {
            fillColor: [30, 64, 175],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
    });

    const medsStartY = (doc.lastAutoTable?.finalY || 95) + 10;
    autoTable(doc, {
        startY: medsStartY,
        head: [['Medicine', 'Dosage', 'Times', 'Stock']],
        body: (medications || []).map((item) => [
            item.medicineName || '--',
            item.dosage || '--',
            Array.isArray(item.times) ? item.times.join(', ') : '--',
            `${item.stockRemaining ?? '--'}`,
        ]),
        theme: 'striped',
        styles: {
            fontSize: 9,
            textColor: [30, 41, 59],
            lineColor: [226, 232, 240],
            lineWidth: 0.15,
        },
        headStyles: {
            fillColor: [13, 148, 136],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
    });

    const footerY = 286;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, footerY - 4, 196, footerY - 4);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated securely by SehatSaathi — Not a medical diagnostic document.', 14, footerY);

    const safeName = `${profile?.name || 'patient'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`sehatsaathi-report-${safeName}-${generatedOn.toISOString().slice(0, 10)}.pdf`);
}
