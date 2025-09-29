import { PayrollCalculationRow } from "../types";
import { sarabunBase64 } from "../assets/Sarabun-Regular-base64";

interface PdfData {
    periodTitle: string;
    rows: (PayrollCalculationRow & { totalIncome: number, netPay: number })[];
}

export const generatePayrollPDF = (data: PdfData) => {
    const { periodTitle, rows } = data;

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    doc.addFileToVFS("Sarabun-Regular.ttf", sarabunBase64);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun");

    doc.setFontSize(16);
    doc.text(periodTitle, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    const tableBody = rows.map((row, index) => {
        const monthlyRate = row.employmentType === 'monthly' ? row.baseRate.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-';
        const dailyRate = row.employmentType === 'daily' ? row.baseRate.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '-';
        const workDays = row.employmentType === 'daily' ? row.workDays || '-' : '-';

        return [
            index + 1,
            row.name,
            row.position,
            monthlyRate,
            row.otherIncome ? Number(row.otherIncome).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-',
            dailyRate,
            workDays,
            row.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            row.deductionSocialSecurity ? Number(row.deductionSocialSecurity).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-',
            row.deductionAbsence ? Number(row.deductionAbsence).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-',
            row.deductionOther ? Number(row.deductionOther).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-',
            row.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            `${row.accountInfo.bank} ${row.accountInfo.accountNumber}`
        ];
    });

    const totals = rows.reduce((acc, row) => {
        acc.totalIncome += row.totalIncome;
        acc.deductionSocialSecurity += Number(row.deductionSocialSecurity || 0);
        acc.deductionAbsence += Number(row.deductionAbsence || 0);
        acc.deductionOther += Number(row.deductionOther || 0);
        acc.netPay += row.netPay;
        acc.otherIncome += Number(row.otherIncome || 0);
        return acc;
    }, { totalIncome: 0, deductionSocialSecurity: 0, deductionAbsence: 0, deductionOther: 0, netPay: 0, otherIncome: 0 });

    const footer = [
        '', 'ยอดรวม', '', '',
        totals.otherIncome.toLocaleString('en-US', { minimumFractionDigits: 2 }), '', '',
        totals.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        totals.deductionSocialSecurity.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        totals.deductionAbsence.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        totals.deductionOther.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        totals.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        ''
    ];

    (doc as any).autoTable({
        startY: 20,
        head: [['ลำดับ', 'รายชื่อ', 'ตำแหน่ง', 'เงินเดือน', 'รายได้อื่น', 'ค่าจ้าง/วัน', 'วันทำงาน', 'รวมเงิน', 'หัก ปกส.', 'หักขาด/ลา', 'หักอื่นๆ', 'ยอดจ่ายจริง', 'เลขที่บัญชี']],
        body: tableBody,
        foot: [footer],
        theme: 'grid',
        styles: {
            font: "Sarabun",
            fontSize: 9,
            cellPadding: 1.5,
            lineWidth: 0.1,
            lineColor: '#444'
        },
        headStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#000', halign: 'center' },
        footStyles: { fontStyle: 'bold', fillColor: '#EAEAEA', textColor: '#000' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 8 }, // ลำดับ
            1: { cellWidth: 30 }, // รายชื่อ
            2: { cellWidth: 15 }, // ตำแหน่ง
            3: { halign: 'right', cellWidth: 15 }, // เงินเดือน
            4: { halign: 'right', cellWidth: 15 }, // รายได้อื่น
            5: { halign: 'center', cellWidth: 15 }, // ค่าจ้าง/วัน
            6: { halign: 'center', cellWidth: 12 }, // วันทำงาน
            7: { halign: 'right', cellWidth: 18, fontStyle: 'bold' }, // รวมเงิน
            8: { halign: 'right', cellWidth: 15 }, // ปกส
            9: { halign: 'right', cellWidth: 15 }, // ขาดลา
            10: { halign: 'right', cellWidth: 15 }, // อื่นๆ
            11: { halign: 'right', cellWidth: 18, fontStyle: 'bold' }, // ยอดจ่ายจริง
            12: { cellWidth: 35 }, // เลขที่บัญชี
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(10);
    doc.text('ลงชื่อ....................................................ผู้มีอำนาจ', 30, finalY);
    doc.text('( นางวิพัฒน์ กาลจักร )', 45, finalY + 5);

    doc.text('จัดทำโดย....................................................พนักงาน', 180, finalY);
    doc.text('( นายณัฐภัทร สุวรรณโส )', 190, finalY + 5);


    doc.save(`Payroll-${periodTitle}.pdf`);
};