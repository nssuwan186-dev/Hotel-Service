
export const formatISODate = (d: Date | null): string => {
    if (!d) return '';
    return d.toISOString().split('T')[0];
};

const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];


export const formatThaiDate = (d: Date | null | string): string => {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d) : d;
    const yearBe = date.getFullYear() + 543;
    return `${date.getDate()} ${thaiMonthsShort[date.getMonth()]} ${String(yearBe).slice(-2)}`;
};
