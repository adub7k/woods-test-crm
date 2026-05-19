const App = {
  _current: 'dashboard',

  nav(page) {
    if (page === 'more') { UI.toggleMenu(); return; }
    this._current = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item, .tab-btn').forEach(b => b.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    document.querySelectorAll('[data-page="'+page+'"]').forEach(b => b.classList.add('active'));
    // Update topbar title
    const titles = { dashboard:'Woods Test CRM', leads:'Leads', followups:'Follow-ups', appointments:'Appointments', jobs:'Jobs', invoices:'Invoices', customers:'Customers', fleet:'Fleet', revenue:'Revenue', settings:'Settings' };
    const topTitle = document.getElementById('topbar-title');
    if (topTitle) topTitle.textContent = titles[page] || 'Woods Test CRM';
    UI.closeMenu();
    this._render(page);
  },

  _render(page) {
    if (page === 'dashboard')    Dashboard.render();
    else if (page === 'leads')        Leads.render();
    else if (page === 'followups')    Followups.render();
    else if (page === 'appointments') Appointments.render();
    else if (page === 'jobs')         Jobs.render();
    else if (page === 'invoices')     Invoices.render();
    else if (page === 'customers')    Customers.render();
    else if (page === 'messages')     Messages.render();
    else if (page === 'fleet')        Fleet.render();
    else if (page === 'revenue')      Revenue.render();
    else if (page === 'settings')     Settings.render();
  },

  refreshDashboard() { if (this._current === 'dashboard') Dashboard.render(); },
};

const UI = {
  _menuOpen: false,

  toggleMenu() {
    this._menuOpen = !this._menuOpen;
    document.getElementById('drawer').classList.toggle('open', this._menuOpen);
    document.getElementById('drawer-overlay').classList.toggle('open', this._menuOpen);
  },

  closeMenu() {
    this._menuOpen = false;
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('open');
  },

  quickAdd() {
    const html = [];
    html.push('<div class="modal-title">Quick Add</div>');
    html.push('<div style="display:flex;flex-direction:column;gap:10px;">');
    html.push('<button class="btn btn-full" onclick="Modal.close();Jobs.openAdd()">&#128295; New Job</button>');
    html.push('<button class="btn btn-full" onclick="Modal.close();Leads.openQuickAdd(\'walk-in\')">&#128222; Log Walk-in Lead</button>');
    html.push('<button class="btn btn-full" onclick="Modal.close();Leads.openQuickAdd(\'instagram\')">&#128248; Log Instagram Lead</button>');
    html.push('<button class="btn btn-full" onclick="Modal.close();Leads.openQuickAdd(\'google\')">&#128269; Log Google Lead</button>');
    html.push('<button class="btn btn-full" onclick="Modal.close();Appointments.openAdd()">&#128197; New Appointment</button>');
    html.push('<button class="btn btn-full" onclick="Modal.close();Invoices.openCreate()">&#129534; New Invoice</button>');
    html.push('<button class="btn btn-full" onclick="Modal.close()">Cancel</button>');
    html.push('</div>');
    Modal.show(html.join(''));
  }
};

// Offline detection
window.addEventListener('online',  () => { document.getElementById('offline-banner')?.classList.remove('show'); toast('Back online ✓'); App._render(App._current); });
window.addEventListener('offline', () => { document.getElementById('offline-banner')?.classList.add('show'); });

// Nav button click handlers
document.querySelectorAll('.nav-item, .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => App.nav(btn.dataset.page));
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(e => console.log('SW:', e));
}

// Update badges
async function updateBadges() {
  try {
    const [leads, tasks, invoices, convos] = await Promise.all([db.leads.all(), db.tasks.all(), db.invoices.all(), db.conversations.all()]);
    const newLeads = leads.filter(l=>l.status==='new').length;
    const lb = document.getElementById('leads-badge');
    if (lb) { if(newLeads>0){lb.textContent=newLeads;lb.classList.remove('hidden');}else lb.classList.add('hidden'); }
    const today_str = today();
    const pendingTasks = tasks.filter(t=>!t.done&&t.due_date<=today_str).length;
    const fb = document.getElementById('followups-badge');
    if (fb) { if(pendingTasks>0){fb.textContent=pendingTasks;fb.classList.remove('hidden');}else fb.classList.add('hidden'); }
    const unpaidInv = invoices.filter(i=>i.status==='unpaid').length;
    const ib = document.getElementById('invoices-badge');
    if (ib) { if(unpaidInv>0){ib.textContent=unpaidInv;ib.classList.remove('hidden');}else ib.classList.add('hidden'); }
    const unreadMsgs = convos.filter(c=>c.direction==='inbound'&&!c.read).length;
    const mb = document.getElementById('messages-nav-badge');
    if (mb) { if(unreadMsgs>0){mb.textContent=unreadMsgs;mb.classList.remove('hidden');}else mb.classList.add('hidden'); }
  } catch(e) {}
}

// Boot
async function boot() {
  try {
    const settings = await db.settings.get();
    const shopName = settings.shopName || 'Woods Test CRM';
    const drawerName = document.getElementById('drawer-shop-name');
    if (drawerName) drawerName.textContent = shopName;
    const topTitle = document.getElementById('topbar-title');
    if (topTitle) topTitle.textContent = shopName;
    const tagline = document.getElementById('drawer-tagline');
    if (tagline && settings.tagline) tagline.textContent = settings.tagline;
    // Store shop name globally for use in email templates
    window._shopName = shopName;
    await Dashboard.render();
    await updateBadges();
    document.getElementById('loading').classList.add('hidden');
    // Refresh badges every 90 seconds
    setInterval(updateBadges, 90000);
  } catch(e) {
    console.error('Boot error:', e);
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
      loadingText.innerHTML = '&#9888; Cannot connect to server<br><span style="font-size:12px;opacity:.7;">Make sure the server is running, then refresh</span>';
    }
    // Show retry button
    const loading = document.getElementById('loading');
    if (loading) {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Retry';
      retryBtn.style.cssText = 'margin-top:20px;padding:10px 28px;border-radius:8px;border:none;background:rgba(255,255,255,0.2);color:#fff;font-size:15px;cursor:pointer;';
      retryBtn.onclick = () => window.location.reload();
      loading.appendChild(retryBtn);
    }
  }
}
boot();
