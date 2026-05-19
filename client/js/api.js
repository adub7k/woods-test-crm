// Auto-detect API base URL
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' : '';  // Same origin always

async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(API + '/api' + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    return res.json();
  } catch (e) {
    console.error('API error:', path, e);
    throw e;
  }
}

const db = {
  settings:     { get: () => apiFetch('/settings'), save: (s) => apiFetch('/settings', { method:'POST', body:s }) },
  customers:    { all: () => apiFetch('/customers'), search: (q) => apiFetch('/customers/search?q='+encodeURIComponent(q)), get: (id) => apiFetch('/customers/'+id), save: (c) => apiFetch('/customers', {method:'POST',body:c}), delete: (id) => apiFetch('/customers/'+id, {method:'DELETE'}), redeemReward: (id) => apiFetch('/customers/'+id+'/redeem-reward', {method:'POST'}) },
  vehicles:     { forCustomer: (cid) => apiFetch('/vehicles/customer/'+cid), save: (v) => apiFetch('/vehicles', {method:'POST',body:v}), delete: (id) => apiFetch('/vehicles/'+id, {method:'DELETE'}) },
  templates:    { all: () => apiFetch('/templates'), save: (t) => apiFetch('/templates', {method:'POST',body:t}), delete: (id) => apiFetch('/templates/'+id, {method:'DELETE'}) },
  jobs:         { all: () => apiFetch('/jobs'), stats: () => apiFetch('/jobs/stats'), save: (j) => apiFetch('/jobs', {method:'POST',body:j}), delete: (id) => apiFetch('/jobs/'+id, {method:'DELETE'}) },
  invoices:     { all: () => apiFetch('/invoices'), save: (i) => apiFetch('/invoices', {method:'POST',body:i}), markPaid: (id) => apiFetch('/invoices/'+id+'/mark-paid', {method:'POST'}), delete: (id) => apiFetch('/invoices/'+id, {method:'DELETE'}) },
  fleet:        { all: () => apiFetch('/fleet'), get: (id) => apiFetch('/fleet/'+id), save: (f) => apiFetch('/fleet', {method:'POST',body:f}), delete: (id) => apiFetch('/fleet/'+id, {method:'DELETE'}) },
  appointments: { forMonth: (y, m) => apiFetch('/appointments/month/'+y+'/'+m), save: (a) => apiFetch('/appointments', {method:'POST',body:a}), delete: (id) => apiFetch('/appointments/'+id, {method:'DELETE'}) },
  leads:        { all: () => apiFetch('/leads'), save: (l) => apiFetch('/leads', {method:'POST',body:l}), convert: (id) => apiFetch('/leads/'+id+'/convert', {method:'POST'}), delete: (id) => apiFetch('/leads/'+id, {method:'DELETE'}) },
  tasks:        { all: () => apiFetch('/tasks'), save: (t) => apiFetch('/tasks', {method:'POST',body:t}), delete: (id) => apiFetch('/tasks/'+id, {method:'DELETE'}) },
  revenue:      { full: () => apiFetch('/revenue') },
  conversations: { all: () => apiFetch('/conversations'), forCustomer: (cid) => apiFetch('/conversations/customer/'+cid), save: (c) => apiFetch('/conversations', {method:'POST',body:c}) },
  sms:          { send: (opts) => apiFetch('/sms/send', {method:'POST',body:opts}) },
  email:        { send: (opts) => apiFetch('/email/send', {method:'POST',body:opts}) },
};
