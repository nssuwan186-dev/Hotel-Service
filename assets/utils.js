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
    try {
      const res = await fetch(url, options);
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text().catch(()=> '');
        throw new Error(`HTTP ${res.status} ${res.statusText} | ${text.slice(0,200)}`);
      }
      if (!ct.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Invalid content-type: ${ct} | Body: ${text.slice(0,200)}`);
      }
      return await res.json();
    } catch (e) {
      console.error('Network/Parse error:', e);
      throw new Error('ข้อผิดพลาดของเครือข่าย: ' + (e.message || 'ไม่ทราบสาเหตุ'));
    }
  }

  async function apiPost(payload) {
    const url = CONFIG.SCRIPT_URL; // รวม token แล้ว
    const data = await safeFetch(url, {
      method: 'POST',
      body: new URLSearchParams(payload)
    });
    if (data.status !== 'success') throw new Error(data.message || 'Unknown error');
    return data.data || data.result || data;
  }

  async function apiGet(action) {
    const url = `${CONFIG.SCRIPT_URL}&action=${encodeURIComponent(action)}`;
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

  return { qs, show, hide, debounce, toFixed2, isThaiIdValid, apiPost, apiGet, setLoading, setSuccess, setError, setApiStatus };
})();