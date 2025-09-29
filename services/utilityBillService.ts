import { Tenant, UtilityRates, MeterReading } from "../types";
import { sarabunBase64 } from "../assets/Sarabun-Regular-base64";
import { thaiMonthsFull } from './utils';

interface BillData {
    tenant: Tenant;
    utilityRates: UtilityRates;
    year: number;
    month: number; // 0-11
    currentReading: MeterReading;
    prevReading: MeterReading | undefined;
}

export const generateUtilityBillPDF = (data: BillData) => {
    const { tenant, utilityRates, year, month, currentReading, prevReading } = data;

    // FIX: The jsPDF constructor is available globally from a script tag.
    // It is accessed via `jspdf.jsPDF`.
    const doc = new jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    doc.addFileToVFS("Sarabun-Regular.ttf", sarabunBase64);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun");

    const waterPrev = prevReading?.water ?? 0;
    const elecPrev = prevReading?.electricity ?? 0;
    const waterCurr = currentReading.water ?? 0;
    const elecCurr = currentReading.electricity ?? 0;

    const waterUnits = waterCurr - waterPrev;
    const elecUnits = elecCurr - elecPrev;

    const waterCost = waterUnits * utilityRates.waterPerUnit;
    const elecCost = elecUnits * utilityRates.electricityPerUnit;
    const totalCost = tenant.rent + waterCost + elecCost;

    const drawBill = (yOffset: number) => {
        doc.setFontSize(14);
        doc.setFont("Sarabun", "normal");

        doc.rect(10, yOffset, 190, 135); // Outer box
        doc.text('ใบแจ้งค่าใช้จ่าย', 105, yOffset + 10, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`ชื่อ-สกุล ${tenant.name} ห้อง ${tenant.roomNumber}`, 15, yOffset + 20);
        doc.text(`ประจำเดือน ${thaiMonthsFull[month]} ${year + 543}`, 15, yOffset + 25);

        (doc as any).autoTable({
            startY: yOffset + 28,
            head: [['รายการ', 'มิเตอร์ครั้งก่อน', 'มิเตอร์ครั้งใหม่', 'รวมหน่วย', 'หน่วยละ', 'รวม']],
            body: [
                ['ค่าห้องพัก', '-', '-', '-', '-', tenant.rent.toFixed(2)],
                ['ค่าน้ำ', waterPrev.toString(), waterCurr.toString(), waterUnits.toString(), utilityRates.waterPerUnit.toFixed(2), waterCost.toFixed(2)],
                ['ค่าไฟ', elecPrev.toString(), elecCurr.toString(), elecUnits.toString(), utilityRates.electricityPerUnit.toFixed(2), elecCost.toFixed(2)],
            ],
            foot: [['รวม', '', '', '', '', totalCost.toFixed(2)]],
            theme: 'grid',
            margin: { left: 15, right: 15 },
            tableWidth: 180,
            styles: {
                font: "Sarabun",
                fontSize: 10,
                cellPadding: 2,
                lineWidth: 0.1,
                lineColor: '#000'
            },
            headStyles: { fillColor: '#F0F0F0', textColor: '#000', fontStyle: 'bold' },
            footStyles: { fillColor: '#F0F0F0', textColor: '#000', fontStyle: 'bold' },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'right' },
            }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY;
        
        doc.setFontSize(9);
        doc.text('**กรุณาจ่ายเงินก่อนวันที่ 5 ของเดือน**', 105, finalY + 10, { align: 'center'});
        doc.text('ชำระช้าปรับวันละ 50 บาท', 105, finalY + 15, { align: 'center'});
        doc.text('**จ่ายเงินได้ที่ออฟฟิตหน้าโรงแรม**', 105, finalY + 20, { align: 'center'});
        doc.text('ติดต่อสอบถาม โทร 080-6254859,042-492641', 105, finalY + 25, { align: 'center' });
    };
    
    drawBill(10); // First bill
    drawBill(150); // Second bill on the same page

    doc.save(`UtilityBill-${tenant.roomNumber}-${thaiMonthsFull[month]}.pdf`);
};