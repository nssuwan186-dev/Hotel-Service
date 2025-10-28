import { GoogleGenAI } from "@google/genai";

declare var marked: any;
declare var Chart: any;

// @ts-nocheck
const Utils = (() => {
  function qs(id) { return document.getElementById(id); }
  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }
  function debounce(fn, delay=300) { let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), delay); };}
  function toFixed2(n){ return (parseFloat(n)||0).toFixed(2); }

  function isThaiIdValid(id) {
    if (!id) return true; // optional
    if (!/^\d{13}$/.test(id)) return false;
    let sum=0; for(let i=0;i<12;i++) sum += parseInt(id[i])*(13-i);
    const check=(11-(sum%11))%10; return check===parseInt(id[12]);
  }

  async function safeFetch(url, options={}) {
    console.info(`[API] Requesting: ${url}`);
    try {
      const res = await fetch(url, options);
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text().catch(()=> '');
        const errorMsg = `HTTP ${res.status} ${res.statusText} | ${text.slice(0,200)}`;
        console.error(`[API] Failed fetch for ${url}`, { status: res.status, statusText: res.statusText, responseBody: text });
        throw new Error(errorMsg);
      }
      if (!ct.includes('application/json')) {
        const text = await res.text();
        const errorMsg = `Invalid content-type: ${ct} | Body: ${text.slice(0,200)}`;
        console.error(`[API] Invalid content-type for ${url}`, { contentType: ct, responseBody: text });
        throw new Error(errorMsg);
      }
      return await res.json();
    } catch (e) {
      console.error('[API] Network/Parse error:', e);
      // Re-throw with a user-friendly message, but the detailed error is logged above.
      throw new Error('ข้อผิดพลาดของเครือข่าย: ' + (e.message || 'ไม่ทราบสาเหตุ'));
    }
  }

  async function apiPost(payload) {
    const url = (window as any).CONFIG.SCRIPT_URL; // รวม token แล้ว
    const data = await safeFetch(url, {
      method: 'POST',
      body: new URLSearchParams(payload)
    });
    if (data.status !== 'success') throw new Error(data.message || 'Unknown error');
    return data.data || data.result || data;
  }

  async function apiGet(action) {
    const url = `${(window as any).CONFIG.SCRIPT_URL}&action=${encodeURIComponent(action)}`;
    const data = await safeFetch(url);
    if (data.status && data.status==='error') throw new Error(data.message || 'API error');
    return data.data || data.result || data;
  }

  function setLoading(btn, msgEl, msg) {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner !w-5 !h-5 !border-2"></div><span class="ml-2">${msg}</span>`;
    }
    if (msgEl) { msgEl.textContent = msg; msgEl.className = 'text-sm text-yellow-400'; }
  }
  function setSuccess(msgEl, msg){ if(msgEl){ msgEl.textContent = msg; msgEl.className='text-sm text-green-400'; } }
  function setError(btn, msgEl, error, originalText){
    console.error('Submission Error:', error);
    if(msgEl){ msgEl.textContent = `เกิดข้อผิดพลาด: ${error.message}`; msgEl.className='text-sm text-red-500'; }
    if(btn){ btn.disabled=false; btn.innerHTML = `<i class="fas fa-save mr-2"></i>${originalText}`; }
  }

  function setApiStatus(ok, text){
    const el = qs('api-status');
    const retryBtn = qs('api-retry-btn');
    if (!el || !retryBtn) return;
    
    el.textContent = text || (ok ? 'พร้อมใช้งาน' : 'ผิดพลาด');
    el.className = ok ? 'ml-1 text-green-400' : 'ml-1 text-red-400';

    if (ok) {
      retryBtn.classList.add('hidden');
    } else {
      retryBtn.classList.remove('hidden');
    }
  }

  function showConfigError(message) {
    const overlay = qs('config-error-overlay');
    const msgEl = qs('config-error-message');
    if (overlay && msgEl) {
      msgEl.innerHTML = message;
      show(overlay);
    }
  }

  return { qs, show, hide, debounce, toFixed2, isThaiIdValid, apiPost, apiGet, setLoading, setSuccess, setError, setApiStatus, showConfigError };
})();

