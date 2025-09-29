import { AdminBooking } from "../types";
import { sarabunBase64 } from "../assets/Sarabun-Regular-base64";
import { logoBase64 } from "../assets/logo";
import { ThaiBaht } from './thaiBaht';

export const generateInvoicePDF = (booking: AdminBooking) => {
    if (!booking.guest || !booking.room) {
        console.error("Booking data is incomplete for PDF generation.");
        return;
    }

    // FIX: The jsPDF constructor is available globally from a script tag.
    // The incorrect destructuring from the window object has been removed.
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    // Add Sarabun font
    doc.addFileToVFS("Sarabun-Regular.ttf", sarabunBase64);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun");

    const drawReceipt = (xOffset: number, type: 'ต้นฉบับ' | 'สำเนา') => {
        // --- Header ---
        doc.addImage(logoBase64, 'PNG', xOffset + 10, 10, 30, 15);
        doc.setFontSize(14);
        doc.setFont("Sarabun", "normal");
        doc.text("บริษัท วิพัฒน์โฮเทล.ดีเวลอปเมนท์ จำกัด", xOffset + 45, 15);
        doc.setFontSize(9);
        doc.text("(สำนักงานใหญ่)", xOffset + 45, 20);
        doc.text("426 หมู่ที่9 ตำบลบึงกาฬ อำเภอเมืองบึงกาฬ จังหวัดบึงกาฬ 38000", xOffset + 45, 25);
        doc.text("โทร 080-6254859,042-492641", xOffset + 45, 30);
        doc.text("เลขประจำตัวผู้เสียภาษีอากร 0-3855-59000-07-5", xOffset + 45, 35);
        
        doc.setFontSize(12);
        doc.text("ใบเสร็จรับเงิน / ใบกำกับภาษี", xOffset + 100, 15, { align: 'left' });
        doc.setFontSize(9);
        doc.text(type, xOffset + 130, 10, { align: 'right' });


        // --- Invoice Details ---
        const detailsX = xOffset + 100;
        doc.text(`เลขที่เอกสาร`, detailsX, 22);
        doc.text(`วันที่`, detailsX, 27);
        doc.text(`ชำระเงินโดย`, detailsX, 32);
        
        doc.text(`: ${booking.id}`, detailsX + 15, 22);
        doc.text(`: ${new Date(booking.checkOut).toLocaleDateString('th-TH')}`, detailsX + 15, 27);
        doc.text(`: ${booking.paymentMethod}`, detailsX + 15, 32);
        
        // --- Customer Details ---
        doc.setLineWidth(0.2);
        doc.line(xOffset + 10, 40, xOffset + 138, 40);
        doc.setFontSize(10);
        doc.text("ชื่อลูกค้า", xOffset + 12, 45);
        doc.text(booking.guest.fullName, xOffset + 25, 45);
        doc.text(booking.guest.phoneNumber || '-', xOffset + 25, 50);
        doc.line(xOffset + 10, 55, xOffset + 138, 55);

        // --- Table ---
        const checkInDate = new Date(booking.checkIn).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const duration = Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)));

        const tableBody = [
            [
                '1',
                `ค่าห้องพัก ${booking.room.roomNumber} (${checkInDate} - ${checkOutDate})`,
                `${duration} คืน`,
                booking.totalAmount.toFixed(2)
            ]
        ];
        
        (doc as any).autoTable({
            startY: 58,
            head: [['No.', 'รายการ', 'ระยะเวลา', 'ราคารวม']],
            body: tableBody,
            theme: 'plain',
            margin: { left: xOffset + 10 },
            tableWidth: 128,
            styles: {
                font: "Sarabun",
                fontSize: 10,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: '#E0EFFF',
                textColor: '#000000',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'left', cellWidth: 70 },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'right' }
            }
        });

        // --- Totals ---
        const totalAmount = booking.totalAmount;
        const priceBeforeVat = totalAmount / 1.07;
        const vatAmount = totalAmount - priceBeforeVat;
        const finalY = (doc as any).lastAutoTable.finalY + 5;

        doc.setFontSize(10);
        const totalTextX = xOffset + 100;
        doc.text("รวมเป็นเงิน", totalTextX, finalY);
        doc.text(`${totalAmount.toFixed(2)}`, xOffset + 138, finalY, { align: 'right' });
        doc.text("ภาษีมูลค่าเพิ่ม 7%", totalTextX, finalY + 5);
        doc.text(`${vatAmount.toFixed(2)}`, xOffset + 138, finalY + 5, { align: 'right' });
        doc.text("ราคาไม่รวมภาษีมูลค่าเพิ่ม", totalTextX, finalY + 10);
        doc.text(`${priceBeforeVat.toFixed(2)}`, xOffset + 138, finalY + 10, { align: 'right' });

        doc.setLineWidth(0.5);
        doc.line(xOffset + 98, finalY + 13, xOffset + 138, finalY + 13);
        
        doc.setFont("Sarabun", "normal");
        doc.text("จำนวนเงินรวมทั้งสิ้น", totalTextX, finalY + 18);
        doc.text(`${totalAmount.toFixed(2)}`, xOffset + 138, finalY + 18, { align: 'right' });
        doc.line(xOffset + 98, finalY + 20, xOffset + 138, finalY + 20);
        doc.line(xOffset + 98, finalY + 21, xOffset + 138, finalY + 21);


        // --- Total in words ---
        doc.text(`(${ThaiBaht(totalAmount)})`, xOffset + 15, finalY + 18);

        // --- Footer ---
        const footerY = 130;
        doc.text("...........................................................", xOffset + 15, footerY);
        doc.text("ผู้จ่ายเงิน", xOffset + 30, footerY + 5);
        doc.text("วันที่", xOffset + 33, footerY + 10);

        doc.text("...........................................................", xOffset + 85, footerY);
        doc.text("ผู้รับเงิน", xOffset + 102, footerY + 5);
        doc.text("วันที่", xOffset + 105, footerY + 10);
    }
    
    drawReceipt(0, 'ต้นฉบับ');
    
    // Vertical separator
    doc.setDashPattern([2, 1]);
    doc.line(148.5, 5, 148.5, 205);
    doc.setDashPattern([]);

    drawReceipt(148.5, 'สำเนา');

    doc.save(`Invoice-${booking.id}.pdf`);
};