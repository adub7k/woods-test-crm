const Dashboard = {
  async render() {
    const el = document.getElementById('page-dashboard');
    el.innerHTML = '<div class="empty-state"><div class="loading-spinner-sm"></div></div>';
    const now = new Date();
    const todayStr = today();
    const greeting = now.getHours()<12?'morning':now.getHours()<17?'afternoon':'evening';

    const [stats, allJobs, allLeads, allTasks, allInvoices, monthAppts] = await Promise.all([
      db.jobs.stats(), db.jobs.all(), db.leads.all(), db.tasks.all(), db.invoices.all(),
      db.appointments.forMonth(now.getFullYear(), now.getMonth()+1)
    ]);

    const todaySchedule = monthAppts.filter(a=>a.date===todayStr).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const unpaidInvoices = allInvoices.filter(i=>i.status==='unpaid');
    const outstandingAmt = unpaidInvoices.reduce((s,i)=>s+i.total,0);
    const overdueInvoices = unpaidInvoices.filter(i=>i.created_at<todayStr);
    const overdueTasks = allTasks.filter(t=>!t.done&&t.due_date<todayStr);
    const todayTasks = allTasks.filter(t=>!t.done&&t.due_date===todayStr);
    const newLeadsToday = allLeads.filter(l=>l.created_at===todayStr);
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate()+7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const thisWeekJobs = allJobs.filter(j=>(j.status==='scheduled'||j.status==='in-progress')&&j.date>=todayStr&&j.date<=weekEndStr);
    const daysInMonth = new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    const projected = now.getDate()>0?Math.round((stats.monthRevenue/now.getDate())*daysInMonth):0;
    const marginPct = stats.monthRevenue>0?Math.round(((stats.monthProfit||0)/stats.monthRevenue)*100):0;

    const html = [];
    html.push('<div style="padding-bottom:8px;">');
    html.push('<div style="font-size:20px;font-weight:700;margin-bottom:2px;">Good '+greeting+' &#128075;</div>');
    html.push('<div style="font-size:13px;color:var(--muted);">'+now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})+'</div>');
    html.push('</div>');

    // Alert banners
    if (overdueTasks.length) {
      html.push('<div class="alert-banner alert-red" onclick="App.nav(\'followups\')"><div class="alert-banner-icon">&#9888;&#65039;</div><div><div class="alert-banner-text">'+overdueTasks.length+' overdue task'+(overdueTasks.length!==1?'s':'')+'</div><div class="alert-banner-sub">Tap to review</div></div></div>');
    }
    if (overdueInvoices.length) {
      html.push('<div class="alert-banner alert-red" onclick="App.nav(\'invoices\')"><div class="alert-banner-icon">&#128176;</div><div><div class="alert-banner-text">'+fmtMoney(outstandingAmt)+' outstanding</div><div class="alert-banner-sub">'+overdueInvoices.length+' invoice'+(overdueInvoices.length!==1?'s':'')+' past due</div></div></div>');
    }
    if (newLeadsToday.length) {
      html.push('<div class="alert-banner alert-green" onclick="App.nav(\'leads\')"><div class="alert-banner-icon">&#128276;</div><div><div class="alert-banner-text">'+newLeadsToday.length+' new lead'+(newLeadsToday.length!==1?'s':'')+' today</div><div class="alert-banner-sub">Follow up now</div></div></div>');
    }
    if ((stats.loyaltyAlerts||[]).length) {
      html.push('<div class="alert-banner alert-orange" onclick="App.nav(\'customers\')"><div class="alert-banner-icon">&#11088;</div><div><div class="alert-banner-text">'+(stats.loyaltyAlerts.length)+' loyalty reward'+(stats.loyaltyAlerts.length!==1?'s':'')+' ready</div><div class="alert-banner-sub">Tap to view customers</div></div></div>');
    }

    // Quick actions
    html.push('<div class="section-header">Quick Actions</div>');
    html.push('<div class="quick-actions">');
    html.push('<div class="quick-action" onclick="Jobs.openAdd()"><div class="quick-action-icon">&#128295;</div><div class="quick-action-label">New Job</div></div>');
    html.push('<div class="quick-action" onclick="Leads.openQuickAdd(\'walk-in\')"><div class="quick-action-icon">&#128222;</div><div class="quick-action-label">Log Lead</div></div>');
    html.push('<div class="quick-action" onclick="Invoices.openCreate()"><div class="quick-action-icon">&#129534;</div><div class="quick-action-label">Invoice</div></div>');
    html.push('<div class="quick-action" onclick="App.nav(\'appointments\')"><div class="quick-action-icon">&#128197;</div><div class="quick-action-label">Schedule</div></div>');
    html.push('</div>');

    // KPIs
    html.push('<div class="section-header">This Month</div>');
    html.push('<div class="metric-grid">');
    html.push('<div class="metric-card"><div class="metric-label">Revenue</div><div class="metric-value">'+fmtMoney(stats.monthRevenue)+'</div><div class="metric-delta">'+stats.monthJobs+' jobs done</div></div>');
    html.push('<div class="metric-card"><div class="metric-label">Profit</div><div class="metric-value" style="color:var(--green)">'+fmtMoney(stats.monthProfit||0)+'</div><div class="metric-delta">'+marginPct+'% margin</div></div>');
    html.push('<div class="metric-card"><div class="metric-label">Projected</div><div class="metric-value">'+fmtMoney(projected)+'</div><div class="metric-delta">Day '+now.getDate()+' of '+daysInMonth+'</div></div>');
    html.push('<div class="metric-card"><div class="metric-label">Pipeline</div><div class="metric-value">'+fmtMoney(stats.pipelineValue||0)+'</div><div class="metric-delta">'+stats.activeJobs+' active jobs</div></div>');
    html.push('</div>');

    // Today schedule
    html.push('<div class="section-header" style="display:flex;justify-content:space-between;"><span>Today\'s Schedule</span><span style="font-size:12px;font-weight:400;color:var(--blue);cursor:pointer;" onclick="App.nav(\'appointments\')">View all</span></div>');
    html.push('<div class="card" style="padding:0 16px;">');
    if (todaySchedule.length) {
      const statusColors = {confirmed:'var(--green)','in-progress':'var(--orange)',pending:'var(--faint)',done:'var(--faint)',cancelled:'var(--red)'};
      todaySchedule.forEach(a => {
        html.push('<div class="schedule-item">');
        html.push('<div class="schedule-time"><div>'+( a.time||'—')+'</div>'+(a.duration?'<div class="schedule-time-sub">'+a.duration+'min</div>':'')+'</div>');
        html.push('<div class="schedule-bar" style="background:'+(statusColors[a.status]||'#ccc')+'"></div>');
        html.push('<div class="schedule-info"><div class="schedule-title">'+a.title+'</div><div class="schedule-sub">'+(a.customer_name||'Walk-in')+(a.vehicle_label?' · '+a.vehicle_label:'')+'</div></div>');
        html.push('</div>');
      });
    } else {
      html.push('<div style="padding:20px 0;text-align:center;color:var(--faint);font-size:13px;">No appointments today</div>');
    }
    html.push('</div>');

    // Tasks due
    const taskList = [...overdueTasks, ...todayTasks].slice(0,4);
    if (taskList.length) {
      html.push('<div class="section-header" style="display:flex;justify-content:space-between;"><span>Tasks Due</span><span style="font-size:12px;font-weight:400;color:var(--blue);cursor:pointer;" onclick="App.nav(\'followups\')">View all</span></div>');
      html.push('<div class="card" style="padding:0 16px;">');
      const typeIcon = {call:'&#128222;',email:'&#128231;',text:'&#128172;',other:'&#128204;'};
      taskList.forEach(t => {
        const overdue = t.due_date < todayStr;
        html.push('<div class="list-row" onclick="Followups.openAction(\''+t.id+'\')">');
        html.push('<div style="font-size:20px;">'+(typeIcon[t.type||'other']||'&#128204;')+'</div>');
        html.push('<div class="list-main"><div class="list-name">'+t.title+'</div><div class="list-sub" style="color:'+(overdue?'var(--red)':'var(--muted)')+';">'+(overdue?'Overdue — ':'')+fmtDateShort(t.due_date)+'</div></div>');
        html.push('<div style="font-size:20px;color:var(--faint);">&#8250;</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // This week jobs
    if (thisWeekJobs.length) {
      html.push('<div class="section-header" style="display:flex;justify-content:space-between;"><span>This Week</span><span style="font-size:12px;font-weight:400;color:var(--blue);cursor:pointer;" onclick="App.nav(\'jobs\')">View all</span></div>');
      html.push('<div class="card" style="padding:0 16px;">');
      thisWeekJobs.slice(0,5).forEach(j => {
        const d = new Date(j.date+'T12:00:00');
        html.push('<div class="list-row" onclick="Jobs.openEdit(\''+j.id+'\')">');
        html.push('<div style="text-align:center;min-width:40px;"><div style="font-size:11px;font-weight:700;color:var(--muted);">'+d.toLocaleDateString('en-US',{weekday:'short'})+'</div><div style="font-size:15px;font-weight:700;">'+d.getDate()+'</div></div>');
        html.push('<div class="list-main"><div class="list-name">'+(j.customer_name||'—')+'</div><div class="list-sub">'+catBadge(j.category)+' '+j.service+'</div></div>');
        html.push('<div class="list-right"><div class="list-amount">'+fmtMoney(j.price)+'</div>'+statusBadge(j.status)+'</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    html.push('</div>');
    el.innerHTML = html.join('');
  }
};
