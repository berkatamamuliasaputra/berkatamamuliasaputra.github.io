<script>
// 1. TARUH INITIALIZATION SUPABASE DI SINI (Paling atas)
    const SUPABASE_URL = 'https://uogkyucwbaofwbcrcpvf.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_QunitsAo75z0AcQL0X6ygQ_KmNznscd';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window._supabase = supabase;
    console.log('Supabase siap:', supabase);

    // 2. BARULAH DI BAWAHNYA SISA KODE JAVASCRIPT DASHBOARD ANDA
    var currentUser = null;
    function checkLogin() { ... }
    function loadPurchaseRequests() { ... }
    // ... ribuan baris kode bawaan dashboard Anda lainnya ...
  </script>
 
// ─── State ────────────────────────────────────────────────────────────────────
var store = {}, loaded = {}, currentUser = null, currentSection = 'dashboard';
var editingRow = null, deletingRow = null, deleteSection = null, activeFileField = null;
var customersList = [], vendorsList = [], perusahaanList = [];
 
// ─── Mapping: section → field key yang dipakai sebagai nama subfolder Drive ──
// Subfolder dibuat otomatis berdasarkan nilai field ini saat upload file
var ITEM_NAME_FIELD = {
  'purchase-requests': 'Nama Item',
  'purchase-orders':   'Nama Item',
  'quotations':        'Nama Barang',
  'invoices':          'Invoice Title',
  'status':            'Sending Item',
  'suppliers':         'Nama Perusahaan Vendor/Supplier'
};
 
// ─── Configs ──────────────────────────────────────────────────────────────────
var CFG = {
  'purchase-requests': {
    title:'Purchase Request', sheet:'Purchase Request', idKey:'ID Request', idFn:'getNextPurchaseRequestId',
    fields:[
      {k:'ID Request',      lbl:'ID Request',         type:'text',  ro:true,  auto:true, col:1},
      {k:'Tanggal',         lbl:'Tanggal',            type:'date',             col:1},
      {k:'Nama Customer',   lbl:'Nama Customer',      type:'customer',         col:2},
      {k:'Nama Item',       lbl:'Nama Item',          type:'text',             col:1},
      {k:'Qty',             lbl:'Qty',                type:'number',           col:1, ppn:true},
      {k:'Uom',             lbl:'UOM',                type:'text',             col:1},
      {k:'Spesifikasi',     lbl:'Spesifikasi',        type:'textarea',         col:2},
      {k:'Harga Beli',      lbl:'Harga Beli',         type:'text',             col:1, ppn:true},
      {k:'Harga Jual',      lbl:'Harga Jual',         type:'text',             col:1, ppn:true},
      {k:'Total Harga Beli',lbl:'Total Harga Beli',   type:'text', ro:true, autoCalc:'tBeli', col:1},
      {k:'Total Harga Jual',lbl:'Total Harga Jual',   type:'text', ro:true, autoCalc:'tJual', col:1},
      {k:'PPN 11%',         lbl:'PPN 11% (auto)',     type:'text', ro:true, autoCalc:'ppn11', col:1},
      {k:'PPN 12%',         lbl:'PPN 12% (auto)',     type:'text', ro:true, autoCalc:'ppn12', col:1},
      {k:'DPP + (PPN 11%)', lbl:'DPP + PPN 11% (auto)',type:'text',ro:true,autoCalc:'dpp11', col:2},
      {k:'PMT Mode',        lbl:'PMT Mode',           type:'text',             col:1},
      {k:'Online Shop Link',lbl:'Online Shop Link',   type:'text',             col:1},
      {k:'File',            lbl:'File',               type:'file',             col:2},
    ]
  },
  'purchase-orders': {
    title:'Purchase Order', sheet:'Purchase Order', idKey:'ID Order', idFn:'getNextPurchaseOrderId',
    fields:[
      {k:'ID Order',        lbl:'ID Order',           type:'text',  ro:true, auto:true, col:1},
      {k:'Tanggal',         lbl:'Tanggal',            type:'date',            col:1},
      {k:'Nama Customer',   lbl:'Nama Customer',      type:'customer',        col:2},
      {k:'Nama Item',       lbl:'Nama Item',          type:'text',            col:1},
      {k:'Qty',             lbl:'Qty',                type:'number',          col:1, ppn:true},
      {k:'Uom',             lbl:'UOM',                type:'text',            col:1},
      {k:'Vendor/Supplier', lbl:'Vendor / Supplier',  type:'vendor',          col:2},
      {k:'Harga Beli',      lbl:'Harga Beli',         type:'text',            col:1, ppn:true},
      {k:'Harga Jual',      lbl:'Harga Jual',         type:'text',            col:1, ppn:true},
      {k:'Total Beli',      lbl:'Total Beli',         type:'text', ro:true, autoCalc:'tBeli', col:1},
      {k:'Total Jual',      lbl:'Total Jual',         type:'text', ro:true, autoCalc:'tJual', col:1},
      {k:'Profit',          lbl:'Profit (auto)',      type:'text', ro:true, autoCalc:'profit', col:1},
      {k:'No PO',           lbl:'No. PO',             type:'text',            col:1},
      {k:'PPN 11%',         lbl:'PPN 11% (auto)',     type:'text', ro:true, autoCalc:'ppn11', col:1},
      {k:'PPN 12%',         lbl:'PPN 12% (auto)',     type:'text', ro:true, autoCalc:'ppn12', col:1},
      {k:'DPP PPH',         lbl:'DPP PPH (auto)',     type:'text', ro:true, autoCalc:'dppPph', col:1},
      {k:'Grand Total + (DPP + PPN11%)',lbl:'Grand Total DPP+PPN11% (auto)',type:'text',ro:true,autoCalc:'grandTotal',col:1},
      {k:'Link Pembelian',  lbl:'Link Pembelian',     type:'text',            col:2},
      {k:'File PO',         lbl:'File PO',            type:'file',            col:2},
    ]
  },
  quotations: {
    title:'Quotation', sheet:'Quotation', idKey:'ID Quotation', idFn:'getNextQuotationId',
    fields:[
      {k:'ID Quotation',    lbl:'ID Quotation',       type:'text', ro:true, auto:true, col:1},
      {k:'Tanggal',         lbl:'Tanggal',            type:'date',            col:1},
      {k:'Nama Customer',   lbl:'Nama Customer',      type:'text',            col:1},
      {k:'Nama Perusahaan', lbl:'Nama Perusahaan',    type:'perusahaan',      col:1},
      {k:'Nama Barang',     lbl:'Nama Barang',        type:'text',            col:1},
      {k:'Qty',             lbl:'Qty',                type:'number',          col:1, ppn:true},
      {k:'Uom',             lbl:'UOM',                type:'text',            col:1},
      {k:'Harga',           lbl:'Harga',              type:'text',            col:1, ppn:true},
      {k:'Total Harga',     lbl:'Total Harga',        type:'text', ro:true, autoCalc:'tHarga', col:1},
      {k:'Harga (PPN)',     lbl:'PPN 11% Amount (auto)',type:'text',ro:true,autoCalc:'ppnAmt', col:1},
      {k:'Grand Total + (PPN 11%)',lbl:'Grand Total + PPN 11% (auto)',type:'text',ro:true,autoCalc:'grandQt', col:1},
      {k:'Status',          lbl:'Status',             type:'text',            col:2},
      {k:'File',            lbl:'File Quotation',     type:'file',            col:2},
    ]
  },
  invoices: {
    title:'Invoice', sheet:'Invoice', idKey:'ID Invoice', idFn:'getNextInvoiceId',
    fields:[
      {k:'ID Invoice',       lbl:'ID Invoice',        type:'text', ro:true, auto:true, col:1},
      {k:'Tanggal Invoice',  lbl:'Tanggal Invoice',   type:'date',            col:1},
      {k:'Nama Customer',    lbl:'Nama Customer',     type:'text',            col:1},
      {k:'Nomer PO',         lbl:'Nomer PO',          type:'text',            col:1},
      {k:'Invoice Title',    lbl:'Invoice Title',     type:'text',            col:2},
      {k:'Nominal Tagihan',  lbl:'Nominal Tagihan',   type:'text',            col:1},
      {k:'Jatuh Tempo',      lbl:'Jatuh Tempo',       type:'date',            col:1},
      {k:'Term of Payment',  lbl:'Term of Payment',   type:'text',            col:1},
      {k:'Status',           lbl:'Status',            type:'text',            col:1},
      {k:'Faktur Invoice File',lbl:'Faktur Invoice File',type:'file',         col:2},
    ]
  },
  status: {
    title:'Delivery Status', sheet:'Status', idKey:null, idFn:null,
    fields:[
      {k:'Tanggal',      lbl:'Tanggal',        type:'date', col:1},
      {k:'Customer Name',lbl:'Customer Name',  type:'text', col:1},
      {k:'Sending Item', lbl:'Sending Item',   type:'text', col:2},
      {k:'No. PO',       lbl:'No. PO',         type:'text', col:1},
      {k:'Man Power',    lbl:'Man Power',       type:'text', col:1},
      {k:'Status',       lbl:'Status',          type:'text', col:2},
      {k:'Surat Jalan',  lbl:'Surat Jalan (Link/File)', type:'file', col:2},
    ]
  },
  suppliers: {
    title:'Supplier / Vendor', sheet:'Supplier/Vendor', idKey:'ID Supplier', idFn:'getNextSupplierId',
    fields:[
      {k:'ID Supplier',                    lbl:'ID Supplier', type:'text', ro:true, auto:true, col:1},
      {k:'Kategori',                       lbl:'Kategori',    type:'text', col:1},
      {k:'Nama Perusahaan Vendor/Supplier',lbl:'Nama Perusahaan / Vendor', type:'text', col:2},
      {k:'Nama Barang',    lbl:'Nama Barang',     type:'text', col:1},
      {k:'Harga Barang',   lbl:'Harga Barang',    type:'text', col:1},
      {k:'Alamat Kantor / Toko', lbl:'Alamat Kantor / Toko', type:'textarea', col:2},
      {k:'PIC',            lbl:'PIC',             type:'text', col:1},
      {k:'No Tlp/WA',      lbl:'No. Tlp / WA',   type:'text', col:1},
    ]
  },
};
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
function v(x){ return (x===null||x===undefined||x==='') ? '—' : x; }
function fmtDate(x){ if(!x) return '—'; try{ var d=new Date(x); return isNaN(d)?x:d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}); }catch(e){return x;} }
function badge(s){ if(!s) return '—'; var l=s.toLowerCase(); var c='bdg-def'; if(/paid|completed|approved|lunas|done|selesai/.test(l))c='bdg-ok'; else if(/pending|process|proses|progress|review/.test(l))c='bdg-warn'; else if(/cancel|reject|batal|fail|gagal/.test(l))c='bdg-err'; return '<span class="bdg '+c+'">'+s+'</span>'; }
function cellLink(val){ if(!val) return '—'; if(/^https?:\/\//i.test(String(val))) return '<a href="'+val+'" target="_blank" class="cell-link"><i class="fas fa-external-link-alt"></i>Lihat</a>'; return v(val); }
function emptyRow(cols,msg){ return '<tr><td colspan="'+cols+'" class="empty-state"><i class="fas fa-inbox"></i><p>'+(msg||'Belum ada data')+'</p></td></tr>'; }
function parseNum(x){ return parseFloat(String(x||'').replace(/[^0-9.]/g,''))||0; }
// ─── Format angka menjadi Rupiah ──────────────────────────────────────────────
function fmtRp(x){
  if(x===null||x===undefined||x==='') return '—';
  var n = parseFloat(String(x).replace(/[^0-9.\-]/g,''));
  if(isNaN(n)) return v(x);
  return 'Rp\u00A0'+new Intl.NumberFormat('id-ID',{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(n));
}
// Format profit sebagai persentase: (Total Jual - Total Beli) / Total Beli * 100
function fmtPct(profitVal, totalBeli){
  var profit = parseFloat(String(profitVal).replace(/[^0-9.\-]/g,''));
  var beli   = parseFloat(String(totalBeli||'').replace(/[^0-9.\-]/g,''));
  // Jika ada Total Beli, hitung % dari sana; kalau tidak ada, tampilkan saja nilai raw %
  var pct;
  if(!isNaN(beli) && beli !== 0){
    pct = (profit / beli) * 100;
  } else if(!isNaN(profit)){
    pct = profit; // fallback: anggap sudah dalam bentuk %
  } else {
    return '—';
  }
  var sign  = pct >= 0 ? '+' : '';
  var color = pct >= 0 ? '#059669' : '#ef4444';
  var fixed = Math.abs(pct) >= 100 ? pct.toFixed(1) : pct.toFixed(2);
  return '<span style="color:'+color+';font-weight:700">'+sign+fixed+'%</span>';
}
function showToast(msg,type){ var t=document.getElementById('toast'); var el=document.createElement('div'); el.className='toast-item '+(type||'success'); el.innerHTML='<i class="fas '+(type==='error'?'fa-circle-xmark':'fa-circle-check')+'"></i> '+msg; t.appendChild(el); setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},3500); }
 
// ─── Session ──────────────────────────────────────────────────────────────────
function initApp(){
  applyTheme(); // Terapkan tema tersimpan sebelum render
  loadActivityLogFromStorage();
  var s = null;
  try { s = localStorage.getItem('pms_user'); } catch(e) { s = null; }
  if(s){
    try{
      var user = JSON.parse(s);
      if(user && user.username){
        currentUser = user;
        showApp();
        loadSection('dashboard');
        loadNewsTicker();
        return;
      }
    }catch(e){}
  }
  showLogin();
}
 
// PERBAIKAN: showLogin dan showApp tidak lagi bentrok dengan Bootstrap d-flex
// karena class d-flex sudah dihapus dari #app di HTML
function showLogin(){
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}
 
function showApp(){
  if(!currentUser) return;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('sb-name').textContent = currentUser.name || currentUser.username || '—';
  document.getElementById('sb-role').textContent = currentUser.role || 'User';
  // Tampilkan foto profil di sidebar jika ada
  try {
    var photoUrl = localStorage.getItem('bms_photo_'+currentUser.username);
    updateProfilePhotoDisplay(photoUrl);
  } catch(e){}
}
 
function doLogout(){
  try { localStorage.removeItem('pms_user'); } catch(e){}
  currentUser = null;
  store = {}; loaded = {};
  showLogin();
}
 
function togglePw(){
  var i=document.getElementById('l-pass');
  var changed=i.type==='password';
  i.type=changed?'text':'password';
  document.getElementById('pw-icon').className='fas fa-eye'+(changed?'-slash':'');
}
 
// ─── Login ────────────────────────────────────────────────────────────────────
function doLogin(e){
  e.preventDefault();
  var u=document.getElementById('l-user').value.trim();
  var p=document.getElementById('l-pass').value;
  if(!u||!p){ showLoginErr('Isi username dan password.'); return; }
  hideLoginErr();
  setLoginLoading(true);
  google.script.run
    .withSuccessHandler(onLoginResult)
    .withFailureHandler(function(err){ setLoginLoading(false); showLoginErr(err.message||'Koneksi gagal.'); })
    .login(u, p);
}
 
function onLoginResult(r){
  setLoginLoading(false);
  if(!r){ showLoginErr('Tidak ada respons dari server.'); return; }
  if(r.success && r.user){
    try { localStorage.setItem('pms_user', JSON.stringify(r.user)); } catch(e){}
    currentUser = r.user;
    showApp();
    loadSection('dashboard');
  } else {
    showLoginErr(r.error || 'Login gagal.');
  }
}
 
// PERBAIKAN: setLoginLoading tidak lagi pakai Bootstrap d-none, tapi class .hidden custom
function setLoginLoading(on){
  document.getElementById('login-btn').disabled = on;
  if(on){
    document.getElementById('login-sp').classList.remove('hidden');
  } else {
    document.getElementById('login-sp').classList.add('hidden');
  }
}
 
function showLoginErr(msg){
  var el=document.getElementById('login-err');
  el.textContent=msg;
  el.style.display='block';
}
 
function hideLoginErr(){
  document.getElementById('login-err').style.display='none';
}
 
// ─── Navigation ───────────────────────────────────────────────────────────────
function nav(sec,el){
  document.querySelectorAll('.sb-link').forEach(function(a){a.classList.remove('active');});
  el.classList.add('active');
  document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active');});
  document.getElementById('sec-'+sec).classList.add('active');
  currentSection=sec;
  if(sec==='account'){ openAccountSection(); return; }
  if(sec==='dashboard') loadNewsTicker();
  if(!loaded[sec]) loadSection(sec);
}
 
// ─── Data loading ─────────────────────────────────────────────────────────────
function loadSection(sec){
  loaded[sec]=true;
  var map={
    'dashboard':'getDashboardData',
    'purchase-requests':'getPurchaseRequests',
    'purchase-orders':'getPurchaseOrders',
    'quotations':'getQuotations',
    'invoices':'getInvoices',
    'status':'getDeliveryStatus',
    'suppliers':'getSuppliers'
  };
  if(!map[sec]) return;
  google.script.run
    .withSuccessHandler(function(r){ onData(sec, r); })
    .withFailureHandler(function(e){ loaded[sec]=false; showToast((e&&e.message)||'Gagal memuat data','error'); })
    [map[sec]]();
}
 
function onData(sec,r){
  if(sec==='dashboard'){ renderDashboard(r); return; }
  if(r && r.success){
    store[sec]=r.data;
    renderSection(sec);
    var infoEl=document.getElementById('info-'+sec);
    if(infoEl) infoEl.textContent=r.data.length+' total records';
  } else {
    showToast((r&&r.error)||'Gagal memuat '+sec,'error');
  }
}
 
function filterSec(sec){
  if(!store[sec]) return;
  var q=(document.getElementById('q-'+sec)||{}).value||'';
  renderSection(sec,q.toLowerCase());
}
 
// ─── Dashboard render ─────────────────────────────────────────────────────────
function renderDashboard(d){
  if(!d||!d.success){
    document.getElementById('stats-grid').innerHTML='<div class="col-12" style="padding:16px;color:var(--red)">Error: '+(d&&d.error?d.error:'Gagal memuat data')+'</div>';
    return;
  }
  var r=d.report, c=d.counts;
  var cards=[
    {ic:'blue',icn:'fa-chart-bar',    l:'Total RFQ',           val:r.totalRfq,          sub:'Data dari Report'},
    {ic:'green',icn:'fa-shopping-bag',l:'Total PO Items',      val:r.totalItemPo,        sub:'Data dari Report'},
    {ic:'orange',icn:'fa-boxes',      l:'Total Qty Requested', val:r.totalQtyRequested,  sub:'Data dari Report'},
    {ic:'purple',icn:'fa-building',   l:'Total Vendors',       val:r.totalVendor,        sub:'Data dari Report'},
    {ic:'blue',icn:'fa-clipboard-list',l:'Purchase Requests',  val:c.purchaseRequests},
    {ic:'green',icn:'fa-shopping-cart',l:'Purchase Orders',    val:c.purchaseOrders},
    {ic:'orange',icn:'fa-file-invoice',l:'Quotations',         val:c.quotations},
    {ic:'purple',icn:'fa-receipt',    l:'Invoices',            val:c.invoices}
  ];
  var colorMap={blue:'var(--blue)',green:'var(--green)',orange:'var(--orange)',purple:'var(--purple)'};
  var bgMap={blue:'var(--blue-light)',green:'var(--green-light)',orange:'var(--orange-light)',purple:'var(--purple-light)'};
  var html=cards.map(function(cd){
    return '<div class="col-lg-3 col-sm-6"><div class="stat-card">'
      +'<div class="stat-ic" style="background:'+bgMap[cd.ic]+';float:right"><i class="fas '+cd.icn+'" style="color:'+colorMap[cd.ic]+'"></i></div>'
      +'<div class="stat-lbl">'+cd.l+'</div>'
      +'<div class="stat-val">'+v(cd.val)+'</div>'
      +(cd.sub?'<div class="stat-sub">'+cd.sub+'</div>':'')
      +'</div></div>';
  }).join('');
  document.getElementById('stats-grid').innerHTML=html;
 
  // Recent orders
  if(!d.recentOrders||d.recentOrders.length===0){
    document.getElementById('recent-orders').innerHTML=emptyRow(5);
  } else {
    document.getElementById('recent-orders').innerHTML='<table class="tbl"><thead><tr><th>ID Order</th><th>Customer</th><th>Item</th><th>Total Jual</th><th>No. PO</th></tr></thead><tbody>'
      +d.recentOrders.map(function(o){
        return '<tr><td style="color:var(--blue);font-weight:600">'+v(o['ID Order'])+'</td>'
          +'<td>'+v(o['Nama Customer'])+'</td>'
          +'<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v(o['Nama Item'])+'</td>'
          +'<td style="text-align:right;white-space:nowrap">'+fmtRp(o['Total Jual']||o['Total Beli'])+'</td>'
          +'<td>'+v(o['No PO'])+'</td></tr>';
      }).join('')+'</tbody></table>';
  }
 
  // Recent invoices
  if(!d.recentInvoices||d.recentInvoices.length===0){
    document.getElementById('recent-invoices').innerHTML=emptyRow(5);
  } else {
    document.getElementById('recent-invoices').innerHTML='<table class="tbl"><thead><tr><th>ID Invoice</th><th>Customer</th><th>Nominal</th><th>Jatuh Tempo</th><th>Status</th></tr></thead><tbody>'
      +d.recentInvoices.map(function(i){
        return '<tr><td style="color:var(--blue);font-weight:600">'+v(i['ID Invoice'])+'</td>'
          +'<td>'+v(i['Nama Customer'])+'</td>'
          +'<td style="text-align:right;white-space:nowrap">'+fmtRp(i['Nominal Tagihan'])+'</td>'
          +'<td>'+fmtDate(i['Jatuh Tempo'])+'</td>'
          +'<td>'+badge(i['Status'])+'</td></tr>';
      }).join('')+'</tbody></table>';
  }
}
 
// ─── Section table renderers ──────────────────────────────────────────────────
function renderSection(sec,q){
  var data=filterData(store[sec]||[],q);
  var tb=document.getElementById('tb-'+sec);
  if(!tb) return;
  if(data.length===0){ tb.innerHTML=emptyRow(20,q?'Tidak ada hasil pencarian':'Belum ada data'); return; }
  tb.innerHTML=data.map(function(r){ return renderRow(sec,r); }).join('');
}
 
function renderRow(sec,r){
  var ri=r._rowIndex||0;
  var trClick=' onclick="openDetailDrawer(\''+sec+'\',(store[\''+sec+'\']||[]).find(function(x){return x._rowIndex==='+ri+';})||{_rowIndex:'+ri+'},'+ri+')"';
  if(sec==='purchase-requests'){
    return '<tr'+trClick+'><td style="color:var(--blue);font-weight:600;font-size:12px">'+v(r['ID Request'])+'</td><td style="white-space:nowrap">'+fmtDate(r['Tanggal'])+'</td><td>'+v(r['Nama Customer'])+'</td><td style="min-width:200px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v(r['Nama Item'])+'</td><td style="text-align:center;width:52px">'+v(r['Qty'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Total Harga Beli'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Total Harga Jual'])+'</td><td>'+v(r['PMT Mode'])+'</td><td>'+cellLink(r['Online Shop Link'])+'</td><td>'+cellLink(r['File'])+'</td><td onclick="event.stopPropagation()">'+actBtns(sec,r,ri)+'</td></tr>';
  }
  if(sec==='purchase-orders'){
    return '<tr'+trClick+'><td style="color:var(--blue);font-weight:600;font-size:12px">'+v(r['ID Order'])+'</td><td style="white-space:nowrap">'+fmtDate(r['Tanggal'])+'</td><td>'+v(r['Nama Customer'])+'</td><td style="min-width:200px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v(r['Nama Item'])+'</td><td style="text-align:center;width:52px">'+v(r['Qty'])+'</td><td>'+v(r['Uom']||r['UOM']||r['Satuan']||'')+'</td><td>'+v(r['Vendor/Supplier'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Total Beli'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Harga Jual'])+'</td><td style="text-align:center;white-space:nowrap">'+fmtPct(r['Profit'],r['Total Beli'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Total Jual'])+'</td><td>'+v(r['No PO'])+'</td><td>'+cellLink(r['Link Pembelian'])+'</td><td>'+cellLink(r['File PO'])+'</td><td onclick="event.stopPropagation()">'+actBtns(sec,r,ri)+'</td></tr>';
  }
  if(sec==='quotations'){
    return '<tr'+trClick+'><td style="color:var(--blue);font-weight:600;font-size:12px">'+v(r['ID Quotation'])+'</td><td style="white-space:nowrap">'+fmtDate(r['Tanggal'])+'</td><td>'+v(r['Nama Customer'])+'</td><td style="min-width:200px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v(r['Nama Barang'])+'</td><td style="text-align:center;width:52px">'+v(r['Qty'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Harga'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Total Harga'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Grand Total + (PPN 11%)'])+'</td><td>'+badge(r['Status'])+'</td><td>'+cellLink(r['File'])+'</td><td onclick="event.stopPropagation()">'+actBtns(sec,r,ri)+'</td></tr>';
  }
  if(sec==='invoices'){
    return '<tr'+trClick+'><td style="color:var(--blue);font-weight:600;font-size:12px">'+v(r['ID Invoice'])+'</td><td style="white-space:nowrap">'+fmtDate(r['Tanggal Invoice'])+'</td><td>'+v(r['Nama Customer'])+'</td><td>'+v(r['Nomer PO'])+'</td><td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v(r['Invoice Title'])+'</td><td style="text-align:right;white-space:nowrap"><strong>'+fmtRp(r['Nominal Tagihan'])+'</strong></td><td style="white-space:nowrap">'+fmtDate(r['Jatuh Tempo'])+'</td><td>'+v(r['Term of Payment'])+'</td><td>'+badge(r['Status'])+'</td><td>'+cellLink(r['Faktur Invoice File'])+'</td><td onclick="event.stopPropagation()">'+actBtns(sec,r,ri)+'</td></tr>';
  }
  if(sec==='status'){
    return '<tr'+trClick+'><td style="white-space:nowrap">'+fmtDate(r['Tanggal'])+'</td><td>'+v(r['Customer Name'])+'</td><td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v(r['Sending Item'])+'</td><td>'+v(r['No. PO'])+'</td><td>'+v(r['Man Power'])+'</td><td>'+badge(r['Status'])+'</td><td>'+cellLink(r['Surat Jalan'])+'</td><td onclick="event.stopPropagation()">'+actBtns(sec,r,ri)+'</td></tr>';
  }
  if(sec==='suppliers'){
    return '<tr'+trClick+'><td style="color:var(--blue);font-weight:600;font-size:12px">'+v(r['ID Supplier'])+'</td><td><strong>'+v(r['Nama Perusahaan Vendor/Supplier'])+'</strong></td><td>'+v(r['Kategori'])+'</td><td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v(r['Nama Barang'])+'</td><td style="text-align:right;white-space:nowrap">'+fmtRp(r['Harga Barang'])+'</td><td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v(r['Alamat Kantor / Toko'])+'</td><td>'+v(r['PIC'])+'</td><td>'+v(r['No Tlp/WA'])+'</td><td onclick="event.stopPropagation()">'+actBtns(sec,r,ri)+'</td></tr>';
  }
  return '';
}
 
