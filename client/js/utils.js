function genId(p='x'){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function today(){return new Date().toISOString().split('T')[0];}
function tomorrow(){const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().split('T')[0];}
function fmtMoney(n){return '$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});}
function fmtDate(s){if(!s)return '';const d=new Date(s+'T12:00:00');return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
function fmtDateShort(s){if(!s)return '';const d=new Date(s+'T12:00:00');return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function initials(name=''){return name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();}
function avatarColors(name=''){const p=[['#e6f1fb','#0c447c'],['#e1f5ee','#085041'],['#eeedfe','#3c3489'],['#faeeda','#633806'],['#fbeaf0','#72243e'],['#eaf3de','#27500a'],['#fff3e0','#7c4a00']];return p[(name.charCodeAt(0)||0)%p.length];}
function avatarEl(name='',size=40){const[bg,fg]=avatarColors(name);return '<div class="list-avatar" style="width:'+size+'px;height:'+size+'px;background:'+bg+';color:'+fg+';font-size:'+Math.round(size*0.35)+'px;">'+initials(name)+'</div>';}

function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.background = type === 'error' ? '#c0392b' : type === 'warning' ? '#EF9F27' : '#1a1a1a';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

function showPageLoading(pageId) {
  const el = document.getElementById(pageId);
  if (el) el.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;padding:60px;"><div class="spinner"></div></div>';
}

// Prevent double-submit on buttons
function disableBtn(el) {
  if (!el) return;
  el.disabled = true;
  el._origText = el.innerHTML;
  el.innerHTML = '<span class="spinner-sm"></span>';
  setTimeout(() => enableBtn(el), 8000); // auto-re-enable after 8s failsafe
}
function enableBtn(el) {
  if (!el) return;
  el.disabled = false;
  if (el._origText) el.innerHTML = el._origText;
}

function catBadge(cat){const m={detail:'badge-detail',tint:'badge-tint',tire:'badge-tire'};const l={detail:'Detail',tint:'Tint',tire:'Tire'};return '<span class="badge '+(m[cat]||'')+'">'+(l[cat]||cat)+'</span>';}
function statusBadge(s){const m={'done':'badge-done','in-progress':'badge-progress','scheduled':'badge-scheduled'};const l={'done':'Done','in-progress':'In progress','scheduled':'Scheduled'};return '<span class="badge '+(m[s]||'')+'">'+( l[s]||s)+'</span>';}
function leadStageBadge(s){const m={'new':'badge-new','contacted':'badge-contacted','appointment-set':'badge-appointment-set','no-show':'badge-no-show','closed':'badge-closed','lost':'badge-lost'};const l={'new':'New','contacted':'Contacted','appointment-set':'Appt Set','no-show':'No Show','closed':'Closed','lost':'Lost'};return '<span class="badge '+(m[s]||'badge-new')+'">'+( l[s]||s)+'</span>';}
function sourceBadge(s){const m={'walk-in':'badge-walkin','instagram':'badge-instagram','google':'badge-google','referral':'badge-referral','facebook':'badge-facebook','website':'badge-website'};const l={'walk-in':'Walk-in','instagram':'Instagram','google':'Google','referral':'Referral','facebook':'Facebook','website':'Website'};return '<span class="badge '+(m[s]||'badge-walkin')+'">'+( l[s]||s)+'</span>';}

// Modal - bottom sheet style
const Modal = {
  _stack: [],
  show(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
    // Focus first input after animation
    setTimeout(() => {
      const f = document.querySelector('#modal-content input:not([type=hidden]), #modal-content select, #modal-content textarea');
      if (f) { try { f.focus(); } catch(e) {} }
    }, 150);
  },
  close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) Modal.close();
    });
  }
});

// Autocomplete with debounce
function makeAutocomplete(inputId, listId, onSelect) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  if (!input || !list) return;
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { list.innerHTML = ''; return; }
    timer = setTimeout(async () => {
      try {
        const results = await db.customers.search(q);
        list.innerHTML = results.map(c =>
          '<div class="autocomplete-item" data-id="'+c.id+'" data-name="'+c.name+'">' +
          avatarEl(c.name,28) +
          '<div><div>'+c.name+'</div><div style="font-size:11px;color:var(--muted)">'+(c.phone||c.email||'')+'</div></div>' +
          '</div>'
        ).join('');
        list.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            onSelect(item.dataset.id, item.dataset.name);
            list.innerHTML = '';
          });
        });
      } catch(e) { list.innerHTML = ''; }
    }, 250);
  });
  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) list.innerHTML = '';
  });
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', e => {
  console.error('Unhandled promise rejection:', e.reason);
  if (e.reason?.message?.includes('API error')) {
    toast('Connection error — check your internet', 'error');
  }
});
