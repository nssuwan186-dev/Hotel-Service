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
  function openExpenseModal(){ document.getElementById('expenseDate').valueAsDate = new Date(); document.getElementById('expense-modal').classList.remove('hidden'); }
  function closeExpenseModal(){ closeModal('expense-modal','expense-form'); }
  function openExtendModal(rowNumber, currentCheckOut){ document.getElementById('extend-row-number').value=rowNumber; const dateInput=document.getElementById('extendCheckOutDate'); dateInput.value=currentCheckOut; dateInput.min=currentCheckOut; document.getElementById('extend-modal').classList.remove('hidden'); }
  function closeExtendModal(){ closeModal('extend-modal','extend-form'); }
  
  function closeModal(modalId, formId){
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    if (formId){
      const f = document.getElementById(formId); if(f) f.reset();
    }
    const statusMsg = modal.querySelector('[id*="-status-message"]'); if (statusMsg) statusMsg.textContent='';
    const submitBtn = modal.querySelector('button[type="submit"]'); if (submitBtn){ submitBtn.disabled=false; }
  }

  return { showView, openBookingModal, closeBookingModal, openExpenseModal, closeExpenseModal, openExtendModal, closeExtendModal, initTheme, setState, getState };
})();
