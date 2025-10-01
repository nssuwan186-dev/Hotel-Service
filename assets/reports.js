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

    if (tabId==='daily'){
      const df = document.getElementById('report-date-filter');
      if (!df.value) df.valueAsDate = new Date();
      renderDaily();
    }
    if (tabId==='monthly'){ renderMonthly(); }
    if (tabId==='yearly'){ renderYearly(); }
  }

  function printDaily(){ window.print(); }

  function renderDaily(){
    const date = document.getElementById('report-date-filter').value || new Date().toISOString().slice(0,10);
    const acts = (UI.getState().activities || []).filter(a => (a['Check-in Date']||'').slice(0,10)===date);
    const exps = (UI.getState().expenses || []).filter(e => e.Date===date);

    const cash = acts.reduce((s,a)=> s + (parseFloat(a['Cash Amount'])||0), 0);
    const transfer = acts.reduce((s,a)=> s + (parseFloat(a['Transfer Amount'])||0), 0);
    const income = acts.reduce((s,a)=> s + (parseFloat(a['Total Price'])||0), 0);
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
      byMonth[key] = (byMonth[key] || 0) + (parseFloat(a['Total Price'])||0);
    });
    const labels = Object.keys(byMonth).sort();
    const values = labels.map(k=> byMonth[k]);

    const ctx = document.getElementById('monthlyIncomeChart-report').getContext('2d');
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

    const ctx = document.getElementById('roomTypeChart-report').getContext('2d');
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