const UI = (() => {
  const state = { rooms: [], activities: [], expenses: [], monthlyChart: null, roomTypeChart: null };

  function setState(key, val){ state[key]=val; }
  function getState(){ return state; }

  function showView(viewId){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    Utils.qs(viewId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn=>{
      btn.classList.remove('text-white','border-cyan-500','border-amber-500','border-green-500','border-indigo-500');
      btn.classList.add('border-transparent');
    });
    const activeBtn = Utils.qs(`nav-${viewId}`);
    if (activeBtn){
      let colorClass = 'border-cyan-500';
      if (viewId==='expense-view') colorClass='border-amber-500';
      if (viewId==='report-view') colorClass='border-green-500';
      if (viewId==='status-view') colorClass='border-indigo-500';
      activeBtn.classList.add('text-white', colorClass);
      activeBtn.classList.remove('border-transparent');
    }
  }

  // Theme
  function setTheme(mode){
    if (mode==='light'){
      document.body.classList.remove('bg-gray-800','text-gray-200');
      document.body.classList.add('bg-white','text-gray-900');
    }else{
      document.body.classList.remove('bg-white','text-gray-900');
      document.body.classList.add('bg-gray-800','text-gray-200');
    }
    localStorage.setItem('theme', mode);
  }
  function initTheme(){
    const cur = localStorage.getItem('theme') || 'dark';
    setTheme(cur);
    Utils.qs('themeToggle').addEventListener('click', ()=>{
      const now = localStorage.getItem('theme') || 'dark';
      setTheme(now==='dark' ? 'light' : 'dark');
    });
  }

  // Modals
  function openBookingModal(){ document.getElementById('booking-modal').classList.remove('hidden'); }
  function closeBookingModal(){ closeModal('booking-modal','activity-form'); }
  // FIX: Cast element to HTMLInputElement to access valueAsDate property.
  function openExpenseModal(){ (document.getElementById('expenseDate') as HTMLInputElement).valueAsDate = new Date(); document.getElementById('expense-modal').classList.remove('hidden'); }
  function closeExpenseModal(){ closeModal('expense-modal','expense-form'); }
  // FIX: Cast elements to HTMLInputElement to access value and min properties.
  function openExtendModal(rowNumber, currentCheckOut){ (document.getElementById('extend-row-number') as HTMLInputElement).value=rowNumber; const dateInput=document.getElementById('extendCheckOutDate') as HTMLInputElement; dateInput.value=currentCheckOut; dateInput.min=currentCheckOut; document.getElementById('extend-modal').classList.remove('hidden'); }
  function closeExtendModal(){ closeModal('extend-modal','extend-form'); }
  
  function closeModal(modalId, formId){
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    if (formId){
      // FIX: Cast element to HTMLFormElement to access reset method.
      const f = document.getElementById(formId) as HTMLFormElement; if(f) f.reset();
    }
    const statusMsg = modal.querySelector('[id*="-status-message"]'); if (statusMsg) statusMsg.textContent='';
    // FIX: Cast element to HTMLButtonElement to access disabled property.
    const submitBtn = modal.querySelector('button[type="submit"]') as HTMLButtonElement; if (submitBtn){ submitBtn.disabled=false; }
  }

  return { showView, openBookingModal, closeBookingModal, openExpenseModal, closeExpenseModal, openExtendModal, closeExtendModal, initTheme, setState, getState };
})();

const Bookings = (() => {
  let base64Files = [];
  function getFiles(){ return base64Files; }
  function clearFiles(){ base64Files = []; }

  // FIX: Add type annotation for the event and file objects to resolve property access errors.
  function handleFileSelection(e: Event) {
    const preview = document.getElementById('file-preview');
    preview.innerHTML = '';
    clearFiles();
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files).slice(0,3);
    files.forEach((file: File)=>{
      const reader = new FileReader();
      reader.onload = ev => {
        // FIX: Cast FileReader result to string before calling split.
        const resultStr = ev.target.result as string;
        const b64 = resultStr.split(',')[1];
        base64Files.push({ name: file.name, type: file.type, data: b64 });
        const isImg = file.type.startsWith('image/');
        preview.innerHTML += isImg
          ? `<img src="${ev.target.result as string}" class="w-full h-24 object-cover rounded-md">`
          : `<div class="w-full h-24 bg-gray-700 rounded-md flex flex-col items-center justify-center p-2"><i class="fas fa-file text-cyan-400 text-2xl"></i><span class="text-xs text-center truncate w-full mt-2">${file.name}</span></div>`;
      };
      reader.readAsDataURL(file);
    });
  }

  function calculatePrice(){
    // FIX: Cast elements to HTMLInputElement/HTMLSelectElement to access value property.
    const checkInV = (document.getElementById('checkInDate') as HTMLInputElement).value;
    const checkOutV = (document.getElementById('checkOutDate') as HTMLInputElement).value;
    const roomNum = (document.getElementById('roomNumber') as HTMLSelectElement).value;
    const rooms = UI.getState().rooms || [];
    const selected = rooms.find(r => String(r.number)===String(roomNum));
    (document.getElementById('roomType') as HTMLInputElement).value = selected ? selected.type : '';
    (document.getElementById('pricePerNight') as HTMLInputElement).value = selected ? String(selected.price) : '';

    if (!checkInV || !checkOutV || new Date(checkOutV)<=new Date(checkInV)){
      document.getElementById('numberOfNights').textContent = '0';
      document.getElementById('totalPrice').textContent = '0.00';
    }else{
      // FIX: Use .getTime() for date arithmetic to ensure numeric operations.
      const diffDays = Math.ceil((new Date(checkOutV).getTime()-new Date(checkInV).getTime())/(1000*60*60*24));
      // FIX: Convert number to string for textContent.
      document.getElementById('numberOfNights').textContent = String(diffDays);
      const total = selected ? diffDays * parseFloat(selected.price) : 0;
      document.getElementById('totalPrice').textContent = Utils.toFixed2(total);
    }
    calculateBalance();
  }

  function calculateBalance(){
    const total = parseFloat(document.getElementById('totalPrice').textContent)||0;
    // FIX: Cast elements to HTMLInputElement to access value property.
    const cash = parseFloat((document.getElementById('cashAmount') as HTMLInputElement).value)||0;
    const transfer = parseFloat((document.getElementById('transferAmount') as HTMLInputElement).value)||0;
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
    // FIX: Cast elements to access their properties correctly.
    const name = (document.getElementById('guestName') as HTMLInputElement).value.trim();
    const idcard = (document.getElementById('guestIdCard') as HTMLInputElement).value.trim();
    const checkIn = (document.getElementById('checkInDate') as HTMLInputElement).value;
    const checkOut = (document.getElementById('checkOutDate') as HTMLInputElement).value;
    const room = (document.getElementById('roomNumber') as HTMLSelectElement).value;
    const priceNight = parseFloat((document.getElementById('pricePerNight') as HTMLInputElement).value||'0');
    const total = parseFloat(document.getElementById('totalPrice').textContent||'0');
    const cash = parseFloat((document.getElementById('cashAmount') as HTMLInputElement).value||'0');
    const transfer = parseFloat((document.getElementById('transferAmount') as HTMLInputElement).value||'0');

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
    
    // FIX: Cast elements to access their properties correctly.
    const params = {
      action: 'addBooking',
      timestamp: new Date().toISOString(),
      guestName: (document.getElementById('guestName') as HTMLInputElement).value.trim(),
      guestIdCard: (document.getElementById('guestIdCard') as HTMLInputElement).value.trim(),
      guestAddress: (document.getElementById('guestAddress') as HTMLInputElement).value.trim(),
      checkInDate: (document.getElementById('checkInDate') as HTMLInputElement).value,
      checkOutDate: (document.getElementById('checkOutDate') as HTMLInputElement).value,
      roomNumber: (document.getElementById('roomNumber') as HTMLSelectElement).value,
      roomType: (document.getElementById('roomType') as HTMLInputElement).value,
      pricePerNight: (document.getElementById('pricePerNight') as HTMLInputElement).value,
      numberOfNights: document.getElementById('numberOfNights').textContent,
      totalPrice: document.getElementById('totalPrice').textContent,
      cashAmount: (document.getElementById('cashAmount') as HTMLInputElement).value || '0',
      transferAmount: (document.getElementById('transferAmount') as HTMLInputElement).value || '0',
      numberOfGuests: (document.getElementById('numberOfGuests') as HTMLInputElement).value,
      remarks: (document.getElementById('remarks') as HTMLInputElement).value,
      files: JSON.stringify(base64Files),
    };

    return Utils.apiPost(params);
  }

  async function submitExtend(){
    // FIX: Cast elements to HTMLInputElement to access value property.
    const payload = {
      action:'extendStay',
      rowNumber: (document.getElementById('extend-row-number') as HTMLInputElement).value,
      newCheckOutDate: (document.getElementById('extendCheckOutDate') as HTMLInputElement).value
    };
    // Basic validation
    if (!payload.rowNumber || !payload.newCheckOutDate) {
      throw new Error('ข้อมูลไม่ครบถ้วน');
    }
    return Utils.apiPost(payload);
  }

  return { getFiles, clearFiles, handleFileSelection, calculatePrice, calculateBalance, fetchRooms, submitBooking, submitExtend };
})();

