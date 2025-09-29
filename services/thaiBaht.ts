
// Function to convert number to Thai Baht text format
export function ThaiBaht(number: number): string {
    const txtNumArr = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ'];
    const txtDigitArr = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    let bahtTxt = '';
    
    if (isNaN(number)) {
        return "NaN";
    }
    if (number === 0) {
        return "ศูนย์บาทถ้วน";
    }

    const sNumber = number.toFixed(2).toString().split('.');
    let sInt = sNumber[0];
    const sSatang = sNumber[1];
    
    if (sInt.length > 12) {
        return "ข้อมูลเกินขอบเขต";
    }

    sInt = sInt.split('').reverse().join(''); // Reverse string
    
    for (let i = 0; i < sInt.length; i++) {
        const digit = parseInt(sInt[i], 10);
        const position = i % 6;
        let value = '';

        if (digit !== 0) {
            if (position === 0 && i > 0) { // หลักล้าน
                value = 'ล้าน';
            } else {
                value = txtDigitArr[position];
            }

            if (digit === 1 && position === 1) { // สิบ
                // No number needed, just "สิบ"
            } else if (digit === 1 && position === 0 && sInt.length > 1 && sInt[i+1] !== '0') { // หนึ่ง in units place
                value = 'เอ็ด' + value;
            } else if (digit === 2 && position === 1) { // ยี่สิบ
                value = 'ยี่' + value;
            } else {
                value = txtNumArr[digit] + value;
            }
        }
        bahtTxt = value + bahtTxt;
    }

    if (sSatang === '00') {
        bahtTxt += 'บาทถ้วน';
    } else {
        bahtTxt += 'บาท';
        let sSatangRev = sSatang.split('').reverse().join('');
        let satangTxt = '';
        for (let i = 0; i < sSatangRev.length; i++) {
            const digit = parseInt(sSatangRev[i], 10);
            let value = '';
            if (digit !== 0) {
                if (digit === 1 && i === 1) {
                    // "สิบ"
                } else if (digit === 1 && i === 0 && sSatangRev[1] !== '0') {
                    value = 'เอ็ด';
                } else if (digit === 2 && i === 1) {
                    value = 'ยี่';
                } else {
                    value = txtNumArr[digit];
                }

                if (i === 1) {
                    value += 'สิบ';
                }
            }
            satangTxt = value + satangTxt;
        }
        bahtTxt += satangTxt + 'สตางค์';
    }

    return bahtTxt;
}