// ─── Detail Drawer ────────────────────────────────────────────────────────────
var _ddSec='', _ddRowIndex=null, _ddRecord=null;
 
var DD_CONFIG = {
  'purchase-requests': {
    title: 'Purchase Request',
    idKey: 'ID Request',
    sections: [
      { label: 'Informasi Umum', fields: [
        {k:'Tanggal', lbl:'Tanggal', fmt:'date'},
        {k:'Nama Customer', lbl:'Customer'},
        {k:'Nama Item', lbl:'Nama Item'},
        {k:'Qty', lbl:'Qty'}, {k:'Uom', lbl:'UOM'},
        {k:'Spesifikasi', lbl:'Spesifikasi'},
        {k:'PMT Mode', lbl:'PMT Mode'},
      ]},
      { label: 'Harga', fields: [
        {k:'Harga Beli', lbl:'Harga Beli', fmt:'rp'},
        {k:'Harga Jual', lbl:'Harga Jual', fmt:'rp'},
        {k:'Total Harga Beli', lbl:'Total Beli', fmt:'rp', big:true},
        {k:'Total Harga Jual', lbl:'Total Jual', fmt:'rp', big:true},
        {k:'PPN 11%', lbl:'PPN 11%', fmt:'rp'},
        {k:'DPP + (PPN 11%)', lbl:'DPP + PPN 11%', fmt:'rp'},
      ]},
      { label: 'Lampiran', fields: [
        {k:'Online Shop Link', lbl:'Link Toko', fmt:'link'},
        {k:'File', lbl:'File', fmt:'link'},
      ]},
    ]
  },
  'purchase-orders': {
    title: 'Purchase Order',
    idKey: 'ID Order',
    sections: [
      { label: 'Informasi Umum', fields: [
        {k:'Tanggal', lbl:'Tanggal', fmt:'date'},
        {k:'Nama Customer', lbl:'Customer'},
        {k:'Nama Item', lbl:'Nama Item'},
        {k:'Qty', lbl:'Qty'}, {k:'Uom', lbl:'UOM'},
        {k:'Vendor/Supplier', lbl:'Vendor / Supplier'},
        {k:'No PO', lbl:'No. PO'},
      ]},
      { label: 'Harga', fields: [
        {k:'Harga Beli', lbl:'Harga Beli', fmt:'rp'},
        {k:'Harga Jual', lbl:'Harga Jual', fmt:'rp'},
        {k:'Total Beli', lbl:'Total Beli', fmt:'rp', big:true},
        {k:'Total Jual', lbl:'Total Jual', fmt:'rp', big:true},
        {k:'Profit', lbl:'Profit (%)', fmt:'pct'},
        {k:'PPN 11%', lbl:'PPN 11%', fmt:'rp'},
        {k:'Grand Total + (DPP + PPN11%)', lbl:'Grand Total', fmt:'rp'},
      ]},
      { label: 'Lampiran', fields: [
        {k:'Link Pembelian', lbl:'Link Pembelian', fmt:'link'},
        {k:'File PO', lbl:'File PO', fmt:'link'},
      ]},
    ]
  },
  'quotations': {
    title: 'Quotation',
    idKey: 'ID Quotation',
    sections: [
      { label: 'Informasi Umum', fields: [
        {k:'Tanggal', lbl:'Tanggal', fmt:'date'},
        {k:'Nama Customer', lbl:'Customer'},
        {k:'Nama Perusahaan', lbl:'Perusahaan'},
        {k:'Nama Barang', lbl:'Nama Barang'},
        {k:'Qty', lbl:'Qty'}, {k:'Uom', lbl:'UOM'},
        {k:'Status', lbl:'Status', fmt:'badge'},
      ]},
      { label: 'Harga', fields: [
        {k:'Harga', lbl:'Harga Satuan', fmt:'rp'},
        {k:'Total Harga', lbl:'Total Harga', fmt:'rp', big:true},
        {k:'Harga (PPN)', lbl:'PPN 11% Amount', fmt:'rp'},
        {k:'Grand Total + (PPN 11%)', lbl:'Grand Total + PPN', fmt:'rp', big:true},
      ]},
      { label: 'Lampiran', fields: [
        {k:'File', lbl:'File Quotation', fmt:'link'},
      ]},
    ]
  },
  'invoices': {
    title: 'Invoice',
    idKey: 'ID Invoice',
    sections: [
      { label: 'Informasi Umum', fields: [
        {k:'Tanggal Invoice', lbl:'Tgl Invoice', fmt:'date'},
        {k:'Nama Customer', lbl:'Customer'},
        {k:'Nomer PO', lbl:'No. PO'},
        {k:'Invoice Title', lbl:'Judul Invoice'},
        {k:'Jatuh Tempo', lbl:'Jatuh Tempo', fmt:'date'},
        {k:'Term of Payment', lbl:'Term of Payment'},
        {k:'Status', lbl:'Status', fmt:'badge'},
      ]},
      { label: 'Tagihan', fields: [
        {k:'Nominal Tagihan', lbl:'Nominal Tagihan', fmt:'rp', big:true},
      ]},
      { label: 'Lampiran', fields: [
        {k:'Faktur Invoice File', lbl:'Faktur Invoice', fmt:'link'},
      ]},
    ]
  },
  'status': {
    title: 'Delivery Status',
    idKey: null,
    sections: [
      { label: 'Informasi Pengiriman', fields: [
        {k:'Tanggal', lbl:'Tanggal', fmt:'date'},
        {k:'Customer Name', lbl:'Customer'},
        {k:'Sending Item', lbl:'Item Dikirim'},
        {k:'No. PO', lbl:'No. PO'},
        {k:'Man Power', lbl:'Man Power'},
        {k:'Status', lbl:'Status', fmt:'badge'},
        {k:'Surat Jalan', lbl:'Surat Jalan', fmt:'link'},
      ]},
    ]
  },
  'suppliers': {
    title: 'Supplier / Vendor',
    idKey: 'ID Supplier',
    sections: [
      { label: 'Informasi Perusahaan', fields: [
        {k:'Nama Perusahaan Vendor/Supplier', lbl:'Nama Perusahaan'},
        {k:'Kategori', lbl:'Kategori'},
        {k:'Alamat Kantor / Toko', lbl:'Alamat'},
        {k:'PIC', lbl:'PIC'},
        {k:'No Tlp/WA', lbl:'No. Tlp / WA'},
      ]},
      { label: 'Produk', fields: [
        {k:'Nama Barang', lbl:'Nama Barang'},
        {k:'Harga Barang', lbl:'Harga Barang', fmt:'rp', big:true},
      ]},
    ]
  },
};
 