const Expenses = (() => {
  function renderExpenses(rows){
    const body = document.getElementById('expense-table-body');
    let total = 0; body.innerHTML='';
    if (rows.length===0){
      body.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">ไม่พบข้อมูลรายจ่าย</td></tr>`;
    }else{
      rows.forEach(it=>{
        const amt = parseFloat(it.Amount)||0; total+=amt;
        body.innerHTML += `
          <tr class="hover:bg-gray-700">
            <td class="px-3 py-3 text-sm text-gray-300">${new Date(it.Date).toLocaleDateString('th-TH')}</td>
            <td class="px-3 py-3 text-sm font-medium text-white">${it.Description}</td>
            <td class="px-3 py-3 text-sm text-amber-400 text-right">${Utils.toFixed2(amt)}</td>
            <td class="px-3 py-3 text-sm text-center">
              <button class="bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 rounded mr-2 btn-edit-expense" data-row-number="${it.rowNumber}"><i class="fa fa-pen"></i></button>
              <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded btn-delete-expense" data-row-number="${it.rowNumber}"><i class="fa fa-trash"></i></button>
            </td>
          </tr>`;
      });
    }
    document.getElementById('total-expenses').textContent = Utils.toFixed2(total);
  }

  async function fetchExpenses(force=false){
    const loading = document.getElementById('loading-expenses');
    Utils.show(loading);
    const data = await Utils.apiGet('getExpenses');
    // FIX: Use .getTime() for date arithmetic to ensure numeric operations.
    data.sort((a,b)=> new Date(b.Date).getTime() - new Date(a.Date).getTime());
    UI.setState('expenses', data);
    Utils.hide(loading);
    // FIX: Cast element to HTMLInputElement to access value and valueAsDate properties.
    const f = document.getElementById('expense-date-filter') as HTMLInputElement;
    if (f && !f.value) f.valueAsDate = new Date();
    filterAndRender();
  }

  function filterAndRender(){
    const all = UI.getState().expenses || [];
    // FIX: Cast element to HTMLInputElement to access value property.
    const filterDate = (document.getElementById('expense-date-filter') as HTMLInputElement).value;
    const filtered = filterDate ? all.filter(ex=> ex.Date===filterDate) : all;
    renderExpenses(filtered);
  }

  function openEdit(rowNumber){
    const it = (UI.getState().expenses||[]).find(x=> String(x.rowNumber)===String(rowNumber));
    if (!it) return;
    UI.openExpenseModal();
    // FIX: Cast elements to access their properties correctly.
    (document.getElementById('expenseDate') as HTMLInputElement).value = it.Date;
    (document.getElementById('expenseDescription') as HTMLInputElement).value = it.Description;
    (document.getElementById('expenseCategory') as HTMLSelectElement).value = it.Category || '';
    (document.getElementById('expenseAmount') as HTMLInputElement).value = it.Amount;
    const btn = document.getElementById('expense-submit-btn') as HTMLButtonElement;
    btn.dataset.mode = 'edit';
    btn.dataset.row = rowNumber;
  }

  async function submitExpense(){
    const btn = document.getElementById('expense-submit-btn') as HTMLButtonElement;
    const mode = btn.dataset.mode || 'add';
    // FIX: Add a type definition for payload to include optional rowNumber.
    const payload: {
        action: string;
        timestamp: string;
        date: string;
        description: string;
        category: string;
        amount: string;
        rowNumber?: string;
    } = {
      action: mode==='edit' ? 'updateExpense' : 'addExpense',
      timestamp: new Date().toISOString(),
      // FIX: Cast elements to access their value properties.
      date: (document.getElementById('expenseDate') as HTMLInputElement).value,
      description: (document.getElementById('expenseDescription') as HTMLInputElement).value.trim(),
      category: (document.getElementById('expenseCategory') as HTMLSelectElement).value.trim(),
      amount: (document.getElementById('expenseAmount') as HTMLInputElement).value
    };
    if (mode==='edit') payload.rowNumber = btn.dataset.row;
    
    if (!payload.date || !payload.description || !payload.amount) {
        throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    return Utils.apiPost(payload);
  }

  function initFilters(){
    document.getElementById('expense-date-filter').addEventListener('input', filterAndRender);
  }

  return { fetchAndRenderExpenses: fetchExpenses, filterAndRender, openEdit, submitExpense, initFilters };
})();

const Reports = (() => {
  let monthlyIncomeChart=null, roomTypeChart=null;

  function showTab(tabId){
    document.querySelectorAll('.report-tab-content').forEach(el=>el.classList.remove('active'));
    document.getElementById(`report-${tabId}-content`).classList.add('active');
    document.querySelectorAll('.report-tab-btn').forEach(btn=>{
      btn.classList.remove('text-white','border-green-500'); btn.classList.add('text-gray-400','border-transparent');
    });
    document.getElementById(`report-tab-${tabId}`).classList.add('text-white','border-green-500');
    document.getElementById(`report-tab-${tabId}`).classList.remove('text-gray-400','border-transparent');
    
    Utils.hide(Utils.qs('ai-analysis-container'));

    if (tabId==='daily'){
      // FIX: Cast element to HTMLInputElement to access value and valueAsDate properties.
      const df = document.getElementById('report-date-filter') as HTMLInputElement;
      if (!df.value) df.valueAsDate = new Date();
      renderDaily();
    }
    if (tabId==='monthly'){ renderMonthly(); }
    if (tabId==='yearly'){ renderYearly(); }
  }

  function printDaily(){ window.print(); }

  function renderDaily(){
    Utils.hide(Utils.qs('ai-analysis-container'));
    // FIX: Cast element to HTMLInputElement to access value property.
    const date = (document.getElementById('report-date-filter') as HTMLInputElement).value || new Date().toISOString().slice(0,10);
    const acts = (UI.getState().activities || []).filter(a => (a['Check-in Date']||'').slice(0,10)===date);
    const exps = (UI.getState().expenses || []).filter(e => e.Date===date);

    const cash = acts.reduce((s,a)=> s + (parseFloat(a['Cash Amount'])||0), 0);
    const transfer = acts.reduce((s,a)=> s + (parseFloat(a['Transfer Amount'])||0), 0);
    const income = cash + transfer; // Use sum of payments for accuracy
    const expense = exps.reduce((s,e)=> s + (parseFloat(e.Amount)||0), 0);

    document.getElementById('report-total-cash').textContent = Utils.toFixed2(cash);
    document.getElementById('report-total-transfer').textContent = Utils.toFixed2(transfer);
    document.getElementById('report-total-income').textContent = Utils.toFixed2(income);
    document.getElementById('report-total-expense').textContent = Utils.toFixed2(expense);
    document.getElementById('report-net-balance').textContent = Utils.toFixed2(income - expense);

    const body = document.getElementById('report-table-body');
    body.innerHTML = '';
    if (acts.length===0){
      body.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">ไม่มีรายการ</td></tr>`;
    } else {
      acts.forEach(a=>{
        body.innerHTML += `
          <tr class="hover:bg-gray-700">
            <td class="px-3 py-3 text-sm text-white">${a['Guest Name']}</td>
            <td class="px-3 py-3 text-sm text-right text-green-400">${Utils.toFixed2(a['Cash Amount'])}</td>
            <td class="px-3 py-3 text-sm text-right text-sky-400">${Utils.toFixed2(a['Transfer Amount'])}</td>
            <td class="px-3 py-3 text-sm text-right text-cyan-400">${Utils.toFixed2(a['Total Price'])}</td>
          </tr>`;
      });
    }
  }

  function renderMonthly(){
    const acts = UI.getState().activities || [];
    const byMonth = {};
    acts.forEach(a=>{
      const d = new Date(a['Check-in Date']);
      const key = `${d.getFullYear()}-${('0'+(d.getMonth()+1)).slice(-2)}`;
      const income = (parseFloat(a['Cash Amount'])||0) + (parseFloat(a['Transfer Amount'])||0);
      byMonth[key] = (byMonth[key] || 0) + income;
    });
    const labels = Object.keys(byMonth).sort();
    const values = labels.map(k=> byMonth[k]);

    // FIX: Cast element to HTMLCanvasElement to access getContext method.
    const ctx = (document.getElementById('monthlyIncomeChart-report') as HTMLCanvasElement).getContext('2d');
    if (monthlyIncomeChart) monthlyIncomeChart.destroy();
    monthlyIncomeChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'รายได้รวม (บาท)', data: values, backgroundColor: '#06b6d4' }]},
      options: { responsive: true, scales: { y: { beginAtZero: true }}}
    });
  }

  function renderYearly(){
    const acts = UI.getState().activities || [];
    const byType = {};
    acts.forEach(a=>{
      const t = a['Room Type'] || 'ไม่ระบุ';
      byType[t] = (byType[t] || 0) + 1;
    });
    const labels = Object.keys(byType);
    const values = labels.map(k=> byType[k]);

    // FIX: Cast element to HTMLCanvasElement to access getContext method.
    const ctx = (document.getElementById('roomTypeChart-report') as HTMLCanvasElement).getContext('2d');
    if (roomTypeChart) roomTypeChart.destroy();
    roomTypeChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: ['#06b6d4','#34d399','#f59e0b','#ef4444','#8b5cf6','#10b981'] }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // เติมปีให้ select
    const years = Array.from(new Set((acts.map(a=> new Date(a['Check-in Date']).getFullYear())))).sort();
    const sel = document.getElementById('report-year-filter');
    sel.innerHTML = years.map(y=> `<option value="${y}">${y}</option>`).join('');
  }

  return { showTab, printDaily, renderDaily, renderMonthly, renderYearly };
})();

