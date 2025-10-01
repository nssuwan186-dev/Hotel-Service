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
    data.sort((a,b)=> new Date(b.Date) - new Date(a.Date));
    UI.setState('expenses', data);
    Utils.hide(loading);
    const f = document.getElementById('expense-date-filter');
    if (f && !f.value) f.valueAsDate = new Date();
    filterAndRender();
  }

  function filterAndRender(){
    const all = UI.getState().expenses || [];
    const filterDate = document.getElementById('expense-date-filter').value;
    const filtered = filterDate ? all.filter(ex=> ex.Date===filterDate) : all;
    renderExpenses(filtered);
  }

  function openEdit(rowNumber){
    const it = (UI.getState().expenses||[]).find(x=> String(x.rowNumber)===String(rowNumber));
    if (!it) return;
    UI.openExpenseModal();
    document.getElementById('expenseDate').value = it.Date;
    document.getElementById('expenseDescription').value = it.Description;
    document.getElementById('expenseCategory').value = it.Category || '';
    document.getElementById('expenseAmount').value = it.Amount;
    const btn = document.getElementById('expense-submit-btn');
    btn.dataset.mode = 'edit';
    btn.dataset.row = rowNumber;
  }

  async function submitExpense(){
    const btn = document.getElementById('expense-submit-btn');
    const mode = btn.dataset.mode || 'add';
    const payload = {
      action: mode==='edit' ? 'updateExpense' : 'addExpense',
      timestamp: new Date().toISOString(),
      date: document.getElementById('expenseDate').value,
      description: document.getElementById('expenseDescription').value.trim(),
      category: document.getElementById('expenseCategory').value.trim(),
      amount: document.getElementById('expenseAmount').value
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