function openDetailDrawer(sec, r, ri){
  _ddSec = sec; _ddRowIndex = ri; _ddRecord = r;
  var cfg = DD_CONFIG[sec];
  if(!cfg) return;
 
  // Header
  var idVal = cfg.idKey ? (r[cfg.idKey]||'—') : ('Baris #'+ri);
  document.getElementById('dd-id').textContent    = idVal;
  document.getElementById('dd-title').textContent = cfg.title;
 
  // Subtitle: nama item / nama customer
  var sub = r['Nama Item']||r['Nama Barang']||r['Invoice Title']||r['Sending Item']||r['Nama Perusahaan Vendor/Supplier']||'';
  document.getElementById('dd-subtitle').textContent = sub.length > 40 ? sub.substring(0,40)+'…' : sub;
 
  // Body
  var html = '';
  cfg.sections.forEach(function(sec_){
    html += '<div class="dd-section-label">'+sec_.label+'</div>';
    sec_.fields.forEach(function(f){
      var val = r[f.k];
      if(val===null||val===undefined||val==='') return; // skip kosong
      html += '<div class="dd-row"><span class="dd-label">'+f.lbl+'</span>';
      var fmt = f.fmt||'text';
      if(fmt==='rp'){
        var cls = f.big ? 'dd-val money' : 'dd-val';
        html += '<span class="'+cls+'">'+fmtRp(val)+'</span>';
      } else if(fmt==='profit'||fmt==='pct'){
        var totalBeli = r['Total Beli']||r['Total Harga Beli']||'0';
        html += '<span class="dd-val">'+fmtPct(val, totalBeli)+'</span>';
      } else if(fmt==='date'){
        html += '<span class="dd-val">'+fmtDate(val)+'</span>';
      } else if(fmt==='link'){
        if(val && val!=='—'){
          html += '<span class="dd-val"><a href="'+val+'" target="_blank"><i class="fas fa-external-link-alt" style="font-size:10px"></i> Lihat File</a></span>';
        } else { return; }
      } else if(fmt==='badge'){
        html += '<span class="dd-val">'+badge(val)+'</span>';
      } else {
        html += '<span class="dd-val">'+v(val)+'</span>';
      }
      html += '</div>';
    });
  });
  if(!html) html = '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:24px 0">Tidak ada detail tersedia.</p>';
  document.getElementById('dd-body').innerHTML = html;
 
  document.getElementById('detail-drawer').classList.add('open');
  document.getElementById('dd-overlay').classList.add('open');
}
 
function closeDetailDrawer(){
  document.getElementById('detail-drawer').classList.remove('open');
  document.getElementById('dd-overlay').classList.remove('open');
}
 
function ddEdit(){
  closeDetailDrawer();
  if(_ddSec && _ddRowIndex) openEdit(_ddSec, _ddRowIndex);
}
 
function ddDelete(){
  closeDetailDrawer();
  if(_ddSec && _ddRowIndex) openDelete(_ddSec, _ddRowIndex);
}
 