const App = (() => {

  async function checkApiStatus(): Promise<boolean> {
    const statusEl = Utils.qs('api-status');
    const retryBtn = Utils.qs('api-retry-btn');
    
    statusEl.textContent = 'ตรวจสอบ...';
    statusEl.className = 'ml-1 text-yellow-400';
    retryBtn.classList.add('hidden');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      const response = await fetch((window as any).CONFIG.SCRIPT_URL + '&action=ping', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        Utils.setApiStatus(true, 'พร้อมใช้งาน');
        return true;
      } else {
        const errorText = response.status === 404 
          ? 'มีปัญหา (ไม่พบ URL)' 
          : `มีปัญหา (Code: ${response.status})`;
        Utils.setApiStatus(false, errorText);
        return false;
      }
    } catch (e) {
      Utils.setApiStatus(false, 'เชื่อมต่อไม่ได้');
      return false;
    }
  }

  async function analyzeDailyReportWithAI() {
    const aiContainer = Utils.qs('ai-analysis-container');
    const aiResult = Utils.qs('ai-analysis-result');
    // FIX: Cast element to HTMLButtonElement to access disabled property.
    const btn = Utils.qs('ai-analysis-btn') as HTMLButtonElement;
    
    Utils.show(aiContainer);
    aiResult.innerHTML = `<div class="flex items-center justify-center p-4"><div class="spinner"></div><p class="ml-4">AI กำลังวิเคราะห์ข้อมูล...</p></div>`;
    btn.disabled = true;

    try {
        if (!process.env.API_KEY) {
            throw new Error("API key is not configured.");
        }
        
        const date = (Utils.qs('report-date-filter') as HTMLInputElement).value || new Date().toISOString().slice(0, 10);
        const acts = (UI.getState().activities || []).filter(a => (a['Check-in Date'] || '').slice(0, 10) === date);
        const exps = (UI.getState().expenses || []).filter(e => e.Date === date);

        const totalIncome = acts.reduce((s, a) => s + (parseFloat(a['Cash Amount']) || 0) + (parseFloat(a['Transfer Amount']) || 0), 0);
        const totalExpense = exps.reduce((s, e) => s + (parseFloat(e.Amount) || 0), 0);
        const totalCash = acts.reduce((s, a) => s + (parseFloat(a['Cash Amount']) || 0), 0);
        const totalTransfer = acts.reduce((s, a) => s + (parseFloat(a['Transfer Amount']) || 0), 0);
        const netBalance = totalIncome - totalExpense;

        const dailyData = {
            date: new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
            totalIncome,
            totalExpense,
            netBalance,
            totalCash,
            totalTransfer,
            checkIns: acts.map(a => ({ guest: a['Guest Name'], room: a['Room Number'], price: a['Total Price'] })),
            expenses: exps.map(e => ({ description: e.Description, amount: e.Amount })),
        };
        
        if (dailyData.checkIns.length === 0 && dailyData.expenses.length === 0) {
            aiResult.innerHTML = `<p class="text-gray-400 p-4 text-center">ไม่มีข้อมูลเพียงพอสำหรับวิเคราะห์ในวันนี้</p>`;
            btn.disabled = false;
            return;
        }
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `คุณคือผู้ช่วยผู้จัดการโรงแรมมืออาชีพ มีหน้าที่วิเคราะห์ข้อมูลสรุปรายวันและให้ข้อมูลเชิงลึกที่เป็นประโยชน์
        
        นี่คือข้อมูลสำหรับวันที่ ${dailyData.date}:
        - รายรับรวม: ${dailyData.totalIncome.toFixed(2)} บาท (เงินสด: ${dailyData.totalCash.toFixed(2)}, เงินโอน: ${dailyData.totalTransfer.toFixed(2)})
        - รายจ่ายรวม: ${dailyData.totalExpense.toFixed(2)} บาท
        - คงเหลือสุทธิ: ${dailyData.netBalance.toFixed(2)} บาท
        - รายการเช็คอิน (${dailyData.checkIns.length} รายการ): ${JSON.stringify(dailyData.checkIns).substring(0, 500)}
        - รายการรายจ่าย (${dailyData.expenses.length} รายการ): ${JSON.stringify(dailyData.expenses).substring(0, 500)}

        โปรดสรุปผลประกอบการของวันนี้เป็นภาษาไทย โดยเน้นประเด็นต่อไปนี้:
        1.  ภาพรวมทางการเงิน (รายรับ, รายจ่าย, และกำไร/ขาดทุน)
        2.  กิจกรรมหลักที่เกิดขึ้น (เช่น จำนวนการเช็คอิน)
        3.  ข้อสังเกตที่น่าสนใจ หรือคำแนะนำสำหรับผู้จัดการ (ถ้ามี)
        
        จัดรูปแบบคำตอบโดยใช้ Markdown เพื่อให้อ่านง่าย`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        aiResult.innerHTML = marked.parse(response.text);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        aiResult.innerHTML = `<p class="text-red-400 p-4">เกิดข้อผิดพลาดในการวิเคราะห์ด้วย AI: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
    }
  }

  function handleViewChange(viewId) {
    UI.showView(viewId);
    if (viewId === 'dashboard') updateDashboard();
    if (viewId === 'status-view') fetchAndRenderCurrentGuests(true);
    if (viewId === 'history-view') fetchActivities();
    if (viewId === 'expense-view') Expenses.fetchAndRenderExpenses();
    if (viewId === 'report-view') Reports.showTab('daily');
  }

  function handleCloseBookingModal() {
    UI.closeBookingModal();
    Utils.qs('file-preview').innerHTML = '';
    Bookings.clearFiles();
    Bookings.calculatePrice();
  }

  async function handleCheckoutGuest(rowNumber) {
    if (!confirm('ยืนยันการเช็คเอาท์หรือไม่?')) return;
    try {
      await Utils.apiPost({ action: 'updateStatus', rowNumber, status: 'Checked Out' });
      fetchAndRenderCurrentGuests(true);
    } catch (e) { alert(`เกิดข้อผิดพลาด: ${e.message}`); }
  }

  async function handleDeleteExpense(rowNumber) {
     if (!confirm('ยืนยันการลบรายจ่ายนี้หรือไม่?')) return;
    try{
      await Utils.apiPost({ action:'deleteExpense', rowNumber });
      await Expenses.fetchAndRenderExpenses(true);
      await updateDashboard();
    }catch(e){ alert('ลบไม่สำเร็จ: '+e.message); }
  }


  function bindEventListeners() {
    // API Status Retry
    Utils.qs('api-retry-btn').addEventListener('click', checkApiStatus);

    // Main Navigation
    Utils.qs('nav-dashboard').addEventListener('click', () => handleViewChange('dashboard'));
    Utils.qs('nav-status-view').addEventListener('click', () => handleViewChange('status-view'));
    Utils.qs('nav-history-view').addEventListener('click', () => handleViewChange('history-view'));
    Utils.qs('nav-expense-view').addEventListener('click', () => handleViewChange('expense-view'));
    Utils.qs('nav-report-view').addEventListener('click', () => handleViewChange('report-view'));

    // Dashboard Buttons
    Utils.qs('add-booking-btn').addEventListener('click', () => {
      if (UI.getState().rooms.length === 0) Bookings.fetchRooms();
      UI.openBookingModal();
    });
    
    // Expense View Buttons
    Utils.qs('add-expense-btn').addEventListener('click', UI.openExpenseModal);

    // Report Tabs and Buttons
    Utils.qs('report-tab-daily').addEventListener('click', () => Reports.showTab('daily'));
    Utils.qs('report-tab-monthly').addEventListener('click', () => Reports.showTab('monthly'));
    Utils.qs('report-tab-yearly').addEventListener('click', () => Reports.showTab('yearly'));
    Utils.qs('print-daily-report-btn').addEventListener('click', Reports.printDaily);
    Utils.qs('ai-analysis-btn').addEventListener('click', analyzeDailyReportWithAI);
    Utils.qs('report-date-filter').addEventListener('change', () => Reports.renderDaily());


    // Booking Modal Form and Controls
    Utils.qs('activity-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        // FIX: Cast button to HTMLButtonElement to access its properties.
        const btn = Utils.qs('submit-btn') as HTMLButtonElement;
        const msg = Utils.qs('status-message');
        if(btn.dataset.locked === '1') return;
        btn.dataset.locked = '1';
        Utils.setLoading(btn, msg, 'กำลังบันทึก...');
        try {
            await Bookings.submitBooking();
            Utils.setSuccess(msg,'บันทึกข้อมูลสำเร็จ!');
            await fetchActivities(true);
            updateDashboard();
            setTimeout(handleCloseBookingModal, 1200);
        } catch(err) {
            Utils.setError(btn, msg, err, 'บันทึก');
        } finally {
            btn.dataset.locked = '0';
        }
    });
    Utils.qs('checkInDate').addEventListener('change', Bookings.calculatePrice);
    Utils.qs('checkOutDate').addEventListener('change', Bookings.calculatePrice);
    Utils.qs('roomNumber').addEventListener('change', Bookings.calculatePrice);
    Utils.qs('cashAmount').addEventListener('input', Bookings.calculateBalance);
    Utils.qs('transferAmount').addEventListener('input', Bookings.calculateBalance);
    Utils.qs('fileInput').addEventListener('change', Bookings.handleFileSelection);
    Utils.qs('cancel-booking-btn').addEventListener('click', handleCloseBookingModal);

    // Expense Modal Form and Controls
    Utils.qs('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        // FIX: Cast button to HTMLButtonElement to access its properties.
        const btn = Utils.qs('expense-submit-btn') as HTMLButtonElement;
        const msg = Utils.qs('expense-status-message');
        const mode = btn.dataset.mode || 'add';
        Utils.setLoading(btn, msg, 'กำลังบันทึก...');
        try {
            await Expenses.submitExpense();
            Utils.setSuccess(msg, mode === 'edit' ? 'อัปเดตรายจ่ายสำเร็จ!' : 'บันทึกรายจ่ายสำเร็จ!');
            await Expenses.fetchAndRenderExpenses(true);
            await updateDashboard();
            setTimeout(UI.closeExpenseModal, 1000);
        } catch(err) {
            Utils.setError(btn, msg, err, mode === 'edit' ? 'อัปเดต' : 'บันทึก');
        } finally {
            btn.dataset.mode = 'add';
            btn.dataset.row = '';
        }
    });
    Utils.qs('cancel-expense-btn').addEventListener('click', UI.closeExpenseModal);

    // Extend Stay Modal Form and Controls
    Utils.qs('extend-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        // FIX: Cast button to HTMLButtonElement to access its properties.
        const btn = document.getElementById('extend-submit-btn') as HTMLButtonElement;
        const msg = document.getElementById('extend-status-message');
        Utils.setLoading(btn, msg, 'กำลังอัปเดต...');
        try {
            await Bookings.submitExtend();
            Utils.setSuccess(msg,'อัปเดตสำเร็จ!');
            await fetchAndRenderCurrentGuests(true);
            setTimeout(UI.closeExtendModal, 1200);
        } catch(err) {
            Utils.setError(btn, msg, err, 'อัปเดต');
        }
    });
    Utils.qs('cancel-extend-btn').addEventListener('click', UI.closeExtendModal);
    
    // Event Delegation for dynamically generated buttons
    // FIX: Cast event target and closest results to HTMLElement to access dataset property.
    document.body.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const checkoutBtn = target.closest('.btn-checkout');
      if (checkoutBtn) {
        handleCheckoutGuest((checkoutBtn as HTMLElement).dataset.rowNumber);
        return;
      }

      const extendBtn = target.closest('.btn-extend');
      if (extendBtn) {
        const extendBtnEl = extendBtn as HTMLElement;
        UI.openExtendModal(extendBtnEl.dataset.rowNumber, extendBtnEl.dataset.checkOutDate);
        return;
      }
      
      const editExpenseBtn = target.closest('.btn-edit-expense');
      if (editExpenseBtn) {
        Expenses.openEdit((editExpenseBtn as HTMLElement).dataset.rowNumber);
        return;
      }

      const deleteExpenseBtn = target.closest('.btn-delete-expense');
      if (deleteExpenseBtn) {
        handleDeleteExpense((deleteExpenseBtn as HTMLElement).dataset.rowNumber);
        return;
      }
    });
  }

  async function init(){
    UI.initTheme();
    
    if ((window as any).CONFIG.SCRIPT_URL.includes("YOUR_APPS_SCRIPT_WEBAPP_URL_HERE")) {
      const msg = "กรุณาตั้งค่า Google Apps Script URL ในไฟล์ index.html ก่อนใช้งาน";
      Utils.showConfigError(msg);
      Utils.setApiStatus(false, "ไม่ได้ตั้งค่า");
      return; 
    }

    const isApiOk = await checkApiStatus();
    if (!isApiOk) {
        const msg = 'ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาตรวจสอบว่า Google Apps Script URL ใน index.html ถูกต้อง, deploy ถูกต้องแล้ว และตั้งค่าการเข้าถึงเป็น "Anyone"';
        Utils.showConfigError(msg);
        return;
    }

    // All clear, initialize the app fully
    bindEventListeners();
    try{
      await fetchActivities(true);
      await Expenses.fetchAndRenderExpenses(true);
      await Bookings.fetchRooms();
      updateDashboard();
      bindHistoryFilters();
      Expenses.initFilters();
    }catch(e){
      console.error(e);
      alert('โหลดข้อมูลล้มเหลว: ' + e.message);
    }
  }

  async function fetchAndRenderCurrentGuests(force=true){
    const loading = document.getElementById('loading-status'); Utils.show(loading);
    // Don't force a full refresh if we already have data, unless specified
    if (UI.getState().activities.length === 0 || force) {
      await fetchActivities(true);
    }
    const grid = document.getElementById('status-grid');
    grid.innerHTML='';
    const current = UI.getState().activities.filter(g=>g.Status==='Checked In');
    if (current.length===0){
      grid.innerHTML = `<p class="text-gray-500 md:col-span-2 lg:col-span-3 text-center">ไม่มีผู้เข้าพักในขณะนี้</p>`;
      Utils.hide(loading); return;
    }
    current.forEach(g=>{
      grid.innerHTML += `
        <div class="bg-gray-800 p-4 rounded-lg shadow-md">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="text-lg font-bold text-white">${g['Guest Name']}</h4>
              <p class="text-sm text-gray-400">ห้อง: <span class="font-semibold text-indigo-400">${g['Room Number']}</span></p>
            </div>
            <span class="text-xs bg-green-500/20 text-green-400 font-medium px-2 py-1 rounded-full">Checked In</span>
          </div>
          <div class="mt-4 text-xs text-gray-400">
            <p>เช็คอิน: ${new Date(g['Check-in Date']).toLocaleDateString('th-TH')}</p>
            <p>เช็คเอาท์: ${new Date(g['Check-out Date']).toLocaleDateString('th-TH')}</p>
          </div>
          <div class="mt-4 flex space-x-2">
            <button class="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded-md btn-checkout" data-row-number="${g.rowNumber}">เช็คเอาท์</button>
            <button class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-3 rounded-md btn-extend" data-row-number="${g.rowNumber}" data-check-out-date="${g['Check-out Date']}">ขยายเวลา</button>
          </div>
        </div>`;
    });
    Utils.hide(loading);
  }

  async function fetchActivities(force=false){
    const loading = document.getElementById('loading-history');
    if (force || UI.getState().activities.length === 0) {
        Utils.show(loading);
        const data = await Utils.apiGet('getActivities');
        // ปรับรูปแบบคีย์ -> map ให้ Front รองรับ
        const normalized = data.map((r)=>({
          rowNumber: r.rowNumber,
          'Guest Name': r.GuestName || r['Guest Name'],
          'Room Number': r.RoomNumber || r['Room Number'],
          'Room Type': r.RoomType || r['Room Type'],
          'Check-in Date': r.CheckInDate || r['Check-in Date'],
          'Check-out Date': r.CheckOutDate || r['Check-out Date'],
          'Total Price': parseFloat(r.TotalPrice || r['Total Price'] || 0),
          'Cash Amount': parseFloat(r.CashAmount || r['Cash Amount'] || 0),
          'Transfer Amount': parseFloat(r.TransferAmount || r['Transfer Amount'] || 0),
          Status: r.Status || 'Checked In',
          Files: r.Files || ''
        }));
        UI.setState('activities', normalized);
        Utils.hide(loading);
    }
    renderHistory(UI.getState().activities);
  }

  function renderHistory(data){
    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = '';
    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">ไม่พบข้อมูล</td></tr>`;
      return;
    }
    // Lazy chunk render
    let i = 0;
    function renderChunk(){
      const end = Math.min(i+50, data.length);
      for (; i<end; i++){
        const item = data[i];
        const statusColor = item.Status === 'Checked Out' ? 'text-red-400' : 'text-green-400';
        const filesHtml = (item.Files || '').split('|').filter(Boolean).map((url,idx)=> `<a href="${url}" target="_blank" class="text-cyan-400 underline">ไฟล์ ${idx+1}</a>`).join(' , ');
        tableBody.innerHTML += `
          <tr class="hover:bg-gray-700">
            <td class="px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-300">${new Date(item["Check-in Date"]).toLocaleDateString('th-TH')}</td>
            <td class="px-3 py-3 sm:px-6 sm:py-4 text-sm font-medium text-white">${item["Guest Name"]||'-'}</td>
            <td class="px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-300">${item["Room Number"]||'-'}</td>
            <td class="px-3 py-3 sm:px-6 sm:py-4 text-sm text-cyan-400 text-right">${Utils.toFixed2(item["Total Price"])}</td>
            <td class="px-3 py-3 sm:px-6 sm:py-4 text-sm ${statusColor}">${item.Status || '-'}</td>
            <td class="px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-300">${filesHtml || '-'}</td>
          </tr>`;
      }
      if (i < data.length) requestAnimationFrame(renderChunk);
    }
    requestAnimationFrame(renderChunk);
  }

  function bindHistoryFilters(){
    const apply = Utils.debounce(()=>{
      // FIX: Cast elements to access their properties correctly.
      const nameFilter = ((document.getElementById('search-name') as HTMLInputElement).value || '').toLowerCase();
      const monthFilter = (document.getElementById('search-month') as HTMLInputElement).value; // YYYY-MM
      const roomFilter = (document.getElementById('search-room') as HTMLSelectElement).value;
      const statusFilter = (document.getElementById('search-status') as HTMLSelectElement).value;
      const allActs = UI.getState().activities || [];
      const roomsSet = [...new Set(allActs.map(a => a['Room Number']))].filter(Boolean).sort((a,b)=>+a-+b);
      const roomSel = document.getElementById('search-room') as HTMLSelectElement;
      if (roomSel && roomSel.options.length<=1){
        roomSel.innerHTML = '<option value="">ทุกห้อง</option>' + roomsSet.map(r=> `<option>${r}</option>`).join('');
      }

      const filtered = allActs.filter(item => {
        const itemDate = new Date(item["Check-in Date"]);
        const itemMonth = itemDate.getFullYear() + '-' + ('0' + (itemDate.getMonth() + 1)).slice(-2);
        const nameOk = (item["Guest Name"] || '').toLowerCase().includes(nameFilter);
        const monthOk = !monthFilter || itemMonth === monthFilter;
        const roomOk = !roomFilter || (item["Room Number"] == roomFilter);
        const statusOk = !statusFilter || (item.Status || 'Checked In') === statusFilter;
        return nameOk && monthOk && roomOk && statusOk;
      });
      renderHistory(filtered);
    }, 250);

    ['search-name','search-month','search-room','search-status'].forEach(id=>{
      const el = document.getElementById(id);
      const evt = id==='search-name' ? 'input' : 'change';
      el.addEventListener(evt, apply);
    });
  }

  function updateDashboard(){
    const acts = UI.getState().activities || [];
    const exps = UI.getState().expenses || [];
    const totalIncome = acts.reduce((s,a)=> s + (parseFloat(a['Cash Amount'])||0) + (parseFloat(a['Transfer Amount'])||0), 0);
    const totalExpense = exps.reduce((s,e)=> s + (parseFloat(e.Amount)||0), 0);
    const occupied = acts.filter(a=> a.Status==='Checked In').length;

    Utils.qs('db-total-income').textContent = Utils.toFixed2(totalIncome);
    Utils.qs('db-total-expense').textContent = Utils.toFixed2(totalExpense);
    // FIX: Convert numbers to strings before assigning to textContent.
    Utils.qs('db-occupied-rooms').textContent = String(occupied);
    Utils.qs('db-total-bookings').textContent = String(acts.length);
  }

  return { init, fetchActivities, updateDashboard, renderHistory, fetchAndRenderHistory: fetchActivities };
})();

document.addEventListener('DOMContentLoaded', App.init);