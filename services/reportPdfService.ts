
import { AdminBooking } from "../types";
import { sarabunBase64 } from "../assets/Sarabun-Regular-base64";

interface ReportPdfData {
    periodTitle: string;
    reportData: (AdminBooking & { duration: number })[];
    totals: any;
}

const generateReportBase = (title: string, data: ReportPdfData, head: any[], bodyTransform: (row: any, index: number) => any[], footerTransform: (totals: any) => any[], columnStyles: any) => {
    const { periodTitle, reportData, totals } = data;

    const doc = new jspdf.jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    doc.addFileToVFS("Sarabun-Regular.ttf", sarabunBase64);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun");

    doc.setFontSize(14);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text("เจ้าของ/เจ้าสำนักโรงแรม วิพัฒน์โฮเทลดีเวลลอปเม้นท์จำกัด", doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });
    doc.text(periodTitle, doc.internal.pageSize.getWidth() / 2, 23, { align: 'center' });
    
    const tableBody = reportData.map(bodyTransform);

    (doc as any).autoTable({
        startY: 30,
        head: [head],
        body: tableBody,
        foot: [footerTransform(totals)],
        theme: 'grid',
        styles: {
            font: "Sarabun",
            fontSize: 9,
            cellPadding: 1.5,
            lineWidth: 0.1,
            lineColor: '#333'
        },
        headStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#000', halign: 'center' },
        footStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#000' },
        columnStyles
    });
    
    doc.save(`${title.split(" ")[0]}-Report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generatePAOReportPDF = (data: ReportPdfData) => {
    generateReportBase(
        "บัญชีผู้เข้าพักและรายละเอียดในการเรียกเก็บค่าธรรมเนียมบำรุงองค์การบริหารส่วนจังหวัด",
        data,
        ['ที่', 'ชื่อ-สกุล', 'วันเวลาที่เข้าพัก', 'รวมจำนวนวัน', 'ราคาห้องพัก (บาท)', 'รวมค่าเช่า (บาท)', 'ค่าธรรมเนียม (บาท)'],
        (b, index) => [
            index + 1,
            b.guest?.fullName || '-',
            new Date(b.checkIn).toLocaleDateString('th-TH'),
            b.duration,
            (b.room?.price || 0).toFixed(2),
            b.totalAmount.toFixed(2),
            b.feeAmount.toFixed(2)
        ],
        (totals) => ['', '', '', '', 'รวมทั้งสิ้น', totals.totalAmount.toFixed(2), totals.feeAmount.toFixed(2)],
        {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 50 },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
        }
    );
};

export const generateMunicipalityReportPDF = (data: ReportPdfData) => {
     generateReportBase(
        "บัญชีผู้เข้าพักสำหรับแจ้งเทศบาล",
        data,
        ['ที่', 'ชื่อ-สกุล', 'วันเวลาที่เข้าพัก', 'รวมจำนวนวัน', 'ราคาห้องพัก (บาท)', 'รวมค่าเช่า (บาท)'],
        (b, index) => [
            index + 1,
            b.guest?.fullName || '-',
            new Date(b.checkIn).toLocaleDateString('th-TH'),
            b.duration,
            (b.room?.price || 0).toFixed(2),
            b.totalAmount.toFixed(2)
        ],
        (totals) => ['', '', '', '', 'รวมทั้งสิ้น', totals.totalAmount.toFixed(2)],
        {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 60 },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
        }
    );
};
