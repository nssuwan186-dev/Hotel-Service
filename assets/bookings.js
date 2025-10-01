const Bookings = (() => {
  let base64Files = [];
  function getFiles(){ return base64Files; }
  function clearFiles(){ base64Files = []; }

  function handleFileSelection(e) {
    const preview = document.getElementById('file-preview');
    preview.innerHTML = '';
    clearFiles();
    const files = Array.from(e.target.files).slice(0,3);
    files.forEach(file=>{
      const reader = new FileReader();
      reader.onload = ev => {
        const b64 = ev.target.result.split(',')[1];
        base64Files.push({ name: file.name, type: file.type, data: b64 });
        const isImg = file.type.startsWith('image/');
        preview.innerHTML += isImg
          ? `<img src="${ev.target.result}" class="w-full h-24 object-cover rounded-md">`
          : `<div class="w-full h-24 bg-gray-700 rounded-md flex flex-col items-center justify-center p-2"><i class="fas fa-file text-cyan-400 text-2xl"></i><span class="text-xs text-center truncate w-full mt-2">${file.name}</span></div>`;
      };
      reader.readAsDataURL(file);
    });
  }

  function calculatePrice(){
    const checkInV = document.getElementById('checkInDate').value;
    const checkOutV = document.getElementById('checkOutDate').value;
    const roomNum = document.getElementById('roomNumber').value;
    const rooms = UI.getState().rooms || [];
    const selected = rooms.find(r => String(r.number)===String(roomNum));
    document.getElementById('roomType').value = selected ? selected.type : '';
    document.getElementById('pricePerNight').value = selected ? selected.price : '';

    if (!checkInV || !checkOutV || new Date(checkOutV)<=new Date(checkInV)){
      document.getElementById('numberOfNights').textContent = '0';
      document.getElementById('totalPrice').textContent = '0.00';
    }else{
      const diffDays = Math.ceil((new Date(checkOutV)-new Date(checkInV))/(1000*60*60*24));
      document.getElementById('numberOfNights').textContent = diffDays;
      const total = selected ? diffDays * parseFloat(selected.price) : 0;
      document.getElementById('totalPrice').textContent = Utils.toFixed2(total);
    }
    calculateBalance();
  }

  function calculateBalance(){
    const total = parseFloat(document.getElementById('totalPrice').textContent)||0;
    const cash = parseFloat(document.getElementById('cashAmount').value)||0;
    const transfer = parseFloat(document.getElementById('transferAmount').value)||0;
    const bal = total - (cash+transfer);
    const el = document.getElementById('balanceDue');
    el.textContent = Utils.toFixed2(bal);
    el.classList.toggle('text-red-400', bal>0);
    el.classList.toggle('text-green-400', bal<=0);
  }

  async function fetchRooms(){
    const data = await Utils.apiGet('getRooms');
    UI.setState('rooms', data);
    const sel = document.getElementById('roomNumber');
    if (sel){
      sel.innerHTML = '<option value="">-- เลือกห้อง --</option>';
      data.forEach(room=>{
        sel.innerHTML += `<option value="${room.number}">${room.number} (${room.type}) - ${room.price} บาท</option>`;
      });
    }
  }

  function validateBookingForm(){
    const name = document.getElementById('guestName').value.trim();
    const idcard = document.getElementById('guestIdCard').value.trim();
    const checkIn = document.getElementById('checkInDate').value;
    const checkOut = document.getElementById('checkOutDate').value;
    const room = document.getElementById('roomNumber').value;
    const priceNight = parseFloat(document.getElementById('pricePerNight').value||0);
    const total = parseFloat(document.getElementById('totalPrice').textContent||0);
    const cash = parseFloat(document.getElementById('cashAmount').value||0);
    const transfer = parseFloat(document.getElementById('transferAmount').value||0);

    if (!name) return { ok:false, msg:'กรุณากรอกชื่อผู้เข้าพัก' };
    if (idcard && !Utils.isThaiIdValid(idcard)) return { ok:false, msg:'เลขบัตรประชาชนไม่ถูกต้อง' };
    if (!checkIn || !checkOut) return { ok:false, msg:'กรุณาเลือกวันที่เช็คอิน/เช็คเอาท์' };
    if (new Date(checkOut)<=new Date(checkIn)) return { ok:false, msg:'วันที่เช็คเอาท์ต้องมากกว่าวันที่เช็คอิน' };
    if (!room) return { ok:false, msg:'กรุณาเลือกห้อง' };
    if (priceNight<=0 || total<=0) return { ok:false, msg:'ราคาห้องไม่ถูกต้อง' };
    if (cash<0 || transfer<0) return { ok:false, msg:'ยอดชำระต้องไม่ติดลบ' };
    return { ok:true };
  }

  async function submitBooking(){
    const v = validateBookingForm();
    if (!v.ok) throw new Error(v.msg);
    
    const params = {
      action: 'addBooking',
      timestamp: new Date().toISOString(),
      guestName: document.getElementById('guestName').value.trim(),
      guestIdCard: document.getElementById('guestIdCard').value.trim(),
      guestAddress: document.getElementById('guestAddress').value.trim(),
      checkInDate: document.getElementById('checkInDate').value,
      checkOutDate: document.getElementById('checkOutDate').value,
      roomNumber: document.getElementById('roomNumber').value,
      roomType: document.getElementById('roomType').value,
      pricePerNight: document.getElementById('pricePerNight').value,
      numberOfNights: document.getElementById('numberOfNights').textContent,
      totalPrice: document.getElementById('totalPrice').textContent,
      cashAmount: document.getElementById('cashAmount').value || '0',
      transferAmount: document.getElementById('transferAmount').value || '0',
      numberOfGuests: document.getElementById('numberOfGuests').value,
      remarks: document.getElementById('remarks').value,
      files: JSON.stringify(base64Files),
    };

    return Utils.apiPost(params);
  }

  async function submitExtend(){
    const payload = {
      action:'extendStay',
      rowNumber: document.getElementById('extend-row-number').value,
      newCheckOutDate: document.getElementById('extendCheckOutDate').value
    };
    // Basic validation
    if (!payload.rowNumber || !payload.newCheckOutDate) {
      throw new Error('ข้อมูลไม่ครบถ้วน');
    }
    return Utils.apiPost(payload);
  }

  return { getFiles, clearFiles, handleFileSelection, calculatePrice, calculateBalance, fetchRooms, submitBooking, submitExtend };
})();