function actBtns(sec,r,ri){
  var fileUrl='';
  var cfg=CFG[sec];
  if(cfg){ cfg.fields.forEach(function(f){ if(f.type==='file'&&r[f.k]&&/^https?:\/\//i.test(String(r[f.k]))) fileUrl=r[f.k]; }); }
  return (fileUrl?'<button class="btn-act view" onclick="window.open(\''+fileUrl+'\',\'_blank\')"><i class="fas fa-external-link-alt"></i>Lihat</button> ':'')+
    '<button class="btn-act edit" onclick="openEdit(\''+sec+'\','+ri+')"><i class="fas fa-pencil"></i>Edit</button> '+
    '<button class="btn-act del" onclick="openDelete(\''+sec+'\','+ri+')"><i class="fas fa-trash"></i>Hapus</button>';
}
 
function filterData(data,q){ if(!q) return data; return data.filter(function(r){ return Object.values(r).some(function(x){ return x&&String(x).toLowerCase().indexOf(q)>=0; }); }); }
 
// ─── Form open/render ─────────────────────────────────────────────────────────
function openAdd(sec){
  var cfg=CFG[sec]; if(!cfg) return;
  editingRow=null; currentSection=sec;
  document.getElementById('modal-title').textContent='Tambah '+cfg.title;
  loadDropdownsIfNeeded(sec, function(){
    if(cfg.idFn){
      google.script.run
        .withSuccessHandler(function(id){ renderFormFields(cfg.fields,null,id,sec); })
        .withFailureHandler(function(){ renderFormFields(cfg.fields,null,'AUTO',sec); })
        [cfg.idFn]();
    } else {
      renderFormFields(cfg.fields,null,'',sec);
    }
    openModal('form-modal');
  });
}
 
function openEdit(sec,rowIndex){
  var cfg=CFG[sec]; if(!cfg) return;
  var row=findRowByIndex(sec,rowIndex); if(!row) return;
  editingRow=row; currentSection=sec;
  document.getElementById('modal-title').textContent='Edit '+cfg.title;
  loadDropdownsIfNeeded(sec, function(){
    renderFormFields(cfg.fields, row, null, sec);
    openModal('form-modal');
  });
}
 
function findRowByIndex(sec,ri){ return (store[sec]||[]).find(function(r){ return r._rowIndex==ri; })||null; }
 
function buildPerusahaanList(){
  var map={};
  (store['quotations']||[]).forEach(function(r){
    var v=(r['Nama Perusahaan']||'').trim();
    if(v) map[v]=1;
  });
  (store['invoices']||[]).forEach(function(r){
    var v=(r['Nama Perusahaan']||'').trim();
    if(v) map[v]=1;
  });
  perusahaanList=Object.keys(map).sort();
}
function loadDropdownsIfNeeded(sec,cb){
  if(sec==='purchase-requests'||sec==='purchase-orders'){
    if(customersList.length>0&&vendorsList.length>0){ cb(); return; }
    var done=0, needed=2;
    function check(){ if(++done===needed) cb(); }
    google.script.run.withSuccessHandler(function(r){ if(r&&r.success) customersList=r.data; check(); }).withFailureHandler(check).getCustomers();
    google.script.run.withSuccessHandler(function(r){ if(r&&r.success) vendorsList=r.data; check(); }).withFailureHandler(check).getVendors();
  } else {
    cb();
  }
}
 
function renderFormFields(fields,rowData,autoId,sec){
  var html='<div class="form-grid">';
  fields.forEach(function(f){
    var val=rowData?String(rowData[f.k]!==undefined&&rowData[f.k]!==null?rowData[f.k]:''):(f.auto&&autoId?autoId:'');
    var cls=f.col===2?'form-group span2':'form-group';
    var fId='ff-'+f.k.replace(/[^a-zA-Z0-9]/g,'-');
    html+='<div class="'+cls+'"><label class="form-lbl">'+f.lbl+(f.ro&&!f.auto?' <span class="auto-badge">auto</span>':'')+(f.auto?' <span class="auto-badge">auto-ID</span>':'')+'</label>';
    if(f.type==='textarea'){
      html+='<textarea class="form-ctrl" id="'+fId+'" '+(f.ro?'readonly':'')+'>'+(val||'')+'</textarea>';
    } else if(f.type==='file'){
      var hasUrl=val&&/^https?:\/\//i.test(val);
      html+='<div class="file-wrap"><div class="file-row">'
        +'<input type="text" class="form-ctrl" id="'+fId+'" value="'+(val||'')+'" placeholder="Paste URL atau upload file…">'
        +'<label class="btn-upload" onclick="triggerUpload(\''+fId+'\')" id="btn-ul-'+fId+'"><i class="fas fa-upload"></i>Upload</label>'
        +(hasUrl?'<a href="'+val+'" target="_blank" class="btn-act view" style="height:36px;padding:0 8px"><i class="fas fa-external-link-alt"></i></a>':'')
        +'</div><div class="file-status" id="st-'+fId+'"></div></div>';
    } else if(f.type==='customer'){
      html+='<div class="datalist-wrap"><input type="text" class="form-ctrl" id="'+fId+'" list="dl-customer" value="'+(val||'')+'" placeholder="Pilih atau ketik nama customer…"><button type="button" class="btn-add-new" onclick="clearField(\''+fId+'\')" title="Ketik nama baru"><i class="fas fa-plus"></i></button></div><datalist id="dl-customer">'+customersList.map(function(c){return '<option value="'+c+'">';}).join('')+'</datalist>';
    } else if(f.type==='perusahaan'){
      html+='<div class="datalist-wrap"><input type="text" class="form-ctrl" id="'+fId+'" list="dl-perusahaan" value="'+(val||'')+'" placeholder="Pilih atau ketik nama perusahaan…"><button type="button" class="btn-add-new" onclick="clearField(\''+fId+'\')" title="Ketik nama baru"><i class="fas fa-plus"></i></button></div><datalist id="dl-perusahaan">'+perusahaanList.map(function(p){return '<option value="'+p+'">';}).join('')+'</datalist>';
    } else if(f.type==='vendor'){
      html+='<div class="datalist-wrap"><input type="text" class="form-ctrl" id="'+fId+'" list="dl-vendor" value="'+(val||'')+'" placeholder="Pilih atau ketik nama vendor…"><button type="button" class="btn-add-new" onclick="clearField(\''+fId+'\')" title="Ketik nama baru"><i class="fas fa-plus"></i></button></div><datalist id="dl-vendor">'+vendorsList.map(function(v){return '<option value="'+v+'">';}).join('')+'</datalist>';
    } else {
      html+='<input class="form-ctrl" id="'+fId+'" type="'+f.type+'" value="'+(val||'')+'" '+(f.ro?'readonly':'')+' '+(f.ppn?'oninput="onPpnChange(\''+sec+'\')"':'')+' placeholder="'+(f.type==='date'?'':f.lbl)+'">';
    }
    html+='</div>';
  });
  html+='</div>';
  document.getElementById('modal-body').innerHTML=html;
  if(rowData) onPpnChange(sec);
}
 
// ─── PPN Auto-Calculation ─────────────────────────────────────────────────────
function getFFVal(key){ var id='ff-'+key.replace(/[^a-zA-Z0-9]/g,'-'); var el=document.getElementById(id); return el?el.value:''; }
function setFFVal(key,val){ var id='ff-'+key.replace(/[^a-zA-Z0-9]/g,'-'); var el=document.getElementById(id); if(el) el.value=val; }
 
function onPpnChange(sec){
  var qty=parseNum(getFFVal('Qty'));
  if(sec==='purchase-requests'){
    var hB=parseNum(getFFVal('Harga Beli')), hJ=parseNum(getFFVal('Harga Jual'));
    var tB=qty*hB, tJ=qty*hJ, p11=tJ*.11, p12=tJ*.12;
    setFFVal('Total Harga Beli', tB>0?Math.round(tB):'');
    setFFVal('Total Harga Jual', tJ>0?Math.round(tJ):'');
    setFFVal('PPN 11%', p11>0?Math.round(p11):'');
    setFFVal('PPN 12%', p12>0?Math.round(p12):'');
    setFFVal('DPP + (PPN 11%)', tJ>0?Math.round(tJ+p11):'');
  } else if(sec==='purchase-orders'){
    var hB=parseNum(getFFVal('Harga Beli')), hJ=parseNum(getFFVal('Harga Jual'));
    var tB=qty*hB, tJ=qty*hJ, pr=tJ-tB, p11=tJ*.11, p12=tJ*.12;
    var prPct = (tB!==0) ? ((pr/tB)*100) : 0;
    setFFVal('Total Beli', tB>0?Math.round(tB):'');
    setFFVal('Total Jual', tJ>0?Math.round(tJ):'');
    setFFVal('Profit', (tJ!==0||tB!==0)?parseFloat(prPct.toFixed(2)):'' );
    setFFVal('PPN 11%', p11>0?Math.round(p11):'');
    setFFVal('PPN 12%', p12>0?Math.round(p12):'');
    setFFVal('DPP PPH', tJ>0?Math.round(tJ):'');
    setFFVal('Grand Total + (DPP + PPN11%)', tJ>0?Math.round(tJ+p11):'');
  } else if(sec==='quotations'){
    var hr=parseNum(getFFVal('Harga'));
    var tH=qty*hr, pAmt=tH*.11;
    setFFVal('Total Harga', tH>0?Math.round(tH):'');
    setFFVal('Harga (PPN)', pAmt>0?Math.round(pAmt):'');
    setFFVal('Grand Total + (PPN 11%)', tH>0?Math.round(tH+pAmt):'');
  }
}
 
// ─── Form submit ──────────────────────────────────────────────────────────────
function submitForm(){
  var cfg=CFG[currentSection]; if(!cfg) return;
  var rowData={};
  cfg.fields.forEach(function(f){
    var id='ff-'+f.k.replace(/[^a-zA-Z0-9]/g,'-');
    var el=document.getElementById(id);
    if(el) rowData[f.k]=el.value;
  });
  var btn=document.getElementById('modal-save-btn');
  btn.disabled=true;
  document.getElementById('modal-save-sp').style.display='inline-flex';
  var rowIndex=editingRow?editingRow._rowIndex:0;
  google.script.run
    .withSuccessHandler(function(r){
      btn.disabled=false;
      document.getElementById('modal-save-sp').style.display='none';
      if(r&&r.success){
        showToast(editingRow?'Data berhasil diupdate':'Data berhasil ditambahkan','success');
        var _lid=cfg.idKey?(rowData[cfg.idKey]||''):''; var _lcu=rowData['Nama Customer']||rowData['Customer Name']||rowData['Nama Perusahaan Vendor/Supplier']||'';
        logActivity(editingRow?'Edit':'Tambah',currentSection,_lid,_lcu);
        // Clear form body langsung sebelum close agar tidak ada flash data lama
        document.getElementById('modal-body').innerHTML='';
        closeModal('form-modal');
        reloadSection(currentSection);
      } else {
        showToast((r&&r.error)||'Gagal menyimpan','error');
      }
    })
    .withFailureHandler(function(e){
      btn.disabled=false;
      document.getElementById('modal-save-sp').style.display='none';
      showToast((e&&e.message)||'Gagal menyimpan','error');
    })
    .saveRecord(cfg.sheet, rowData, rowIndex);
}
 
function reloadSection(sec){ loaded[sec]=false; loadSection(sec); }
 
// ─── Refresh per section (dengan animasi tombol) ──────────────────────────────
function refreshSec(sec){
  var btn=document.getElementById('ref-'+sec);
  if(btn){ btn.classList.add('loading'); btn.disabled=true; }
  loaded[sec]=false;
  var map={
    'dashboard':'getDashboardData',
    'purchase-requests':'getPurchaseRequests','purchase-orders':'getPurchaseOrders',
    'quotations':'getQuotations','invoices':'getInvoices','status':'getDeliveryStatus','suppliers':'getSuppliers'
  };
  if(!map[sec]){ if(btn){btn.classList.remove('loading');btn.disabled=false;} return; }
  google.script.run
    .withSuccessHandler(function(r){
      if(btn){btn.classList.remove('loading');btn.disabled=false;}
      onData(sec,r);
      showToast('Data '+sec+' berhasil diperbarui','success');
    })
    .withFailureHandler(function(e){
      if(btn){btn.classList.remove('loading');btn.disabled=false;}
      loaded[sec]=false;
      showToast((e&&e.message)||'Gagal refresh','error');
    })
    [map[sec]]();
}
 
// ─── Refresh Semua halaman sekaligus ──────────────────────────────────────────
function refreshAll(){
  var btn=document.getElementById('btn-refresh-all');
  var ico=document.getElementById('ico-refresh-all');
  if(btn){btn.disabled=true;}
  if(ico){ico.style.animation='spin .7s linear infinite';}
  store={}; loaded={};
  // Reload dashboard + halaman yang sedang aktif
  var secs=['dashboard','purchase-requests','purchase-orders','quotations','invoices','status','suppliers'];
  var pending=secs.length, done=0;
  function finish(){
    done++;
    if(done>=pending){
      if(btn){btn.disabled=false;}
      if(ico){ico.style.animation='';}
      showToast('Semua data berhasil disinkronisasi','success');
    }
  }
  secs.forEach(function(s){
    loaded[s]=false;
    loadSection(s);
    // Simulasi selesai setelah loadSection (loadSection callbacks handle rendering)
    setTimeout(finish, 3000);
  });
  // Juga trigger refresh visual di semua tombol refresh section
  ['purchase-requests','purchase-orders','quotations','invoices','status','suppliers'].forEach(function(s){
    var rb=document.getElementById('ref-'+s);
    if(rb){rb.classList.add('loading');}
    setTimeout(function(){var rb2=document.getElementById('ref-'+s);if(rb2)rb2.classList.remove('loading');},2500);
  });
}
 
// ─── Delete ───────────────────────────────────────────────────────────────────
function openDelete(sec,rowIndex){
  deleteSection=sec;
  deletingRow=findRowByIndex(sec,rowIndex);
  if(deletingRow) openModal('del-modal');
}
 
function confirmDelete(){
  if(!deletingRow||!deleteSection) return;
  var btn=document.getElementById('del-confirm-btn');
  btn.disabled=true;
  var cfg=CFG[deleteSection];
  google.script.run
    .withSuccessHandler(function(r){
      btn.disabled=false;
      if(r&&r.success){
        showToast('Data berhasil dihapus','success');
        var _dlid=cfg.idKey?(deletingRow[cfg.idKey]||''):''; var _dlcu=deletingRow['Nama Customer']||deletingRow['Customer Name']||deletingRow['Nama Perusahaan Vendor/Supplier']||'';
        logActivity('Hapus',deleteSection,_dlid,_dlcu);
        closeModal('del-modal');
        reloadSection(deleteSection);
      } else {
        showToast((r&&r.error)||'Gagal menghapus','error');
      }
    })
    .withFailureHandler(function(e){
      btn.disabled=false;
      showToast((e&&e.message)||'Gagal menghapus','error');
    })
    .deleteRow(cfg.sheet, deletingRow._rowIndex);
}
 
// ─── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){
  document.getElementById(id).classList.remove('open');
  editingRow=null;
  // Bersihkan form setiap kali modal ditutup agar input selalu fresh saat dibuka kembali
  if(id==='form-modal'){
    setTimeout(function(){ document.getElementById('modal-body').innerHTML=''; },200);
  }
}
 
// ─── File upload ──────────────────────────────────────────────────────────────
function triggerUpload(fieldId){ activeFileField=fieldId; document.getElementById('hidden-file-input').value=''; document.getElementById('hidden-file-input').click(); }
function clearField(id){ var el=document.getElementById(id); if(el){ el.value=''; el.focus(); } }
 
// Ukuran maksimal per chunk: 3 MB dalam Base64 ≈ 2.25 MB data biner
// PropertiesService GAS punya batas 9 KB per property, tapi kita pakai 256 KB per chunk
// Batas total script properties = 500 KB, jadi pakai chunk 180 KB Base64 (≈ 135 KB biner)
var UPLOAD_CHUNK_SIZE = 180 * 1024; // 180 KB per chunk (Base64 chars)
 
function handleFileChange(input){
  var file=input.files[0]; if(!file||!activeFileField) return;
  var stEl  = document.getElementById('st-'+activeFileField);
  var btnEl = document.getElementById('btn-ul-'+activeFileField);
  var fid   = activeFileField;
  var sec   = currentSection; // simpan section saat upload dipicu
 
  if(file.size > 50*1024*1024){
    if(stEl) stEl.textContent='❌ File terlalu besar (maks 50 MB)';
    showToast('File melebihi batas 50 MB','error'); return;
  }
 
  // Subfolder level-2: nama item/barang dari field yang relevan
  var itemFieldKey  = ITEM_NAME_FIELD[sec] || '';
  var subFolderName = itemFieldKey ? (getFFVal(itemFieldKey)||'').trim() : '';
 
  // Label folder untuk info ke user
  var menuLabels = {
    'purchase-requests':'Purchase Request','purchase-orders':'Purchase Order',
    'quotations':'Quotation','invoices':'Invoice',
    'status':'Delivery Status','suppliers':'Supplier Vendor'
  };
  var menuLabel = menuLabels[sec] || sec || '';
  var pathInfo  = menuLabel + (subFolderName ? ' / '+subFolderName : '');
 
  if(stEl) stEl.textContent='Membaca file…';
  if(btnEl){ btnEl.disabled=true; btnEl.innerHTML='<i class="fas fa-circle-notch fa-spin"></i>'; }
 
  var reader = new FileReader();
  reader.onerror = function(){
    if(btnEl){ btnEl.disabled=false; btnEl.innerHTML='<i class="fas fa-upload"></i>Upload'; }
    if(stEl) stEl.textContent='❌ Gagal membaca file.';
    showToast('Gagal membaca file','error');
  };
  reader.onload = function(e){
    var fullB64 = e.target.result.split(',')[1];
 
    if(fullB64.length <= 3*1024*1024){
      // ── Single-shot ────────────────────────────────────────────
      if(stEl) stEl.textContent='⬆ Mengupload '+file.name+' → 📁 '+pathInfo+'…';
      google.script.run
        .withSuccessHandler(function(r){ _onUploadDone(r, fid, stEl, btnEl); })
        .withFailureHandler(function(err){ _onUploadFail(err, stEl, btnEl); })
        .uploadFileToDrive(fullB64, file.name, file.type, subFolderName, sec);
    } else {
      // ── Chunked ────────────────────────────────────────────────
      var chunks = [];
      for(var pos=0; pos<fullB64.length; pos+=UPLOAD_CHUNK_SIZE)
        chunks.push(fullB64.substring(pos, pos+UPLOAD_CHUNK_SIZE));
      var totalChunks = chunks.length;
      if(stEl) stEl.textContent='⬆ Inisialisasi upload '+totalChunks+' bagian → 📁 '+pathInfo+'…';
 
      google.script.run
        .withSuccessHandler(function(initR){
          if(!initR||!initR.success){
            _onUploadFail({message:(initR&&initR.error)||'Init gagal'}, stEl, btnEl); return;
          }
          _sendChunk(initR.tempKey, chunks, 0, totalChunks, file.name, stEl, btnEl, fid);
        })
        .withFailureHandler(function(err){ _onUploadFail(err, stEl, btnEl); })
        .initChunkedUpload(file.name, file.type, subFolderName, sec);
    }
  };
  reader.readAsDataURL(file);
}
 
function _sendChunk(tempKey, chunks, idx, total, fileName, stEl, btnEl, fid){
  if(stEl) stEl.textContent='⬆ Mengirim bagian '+(idx+1)+'/'+total+' ('+fileName+')…';
  google.script.run
    .withSuccessHandler(function(r){
      if(!r||!r.success){
        _onUploadFail({message:(r&&r.error)||'Chunk gagal'}, stEl, btnEl); return;
      }
      if(idx+1 < total){
        // Kirim chunk berikutnya
        _sendChunk(tempKey, chunks, idx+1, total, fileName, stEl, btnEl, fid);
      } else {
        // Langkah 3: finalize
        if(stEl) stEl.textContent='⏳ Menggabungkan file…';
        google.script.run
          .withSuccessHandler(function(fr){ _onUploadDone(fr, fid, stEl, btnEl); })
          .withFailureHandler(function(err){ _onUploadFail(err, stEl, btnEl); })
          .finalizeChunkedUpload(tempKey);
      }
    })
    .withFailureHandler(function(err){ _onUploadFail(err, stEl, btnEl); })
    .appendChunk(tempKey, chunks[idx], idx);
}
 
function _onUploadDone(r, fid, stEl, btnEl){
  if(btnEl){ btnEl.disabled=false; btnEl.innerHTML='<i class="fas fa-upload"></i>Upload'; }
  if(r&&r.success){
    var el=document.getElementById(fid);
    if(el) el.value=r.url;
    var path = r.folderPath || r.folderName || '';
    var folderInfo = path ? ' &nbsp;<span style="color:#64748b;font-size:10px">📁 '+path+'</span>' : '';
    if(stEl) stEl.innerHTML='<a href="'+r.url+'" target="_blank" style="color:var(--green);font-size:11px"><i class="fas fa-check-circle"></i> Tersimpan di Drive'+folderInfo+' — <u>Lihat file</u></a>';
    showToast('✅ File tersimpan di Drive'+(path?' → '+path:''),'success');
  } else {
    if(stEl) stEl.textContent='❌ Upload gagal: '+(r&&r.error?r.error:'Error tidak diketahui');
    showToast('Upload gagal: '+((r&&r.error)||'Error tidak diketahui'),'error');
  }
}
 
function _onUploadFail(err, stEl, btnEl){
  if(btnEl){ btnEl.disabled=false; btnEl.innerHTML='<i class="fas fa-upload"></i>Upload'; }
  var msg = (err&&err.message) ? err.message : JSON.stringify(err||'Unknown error');
  if(stEl) stEl.textContent='❌ Error: '+msg;
  showToast('Upload error: '+msg,'error');
}
 
// ─── Theme Management ────────────────────────────────────────────────────────
function applyTheme(){
  var theme = '';
  try { theme = localStorage.getItem('bms_theme') || 'light'; } catch(e){ theme='light'; }
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeButtons(theme);
}
 
function setTheme(mode){
  try { localStorage.setItem('bms_theme', mode); } catch(e){}
  document.documentElement.setAttribute('data-theme', mode);
  updateThemeButtons(mode);
  showToast(mode==='dark'?'Mode Gelap aktif 🌙':'Mode Terang aktif ☀️','success');
}
 
function updateThemeButtons(mode){
  var lb=document.getElementById('btn-theme-light');
  var db=document.getElementById('btn-theme-dark');
  var td=document.getElementById('theme-desc');
  if(lb){ lb.className='theme-btn'+(mode==='light'?' active':''); }
  if(db){ db.className='theme-btn'+(mode==='dark'?' active':''); }
  if(td){ td.textContent = mode==='dark' ? 'Mode Gelap aktif — tampilan lebih nyaman di malam hari' : 'Mode Terang aktif — tampilan standar siang hari'; }
}
 
// ─── Account Section ─────────────────────────────────────────────────────────
function openAccountSection(){
  if(!currentUser) return;
  // Isi field dari currentUser dan localStorage
  var un = document.getElementById('acc-username');
  var dn = document.getElementById('acc-display-name-input');
  var em = document.getElementById('acc-email');
  var dnDisp = document.getElementById('acc-display-name');
  var roleDisp = document.getElementById('acc-display-role');
  if(un) un.value = currentUser.username || '';
  if(dn) dn.value = currentUser.name || '';
  if(em) try { em.value = localStorage.getItem('bms_email_'+currentUser.username)||''; } catch(e){}
  if(dnDisp) dnDisp.textContent = currentUser.name || currentUser.username || '—';
  if(roleDisp) roleDisp.textContent = currentUser.role || 'User';
  // Foto profil
  try {
    var photoUrl = localStorage.getItem('bms_photo_'+currentUser.username);
    updateProfilePhotoDisplay(photoUrl);
  } catch(e){}
  // Tema
  var theme = '';
  try { theme = localStorage.getItem('bms_theme')||'light'; } catch(e){ theme='light'; }
  updateThemeButtons(theme);
  // Kosongkan field password
  ['acc-old-pw','acc-new-pw','acc-confirm-pw'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
}
 
function updateProfilePhotoDisplay(photoUrl){
  var img = document.getElementById('acc-photo');
  var sbImg = document.getElementById('sb-avatar-img');
  var sbPh = document.getElementById('sb-avatar-ph');
  // Terima URL https:// maupun data:image/ (base64)
  if(photoUrl && ((/^https?:\/\//i.test(photoUrl)) || (/^data:image\//i.test(photoUrl)))){
    if(img){ img.src = photoUrl; }
    if(sbImg){ sbImg.src = photoUrl; sbImg.classList.remove('hidden'); }
    if(sbPh){ sbPh.classList.add('hidden'); }
  } else {
    if(img){ img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='48' fill='%23c2d9ef'/%3E%3Ccircle cx='48' cy='36' r='18' fill='%23fff'/%3E%3Cellipse cx='48' cy='86' rx='30' ry='22' fill='%23fff'/%3E%3C/svg%3E"; }
    if(sbImg){ sbImg.classList.add('hidden'); }
    if(sbPh){ sbPh.classList.remove('hidden'); }
  }
}
 
function triggerProfilePhotoUpload(){
  document.getElementById('profile-photo-input').value='';
  document.getElementById('profile-photo-input').click();
}
 
function handleProfilePhotoChange(input){
  var file = input.files[0];
  if(!file||!currentUser) return;
  if(file.size > 3*1024*1024){ showToast('Foto maksimal 3MB','error'); return; }
  var btn = document.querySelector('.acc-photo-btn');
  if(btn){ btn.innerHTML='<i class="fas fa-circle-notch fa-spin"></i>'; btn.disabled=true; }

  var reader = new FileReader();
  reader.onload = function(e){
    var originalDataUrl = e.target.result;

    // Kompres gambar via canvas sebelum disimpan
    var img = new Image();
    img.onload = function(){
      var canvas = document.createElement('canvas');
      var MAX = 400;
      var ratio = Math.min(MAX/img.width, MAX/img.height, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var compressed = canvas.toDataURL('image/jpeg', 0.82);

      try {
        localStorage.setItem('bms_photo_'+currentUser.username, compressed);
      } catch(ex){
        // Jika localStorage penuh, coba simpan tanpa kompresi ulang
        try { localStorage.setItem('bms_photo_'+currentUser.username, originalDataUrl); } catch(ex2){
          showToast('Penyimpanan lokal penuh. Coba foto yang lebih kecil.','error');
          if(btn){ btn.innerHTML='<i class="fas fa-camera"></i>'; btn.disabled=false; }
          return;
        }
      }

      if(btn){ btn.innerHTML='<i class="fas fa-camera"></i>'; btn.disabled=false; }
      updateProfilePhotoDisplay(compressed);
      showToast('Foto profil berhasil diperbarui!','success');

      // Opsional: coba sync ke Google Drive jika tersedia
      try {
        var b64 = compressed.split(',')[1];
        var fileName = 'profile_'+currentUser.username+'_'+Date.now()+'.jpg';
        google.script.run
          .withSuccessHandler(function(r){
            if(r&&r.success&&r.url){
              try { localStorage.setItem('bms_photo_'+currentUser.username, r.url); } catch(ex){}
              updateProfilePhotoDisplay(r.url);
            }
          })
          .withFailureHandler(function(){})
          .updateUserPhotoUrl && google.script.run.uploadFileToDrive(b64, fileName, 'image/jpeg', currentUser.username, 'profile-photos');
      } catch(ex){}
    };
    img.onerror = function(){
      // fallback simpan langsung tanpa canvas
      try { localStorage.setItem('bms_photo_'+currentUser.username, originalDataUrl); } catch(ex){}
      if(btn){ btn.innerHTML='<i class="fas fa-camera"></i>'; btn.disabled=false; }
      updateProfilePhotoDisplay(originalDataUrl);
      showToast('Foto profil berhasil diperbarui!','success');
    };
    img.src = originalDataUrl;
  };
  reader.onerror = function(){
    if(btn){ btn.innerHTML='<i class="fas fa-camera"></i>'; btn.disabled=false; }
    showToast('Gagal membaca file foto.','error');
  };
  reader.readAsDataURL(file);
}
 
function saveAccountInfo(){
  if(!currentUser) return;
  var newName = (document.getElementById('acc-display-name-input')||{}).value||'';
  var email   = (document.getElementById('acc-email')||{}).value||'';
  if(!newName.trim()){ showToast('Nama tampilan tidak boleh kosong','error'); return; }
  var btn = document.getElementById('acc-info-btn');
  var sp  = document.getElementById('acc-info-sp');
  if(btn) btn.disabled=true;
  if(sp) sp.classList.remove('hidden');
  // Simpan email di localStorage
  try { localStorage.setItem('bms_email_'+currentUser.username, email); } catch(e){}
  // Update nama di Google Sheet
  google.script.run
    .withSuccessHandler(function(r){
      if(btn) btn.disabled=false;
      if(sp) sp.classList.add('hidden');
      if(r&&r.success){
        currentUser.name = newName;
        try { localStorage.setItem('pms_user', JSON.stringify(currentUser)); } catch(e){}
        document.getElementById('sb-name').textContent = newName;
        document.getElementById('acc-display-name').textContent = newName;
        showToast('Profil berhasil disimpan','success');
      } else {
        showToast((r&&r.error)||'Gagal menyimpan profil','error');
      }
    })
    .withFailureHandler(function(err){
      if(btn) btn.disabled=false;
      if(sp) sp.classList.add('hidden');
      showToast((err&&err.message)||'Gagal menyimpan profil','error');
    })
    .updateUserProfile(currentUser.username, newName.trim());
}
 
function changePassword(){
  if(!currentUser) return;
  var oldPw   = (document.getElementById('acc-old-pw')||{}).value||'';
  var newPw   = (document.getElementById('acc-new-pw')||{}).value||'';
  var confPw  = (document.getElementById('acc-confirm-pw')||{}).value||'';
  if(!oldPw||!newPw||!confPw){ showToast('Semua field password harus diisi','error'); return; }
  if(newPw.length < 6){ showToast('Password baru minimal 6 karakter','error'); return; }
  if(newPw !== confPw){ showToast('Konfirmasi password tidak cocok','error'); return; }
  var btn = document.getElementById('acc-pw-btn');
  var sp  = document.getElementById('acc-pw-sp');
  if(btn) btn.disabled=true;
  if(sp) sp.classList.remove('hidden');
  google.script.run
    .withSuccessHandler(function(r){
      if(btn) btn.disabled=false;
      if(sp) sp.classList.add('hidden');
      if(r&&r.success){
        ['acc-old-pw','acc-new-pw','acc-confirm-pw'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
        showToast('Password berhasil diubah','success');
      } else {
        showToast((r&&r.error)||'Gagal mengganti password','error');
      }
    })
    .withFailureHandler(function(err){
      if(btn) btn.disabled=false;
      if(sp) sp.classList.add('hidden');
      showToast((err&&err.message)||'Gagal mengganti password','error');
    })
    .updateUserPassword(currentUser.username, oldPw, newPw);
}
 
function toggleAccPw(inputId, iconId){
  var el = document.getElementById(inputId);
  var ic = document.getElementById(iconId);
  if(!el||!ic) return;
  var isPass = el.type === 'password';
  el.type = isPass ? 'text' : 'password';
  ic.className = 'fas fa-eye' + (isPass ? '-slash' : '');
}
 
// ─── Extra / Media ────────────────────────────────────────────────────────────
var mediaTab='youtube';
function switchMediaTab(tab){
  mediaTab=tab;
  ['youtube','youtube-music','spotify'].forEach(function(t){
    var btn=document.getElementById('mtab-'+t);
    if(btn) btn.className='media-tab'+(t===tab?' active':'');
  });
  var hints={'youtube':'Tempel link video atau playlist YouTube','youtube-music':'Tempel link playlist YouTube Music (diputar via YouTube)','spotify':'Tempel link playlist, album, atau track Spotify'};
  var hintEl=document.getElementById('media-hint');if(hintEl)hintEl.textContent=hints[tab]||'';
  var sp=document.getElementById('spotify-presets');
  if(sp) sp.style.display=tab==='spotify'?'flex':'none';
  var inp=document.getElementById('media-url-input');
  if(inp){inp.value='';inp.placeholder=tab==='spotify'?'https://open.spotify.com/playlist/...':'https://www.youtube.com/watch?v=...';}
}
function setMediaPreset(url){var inp=document.getElementById('media-url-input');if(inp)inp.value=url;}
function parseYouTubeEmbed(url){
  try{var u=new URL(url.trim());
    if(u.hostname==='youtu.be') return 'https://www.youtube.com/embed/'+u.pathname.slice(1)+'?autoplay=1';
    var vid=u.searchParams.get('v');var list=u.searchParams.get('list');
    if(!vid&&list) return 'https://www.youtube.com/embed/videoseries?list='+list+'&autoplay=1';
    if(vid) return 'https://www.youtube.com/embed/'+vid+'?autoplay=1'+(list?'&list='+list:'');
  }catch(e){}return '';
}
function parseSpotifyEmbed(url){
  try{var u=new URL(url.trim());if(u.hostname==='open.spotify.com') return 'https://open.spotify.com/embed'+u.pathname+'?utm_source=generator&theme=0';}catch(e){}return '';
}
function playMedia(){
  var raw=((document.getElementById('media-url-input')||{}).value||'').trim();
  if(!raw) return;
  var embedUrl=mediaTab==='spotify'?parseSpotifyEmbed(raw):parseYouTubeEmbed(raw);
  if(!embedUrl){showToast('URL tidak valid atau tidak didukung','error');return;}
  var iframe=document.getElementById('media-iframe');
  var empty=document.getElementById('media-empty-state');
  var badge=document.getElementById('media-playing-badge');
  var label=document.getElementById('media-playing-label');
  var stopBtn=document.getElementById('btn-stop-media');
  if(iframe){iframe.src=embedUrl;iframe.style.display='block';}
  if(empty) empty.style.display='none';
  if(badge) badge.style.display='flex';
  if(label){var lbl={'youtube':'YouTube sedang diputar','youtube-music':'YouTube Music sedang diputar','spotify':'Spotify sedang diputar'};label.textContent=lbl[mediaTab]||'Sedang diputar';}
  if(stopBtn) stopBtn.style.display='inline-flex';
  ['youtube','youtube-music','spotify'].forEach(function(t){var dot=document.getElementById('mdot-'+t);if(dot)dot.className='dot'+(t===mediaTab?'':' hidden');});
}
function stopMedia(){
  var iframe=document.getElementById('media-iframe');
  var empty=document.getElementById('media-empty-state');
  var badge=document.getElementById('media-playing-badge');
  var stopBtn=document.getElementById('btn-stop-media');
  if(iframe){iframe.src='about:blank';iframe.style.display='none';}
  if(empty) empty.style.display='flex';
  if(badge) badge.style.display='none';
  if(stopBtn) stopBtn.style.display='none';
  ['youtube','youtube-music','spotify'].forEach(function(t){var dot=document.getElementById('mdot-'+t);if(dot)dot.className='dot hidden';});
}
 
// ─── Report & Export ──────────────────────────────────────────────────────────
var rptData=null;
var MODULE_SHEET_MAP={'purchase-request':'purchase-requests','purchase-order':'purchase-orders','quotation':'quotations','invoice':'invoices','delivery-status':'status','supplier':'suppliers'};
var MODULE_LABELS_RPT={'purchase-request':'Purchase Request','purchase-order':'Purchase Order','quotation':'Quotation','invoice':'Invoice','delivery-status':'Delivery Status','supplier':'Supplier / Vendor'};
 
function onRptModuleChange(){
  var mod=(document.getElementById('rpt-module')||{}).value||'';
  var df=document.getElementById('rpt-date-filters');
  if(df) df.style.display=mod==='supplier'?'none':'block';
}
function generateReport(){
  var mod=(document.getElementById('rpt-module')||{}).value||'';
  var sec=MODULE_SHEET_MAP[mod];if(!sec)return;
  var year=(document.getElementById('rpt-year')||{}).value||'';
  var month=(document.getElementById('rpt-month')||{}).value||'';
  var dateFrom=(document.getElementById('rpt-date-from')||{}).value||'';
  var dateTo=(document.getElementById('rpt-date-to')||{}).value||'';
  var btn=document.getElementById('btn-generate-report');
  var sp=document.getElementById('rpt-sp');var ico=document.getElementById('rpt-ico');
  if(btn)btn.disabled=true;if(sp)sp.classList.remove('hidden');if(ico)ico.style.display='none';
  var processData=function(data){
    var dateKeys={'purchase-request':'Tanggal','purchase-order':'Tanggal','quotation':'Tanggal','invoice':'Tanggal Invoice','delivery-status':'Tanggal','supplier':null};
    var dk=dateKeys[mod];
    var filtered=data.filter(function(r){
      if(!dk||(year===''&&month===''&&dateFrom===''&&dateTo==='')) return true;
      var d=r[dk];if(!d)return true;var dt=new Date(d);if(isNaN(dt))return true;
      if(dateFrom&&new Date(dateFrom)>dt)return false;
      if(dateTo&&new Date(dateTo)<dt)return false;
      if(year&&String(dt.getFullYear())!==year)return false;
      if(month&&String(dt.getMonth()+1).padStart(2,'0')!==month)return false;
      return true;
    });
    rptData={mod:mod,rows:filtered};renderReportPreview(mod,filtered);
    if(btn)btn.disabled=false;if(sp)sp.classList.add('hidden');if(ico)ico.style.display='';
    if(filtered.length===0)showToast('Tidak ada data untuk filter ini','error');
    else showToast(filtered.length+' data berhasil dimuat','success');
  };
  if(store[sec]&&store[sec].length>0){processData(store[sec]);}
  else{
    var fnMap={'purchase-requests':'getPurchaseRequests','purchase-orders':'getPurchaseOrders','quotations':'getQuotations','invoices':'getInvoices','status':'getDeliveryStatus','suppliers':'getSuppliers'};
    if(!fnMap[sec]){if(btn)btn.disabled=false;if(sp)sp.classList.add('hidden');if(ico)ico.style.display='';return;}
    google.script.run
      .withSuccessHandler(function(r){
        if(r&&r.success){store[sec]=r.data;loaded[sec]=true;processData(r.data);}
        else{if(btn)btn.disabled=false;if(sp)sp.classList.add('hidden');if(ico)ico.style.display='';showToast((r&&r.error)||'Gagal memuat','error');}
      })
      .withFailureHandler(function(e){
        if(btn)btn.disabled=false;if(sp)sp.classList.add('hidden');if(ico)ico.style.display='';
        showToast((e&&e.message)||'Gagal memuat','error');
      })[fnMap[sec]]();
  }
}
function getRptHeaders(mod){
  var h={'purchase-request':['ID Request','Tanggal','Customer','Nama Item','Qty','Harga Beli','Harga Jual','Total Beli','Total Jual','PMT Mode'],'purchase-order':['ID Order','Tanggal','Customer','Nama Item','Qty','Vendor','Harga Beli','Harga Jual','Total Beli','Total Jual','Profit','No PO'],'quotation':['ID Quotation','Tanggal','Customer','Nama Barang','Qty','Harga','Total Harga','Grand Total PPN 11%','Status'],'invoice':['ID Invoice','Tanggal','Customer','No PO','Invoice Title','Nominal','Jatuh Tempo','Term','Status'],'delivery-status':['Tanggal','Customer','Sending Item','No PO','Man Power','Status'],'supplier':['ID Supplier','Perusahaan/Vendor','Kategori','Nama Barang','Harga','Alamat','PIC','No Tlp/WA']};
  return h[mod]||[];
}
function getRptRow(mod,r){
  if(mod==='purchase-request') return [r['ID Request'],fmtDate(r['Tanggal']),r['Nama Customer'],r['Nama Item'],r['Qty'],r['Harga Beli'],r['Harga Jual'],r['Total Harga Beli'],r['Total Harga Jual'],r['PMT Mode']];
  if(mod==='purchase-order')   return [r['ID Order'],fmtDate(r['Tanggal']),r['Nama Customer'],r['Nama Item'],r['Qty'],r['Vendor/Supplier'],r['Harga Beli'],r['Harga Jual'],r['Total Beli'],r['Total Jual'],(r['Total Beli']&&r['Profit']?(parseFloat(String(r['Profit']).replace(/[^0-9.\-]/g,''))||0).toFixed(2)+'%':r['Profit']||'—'),r['No PO']];
  if(mod==='quotation')        return [r['ID Quotation'],fmtDate(r['Tanggal']),r['Nama Customer'],r['Nama Barang'],r['Qty'],r['Harga'],r['Total Harga'],r['Grand Total + (PPN 11%)'],r['Status']];
  if(mod==='invoice')          return [r['ID Invoice'],fmtDate(r['Tanggal Invoice']),r['Nama Customer'],r['Nomer PO'],r['Invoice Title'],r['Nominal Tagihan'],fmtDate(r['Jatuh Tempo']),r['Term of Payment'],r['Status']];
  if(mod==='delivery-status')  return [fmtDate(r['Tanggal']),r['Customer Name'],r['Sending Item'],r['No. PO'],r['Man Power'],r['Status']];
  if(mod==='supplier')         return [r['ID Supplier'],r['Nama Perusahaan Vendor/Supplier'],r['Kategori'],r['Nama Barang'],r['Harga Barang'],r['Alamat Kantor / Toko'],r['PIC'],r['No Tlp/WA']];
  return [];
}
function renderReportPreview(mod,rows){
  var headers=getRptHeaders(mod);
  var empty=document.getElementById('rpt-empty');var preview=document.getElementById('rpt-preview');
  var titleEl=document.getElementById('rpt-preview-title');var metaEl=document.getElementById('rpt-preview-meta');
  var thead=document.getElementById('rpt-thead');var tbody=document.getElementById('rpt-tbody');
  var expBtns=document.getElementById('rpt-export-btns');var csvInfo=document.getElementById('rpt-csv-info');
  if(empty)empty.style.display='none';if(preview)preview.style.display='block';
  if(titleEl)titleEl.textContent=MODULE_LABELS_RPT[mod]||mod;
  if(metaEl)metaEl.textContent=rows.length+' records';
  if(thead)thead.innerHTML=headers.map(function(h){return '<th style="white-space:nowrap">'+h+'</th>';}).join('');
  if(tbody){
    if(rows.length===0){tbody.innerHTML='<tr><td colspan="'+headers.length+'" class="empty-state">Tidak ada data untuk filter ini</td></tr>';}
    else{
      var html=rows.slice(0,300).map(function(r){return '<tr>'+getRptRow(mod,r).map(function(c){return '<td>'+v(c)+'</td>';}).join('')+'</tr>';}).join('');
      if(rows.length>300) html+='<tr><td colspan="'+headers.length+'" style="text-align:center;color:#94a3b8;font-style:italic;padding:12px">...dan '+(rows.length-300)+' baris lainnya (download CSV untuk data lengkap)</td></tr>';
      tbody.innerHTML=html;
    }
  }
  if(expBtns)expBtns.style.display='block';if(csvInfo)csvInfo.textContent=rows.length+' baris data';
}
function exportRptCSV(){
  if(!rptData||!rptData.rows)return;
  var headers=getRptHeaders(rptData.mod);
  var csvRows=[headers.join(',')];
  rptData.rows.forEach(function(r){
    var cols=getRptRow(rptData.mod,r).map(function(c){
      var s=String(c==null?'':c);
      if(s.indexOf(',')>=0||s.indexOf('"')>=0||s.indexOf('\n')>=0) s='"'+s.replace(/"/g,'""')+'"';
      return s;
    });
    csvRows.push(cols.join(','));
  });
  var csv='\ufeff'+csvRows.join('\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=(MODULE_LABELS_RPT[rptData.mod]||rptData.mod).replace(/\//g,'-')+'_Report_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();URL.revokeObjectURL(url);
  showToast('File CSV berhasil diunduh','success');
}
function exportRptPDF(){
  if(!rptData||!rptData.rows)return;
  var headers=getRptHeaders(rptData.mod);var rows=rptData.rows;
  var modName=MODULE_LABELS_RPT[rptData.mod]||rptData.mod;
  var rowsHtml=rows.slice(0,500).map(function(r,i){
    return '<tr style="background:'+(i%2===0?'#f8fafc':'#fff')+'">'+getRptRow(rptData.mod,r).map(function(c){return '<td>'+v(c)+'</td>';}).join('')+'</tr>';
  }).join('');
  var html='<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>'+modName+' Report</title><style>'+
    'body{font-family:Arial,sans-serif;font-size:10px;color:#1a1a1a;padding:10px 14px}@page{size:A4 landscape;margin:7mm}'+
    'h2{font-size:13px;margin:0 0 3px;color:#1a5cad}p{color:#64748b;font-size:9px;margin:0 0 10px}'+
    'table{width:100%;border-collapse:collapse}th{background:#1a5cad;color:#fff;padding:5px 7px;font-size:9px;text-align:left;border:1px solid #1354a0;white-space:nowrap}'+
    'td{padding:4px 7px;border:1px solid #d1d5db;vertical-align:top;font-size:9px}'+
    '.pbtn{position:fixed;bottom:14px;right:14px;background:#1a5cad;color:#fff;border:none;padding:7px 18px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer}@media print{.pbtn{display:none}}'+
    '</style></head><body>'+
    '<button class="pbtn" onclick="window.print()">🖨 Cetak / Simpan PDF</button>'+
    '<h2>'+modName+' — Laporan Data</h2>'+
    '<p>Tanggal: '+new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})+' | Total: '+rows.length+' records</p>'+
    '<table><thead><tr>'+headers.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr></thead>'+
    '<tbody>'+rowsHtml+'</tbody></table></body></html>';
  var win=window.open('','_blank');
  if(!win){alert('Izinkan popup untuk membuka PDF');return;}
  win.document.write(html);win.document.close();win.focus();
  setTimeout(function(){win.print();},600);
}
 
// ─── Surat Penawaran ──────────────────────────────────────────────────────────
var spItems=[{id:1,namaItem:'',gambar:'',jumlah:1,satuan:'pcs',hargaSatuan:0}];
var DEFAULT_SP_CATATAN='1. Harga Penawaran berlaku selama 14 hari dari Penawaran ini.\n2. Pembayaran 30 hari Setelah Invoice diterima lengkap\n3. Barang stok berjalan, Harga tidak mengikat\n4. Barang Indent 5 - 7 hari\n5. Harga sudah termasuk ongkir';
function genSPNextId(){
  var ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  var d=new Date();
  var yy=String(d.getFullYear()).slice(-2);
  var mm=ROMAN[d.getMonth()];
  var rows=(store['quotations']||[]).filter(function(r){return r['ID Quotation'];});
  var maxSeq=264;
  rows.forEach(function(r){
    var id=String(r['ID Quotation']||'');
    var m=id.match(/PNW\/BMS\/[IVXLC]+\/(\d{2})-(\d+)$/);
    if(m){ var seq=parseInt(m[2],10); if(seq>maxSeq) maxSeq=seq; }
  });
  return 'PNW/BMS/'+mm+'/'+yy+'-'+String(maxSeq+1);
}
function openSuratPenawaran(){
  buildPerusahaanList();
  // refresh datalist sp
  var dl=document.getElementById('dl-perusahaan-sp');
  if(dl) dl.innerHTML=perusahaanList.map(function(p){return '<option value="'+p+'">';}).join('');
  spItems=[{id:1,namaItem:'',gambar:'',jumlah:1,satuan:'pcs',hargaSatuan:0}];
  var fields={'sp-no-surat':genSPNextId(),'sp-tanggal':new Date().toISOString().slice(0,10),'sp-nama-customer':'','sp-nama-perusahaan':'','sp-catatan':DEFAULT_SP_CATATAN,'sp-lain-lain':''};
  Object.keys(fields).forEach(function(id){var el=document.getElementById(id);if(el)el.value=fields[id];});
  var ppnSel=document.getElementById('sp-ppn-mode');if(ppnSel)ppnSel.value='11';
  var sb=document.getElementById('sp-save-btn');if(sb)sb.disabled=false;
  renderSPItems();calcSPTotals();openModal('sp-modal');
}
function fmtRpSP(n){return 'Rp '+new Intl.NumberFormat('id-ID').format(Math.round(n));}
function escHTMLSP(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function renderSPItems(){
  var tbody=document.getElementById('sp-items-tbody');if(!tbody)return;
  if(spItems.length===0){tbody.innerHTML='<tr><td colspan="7" class="empty-state" style="padding:16px">Belum ada item</td></tr>';return;}
  tbody.innerHTML=spItems.map(function(item,idx){
    return '<tr>'+
      '<td><input class="form-ctrl" style="min-width:140px;height:30px;font-size:12px" value="'+escHTMLSP(item.namaItem||'')+'" oninput="spItems['+idx+'].namaItem=this.value;calcSPTotals()" placeholder="Nama item…"></td>'+
      '<td><input class="form-ctrl" style="width:90px;height:30px;font-size:11px" value="'+escHTMLSP(item.gambar||'')+'" oninput="spItems['+idx+'].gambar=this.value" placeholder="URL gambar"></td>'+
      '<td><input class="form-ctrl" type="number" style="width:60px;height:30px;font-size:12px;text-align:center" value="'+item.jumlah+'" oninput="spItems['+idx+'].jumlah=parseFloat(this.value)||0;calcSPTotals()"></td>'+
      '<td><input class="form-ctrl" style="width:60px;height:30px;font-size:12px;text-align:center" value="'+escHTMLSP(item.satuan||'pcs')+'" oninput="spItems['+idx+'].satuan=this.value"></td>'+
      '<td><input class="form-ctrl" type="number" style="width:110px;height:30px;font-size:12px;text-align:right" value="'+item.hargaSatuan+'" oninput="spItems['+idx+'].hargaSatuan=parseFloat(this.value)||0;calcSPTotals()"></td>'+
      '<td style="text-align:right;font-weight:700;font-size:12px;white-space:nowrap">'+fmtRpSP(item.jumlah*item.hargaSatuan)+'</td>'+
      '<td><button class="btn-act del" style="height:26px;padding:0 6px" onclick="removeSPItem('+idx+')"><i class="fas fa-trash" style="font-size:10px"></i></button></td>'+
    '</tr>';
  }).join('');
}
function addSPItem(){spItems.push({id:Date.now(),namaItem:'',gambar:'',jumlah:1,satuan:'pcs',hargaSatuan:0});renderSPItems();}
function removeSPItem(idx){
  spItems.splice(idx,1);
  if(spItems.length===0)spItems.push({id:Date.now(),namaItem:'',gambar:'',jumlah:1,satuan:'pcs',hargaSatuan:0});
  renderSPItems();calcSPTotals();
}
function calcSPTotals(){
  var subTotal=spItems.reduce(function(s,i){return s+(i.jumlah*i.hargaSatuan);},0);
  var ppnSel=document.getElementById('sp-ppn-mode');
  var ppnRate=ppnSel?parseFloat(ppnSel.value)||0:11;
  var ppnLabel=ppnRate===0?'Tanpa PPN':'PPN '+ppnRate+'%';
  var pajak=subTotal*(ppnRate/100);
  var lainLain=parseFloat((document.getElementById('sp-lain-lain')||{}).value||'0')||0;
  var grandTotal=subTotal+pajak+lainLain;
  var set=function(id,val){var el=document.getElementById(id);if(el)el.textContent=val;};
  var lblEl=document.getElementById('sp-pajak-label');if(lblEl)lblEl.textContent=ppnLabel;
  set('sp-subtotal',fmtRpSP(subTotal));set('sp-pajak',fmtRpSP(pajak));set('sp-grandtotal',fmtRpSP(grandTotal));
  window._spCalc={subTotal:subTotal,pajak:pajak,ppnRate:ppnRate,ppnLabel:ppnLabel,lainLain:lainLain,grandTotal:grandTotal};
}
function getSPFormData(){
  var calc=window._spCalc||{subTotal:0,pajak:0,ppnRate:11,ppnLabel:'PPN 11%',lainLain:0,grandTotal:0};
  return{
    noSurat:(document.getElementById('sp-no-surat')||{}).value||'',
    tanggal:(document.getElementById('sp-tanggal')||{}).value||'',
    namaCustomer:(document.getElementById('sp-nama-customer')||{}).value||'',
    namaPerusahaan:(document.getElementById('sp-nama-perusahaan')||{}).value||'',
    items:spItems.filter(function(i){return i.namaItem&&i.namaItem.trim();}),
    lainLain:parseFloat((document.getElementById('sp-lain-lain')||{}).value||'0')||0,
    catatan:(document.getElementById('sp-catatan')||{}).value||'',
    subTotal:calc.subTotal,pajak:calc.pajak,ppnRate:calc.ppnRate||11,ppnLabel:calc.ppnLabel||'PPN 11%',grandTotal:calc.grandTotal
  };
}
function previewSPPDF(){exportSuratPenawaranHTMLPDF(getSPFormData());}
function saveSPAndExport(){
  var data=getSPFormData();
  if(!data.namaCustomer.trim()){showToast('Nama Customer wajib diisi','error');return;}
  if(data.items.length===0){showToast('Minimal 1 item harus diisi','error');return;}
 
  var btn=document.getElementById('sp-save-btn');
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Menyimpan…';}
 
  var firstItem=data.items[0]||{};
  var allNames=data.items.map(function(i){return i.namaItem;}).join(', ');
  var totalQty=data.items.reduce(function(s,i){return s+i.jumlah;},0);
 
  var rowData={
    'ID Quotation':data.noSurat,
    'Tanggal':data.tanggal,
    'Nama Customer':data.namaCustomer,
    'Nama Perusahaan':data.namaPerusahaan||'',
    'Nama Barang':allNames,
    'Qty':String(totalQty),
    'Uom':(firstItem.satuan||'pcs'),
    'Harga':String(Math.round(firstItem.hargaSatuan||0)),
    'Total Harga':String(Math.round(data.subTotal)),
    'Harga (PPN)':String(Math.round(data.pajak)),
    'Grand Total + (PPN 11%)':String(Math.round(data.grandTotal)),
    'Mode PPN':data.ppnLabel||'PPN 11%',
    'Status':'Penawaran',
    'File':''
  };
 
  google.script.run
    .withSuccessHandler(function(r){
      if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i>Simpan &amp; Export PDF';}
      if(r&&r.success){
        loaded['quotations']=false;
        showToast('✅ Quotation '+data.noSurat+' tersimpan ke sheet!','success');
        logActivity('Tambah','quotations',data.noSurat,data.namaCustomer);
        exportSuratPenawaranHTMLPDF(data);
        closeModal('sp-modal');
        reloadSection('quotations');
      } else {
        showToast('❌ Gagal simpan: '+((r&&r.error)||'Error tidak diketahui'),'error');
      }
    })
    .withFailureHandler(function(err){
      if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i>Simpan &amp; Export PDF';}
      showToast('❌ Error: '+((err&&err.message)||'Gagal menyimpan'),'error');
    })
    .saveRecord('Quotation',rowData,0);
}
function exportSuratPenawaranHTMLPDF(data){
  var validItems=data.items.filter(function(i){return i.namaItem&&i.namaItem.trim();});
  var emptyRowCount=Math.max(0,3-validItems.length);
  var BB='#1a5cad';
  var LOGO='https://docs.google.com/drawings/d/e/2PACX-1vTpbKyVkoaaBX-3ejWLVS64Wd7fK8TXKXrqm9ba2GKgXTJdbGIpVVDx8MRrH_yb1fQfUONe36I8bjJZ/pub?w=667&h=690';
  function fP(n){return 'Rp '+new Intl.NumberFormat('id-ID').format(Math.round(n));}
  function fD(d){if(!d)return 'DD/MM/YYYY';try{return new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return d;}}
  var itemRows=validItems.map(function(it){
    return '<tr><td class="il">'+it.namaItem+'</td>'+
    '<td class="ic">'+(it.gambar?'<img src="'+it.gambar+'" style="max-width:80px;max-height:58px;object-fit:contain;display:block;margin:auto" onerror="this.style.display=\'none\'">':'')+'</td>'+
    '<td class="ic">'+it.jumlah+'</td><td class="ic">'+it.satuan+'</td>'+
    '<td class="ir">'+fP(it.hargaSatuan)+'</td><td class="ir fw">'+fP(it.jumlah*it.hargaSatuan)+'</td></tr>';
  }).join('');
  var emptyRows='';for(var i=0;i<emptyRowCount;i++)emptyRows+='<tr><td style="height:55px">&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>';
  var RW='42%';
  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;padding:22px 28px;color:#1a1a1a;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:10mm 14mm;size:A4}'+
    '.hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}.hd-left{display:flex;align-items:flex-start;gap:12px}.hd-logo{width:70px;height:auto}'+
    '.co-name{font-size:13.5px;font-weight:900;color:'+BB+';margin-bottom:5px}.co-detail{font-size:9.5px;color:#374151;line-height:1.7}'+
    '.qt-title{font-size:30px;font-weight:900;color:'+BB+';letter-spacing:2px;align-self:center}'+
    '.info-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.info-left{flex:1;margin-right:16px}.info-right{width:'+RW+';flex-shrink:0}'+
    '.kpd-hd{background:'+BB+';color:#fff;font-weight:700;font-size:11px;padding:6px 10px}.kpd-name{font-weight:700;font-size:12.5px;padding:7px 0 3px}.kpd-co{font-size:11px;color:#374151}'+
    '.nt{width:100%;border-collapse:collapse}.nt th{background:'+BB+';color:#fff;padding:7px 12px;text-align:center;font-size:11px;font-weight:700;border:1px solid #1354a0}.nt td{padding:7px 12px;text-align:center;font-size:11.5px;border:1px solid #d1d5db}'+
    '.it{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}.it thead th{background:'+BB+';color:#fff;padding:8px 10px;font-weight:700;border:1px solid #1354a0}.it tbody td{padding:8px 10px;border:1px solid #d1d5db;vertical-align:middle}'+
    '.il{text-align:left}.ic{text-align:center}.ir{text-align:right}.fw{font-weight:700}'+
    '.tw{display:flex;justify-content:flex-end;margin-bottom:20px}.tt{width:'+RW+';border-collapse:collapse;font-size:11.5px}.tt td{padding:7px 12px;border:1px solid #d1d5db}.tl{font-weight:600}.tr2{text-align:right}'+
    '.gr{background:'+BB+';color:#fff;font-weight:900;font-size:13px}'+
    '.ib{border:1px solid #9ca3af;padding:10px 14px;max-width:52%;border-radius:2px}.il2{font-weight:700;font-size:10.5px;margin-bottom:4px}.it2{font-size:10px;color:#374151;white-space:pre-wrap;line-height:1.75}'+
    '.pbtn{position:fixed;bottom:20px;right:20px;background:'+BB+';color:#fff;border:none;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25)}@media print{.pbtn{display:none}}';
  var html='<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Quotation '+data.noSurat+'</title><style>'+css+'</style></head><body>'+
    '<button class="pbtn" onclick="window.print()">🖨 Cetak / Simpan PDF</button>'+
    '<div class="hd"><div class="hd-left"><img class="hd-logo" src="'+LOGO+'" alt="BMS" onerror="this.style.display=\'none\'">'+
    '<div><div class="co-name">PT. BERKATAMA MULIA SAPUTRA</div><div class="co-detail">Brand Office : Dsn. Gamping Kulon RT. 004 RW. 002<br>Krian<br>Email : berkatama.ms@gmail.com<br>Telepon : (031) 99899266</div></div></div>'+
    '<div class="qt-title">QUOTATION</div></div>'+
    '<div class="info-row"><div class="info-left"><div class="kpd-hd">Kepada Yth :</div><div class="kpd-name">'+(data.namaCustomer||'&nbsp;')+'</div><div class="kpd-co">'+(data.namaPerusahaan||'&nbsp;')+'</div></div>'+
    '<div class="info-right"><table class="nt"><thead><tr><th>Nomor</th><th>Tanggal</th></tr></thead><tbody><tr><td>'+data.noSurat+'</td><td>'+fD(data.tanggal)+'</td></tr></tbody></table></div></div>'+
    '<table class="it"><thead><tr><th style="width:30%;text-align:left">Item</th><th style="width:20%">Gambar</th><th style="width:8%">Jumlah</th><th style="width:8%">Satuan</th><th style="width:17%">Harga Satuan</th><th style="width:17%">Total</th></tr></thead>'+
    '<tbody>'+itemRows+emptyRows+'</tbody></table>'+
    '<div class="tw"><table class="tt">'+
    '<tr><td class="tl">Sub Total</td><td class="tr2" style="font-weight:700">'+fP(data.subTotal)+'</td></tr>'+
    '<tr><td style="font-weight:400">'+escHTMLSP(data.ppnLabel||'Tanpa PPN')+'</td><td class="tr2">'+(data.ppnRate>0?fP(data.pajak):'-')+'</td></tr>'+
    '<tr><td style="font-weight:400">Lain - Lain</td><td class="tr2">'+(data.lainLain?fP(data.lainLain):'-')+'</td></tr>'+
    '<tr class="gr"><td class="tl">Grand Total</td><td class="tr2">'+fP(data.grandTotal)+'</td></tr>'+
    '</table></div>'+
    '<div class="ib"><div class="il2">Informasi :</div><div class="it2">'+escHTMLSP(data.catatan)+'</div></div>'+
    '</body></html>';
  var win=window.open('','_blank');
  if(!win){alert('Izinkan popup browser untuk membuka preview PDF');return;}
  win.document.write(html);win.document.close();win.focus();
  setTimeout(function(){win.print();},800);
}
 
// ═══════════════════════════════════════════════════════════════════════════
// CREATE NEW INVOICE  —  fungsi lengkap
// ═══════════════════════════════════════════════════════════════════════════
var invItems = [];
 
function genInvNextId(){
  var now = new Date();
  var yy  = String(now.getFullYear()).slice(2);
  var mm  = String(now.getMonth()+1).padStart(2,'0');
  var cnt = (store['invoices']||[]).length + 1;
  return 'BMS.INV.40.' + yy + mm + '.' + String(cnt).padStart(3,'0');
}
 
function openCreateInvoice(){
  invItems = [{id:1, namaBarang:'', qty:1, unit:'PCS', hargaSatuan:0}];
  var today = new Date().toISOString().slice(0,10);
  var fields = {
    'inv-no-faktur':     genInvNextId(),
    'inv-tanggal':       today,
    'inv-no-po':         '',
    'inv-faktur-pajak':  '',
    'inv-nama-customer': '',
    'inv-nama-perusahaan':'',
    'inv-alamat':        '',
    'inv-npwp':          '',
    'inv-title':         '',
    'inv-potongan':      '',
    'inv-uang-muka':     '',
    'inv-keterangan':    ''
  };
  Object.keys(fields).forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = fields[id];
  });
  // Term default Net 30
  var termEl = document.getElementById('inv-term');
  if(termEl) termEl.selectedIndex = 0;
  invAutoJatuhTempo();
  var btn = document.getElementById('inv-save-btn');
  if(btn) btn.disabled = false;
  renderInvItems();
  calcInvTotals();
  openModal('inv-modal');
}
 
function invAutoJatuhTempo(){
  var tglEl  = document.getElementById('inv-tanggal');
  var termEl = document.getElementById('inv-term');
  var jthEl  = document.getElementById('inv-jatuh-tempo');
  if(!tglEl||!termEl||!jthEl||!tglEl.value) return;
  var tgl  = new Date(tglEl.value + 'T00:00:00');
  var term = termEl.value;
  var days = 30;
  if(term.indexOf('60')>=0) days=60;
  else if(term.indexOf('15')>=0) days=15;
  else if(term.indexOf('Cash')>=0||term.indexOf('Advance')>=0) days=0;
  tgl.setDate(tgl.getDate()+days);
  jthEl.value = tgl.toISOString().slice(0,10);
}
 
// Terbilang (Rupiah) — sampai triliunan
function invTerbilang(n){
  n = Math.round(n);
  if(n===0) return 'Nol Rupiah';
  var satuan = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan',
                'Sepuluh','Sebelas','Dua Belas','Tiga Belas','Empat Belas','Lima Belas',
                'Enam Belas','Tujuh Belas','Delapan Belas','Sembilan Belas'];
  function ratusan(x){
    if(x<20) return satuan[x];
    if(x<100) return satuan[Math.floor(x/10)*10-0] === undefined
      ? (['','','Dua Puluh','Tiga Puluh','Empat Puluh','Lima Puluh',
          'Enam Puluh','Tujuh Puluh','Delapan Puluh','Sembilan Puluh'][Math.floor(x/10)])
        + (x%10 ? ' '+satuan[x%10] : '')
      : '';
    // override
    var tens=['','','Dua Puluh','Tiga Puluh','Empat Puluh','Lima Puluh','Enam Puluh','Tujuh Puluh','Delapan Puluh','Sembilan Puluh'];
    if(x<100) return tens[Math.floor(x/10)]+(x%10?' '+satuan[x%10]:'');
    var h = Math.floor(x/100);
    var r = x % 100;
    var hs = (h===1?'Seratus':(satuan[h]+' Ratus'));
    return hs + (r>0?' '+ratusan(r):'');
  }
  function jutaan(x){
    if(x < 1000) return ratusan(x);
    if(x < 1000000) { var r=Math.floor(x/1000); return (r===1?'Seribu':(ratusan(r)+' Ribu'))+(x%1000?' '+ratusan(x%1000):''); }
    if(x < 1000000000) return ratusan(Math.floor(x/1000000))+' Juta'+(x%1000000?' '+jutaan(x%1000000):'');
    if(x < 1000000000000) return ratusan(Math.floor(x/1000000000))+' Miliar'+(x%1000000000?' '+jutaan(x%1000000000):'');
    return ratusan(Math.floor(x/1000000000000))+' Triliun'+(x%1000000000000?' '+jutaan(x%1000000000000):'');
  }
  return jutaan(n) + ' Rupiah';
}
 
function fmtRpInv(n){ return 'Rp\u00A0'+new Intl.NumberFormat('id-ID').format(Math.round(n||0)); }
function escInv(s){ return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
 
function renderInvItems(){
  var tbody = document.getElementById('inv-items-tbody');
  if(!tbody) return;
  if(invItems.length===0){
    tbody.innerHTML='<tr><td colspan="6" class="empty-state" style="padding:16px">Belum ada item</td></tr>';
    return;
  }
  tbody.innerHTML = invItems.map(function(item,idx){
    return '<tr>'+
      '<td><input class="form-ctrl" style="min-width:180px;height:30px;font-size:12px" value="'+escInv(item.namaBarang)+'" oninput="invItems['+idx+'].namaBarang=this.value;calcInvTotals()" placeholder="Nama barang &amp; spesifikasi…"></td>'+
      '<td><input class="form-ctrl" type="number" style="width:60px;height:30px;font-size:12px;text-align:center" value="'+item.qty+'" min="0" oninput="invItems['+idx+'].qty=parseFloat(this.value)||0;calcInvTotals()"></td>'+
      '<td><input class="form-ctrl" style="width:60px;height:30px;font-size:12px;text-align:center" value="'+escInv(item.unit||'PCS')+'" oninput="invItems['+idx+'].unit=this.value"></td>'+
      '<td><input class="form-ctrl" type="number" style="width:130px;height:30px;font-size:12px;text-align:right" value="'+item.hargaSatuan+'" min="0" oninput="invItems['+idx+'].hargaSatuan=parseFloat(this.value)||0;calcInvTotals()"></td>'+
      '<td style="text-align:right;font-weight:700;font-size:12px;white-space:nowrap">'+fmtRpInv(item.qty*item.hargaSatuan)+'</td>'+
      '<td><button class="btn-act del" style="height:26px;padding:0 6px" onclick="removeInvItem('+idx+')"><i class="fas fa-trash" style="font-size:10px"></i></button></td>'+
    '</tr>';
  }).join('');
}
 
function addInvItem(){
  invItems.push({id:Date.now(),namaBarang:'',qty:1,unit:'PCS',hargaSatuan:0});
  renderInvItems();
}
 
function removeInvItem(idx){
  invItems.splice(idx,1);
  if(invItems.length===0) invItems.push({id:Date.now(),namaBarang:'',qty:1,unit:'PCS',hargaSatuan:0});
  renderInvItems();
  calcInvTotals();
}
 
function calcInvTotals(){
  var hargaJual = invItems.reduce(function(s,i){ return s+(i.qty*i.hargaSatuan); }, 0);
  var potongan  = parseFloat((document.getElementById('inv-potongan')||{}).value||'0')||0;
  var uangMuka  = parseFloat((document.getElementById('inv-uang-muka')||{}).value||'0')||0;
  var dpp       = hargaJual - potongan - uangMuka;
  var ppn       = dpp * 0.12;
  var total     = dpp + ppn;
 
  var set = function(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; };
  set('inv-harga-jual', fmtRpInv(hargaJual));
  set('inv-dpp',        fmtRpInv(dpp));
  set('inv-ppn',        fmtRpInv(ppn));
  set('inv-total',      fmtRpInv(total));
  set('inv-terbilang',  invTerbilang(total));
 
  window._invCalc = {hargaJual:hargaJual, potongan:potongan, uangMuka:uangMuka, dpp:dpp, ppn:ppn, total:total};
}
 
function getInvFormData(){
  var calc = window._invCalc || {hargaJual:0,potongan:0,uangMuka:0,dpp:0,ppn:0,total:0};
  var g    = function(id){ return (document.getElementById(id)||{}).value||''; };
  return {
    noFaktur:      g('inv-no-faktur'),
    tanggal:       g('inv-tanggal'),
    noPO:          g('inv-no-po'),
    fakturPajak:   g('inv-faktur-pajak'),
    term:          g('inv-term'),
    jatuhTempo:    g('inv-jatuh-tempo'),
    namaCustomer:  g('inv-nama-customer'),
    namaPerusahaan:g('inv-nama-perusahaan'),
    alamat:        g('inv-alamat'),
    npwp:          g('inv-npwp'),
    title:         g('inv-title'),
    keterangan:    g('inv-keterangan'),
    items:         invItems.filter(function(i){ return i.namaBarang && i.namaBarang.trim(); }),
    potongan:      calc.potongan,
    uangMuka:      calc.uangMuka,
    hargaJual:     calc.hargaJual,
    dpp:           calc.dpp,
    ppn:           calc.ppn,
    total:         calc.total
  };
}
 
function previewInvPDF(){ exportInvoiceHTMLPDF(getInvFormData()); }
 
function saveInvAndExport(){
  var data = getInvFormData();
  if(!data.namaCustomer.trim()){ showToast('Nama Customer wajib diisi','error'); return; }
  if(!data.noFaktur.trim()){     showToast('Nomor Faktur wajib diisi','error'); return; }
  if(data.items.length===0){     showToast('Minimal 1 item harus diisi','error'); return; }
 
  var btn = document.getElementById('inv-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Menyimpan…'; }
 
  var allNames = data.items.map(function(i){ return i.namaBarang; }).join(', ');
 
  var rowData = {
    'ID Invoice':          data.noFaktur,
    'Tanggal Invoice':     data.tanggal,
    'Nama Customer':       data.namaCustomer,
    'Nama Perusahaan':     data.namaPerusahaan||'',
    'Nomer PO':            data.noPO||'',
    'Invoice Title':       data.title||allNames,
    'Nominal Tagihan':     String(Math.round(data.total)),
    'Harga Jual':          String(Math.round(data.hargaJual)),
    'Potongan Harga':      String(Math.round(data.potongan||0)),
    'Uang Muka':           String(Math.round(data.uangMuka||0)),
    'DPP':                 String(Math.round(data.dpp)),
    'PPN 12%':             String(Math.round(data.ppn)),
    'Jatuh Tempo':         data.jatuhTempo||'',
    'Term of Payment':     data.term||'',
    'Nomor Faktur Pajak':  data.fakturPajak||'',
    'NPWP':                data.npwp||'',
    'Alamat':              data.alamat||'',
    'Keterangan':          data.keterangan||'',
    'Status':              'Belum Lunas',
    'Faktur Invoice File': ''
  };
 
  google.script.run
    .withSuccessHandler(function(r){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i>Simpan &amp; Export PDF'; }
      if(r && r.success){
        loaded['invoices'] = false;
        showToast('✅ Invoice '+data.noFaktur+' tersimpan ke sheet!','success');
        logActivity('Tambah','invoices',data.noFaktur,data.namaCustomer);
        exportInvoiceHTMLPDF(data);
        closeModal('inv-modal');
        reloadSection('invoices');
      } else {
        showToast('❌ Gagal simpan: '+((r&&r.error)||'Error tidak diketahui'),'error');
      }
    })
    .withFailureHandler(function(err){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i>Simpan &amp; Export PDF'; }
      showToast('❌ Error: '+((err&&err.message)||'Gagal menyimpan'),'error');
    })
    .saveRecord('Invoice', rowData, 0);
}
 
// ── PDF Export — generate HTML Invoice lalu buka di tab baru ─────────────────
function exportInvoiceHTMLPDF(data){
  var validItems = data.items.filter(function(i){ return i.namaBarang && i.namaBarang.trim(); });
  if(validItems.length===0){ showToast('Tidak ada item untuk dicetak','error'); return; }
 
  // Pastikan minimal 8 baris kosong tersedia di tabel agar tampilan mirip template
  var emptyCount = Math.max(0, 8 - validItems.length);
  var LOGO = '';
 
  function fIDR(n){
    if(n===0||n===null||n===undefined) return 'IDR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-';
    return 'IDR &nbsp;'+new Intl.NumberFormat('id-ID').format(Math.round(n));
  }
  function fIDRplain(n){
    if(!n&&n!==0) return '-';
    return 'IDR &nbsp;'+new Intl.NumberFormat('id-ID').format(Math.round(n));
  }
  function fD(d){
    if(!d) return 'DD/MM/YYYY';
    try{ return new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'}); }
    catch(e){ return d; }
  }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
 
  // ── Baris item ──────────────────────────────────────────────────────────────
  var itemRows = validItems.map(function(it,idx){
    return '<tr>'+
      '<td style="text-align:center;border:1px solid #000;padding:4px 6px">'+(idx+1)+'</td>'+
      '<td style="text-align:left;border:1px solid #000;padding:4px 8px">'+esc(it.namaBarang)+'</td>'+
      '<td style="text-align:center;border:1px solid #000;padding:4px 6px">'+it.qty+'</td>'+
      '<td style="text-align:center;border:1px solid #000;padding:4px 6px">'+esc(it.unit||'PCS')+'</td>'+
      '<td style="text-align:right;border:1px solid #000;padding:4px 8px">'+fIDR(it.hargaSatuan)+'</td>'+
      '<td style="text-align:right;border:1px solid #000;padding:4px 8px;font-weight:700">'+fIDR(it.qty*it.hargaSatuan)+'</td>'+
    '</tr>';
  }).join('');
 
  var emptyRows = '';
  for(var i=0;i<emptyCount;i++){
    emptyRows += '<tr>'+
      '<td style="border:1px solid #000;padding:0;height:28px">&nbsp;</td>'+
      '<td style="border:1px solid #000;padding:0">&nbsp;</td>'+
      '<td style="border:1px solid #000;padding:0"></td>'+
      '<td style="border:1px solid #000;padding:0"></td>'+
      '<td style="border:1px solid #000;padding:0"></td>'+
      '<td style="border:1px solid #000;padding:0"></td>'+
    '</tr>';
  }
 
  // ── CSS ─────────────────────────────────────────────────────────────────────
  var css = [
    '*{box-sizing:border-box;margin:0;padding:0}',
    'body{font-family:Arial,Helvetica,sans-serif;font-size:10.5px;color:#000;background:#fff;',
    '  padding:14px 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '@page{margin:8mm 10mm;size:A4}',
    'table{border-collapse:collapse}',
    '.outer{width:100%;border:1px solid #000}',
    /* Baris 1: header perusahaan */
    '.hdr-co{padding:6px 10px;border-bottom:1px solid #000}',
    '.hdr-co-name{font-size:11px;font-weight:900;margin-bottom:1px}',
    '.hdr-co-addr{font-size:9px;color:#222}',
    /* Baris 2: FAKTUR/INVOICE label + nomor + tanggal */
    '.row-faktur{display:grid;grid-template-columns:30% 1fr auto;border-bottom:1px solid #000}',
    '.cell-faktur-label{border-right:1px solid #000;padding:6px 10px;display:flex;align-items:center;justify-content:center}',
    '.faktur-label{font-size:12px;font-weight:900;text-align:center;letter-spacing:.5px}',
    '.cell-nomor{border-right:1px solid #000;padding:6px 10px}',
    '.cell-tanggal{padding:6px 10px;min-width:140px}',
    '.field-lbl{font-size:9px;font-weight:700;margin-bottom:2px}',
    '.field-val{font-size:10.5px;font-weight:600}',
    '.field-val-sm{font-size:9.5px}',
    /* Baris 3: Kepada + info kanan */
    '.row-info{display:grid;grid-template-columns:42% 1fr;border-bottom:1px solid #000}',
    '.cell-kepada{border-right:1px solid #000;padding:8px 10px}',
    '.cell-meta{padding:0}',
    '.meta-item{padding:5px 10px;border-bottom:1px solid #000}',
    '.meta-item:last-child{border-bottom:none}',
    /* Baris 4: NPWP */
    '.row-npwp{padding:5px 10px;border-bottom:1px solid #000;font-size:9.5px}',
    /* Baris 5: sub-judul tabel */
    '.row-subtitle{padding:4px 10px;border-bottom:1px solid #000;font-style:italic;font-size:9.5px}',
    /* Tabel item */
    '.item-tbl{width:100%;border-collapse:collapse}',
    '.item-tbl thead th{background:#e8e8e8;border:1px solid #000;padding:5px 6px;font-size:9.5px;font-weight:900;text-align:center}',
    '.item-tbl tbody td{font-size:10px;vertical-align:top}',
    /* Footer: terbilang + totals */
    '.row-footer{display:grid;grid-template-columns:42% 1fr;border-top:1px solid #000}',
    '.cell-terbilang{border-right:1px solid #000;padding:6px 10px;font-size:9.5px;vertical-align:top}',
    '.cell-totals{padding:0}',
    '.tot-row{display:flex;justify-content:space-between;border-bottom:1px solid #000;padding:4px 10px;font-size:10px}',
    '.tot-row:last-child{border-bottom:none}',
    '.tot-lbl{font-weight:700}',
    '.tot-val{text-align:right;font-weight:600;min-width:140px}',
    '.tot-grand{font-size:11px;font-weight:900;background:#e8e8e8}',
    /* Baris bayar + TTD */
    '.row-bayar{display:grid;grid-template-columns:42% 1fr;border-top:1px solid #000}',
    '.cell-bayar{border-right:1px solid #000;padding:8px 10px;font-size:9.5px}',
    '.cell-ttd{padding:8px 10px;text-align:center;font-size:9.5px;display:flex;flex-direction:column;align-items:center;justify-content:space-between}',
    '.bank-name{font-size:11.5px;font-weight:900;margin:3px 0 1px}',
    '.bank-no{font-size:11px;font-weight:700;letter-spacing:.5px}',
    '.ttd-logo{width:90px;height:auto;margin:4px auto}',
    '.ttd-space{height:80px;width:160px;display:block}',
    '.ttd-name{font-size:11px;font-weight:900;border-top:1.5px solid #000;padding-top:3px;margin-top:2px;display:inline-block;min-width:160px;text-align:center}',
    /* Print button */
    '.pbtn{position:fixed;bottom:18px;right:18px;background:#065f46;color:#fff;border:none;',
    '  padding:9px 20px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;',
    '  box-shadow:0 4px 14px rgba(0,0,0,.3);z-index:9999}',
    '@media print{.pbtn{display:none}}'
  ].join('');
 
  // ── HTML ────────────────────────────────────────────────────────────────────
  var html = '<!DOCTYPE html><html lang="id"><head>'+
    '<meta charset="UTF-8">'+
    '<title>Invoice '+esc(data.noFaktur)+'</title>'+
    '<style>'+css+'</style>'+
    '</head><body>'+
    '<button class="pbtn" onclick="window.print()">🖨 Cetak / Simpan PDF</button>'+
 
    '<div class="outer">'+
 
      /* ── Baris 1: Header perusahaan ── */
      '<div class="hdr-co">'+
        '<div class="hdr-co-name">PT. BERKATAMA MULIA SAPUTRA</div>'+
        '<div class="hdr-co-addr">Dsn. Gamping Kulon RT. 004 RW. 002 Jerukgamping, Krian Kab. Sidoarjo Jawa Timur</div>'+
      '</div>'+
 
      /* ── Baris 2: FAKTUR/INVOICE | Nomor Faktur Penjualan | Tanggal Invoice ── */
      '<div class="row-faktur">'+
        '<div class="cell-faktur-label">'+
          '<div class="faktur-label">FAKTUR/INVOICE</div>'+
        '</div>'+
        '<div class="cell-nomor">'+
          '<div class="field-lbl">Nomor Faktur Penjualan</div>'+
          '<div class="field-val">'+esc(data.noFaktur||'BMS.INV.40.____.__')+'</div>'+
          '<div class="field-lbl" style="margin-top:5px">Nomor Surat Pemesanan</div>'+
          '<div class="field-val-sm">'+esc(data.noPO||'—')+'</div>'+
          '<div class="field-lbl" style="margin-top:5px">Nomor Faktur Pajak</div>'+
          '<div class="field-val-sm">'+esc(data.fakturPajak||'—')+'</div>'+
        '</div>'+
        '<div class="cell-tanggal">'+
          '<div class="field-lbl">Tanggal Invoice</div>'+
          '<div class="field-val">'+fD(data.tanggal)+'</div>'+
          '<div style="margin-top:5px">'+
            '<div class="field-lbl">Tanggal Jatuh Tempo</div>'+
            '<div class="field-val" style="color:#c00">'+fD(data.jatuhTempo)+'</div>'+
            '<div style="font-size:8.5px;color:#555;font-style:italic">'+esc(data.term||'')+'</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
 
      /* ── Baris 3: Kepada Yth | Info Meta (Keterangan + Term) ── */
      '<div class="row-info">'+
        '<div class="cell-kepada">'+
          '<div style="font-size:9.5px;margin-bottom:4px">Kepada Yth,</div>'+
          '<div style="font-size:12px;font-weight:900;margin-bottom:3px">'+esc(data.namaPerusahaan||data.namaCustomer||'NAMA PERUSAHAAN')+'</div>'+
          (data.namaPerusahaan&&data.namaCustomer?'<div style="font-size:10px;margin-bottom:3px">u.p. '+esc(data.namaCustomer)+'</div>':'')+
          '<div style="font-size:10px;color:#333;line-height:1.5;margin-top:2px">'+esc(data.alamat||'ALAMAT PERUSAHAAN')+'</div>'+
        '</div>'+
        '<div class="cell-meta">'+
          '<div class="meta-item">'+
            '<span class="field-lbl">Tanggal Jatuh Tempo &nbsp;</span>'+
            '<span style="font-size:8.5px;font-style:italic;color:#555">('+esc(data.term||'—')+')</span><br>'+
            '<span class="field-val">'+fD(data.jatuhTempo)+'</span>'+
          '</div>'+
          '<div class="meta-item" style="min-height:40px">'+
            '<div class="field-lbl">Keterangan</div>'+
            '<div style="font-size:9.5px;white-space:pre-wrap;line-height:1.5">'+esc(data.keterangan||'')+'</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
 
      /* ── Baris 4: NPWP ── */
      '<div class="row-npwp">'+
        'NPWP : &nbsp;<strong>'+esc(data.npwp||'Nomor NPWP Customer/Perusahaan')+'</strong>'+
      '</div>'+
 
      /* ── Baris 5: Sub-judul ── */
      '<div class="row-subtitle">Barang dan spesifikasi adalah sebagai berikut :</div>'+
 
      /* ── Tabel item ── */
      '<table class="item-tbl">'+
        '<thead><tr>'+
          '<th style="width:5%">NO</th>'+
          '<th style="text-align:left;width:40%">BARANG DAN SPESIFIKASI</th>'+
          '<th style="width:7%">QTY</th>'+
          '<th style="width:7%">UNIT</th>'+
          '<th style="width:20%">HARGA SATUAN</th>'+
          '<th style="width:21%">SUB TOTAL IDR</th>'+
        '</tr></thead>'+
        '<tbody>'+itemRows+emptyRows+'</tbody>'+
      '</table>'+
 
      /* ── Footer: Terbilang + Totals ── */
      '<div class="row-footer">'+
        '<div class="cell-terbilang">'+
          '<strong>Terbilang : '+esc(invTerbilang(data.total))+'</strong>'+
        '</div>'+
        '<div class="cell-totals">'+
          '<div class="tot-row"><span class="tot-lbl">HARGA JUAL</span><span class="tot-val">'+fIDRplain(data.hargaJual)+'</span></div>'+
          '<div class="tot-row"><span class="tot-lbl">POTONGAN HARGA</span><span class="tot-val">'+(data.potongan?fIDRplain(data.potongan):'IDR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-')+'</span></div>'+
          '<div class="tot-row"><span class="tot-lbl">UANG MUKA</span><span class="tot-val">'+(data.uangMuka?fIDRplain(data.uangMuka):'IDR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-')+'</span></div>'+
          '<div class="tot-row"><span class="tot-lbl">DASAR PENGENAAN PAJAK</span><span class="tot-val">'+fIDRplain(data.dpp)+'</span></div>'+
          '<div class="tot-row"><span class="tot-lbl">PPN 12%</span><span class="tot-val">'+fIDRplain(data.ppn)+'</span></div>'+
          '<div class="tot-row tot-grand"><span class="tot-lbl">TOTAL</span><span class="tot-val">'+fIDRplain(data.total)+'</span></div>'+
        '</div>'+
      '</div>'+
 
      /* ── Baris terakhir: Bayar + TTD ── */
      '<div class="row-bayar">'+
        '<div class="cell-bayar">'+
          '<div style="margin-bottom:4px">Pembayaran dengan Bilyet Giro / Melalui<br>T. Transfer harap diatasnamakan / ditujukan :</div>'+
          '<div class="bank-name">MANDIRI</div>'+
          '<div class="bank-no">1410 0975 975 20</div>'+
          '<div style="font-size:9px;margin-top:1px">a/n PT. BERKATAMA MULIA SAPUTRA</div>'+
        '</div>'+
        '<div class="cell-ttd">'+
          '<div>Hormat Kami,</div>'+
          '<div class="ttd-space"></div>'+
          '<div class="ttd-name">Deo Fajar Andyka, S.Kom.</div>'+
        '</div>'+
      '</div>'+
 
    '</div>'+ // /.outer
    '</body></html>';
 
  var win = window.open('','_blank');
  if(!win){ alert('Izinkan popup browser untuk membuka preview PDF'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function(){ win.print(); }, 800);
}
 
// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', initApp);

// ── Activity Ticker ──────────────────────────────────────────────────────────
var activityLog = [];
var ACT_MAX = 50;

var ACT_CFG = {
  'purchase-requests': { icon:'fa-clipboard-list', color:'#f59e0b', label:'Purchase Request' },
  'purchase-orders':   { icon:'fa-shopping-cart',  color:'#8b5cf6', label:'Purchase Order'  },
  'quotations':        { icon:'fa-file-invoice',   color:'#0891b2', label:'Quotation'        },
  'invoices':          { icon:'fa-receipt',        color:'#16a34a', label:'Invoice'          }
};

function logActivity(action, sec, id, customer){
  var cfg = ACT_CFG[sec] || { icon:'fa-circle', color:'#64748b', label:sec };
  var now = new Date();
  var timeStr = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  var entry = {
    action:   action,       // 'Tambah' | 'Edit' | 'Hapus'
    sec:      sec,
    id:       id   || '',
    customer: customer || '',
    label:    cfg.label,
    icon:     cfg.icon,
    color:    cfg.color,
    time:     timeStr
  };
  activityLog.unshift(entry);
  if(activityLog.length > ACT_MAX) activityLog.pop();
  try { localStorage.setItem('bms_activity_log', JSON.stringify(activityLog)); } catch(e){}
  loadNewsTicker();
}

function loadActivityLogFromStorage(){
  try {
    var saved = localStorage.getItem('bms_activity_log');
    if(saved) activityLog = JSON.parse(saved);
  } catch(e){ activityLog = []; }
}

function loadNewsTicker(){
  var inner = document.getElementById('ticker-inner');
  if(!inner) return;
  if(activityLog.length === 0){
    inner.innerHTML = '<span style="color:#475569;font-size:12px;padding:0 20px">Belum ada aktivitas tercatat. Mulai tambah data untuk melihat log di sini…</span>';
    return;
  }
  var html = activityLog.map(function(e){
    var actionColor = e.action==='Tambah'?'#4ade80': e.action==='Edit'?'#60a5fa':'#f87171';
    return '<span class="news-ticker-item">'
      + '<i class="fas '+e.icon+' act-icon" style="color:'+e.color+'"></i>'
      + '<span style="color:'+actionColor+';font-weight:700;font-size:10px">'+e.action+'</span>'
      + '<span>'+e.label+' &mdash; <strong>'+e.id+'</strong>'+(e.customer?' ('+e.customer+')':'')+'</span>'
      + '<span class="act-time">'+e.time+'</span>'
      + '</span><span class="sep">|</span>';
  }).join('');
  inner.innerHTML = html;
  var totalW = inner.scrollWidth;
  var speed = Math.max(20, totalW / 100);
  inner.style.animationDuration = speed + 's';
}
</script>
