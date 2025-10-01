const App = (() => {

  async function checkApiStatus() {
    const statusEl = Utils.qs('api-status');
    const retryBtn = Utils.qs('api-retry-btn');
    
    statusEl.textContent = 'ตรวจสอบ...';
    statusEl.className = 'ml-1 text-yellow-400';
    retryBtn.classList.add('hidden');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      const response = await fetch(CONFIG.SCRIPT_URL + '&action=ping', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        Utils.setApiStatus(true, 'พร้อมใช้งาน');
      } else {
        Utils.setApiStatus(false, 'มีปัญหา');
      }
    } catch (e) {
      Utils.setApiStatus(false, 'เชื่อมต่อไม่ได้');
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

    // Booking Modal Form and Controls
    Utils.qs('activity-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = Utils.qs('submit-btn');
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
        const btn = Utils.qs('expense-submit-btn');
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
        const btn = document.getElementById('extend-submit-btn');
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
    document.body.addEventListener('click', e => {
      const checkoutBtn = e.target.closest('.btn-checkout');
      if (checkoutBtn) {
        handleCheckoutGuest(checkoutBtn.dataset.rowNumber);
        return;
      }

      const extendBtn = e.target.closest('.btn-extend');
      if (extendBtn) {
        UI.openExtendModal(extendBtn.dataset.rowNumber, extendBtn.dataset.checkOutDate);
        return;
      }
      
      const editExpenseBtn = e.target.closest('.btn-edit-expense');
      if (editExpenseBtn) {
        Expenses.openEdit(editExpenseBtn.dataset.rowNumber);
        return;
      }

      const deleteExpenseBtn = e.target.closest('.btn-delete-expense');
      if (deleteExpenseBtn) {
        handleDeleteExpense(deleteExpenseBtn.dataset.rowNumber);
        return;
      }
    });
  }

  async function init(){
    UI.initTheme();
    bindEventListeners();
    
    await checkApiStatus();

    // โหลดข้อมูลหลัก
    try{
      await fetchActivities(true);
      await Expenses.fetchAndRenderExpenses(true);
      await Bookings.fetchRooms();
      updateDashboard();
      bindHistoryFilters();
      Expenses.initFilters(); // Initialize expense filters
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
      const nameFilter = (document.getElementById('search-name').value || '').toLowerCase();
      const monthFilter = document.getElementById('search-month').value; // YYYY-MM
      const roomFilter = document.getElementById('search-room').value;
      const statusFilter = document.getElementById('search-status').value;
      const allActs = UI.getState().activities || [];
      const roomsSet = [...new Set(allActs.map(a => a['Room Number']))].filter(Boolean).sort((a,b)=>+a-+b);
      const roomSel = document.getElementById('search-room');
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
    const totalIncome = acts.reduce((s,a)=> s + (parseFloat(a['Total Price'])||0), 0);
    const totalExpense = exps.reduce((s,e)=> s + (parseFloat(e.Amount)||0), 0);
    const occupied = acts.filter(a=> a.Status==='Checked In').length;

    Utils.qs('db-total-income').textContent = Utils.toFixed2(totalIncome);
    Utils.qs('db-total-expense').textContent = Utils.toFixed2(totalExpense);
    Utils.qs('db-occupied-rooms').textContent = occupied;
    Utils.qs('db-total-bookings').textContent = acts.length;
  }

  return { init, fetchActivities, updateDashboard, renderHistory, fetchAndRenderHistory: fetchActivities };
})();

document.addEventListener('DOMContentLoaded', App.init);