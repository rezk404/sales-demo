/* ==========================================================================
   Sales Pipeline prototype (frontend only, no backend)

   Hierarchy:  STAGE (Kanban column) → LEAD → STATUS → SUB-STATUS → RELATED DATA

   Everything below is driven by the configuration objects in section 1.
   The modal never contains per-status DOM logic: it reads STATUS_CONFIG and
   FIELD_DEFS to decide which statuses, sub-statuses and fields to show.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     1. CONFIGURATION
     ====================================================================== */

  const STAGES = [
    { id: 'fresh',         name: 'Fresh Leads',         color: '#8792a2' },
    { id: 'contact',       name: 'Contact & Follow-Up', color: '#f2b600' },
    { id: 'qualification', name: 'Lead Qualification',  color: '#1d82f5' },
    { id: 'meeting',       name: 'Meeting Management',  color: '#14b8a6' },
    { id: 'deal',          name: 'Deal / Closing',      color: '#2dbe5f' },
  ];

  /*
   * Status → Sub-status → Related field.
   *  - `stage`        the stage a status belongs to
   *  - `subStatuses`  the only sub-statuses allowed for that status;
   *                   `field` is the related field the sub-status points at
   *  - `fields`       the related data shown once a sub-status is chosen
   */
  const STATUS_CONFIG = {
    fresh_lead: {
      label: 'Fresh Lead', stage: 'fresh', tone: 'slate',
      subStatuses: [], fields: [],
      emptyHint: 'Fresh leads have no sub-status. Once you reach the client, move the lead to Contact & Follow-Up.',
    },

    no_answer: {
      label: 'No Answer', stage: 'contact', tone: 'amber',
      subStatuses: [
        { id: 'budget',   label: 'Budget',   field: 'budget' },
        { id: 'project',  label: 'Project',  field: 'project' },
        { id: 'location', label: 'Location', field: 'location' },
        { id: 'note',     label: 'Note',     field: 'note' },
      ],
      fields: ['budget', 'project', 'location', 'note'],
    },
    call_later: {
      label: 'Call Later', stage: 'contact', tone: 'sky',
      subStatuses: [], fields: [],
      emptyHint: 'Call Later has no sub-status. Save to keep the lead in Contact & Follow-Up.',
    },

    qualified: {
      label: 'Qualified', stage: 'qualification', tone: 'green',
      subStatuses: [
        { id: 'project',      label: 'Project',      field: 'project' },
        { id: 'budget',       label: 'Budget',       field: 'budget' },
        { id: 'note',         label: 'Note',         field: 'note' },
        { id: 'down_payment', label: 'Down Payment', field: 'downPayment' },
        { id: 'quarter',      label: 'Quarter',      field: 'quarter' },
      ],
      fields: ['budget', 'project', 'note', 'downPayment', 'quarter'],
    },
    low_budget: {
      label: 'Low Budget', stage: 'qualification', tone: 'orange',
      subStatuses: [
        { id: 'budget',   label: 'Budget',   field: 'budget' },
        { id: 'project',  label: 'Project',  field: 'project' },
        { id: 'location', label: 'Location', field: 'location' },
        { id: 'note',     label: 'Note',     field: 'note' },
      ],
      fields: ['budget', 'project', 'location', 'note'],
    },
    not_interested: {
      label: 'Not Interested', stage: 'qualification', tone: 'red',
      subStatuses: [
        { id: 'location',     label: 'Location',     field: 'location' },
        { id: 'not_a_client', label: 'Not a Client', field: 'note' },
        { id: 'low_budget',   label: 'Low Budget',   field: 'budget' },
        { id: 'project',      label: 'Project',      field: 'project' },
        { id: 'note',         label: 'Note',         field: 'note' },
      ],
      fields: ['location', 'budget', 'project', 'note'],
    },

    schedule_meeting: {
      label: 'Schedule Meeting', stage: 'meeting', tone: 'blue',
      subStatuses: [
        { id: 'office', label: 'Office', field: 'office' },
        { id: 'site',   label: 'Site',   field: 'site' },
        { id: 'note',   label: 'Note',   field: 'note' },
      ],
      fields: ['office', 'site', 'note'],
    },
    meeting_done: {
      label: 'Meeting Done', stage: 'meeting', tone: 'teal',
      subStatuses: [
        { id: 'office',       label: 'Office',       field: 'office' },
        { id: 'site',         label: 'Site',         field: 'site' },
        { id: 'budget',       label: 'Budget',       field: 'budget' },
        { id: 'project_name', label: 'Project Name', field: 'projectName' },
        { id: 'note',         label: 'Note',         field: 'note' },
      ],
      fields: ['office', 'site', 'budget', 'projectName', 'note'],
    },
    reschedule_meeting: {
      label: 'Reschedule Meeting', stage: 'meeting', tone: 'purple',
      subStatuses: [
        { id: 'office', label: 'Office', field: 'office' },
        { id: 'site',   label: 'Site',   field: 'site' },
        { id: 'note',   label: 'Note',   field: 'note' },
      ],
      fields: ['office', 'site', 'note'],
    },

    deal: {
      label: 'Deal', stage: 'deal', tone: 'emerald',
      subStatuses: [
        { id: 'eoi',              label: 'EOI',              field: 'eoi' },
        { id: 'reservation',      label: 'Reservation',      field: 'reservation' },
        { id: 'contract',         label: 'Contract',         field: 'contract' },
        { id: 'reservation_date', label: 'Reservation Date', field: 'reservationDate' },
        { id: 'unit_type',        label: 'Unit Type',        field: 'unitType' },
      ],
      fields: ['eoi', 'reservation', 'contract', 'reservationDate', 'unitType'],
    },
  };

  const PROJECTS = ['Palm Hills', 'ZED East', 'SODIC', 'Hyde Park', 'Mountain View'];
  const CATEGORIES = ['Residential', 'Commercial', 'Coastal'];
  const AGENTS = ['Ahmed Ali', 'Mohamed Mahmoud', 'Ahmed Gad', 'Youssef Ali', 'Mona Samir'];
  const CURRENT_USER = 'Ahmed Gad';
  const AGENT_COLORS = {
    'Ahmed Ali': '#1d82f5', 'Mohamed Mahmoud': '#0f9d8a', 'Ahmed Gad': '#5b6fd6',
    'Youssef Ali': '#d9822b', 'Mona Samir': '#c2477a',
  };
  const OFFICES = ['New Cairo HQ', 'Sheikh Zayed Branch', 'Maadi Branch', 'New Capital Office'];
  const SITES = ['Palm Hills October', 'Palm Hills New Cairo', 'ZED East Sales Center', 'SODIC East', 'Hyde Park New Cairo', 'Mountain View iCity'];
  const LOCATIONS = ['New Cairo', 'Sheikh Zayed', '6th of October', 'New Capital', 'Shorouk', 'Maadi', 'North Coast'];
  const QUARTERS = ['Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027'];
  const UNIT_TYPES = ['Apartment', 'Duplex', 'Penthouse', 'Townhouse', 'Twin House', 'Standalone Villa', 'Chalet'];

  /* Related data fields. Only the approved fields from the client diagram. */
  const FIELD_DEFS = {
    budget:          { label: 'Budget',           type: 'money' },
    project:         { label: 'Project',          type: 'select', options: PROJECTS,  placeholder: 'Select project' },
    projectName:     { label: 'Project Name',     type: 'select', options: PROJECTS,  placeholder: 'Select project' },
    location:        { label: 'Location',         type: 'select', options: LOCATIONS, placeholder: 'Select location' },
    note:            { label: 'Note',             type: 'textarea', placeholder: 'Add a note about this update…', full: true },
    downPayment:     { label: 'Down Payment',     type: 'money' },
    quarter:         { label: 'Quarter',          type: 'select', options: QUARTERS,  placeholder: 'Select quarter' },
    office:          { label: 'Office',           type: 'select', options: OFFICES,   placeholder: 'Select office' },
    site:            { label: 'Site',             type: 'select', options: SITES,     placeholder: 'Select site' },
    eoi:             { label: 'EOI',              type: 'money' },
    reservation:     { label: 'Reservation',      type: 'money' },
    contract:        { label: 'Contract',         type: 'text', placeholder: 'Contract reference no.' },
    reservationDate: { label: 'Reservation Date', type: 'date' },
    unitType:        { label: 'Unit Type',        type: 'select', options: UNIT_TYPES, placeholder: 'Select unit type' },
  };

  const DURATIONS = [
    { value: 'all',   label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: '7d',    label: 'Last 7 days' },
    { value: '30d',   label: 'Last 30 days' },
    { value: 'month', label: 'This month' },
  ];

  /* ======================================================================
     2. ICONS (inline SVG, feather-style)
     ====================================================================== */

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.2" y2="16.2"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><line x1="9" y1="14" x2="9.01" y2="14"/><line x1="15" y1="14" x2="15.01" y2="14"/><path d="M10 22v-4h4v4"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    plusCircle: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    chevronDown: '<polyline points="6 9 12 15 18 9"/>',
    chevronRight: '<polyline points="9 18 15 12 9 6"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    collapse: '<polyline points="4 7 9 12 4 17"/><polyline points="20 7 15 12 20 17"/>',
    expand: '<polyline points="9 7 4 12 9 17"/><polyline points="15 7 20 12 15 17"/>',
    more: '<circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/><circle cx="5" cy="12" r="1.2"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    barChart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    sortDesc: '<line x1="4" y1="6" x2="13" y2="6"/><line x1="4" y1="12" x2="11" y2="12"/><line x1="4" y1="18" x2="9" y2="18"/><polyline points="15 15 18 18 21 15"/><line x1="18" y1="6" x2="18" y2="18"/>',
    sortAlpha: '<path d="M4 18l3.5-10L11 18"/><line x1="5.2" y1="14.5" x2="9.8" y2="14.5"/><polyline points="15 15 18 18 21 15"/><line x1="18" y1="6" x2="18" y2="18"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  };

  function icon(name, cls) {
    return `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  /* ======================================================================
     3. UTILITIES
     ====================================================================== */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const stageById = (id) => STAGES.find((s) => s.id === id);
  const stageIndex = (id) => STAGES.findIndex((s) => s.id === id);
  const statusesForStage = (stageId) => Object.keys(STATUS_CONFIG).filter((k) => STATUS_CONFIG[k].stage === stageId);
  const subStatusOf = (statusId, subId) => {
    const st = STATUS_CONFIG[statusId];
    return st ? st.subStatuses.find((s) => s.id === subId) : null;
  };
  const toneDot = (statusId) => {
    const map = { slate: '#8792a2', amber: '#f2b600', sky: '#2b9fe0', green: '#2dbe5f', orange: '#f28c38', red: '#e5484d', blue: '#4c6ef5', teal: '#14b8a6', purple: '#8b5cf6', emerald: '#10a36b' };
    return map[STATUS_CONFIG[statusId].tone];
  };
  const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

  function avatar(name, size = 'xs') {
    const color = AGENT_COLORS[name] || '#8e99aa';
    return `<span class="avatar avatar-${size}" style="--av:${color}">${esc(initials(name))}</span>`;
  }

  function formatPhone(digits) {
    const d = String(digits || '').replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    return d;
  }

  function formatMoney(value) {
    const n = Number(value);
    if (!value && value !== 0) return '';
    if (!isFinite(n)) return '';
    return 'EGP ' + n.toLocaleString('en-US');
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function formatTime(d) {
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
  }
  function formatDate(d) {
    if (!(d instanceof Date)) d = new Date(d);
    if (isNaN(d)) return '';
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  /* "Just now", "Today, 2:30 PM", "Yesterday, 4:10 PM", "Tomorrow, 11:00 AM", "Mon, 11:00 AM", "12 Sep 2026" */
  function relativeTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    if (diffMs >= 0 && diffMs < 60 * 1000) return 'Just now';
    const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86400000);
    if (dayDiff === 0) return `Today, ${formatTime(d)}`;
    if (dayDiff === -1) return `Yesterday, ${formatTime(d)}`;
    if (dayDiff === 1) return `Tomorrow, ${formatTime(d)}`;
    if (Math.abs(dayDiff) < 7) return `${WEEKDAYS[d.getDay()]}, ${formatTime(d)}`;
    return formatDate(d);
  }

  /* Display value of a related field, used on cards and in summaries */
  function fieldDisplay(fieldId, value) {
    const def = FIELD_DEFS[fieldId];
    if (!def || value == null || value === '') return '';
    if (def.type === 'money') return formatMoney(value);
    if (def.type === 'date') return formatDate(value + 'T00:00:00');
    return String(value);
  }

  /* ======================================================================
     4. DEMO DATA
     ====================================================================== */

  const NOW = Date.now();
  const minutesAgo = (m) => new Date(NOW - m * 60000).toISOString();
  const daysAgo = (d, h = 0) => new Date(NOW - (d * 24 + h) * 3600000).toISOString();
  function dayAt(offsetDays, hour, minute = 0) {
    const d = startOfDay(new Date(NOW));
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }
  function isoDay(offsetDays) {
    const d = startOfDay(new Date(NOW));
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function seedLead(o) {
    const statusLabel = STATUS_CONFIG[o.status].label;
    const sub = subStatusOf(o.status, o.subStatus);
    const history = [
      { at: o.lastActivity, by: o.agent, text: `Status set to ${statusLabel}${sub ? ' › ' + sub.label : ''}` },
      { at: o.createdAt, by: o.agent, text: 'Lead created and assigned' },
    ];
    if (o.status === 'fresh_lead') history.shift();
    return Object.assign({ category: 'Residential', details: {}, nextFollowUp: null, history }, o);
  }

  const DEMO_LEADS = [
    /* ---- Stage 1: Fresh Leads ---- */
    { id: 'LD-10511', name: 'Karim Adel',     phone: '01012844310', project: 'Mountain View', agent: 'Mona Samir',      stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: minutesAgo(18),  createdAt: minutesAgo(18) },
    { id: 'LD-10509', name: 'Nadine Ahmed',   phone: '01123570098', project: 'ZED East',      agent: 'Ahmed Gad',       stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: minutesAgo(140), createdAt: minutesAgo(140) },
    { id: 'LD-10507', name: 'Hany Fathy',     phone: '01224019876', project: '',              agent: 'Youssef Ali',     stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: daysAgo(1, 3),   createdAt: daysAgo(1, 3), category: 'Commercial' },
    { id: 'LD-10506', name: 'Yasmin Fouad',   phone: '01556120473', project: 'Hyde Park',     agent: 'Mohamed Mahmoud', stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: daysAgo(1, 7),   createdAt: daysAgo(1, 7) },
    { id: 'LD-10503', name: 'Islam Tarek',    phone: '01098431256', project: 'Palm Hills',    agent: 'Ahmed Ali',       stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: daysAgo(2, 2),   createdAt: daysAgo(2, 2), category: 'Coastal' },

    /* ---- Stage 2: Contact & Follow-Up ---- */
    { id: 'LD-10498', name: 'Laila Mostafa',  phone: '01007719342', project: 'SODIC',         agent: 'Ahmed Ali',       stage: 'contact', status: 'no_answer', subStatus: 'location',
      details: { location: 'New Cairo', note: 'Prefers a compound close to the AUC area.' },
      lastActivity: minutesAgo(55), createdAt: daysAgo(4), nextFollowUp: dayAt(1, 11) },
    { id: 'LD-10495', name: 'Amr Salah',      phone: '01143308817', project: 'Hyde Park',     agent: 'Mohamed Mahmoud', stage: 'contact', status: 'no_answer', subStatus: 'budget',
      details: { budget: 4500000 }, lastActivity: minutesAgo(210), createdAt: daysAgo(6), nextFollowUp: dayAt(0, 17, 30) },
    { id: 'LD-10491', name: 'Dina Sherif',    phone: '01287765021', project: 'Mountain View', agent: 'Ahmed Gad',       stage: 'contact', status: 'call_later', subStatus: '',
      lastActivity: daysAgo(1, 1), createdAt: daysAgo(5), nextFollowUp: dayAt(0, 17) },
    { id: 'LD-10489', name: 'Mostafa Kamel',  phone: '01019926734', project: 'ZED East',      agent: 'Youssef Ali',     stage: 'contact', status: 'no_answer', subStatus: 'project',
      details: { project: 'ZED East' }, lastActivity: daysAgo(2, 5), createdAt: daysAgo(8) },
    { id: 'LD-10486', name: 'Reem Hamdy',     phone: '01501238846', project: 'Palm Hills',    agent: 'Mona Samir',      stage: 'contact', status: 'call_later', subStatus: '',
      lastActivity: daysAgo(3, 2), createdAt: daysAgo(9), nextFollowUp: dayAt(-1, 16), category: 'Coastal' },

    /* ---- Stage 3: Lead Qualification ---- */
    { id: 'LD-10482', name: 'Ahmed Mohamed',  phone: '01001234567', project: 'Palm Hills',    agent: 'Ahmed Ali',       stage: 'qualification', status: 'qualified', subStatus: 'budget',
      details: { budget: 8500000, project: 'Palm Hills', downPayment: 850000, quarter: 'Q1 2027', note: 'Looking for a 3-bedroom apartment with a garden view.' },
      lastActivity: minutesAgo(35), createdAt: daysAgo(12) },
    { id: 'LD-10479', name: 'Rania Ahmed',    phone: '01114459023', project: 'SODIC',         agent: 'Mohamed Mahmoud', stage: 'qualification', status: 'qualified', subStatus: 'down_payment',
      details: { downPayment: 1200000, budget: 12000000, project: 'SODIC' }, lastActivity: minutesAgo(320), createdAt: daysAgo(14) },
    { id: 'LD-10476', name: 'Tamer Ibrahim',  phone: '01229087415', project: 'Hyde Park',     agent: 'Ahmed Gad',       stage: 'qualification', status: 'low_budget', subStatus: 'budget',
      details: { budget: 2500000, project: 'Hyde Park' }, lastActivity: daysAgo(1, 4), createdAt: daysAgo(15) },
    { id: 'LD-10472', name: 'Sherif Nabil',   phone: '01066231978', project: 'ZED East',      agent: 'Youssef Ali',     stage: 'qualification', status: 'not_interested', subStatus: 'location',
      details: { location: 'Sheikh Zayed', note: 'Only interested in West Cairo projects.' }, lastActivity: daysAgo(2, 1), createdAt: daysAgo(17) },
    { id: 'LD-10470', name: 'Heba Mansour',   phone: '01558804312', project: 'Mountain View', agent: 'Mona Samir',      stage: 'qualification', status: 'qualified', subStatus: 'project',
      details: { project: 'Mountain View', budget: 7000000 }, lastActivity: daysAgo(3, 6), createdAt: daysAgo(18) },
    { id: 'LD-10466', name: 'Walid Shawky',   phone: '01273340561', project: '',              agent: 'Ahmed Ali',       stage: 'qualification', status: 'not_interested', subStatus: 'not_a_client',
      details: { note: 'Asking on behalf of a company. Not a buyer.' }, lastActivity: daysAgo(5), createdAt: daysAgo(20), category: 'Commercial' },

    /* ---- Stage 4: Meeting Management ---- */
    { id: 'LD-10461', name: 'Ahmed Hassan',   phone: '01009873421', project: 'Palm Hills',    agent: 'Ahmed Ali',       stage: 'meeting', status: 'schedule_meeting', subStatus: 'office',
      details: { office: 'New Cairo HQ', note: 'Meeting with the client and his wife.' },
      lastActivity: minutesAgo(90), createdAt: daysAgo(21), nextFollowUp: dayAt(2, 12) },
    { id: 'LD-10458', name: 'Sara Mohamed',   phone: '01127764090', project: 'Palm Hills',    agent: 'Mohamed Mahmoud', stage: 'meeting', status: 'meeting_done', subStatus: 'budget',
      details: { office: 'Sheikh Zayed Branch', site: 'Palm Hills October', budget: 9000000, projectName: 'Palm Hills', note: 'Liked the twin house model. Will confirm budget with family.' },
      lastActivity: minutesAgo(260), createdAt: daysAgo(25) },
    { id: 'LD-10455', name: 'Omar Khaled',    phone: '01206618853', project: 'ZED East',      agent: 'Ahmed Gad',       stage: 'meeting', status: 'reschedule_meeting', subStatus: 'site',
      details: { site: 'ZED East Sales Center', note: 'Client is travelling. New visit next week.' },
      lastActivity: daysAgo(1, 2), createdAt: daysAgo(26), nextFollowUp: dayAt(5, 13) },
    { id: 'LD-10451', name: 'Noha Ragab',     phone: '01023345786', project: 'Mountain View', agent: 'Youssef Ali',     stage: 'meeting', status: 'schedule_meeting', subStatus: 'site',
      details: { site: 'Mountain View iCity' }, lastActivity: daysAgo(2, 3), createdAt: daysAgo(27), nextFollowUp: dayAt(1, 15) },
    { id: 'LD-10447', name: 'Khaled Ezzat',   phone: '01519902247', project: 'SODIC',         agent: 'Mona Samir',      stage: 'meeting', status: 'meeting_done', subStatus: 'project_name',
      details: { office: 'New Cairo HQ', projectName: 'SODIC', budget: 11000000 }, lastActivity: daysAgo(4, 1), createdAt: daysAgo(30) },

    /* ---- Stage 5: Deal / Closing ---- */
    { id: 'LD-10439', name: 'Mahmoud Galal',  phone: '01005561239', project: 'Palm Hills',    agent: 'Ahmed Ali',       stage: 'deal', status: 'deal', subStatus: 'reservation',
      details: { eoi: 100000, reservation: 500000, reservationDate: isoDay(-5), unitType: 'Apartment' },
      lastActivity: minutesAgo(150), createdAt: daysAgo(40) },
    { id: 'LD-10435', name: 'Mariam Adel',    phone: '01148830276', project: 'Mountain View', agent: 'Mohamed Mahmoud', stage: 'deal', status: 'deal', subStatus: 'eoi',
      details: { eoi: 150000, unitType: 'Twin House' }, lastActivity: daysAgo(1, 5), createdAt: daysAgo(38) },
    { id: 'LD-10430', name: 'Hossam Fawzy',   phone: '01283391054', project: 'SODIC',         agent: 'Ahmed Gad',       stage: 'deal', status: 'deal', subStatus: 'contract',
      details: { eoi: 200000, reservation: 750000, contract: 'CN-2026-0412', reservationDate: isoDay(-18), unitType: 'Townhouse' },
      lastActivity: daysAgo(3), createdAt: daysAgo(52) },
    { id: 'LD-10426', name: 'Sara Hassan',    phone: '01067712380', project: 'Hyde Park',     agent: 'Youssef Ali',     stage: 'deal', status: 'deal', subStatus: 'unit_type',
      details: { unitType: 'Penthouse', eoi: 120000 }, lastActivity: daysAgo(6, 2), createdAt: daysAgo(47) },
  ];

  /* ======================================================================
     5. APPLICATION STATE
     ====================================================================== */

  const state = {
    leads: DEMO_LEADS.map(seedLead),
    view: 'kanban',
    search: '',
    filters: { stage: '', status: '', agent: '', project: '', category: '', duration: 'all' },
    collapsed: new Set(),
    sort: {}, // stageId → 'recent' | 'name'
    nextId: 10512,
  };

  const findLead = (id) => state.leads.find((l) => l.id === id);

  /* ======================================================================
     6. CUSTOM SELECT COMPONENT
     One component for toolbar filters, the filter panel and the modal.
     Menus are rendered on <body> with fixed positioning so they are never
     clipped by the modal's scroll area.
     ====================================================================== */

  let openSelectApi = null;

  function createSelect(cfg) {
    const { id, variant = 'field', labelledBy } = cfg;
    let placeholder = cfg.placeholder || 'Select';
    let options = cfg.options || [];
    let value = cfg.value == null ? '' : cfg.value;
    let disabled = !!cfg.disabled;
    let onChange = cfg.onChange;
    let menu = null;
    let activeIdx = -1;

    const root = document.createElement('div');
    root.className = `cselect cselect--${variant}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cselect-btn';
    if (id) btn.id = id;
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    if (labelledBy) btn.setAttribute('aria-labelledby', `${labelledBy} ${id || ''}`.trim());
    root.appendChild(btn);

    const selectable = () => options.filter((o) => !o.disabled);
    const current = () => options.find((o) => o.value === value);

    function renderButton() {
      const o = current();
      const dot = o && o.color ? `<span class="dot" style="--c:${o.color}"></span>` : '';
      const label = o ? (o.buttonLabel || o.label) : placeholder;
      btn.innerHTML = `${dot}<span class="cselect-value${o ? '' : ' is-placeholder'}">${esc(label)}</span>${icon('chevronDown', 'cselect-caret')}`;
      btn.disabled = disabled;
      root.classList.toggle('is-disabled', disabled);
    }

    function highlight(idx) {
      if (!menu) return;
      const items = $$('.cselect-option', menu);
      items.forEach((el) => el.classList.remove('is-active'));
      activeIdx = Math.max(0, Math.min(idx, items.length - 1));
      const el = items[activeIdx];
      if (el) {
        el.classList.add('is-active');
        btn.setAttribute('aria-activedescendant', el.id);
        el.scrollIntoView({ block: 'nearest' });
      }
    }

    function position() {
      if (!menu) return;
      const r = btn.getBoundingClientRect();
      menu.style.minWidth = Math.max(r.width, 160) + 'px';
      const mh = Math.min(menu.scrollHeight, 300);
      const below = window.innerHeight - r.bottom - 12;
      const up = below < mh && r.top > below;
      menu.classList.toggle('is-up', up);
      menu.style.top = (up ? r.top - mh - 4 : r.bottom + 4) + 'px';
      const left = Math.min(r.left, window.innerWidth - menu.offsetWidth - 8);
      menu.style.left = Math.max(8, left) + 'px';
    }

    function open() {
      if (disabled || menu) return;
      closeAllPopovers();
      menu = document.createElement('div');
      menu.className = 'cselect-menu';
      menu.setAttribute('role', 'listbox');
      const uid = Math.random().toString(36).slice(2, 8);
      let lastGroup = null;
      let html = '';
      let i = 0;
      options.forEach((o) => {
        if (o.disabled) return;
        if (o.group && o.group !== lastGroup) {
          html += `<div class="cselect-group">${esc(o.group)}</div>`;
          lastGroup = o.group;
        }
        const sel = o.value === value;
        html += `<div class="cselect-option${sel ? ' is-selected' : ''}" role="option" id="opt-${uid}-${i}" data-idx="${i}" aria-selected="${sel}">` +
          (o.color ? `<span class="dot" style="--c:${o.color}"></span>` : '') +
          `<span>${esc(o.label)}</span>` +
          (o.hint ? `<span class="opt-hint">${esc(o.hint)}</span>` : '') +
          (sel ? icon('check', 'opt-check') : '') + '</div>';
        i++;
      });
      menu.innerHTML = html;
      menu.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus on button
      menu.addEventListener('click', (e) => {
        const el = e.target.closest('.cselect-option');
        if (el) choose(selectable()[Number(el.dataset.idx)].value);
      });
      menu.addEventListener('mousemove', (e) => {
        const el = e.target.closest('.cselect-option');
        if (el && Number(el.dataset.idx) !== activeIdx) highlight(Number(el.dataset.idx));
      });
      document.body.appendChild(menu);
      btn.setAttribute('aria-expanded', 'true');
      position();
      const selIdx = selectable().findIndex((o) => o.value === value);
      highlight(selIdx < 0 ? 0 : selIdx);
      requestAnimationFrame(() => menu && menu.classList.add('is-open'));
      openSelectApi = api;
    }

    function close() {
      if (!menu) return;
      menu.remove();
      menu = null;
      btn.setAttribute('aria-expanded', 'false');
      btn.removeAttribute('aria-activedescendant');
      if (openSelectApi === api) openSelectApi = null;
    }

    function choose(v) {
      const changed = v !== value;
      value = v;
      renderButton();
      close();
      btn.focus();
      if (changed && onChange) onChange(v);
    }

    btn.addEventListener('click', () => (menu ? close() : open()));
    btn.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        if (!menu) open(); else highlight(activeIdx + (k === 'ArrowDown' ? 1 : -1));
      } else if (k === 'Enter' || k === ' ') {
        if (menu) {
          e.preventDefault();
          const o = selectable()[activeIdx];
          if (o) choose(o.value);
        }
      } else if (k === 'Escape' && menu) {
        e.preventDefault();
        e.stopPropagation();
        close();
      } else if (k === 'Tab') {
        close();
      }
    });

    const api = {
      el: root,
      button: btn,
      close,
      contains: (node) => !!(menu && menu.contains(node)),
      get value() { return value; },
      setValue(v) { value = v == null ? '' : v; renderButton(); },
      setOptions(opts, v) { options = opts; if (v !== undefined) value = v; renderButton(); },
      setDisabled(d) { disabled = !!d; if (d) close(); renderButton(); },
      setPlaceholder(p) { placeholder = p; renderButton(); },
      flash() { root.classList.remove('is-flash'); void root.offsetWidth; root.classList.add('is-flash'); },
    };
    renderButton();
    return api;
  }

  /* ---------- Popover helpers (selects, column menus, filter panel) ---------- */

  let openPopMenu = null;
  function closePopMenu() {
    if (openPopMenu) { openPopMenu.el.remove(); openPopMenu.anchor.setAttribute('aria-expanded', 'false'); openPopMenu = null; }
  }
  function closeAllPopovers(except) {
    if (openSelectApi && openSelectApi !== except) openSelectApi.close();
    closePopMenu();
  }

  function showPopMenu(anchor, items) {
    closeAllPopovers();
    const el = document.createElement('div');
    el.className = 'pop-menu';
    el.setAttribute('role', 'menu');
    el.innerHTML = items.map((it, i) => {
      if (it.divider) return '<hr>';
      if (it.label && !it.action) return `<div class="pm-label">${esc(it.label)}</div>`;
      return `<button type="button" role="menuitem" data-i="${i}">${it.icon ? icon(it.icon) : ''}<span>${esc(it.text)}</span>${it.checked ? icon('check', 'pm-check') : ''}</button>`;
    }).join('');
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect();
    el.style.top = r.bottom + 4 + 'px';
    el.style.left = Math.max(8, Math.min(r.right - el.offsetWidth, window.innerWidth - el.offsetWidth - 8)) + 'px';
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      const it = items[Number(b.dataset.i)];
      closePopMenu();
      it.action();
    });
    el.addEventListener('keydown', (e) => {
      const btns = $$('button', el);
      const i = btns.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
      if (e.key === 'Escape') { e.stopPropagation(); closePopMenu(); anchor.focus(); }
    });
    anchor.setAttribute('aria-expanded', 'true');
    openPopMenu = { el, anchor };
    const first = $('button', el);
    if (first) first.focus({ preventScroll: true });
  }

  document.addEventListener('mousedown', (e) => {
    if (openSelectApi && !openSelectApi.el.contains(e.target) && !openSelectApi.contains(e.target)) openSelectApi.close();
    if (openPopMenu && !openPopMenu.el.contains(e.target) && !openPopMenu.anchor.contains(e.target)) closePopMenu();
    const panel = $('#filtersPanel');
    if (!panel.hidden && !panel.contains(e.target) && !$('#filtersBtn').contains(e.target) &&
        !(e.target.closest && e.target.closest('.cselect-menu'))) {
      toggleFiltersPanel(false);
    }
  });
  window.addEventListener('resize', () => closeAllPopovers());
  document.addEventListener('scroll', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('cselect-menu')) return;
    closeAllPopovers();
  }, true);

  /* ======================================================================
     7. FILTERING
     ====================================================================== */

  function inDuration(iso, duration) {
    if (duration === 'all') return true;
    const d = new Date(iso);
    const now = new Date();
    if (duration === 'today') return startOfDay(d).getTime() === startOfDay(now).getTime();
    if (duration === '7d') return now - d <= 7 * 86400000;
    if (duration === '30d') return now - d <= 30 * 86400000;
    if (duration === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  }

  function normalizedQuery() {
    return state.search.trim().toLowerCase().replace(/^#/, '');
  }

  function matchesLead(lead) {
    const f = state.filters;
    if (f.stage && lead.stage !== f.stage) return false;
    if (f.status && lead.status !== f.status) return false;
    if (f.agent && lead.agent !== f.agent) return false;
    if (f.project && lead.project !== f.project) return false;
    if (f.category && lead.category !== f.category) return false;
    if (!inDuration(lead.lastActivity, f.duration)) return false;
    const q = normalizedQuery();
    if (q) {
      const hay = [lead.name, lead.id, lead.project, lead.agent].join(' ').toLowerCase();
      const digits = q.replace(/[\s-]/g, '');
      const phoneHit = /^\d{3,}$/.test(digits) && lead.phone.includes(digits);
      if (!hay.includes(q) && !phoneHit) return false;
    }
    return true;
  }

  function activeFilterCount() {
    const f = state.filters;
    return ['stage', 'status', 'agent', 'project', 'category'].filter((k) => f[k]).length + (f.duration !== 'all' ? 1 : 0);
  }

  /* Wrap search matches in <mark>, escaping everything else */
  function hl(text) {
    const q = normalizedQuery();
    const s = String(text || '');
    if (!q) return esc(s);
    const i = s.toLowerCase().indexOf(q);
    if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
  }

  function sortLeads(list, mode) {
    const arr = list.slice();
    if (mode === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    else arr.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    return arr;
  }

  /* ======================================================================
     8. RENDERING — BOARD
     ====================================================================== */

  const boardEl = $('#board');
  const listEl = $('#listView');

  function statusBadge(statusId) {
    const st = STATUS_CONFIG[statusId];
    return `<span class="badge-status tone-${st.tone}"><span class="dot"></span>${esc(st.label)}</span>`;
  }
  function stateBadges(lead, sepCls = 'lc-sep') {
    const sub = subStatusOf(lead.status, lead.subStatus);
    return statusBadge(lead.status) + (sub ? icon('chevronRight', sepCls) + `<span class="badge-sub">${esc(sub.label)}</span>` : '');
  }

  /* The card's context line: the value of the field the sub-status points at */
  function cardContext(lead) {
    const sub = subStatusOf(lead.status, lead.subStatus);
    if (!sub) return '';
    const value = lead.details[sub.field];
    if (value == null || value === '') return '';
    if (sub.field === 'note') return `<div class="lc-context" title="${esc(value)}"><em>“${esc(value)}”</em></div>`;
    return `<div class="lc-context"><span>${esc(FIELD_DEFS[sub.field].label)}:</span> <strong>${esc(fieldDisplay(sub.field, value))}</strong></div>`;
  }

  function followUpLine(lead) {
    if (!lead.nextFollowUp) return '';
    const overdue = new Date(lead.nextFollowUp) < new Date();
    return `<div class="lc-followup${overdue ? ' is-overdue' : ''}">${icon('calendar')}${overdue ? 'Overdue follow-up' : 'Follow-up'} · ${esc(relativeTime(lead.nextFollowUp))}</div>`;
  }

  function cardHTML(lead) {
    return `
      <article class="lead-card" draggable="true" tabindex="0" role="button" data-id="${esc(lead.id)}"
        aria-label="${esc(lead.name)}, ${esc(STATUS_CONFIG[lead.status].label)}. Open to update.">
        <div class="lc-head">
          <div class="lc-name">${hl(lead.name)}</div>
          <span class="lc-id">#${hl(lead.id)}</span>
        </div>
        <div class="lc-meta">
          <span class="lc-phone">${icon('phone')}${esc(formatPhone(lead.phone))}</span>
          ${lead.project ? `<span>${icon('building')}${hl(lead.project)}</span>` : ''}
        </div>
        <div class="lc-state">${stateBadges(lead)}</div>
        ${cardContext(lead)}
        ${followUpLine(lead)}
        <div class="lc-foot">
          <span class="lc-agent">${avatar(lead.agent)}<span class="lc-agent-name">${hl(lead.agent)}</span></span>
          <span class="lc-time" title="Last activity">${icon('clock')}${esc(relativeTime(lead.lastActivity))}</span>
        </div>
      </article>`;
  }

  function columnHTML(stage, index, visible) {
    const all = state.leads.filter((l) => l.stage === stage.id);
    const shown = sortLeads(visible.filter((l) => l.stage === stage.id), state.sort[stage.id]);
    const filtering = shown.length !== all.length;
    const collapsed = state.collapsed.has(stage.id);
    const countHTML = filtering
      ? `<b>${shown.length}</b><span> of ${all.length} Leads shown</span>`
      : `<b>${all.length}</b><span> ${all.length === 1 ? 'Lead' : 'Leads'}</span>`;

    const chips = statusesForStage(stage.id).map((sid) => {
      const st = STATUS_CONFIG[sid];
      const n = shown.filter((l) => l.status === sid).length;
      const active = state.filters.status === sid;
      return `<button type="button" class="status-chip tone-${st.tone}${active ? ' is-active' : ''}${n === 0 ? ' is-zero' : ''}"
        data-action="status-filter" data-status="${sid}" aria-pressed="${active}"
        title="${active ? 'Show all statuses' : 'Show only ' + esc(st.label)}"><span class="dot"></span>${esc(st.label)} <b>${n}</b></button>`;
    }).join('');

    let body;
    if (shown.length) {
      body = shown.map(cardHTML).join('');
    } else if (all.length === 0) {
      body = `<div class="col-empty">${icon('inbox')}<strong>No leads in this stage</strong>Drag a lead here to move it.</div>`;
    } else {
      body = `<div class="col-empty">${icon('search')}<strong>No matching leads</strong>Adjust the search or filters.</div>`;
    }

    return `
      <section class="column${collapsed ? ' is-collapsed' : ''}" data-stage="${stage.id}" style="--stage:${stage.color}" aria-label="${esc(stage.name)}">
        <header class="col-head">
          <div class="col-title-row">
            <span class="stage-num" title="Stage ${index + 1} of ${STAGES.length}">${index + 1}</span>
            <div class="col-title-text">
              <h2 class="col-title">${esc(stage.name)}</h2>
              <span class="col-count" aria-label="${shown.length} leads">${countHTML}</span>
            </div>
            <div class="col-actions">
              <button type="button" class="icon-btn" data-action="collapse" title="${collapsed ? 'Expand column' : 'Collapse column'}" aria-label="${collapsed ? 'Expand' : 'Collapse'} ${esc(stage.name)}">${icon(collapsed ? 'expand' : 'collapse')}</button>
              <button type="button" class="icon-btn col-menu-btn" data-action="menu" title="Stage options" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(stage.name)} options">${icon('more')}</button>
            </div>
          </div>
          <div class="col-statuses">${chips}</div>
        </header>
        <div class="col-body">
          ${body}
          <div class="drop-hint">${icon('arrowRight')}Drop to move to ${esc(stage.name)}</div>
        </div>
      </section>`;
  }

  function listHTML(visible) {
    const rows = visible
      .slice()
      .sort((a, b) => stageIndex(a.stage) - stageIndex(b.stage) || new Date(b.lastActivity) - new Date(a.lastActivity))
      .map((l) => {
        const stage = stageById(l.stage);
        return `<tr tabindex="0" data-id="${esc(l.id)}">
          <td class="lt-name"><strong>${hl(l.name)}</strong><small>#${hl(l.id)}</small></td>
          <td class="lt-muted" style="color:var(--text-2)">${esc(formatPhone(l.phone))}</td>
          <td>${l.project ? hl(l.project) : '<span class="lt-muted">—</span>'}</td>
          <td><span class="lt-stage"><span class="dot" style="--c:${stage.color}"></span>${esc(stage.name)}</span></td>
          <td><div class="lt-state">${stateBadges(l)}</div></td>
          <td><span class="lc-agent">${avatar(l.agent)}${hl(l.agent)}</span></td>
          <td class="lt-muted">${esc(relativeTime(l.lastActivity))}</td>
        </tr>`;
      }).join('');
    return `<table class="lead-table">
      <thead><tr><th>Lead</th><th>Phone</th><th>Project</th><th>Stage</th><th>Status › Sub-status</th><th>Assigned To</th><th>Last Activity</th></tr></thead>
      <tbody>${rows || `<tr class="lt-empty"><td colspan="7">No leads match your search or filters.</td></tr>`}</tbody>
    </table>`;
  }

  function render() {
    const visible = state.leads.filter(matchesLead);
    if (state.view === 'kanban') {
      const scroll = boardEl.scrollLeft;
      const colScroll = {};
      $$('.column', boardEl).forEach((c) => { colScroll[c.dataset.stage] = $('.col-body', c).scrollTop; });
      boardEl.innerHTML = STAGES.map((s, i) => columnHTML(s, i, visible)).join('');
      boardEl.scrollLeft = scroll;
      $$('.column', boardEl).forEach((c) => { const b = $('.col-body', c); if (colScroll[c.dataset.stage]) b.scrollTop = colScroll[c.dataset.stage]; });
    } else {
      listEl.innerHTML = listHTML(visible);
    }
    renderActiveFilters(visible.length);
  }

  /* ======================================================================
     9. TOOLBAR, SEARCH & FILTERS
     ====================================================================== */

  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');

  const agentOptions = (allLabel) => [{ value: '', label: allLabel }].concat(AGENTS.map((a) => ({ value: a, label: a, hint: a === CURRENT_USER ? 'You' : '' })));
  const projectOptions = (allLabel) => [{ value: '', label: allLabel }].concat(PROJECTS.map((p) => ({ value: p, label: p })));
  const stageOptions = (allLabel) => [{ value: '', label: allLabel }].concat(STAGES.map((s) => ({ value: s.id, label: s.name, color: s.color })));
  function statusFilterOptions() {
    const stages = state.filters.stage ? [stageById(state.filters.stage)] : STAGES;
    const opts = [{ value: '', label: 'All statuses' }];
    stages.forEach((s) => statusesForStage(s.id).forEach((sid) =>
      opts.push({ value: sid, label: STATUS_CONFIG[sid].label, color: toneDot(sid), group: s.name })));
    return opts;
  }

  const controls = {};

  function setFilter(key, value) {
    state.filters[key] = value;
    if (key === 'stage' && value && state.filters.status && STATUS_CONFIG[state.filters.status].stage !== value) {
      state.filters.status = '';
    }
    syncFilterControls();
    render();
  }

  function initToolbar() {
    controls.duration = createSelect({ id: 'durationBtn', variant: 'inline', labelledBy: 'lblDuration', options: DURATIONS, value: 'all', onChange: (v) => setFilter('duration', v) });
    controls.pipeline = createSelect({ id: 'pipelineBtn', variant: 'inline', labelledBy: 'lblPipeline', options: [{ value: 'sales', label: 'Sales Pipeline' }], value: 'sales' });
    controls.category = createSelect({ id: 'categoryBtn', variant: 'inline', labelledBy: 'lblCategory', options: [{ value: '', label: 'All' }].concat(CATEGORIES.map((c) => ({ value: c, label: c }))), value: '', onChange: (v) => setFilter('category', v) });
    controls.project = createSelect({ id: 'projectBtn', variant: 'inline', labelledBy: 'lblProject', options: projectOptions('All'), value: '', onChange: (v) => setFilter('project', v) });
    $('#durationSelect').appendChild(controls.duration.el);
    $('#pipelineSelect').appendChild(controls.pipeline.el);
    $('#categorySelect').appendChild(controls.category.el);
    $('#projectSelect').appendChild(controls.project.el);

    controls.fStage = createSelect({ id: 'fStageBtn', labelledBy: 'lblFStage', options: stageOptions('All stages'), value: '', onChange: (v) => setFilter('stage', v) });
    controls.fStatus = createSelect({ id: 'fStatusBtn', labelledBy: 'lblFStatus', options: statusFilterOptions(), value: '', onChange: (v) => setFilter('status', v) });
    controls.fAgent = createSelect({ id: 'fAgentBtn', labelledBy: 'lblFAgent', options: agentOptions('All agents'), value: '', onChange: (v) => setFilter('agent', v) });
    controls.fProject = createSelect({ id: 'fProjectBtn', labelledBy: 'lblFProject', options: projectOptions('All projects'), value: '', onChange: (v) => setFilter('project', v) });
    controls.fActivity = createSelect({ id: 'fActivityBtn', labelledBy: 'lblFActivity', options: DURATIONS.map((d) => ({ value: d.value, label: d.value === 'all' ? 'Any time' : d.label })), value: 'all', onChange: (v) => setFilter('duration', v) });
    $('#fStage').appendChild(controls.fStage.el);
    $('#fStatus').appendChild(controls.fStatus.el);
    $('#fAgent').appendChild(controls.fAgent.el);
    $('#fProject').appendChild(controls.fProject.el);
    $('#fActivity').appendChild(controls.fActivity.el);

    searchInput.addEventListener('input', () => {
      state.search = searchInput.value;
      searchClear.hidden = !searchInput.value;
      render();
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchInput.value) { e.stopPropagation(); clearSearch(); }
    });
    searchClear.addEventListener('click', () => { clearSearch(); searchInput.focus(); });
    $('#topSearchBtn').addEventListener('click', () => searchInput.focus());

    $('#filtersBtn').addEventListener('click', () => toggleFiltersPanel());
    $('#filtersDone').addEventListener('click', () => toggleFiltersPanel(false));
    $('#filtersReset').addEventListener('click', () => resetFilters(false));
    $('#filtersPanel').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); toggleFiltersPanel(false); $('#filtersBtn').focus(); }
    });

    $$('.vt-btn').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    $('#addLeadBtn').addEventListener('click', () => openModal(null, {}));
    $('#topAddBtn').addEventListener('click', () => openModal(null, {}));
  }

  function clearSearch() {
    searchInput.value = '';
    state.search = '';
    searchClear.hidden = true;
    render();
  }

  function toggleFiltersPanel(force) {
    const panel = $('#filtersPanel');
    const show = force === undefined ? panel.hidden : force;
    if (show) closeAllPopovers();
    panel.hidden = !show;
    $('#filtersBtn').setAttribute('aria-expanded', String(show));
    if (show) { updateFiltersResult(); controls.fStage.button.focus(); }
  }

  function resetFilters(includeSearch) {
    Object.assign(state.filters, { stage: '', status: '', agent: '', project: '', category: '', duration: 'all' });
    if (includeSearch) { searchInput.value = ''; state.search = ''; searchClear.hidden = true; }
    syncFilterControls();
    render();
  }

  function syncFilterControls() {
    const f = state.filters;
    controls.duration.setValue(f.duration);
    controls.category.setValue(f.category);
    controls.project.setValue(f.project);
    controls.fStage.setValue(f.stage);
    controls.fStatus.setOptions(statusFilterOptions(), f.status);
    controls.fAgent.setValue(f.agent);
    controls.fProject.setValue(f.project);
    controls.fActivity.setValue(f.duration);
    const n = activeFilterCount();
    const badge = $('#filtersCount');
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  function updateFiltersResult() {
    const n = state.leads.filter(matchesLead).length;
    $('#filtersResult').textContent = `${n} of ${state.leads.length} leads match`;
  }

  function renderActiveFilters(visibleCount) {
    const f = state.filters;
    const chips = [];
    if (state.search.trim()) chips.push({ key: 'search', label: 'Search', value: `“${state.search.trim()}”` });
    if (f.stage) chips.push({ key: 'stage', label: 'Stage', value: stageById(f.stage).name });
    if (f.status) chips.push({ key: 'status', label: 'Status', value: STATUS_CONFIG[f.status].label });
    if (f.agent) chips.push({ key: 'agent', label: 'Agent', value: f.agent });
    if (f.project) chips.push({ key: 'project', label: 'Project', value: f.project });
    if (f.category) chips.push({ key: 'category', label: 'Category', value: f.category });
    if (f.duration !== 'all') chips.push({ key: 'duration', label: 'Last activity', value: DURATIONS.find((d) => d.value === f.duration).label });

    const wrap = $('#activeFilters');
    if (!$('#filtersPanel').hidden) updateFiltersResult();
    if (!chips.length) { wrap.hidden = true; wrap.innerHTML = ''; return; }
    wrap.hidden = false;
    wrap.innerHTML =
      `<span class="af-result">Showing <strong>${visibleCount}</strong> of ${state.leads.length} leads</span>` +
      chips.map((c) => `<span class="af-chip">${esc(c.label)}: <b>${esc(c.value)}</b><button type="button" data-clear="${c.key}" aria-label="Remove ${esc(c.label)} filter">${icon('x')}</button></span>`).join('') +
      `<button type="button" class="link-btn" data-clear="all">Clear all</button>`;
  }

  $('#activeFilters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-clear]');
    if (!b) return;
    const key = b.dataset.clear;
    if (key === 'all') return resetFilters(true);
    if (key === 'search') return clearSearch();
    setFilter(key, key === 'duration' ? 'all' : '');
  });

  function setView(view) {
    state.view = view;
    $$('.vt-btn').forEach((b) => {
      const on = b.dataset.view === view;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    boardEl.hidden = view !== 'kanban';
    listEl.hidden = view !== 'list';
    render();
  }

  /* ======================================================================
     10. BOARD INTERACTIONS (click, keyboard, column menu, drag & drop)
     ====================================================================== */

  boardEl.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    const column = e.target.closest('.column');
    if (actionBtn) {
      const stageId = column.dataset.stage;
      const action = actionBtn.dataset.action;
      if (action === 'collapse') {
        state.collapsed.has(stageId) ? state.collapsed.delete(stageId) : state.collapsed.add(stageId);
        render();
      } else if (action === 'menu') {
        openColumnMenu(actionBtn, stageId);
      } else if (action === 'status-filter') {
        const sid = actionBtn.dataset.status;
        setFilter('status', state.filters.status === sid ? '' : sid);
      }
      return;
    }
    if (column && column.classList.contains('is-collapsed')) {
      state.collapsed.delete(column.dataset.stage);
      render();
      return;
    }
    const card = e.target.closest('.lead-card');
    if (card) openModal(card.dataset.id, {});
  });

  boardEl.addEventListener('keydown', (e) => {
    const card = e.target.closest('.lead-card');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openModal(card.dataset.id, {}); }
  });

  listEl.addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (row) openModal(row.dataset.id, {});
  });
  listEl.addEventListener('keydown', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openModal(row.dataset.id, {}); }
  });

  function openColumnMenu(anchor, stageId) {
    if (openPopMenu && openPopMenu.anchor === anchor) return closePopMenu();
    const sort = state.sort[stageId] || 'recent';
    const collapsed = state.collapsed.has(stageId);
    showPopMenu(anchor, [
      { text: 'Add lead to this stage', icon: 'plus', action: () => openModal(null, { stage: stageId }) },
      { divider: true },
      { label: 'Sort cards' },
      { text: 'Latest activity first', icon: 'sortDesc', checked: sort === 'recent', action: () => { state.sort[stageId] = 'recent'; render(); } },
      { text: 'Client name (A–Z)', icon: 'sortAlpha', checked: sort === 'name', action: () => { state.sort[stageId] = 'name'; render(); } },
      { divider: true },
      { text: collapsed ? 'Expand column' : 'Collapse column', icon: collapsed ? 'expand' : 'collapse', action: () => { collapsed ? state.collapsed.delete(stageId) : state.collapsed.add(stageId); render(); } },
    ]);
  }

  /* ---- Drag & drop: dropping on another stage opens the update modal ---- */
  let dragId = null;

  function clearDropTargets() {
    $$('.column.is-drop-target', boardEl).forEach((c) => c.classList.remove('is-drop-target'));
  }

  boardEl.addEventListener('dragstart', (e) => {
    const card = e.target.closest && e.target.closest('.lead-card');
    if (!card) return;
    closeAllPopovers();
    dragId = card.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
    const lead = findLead(dragId);
    requestAnimationFrame(() => {
      card.classList.add('is-dragging');
      boardEl.classList.add('is-dragging');
      const src = boardEl.querySelector(`.column[data-stage="${lead.stage}"]`);
      if (src) src.classList.add('is-source');
    });
  });

  boardEl.addEventListener('dragend', () => {
    dragId = null;
    boardEl.classList.remove('is-dragging');
    $$('.is-dragging, .is-source', boardEl).forEach((el) => el.classList.remove('is-dragging', 'is-source'));
    clearDropTargets();
  });

  boardEl.addEventListener('dragover', (e) => {
    if (!dragId) return;
    const col = e.target.closest('.column');
    if (!col) return;
    const lead = findLead(dragId);
    if (col.dataset.stage === lead.stage) { e.dataTransfer.dropEffect = 'none'; clearDropTargets(); return; }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!col.classList.contains('is-drop-target')) { clearDropTargets(); col.classList.add('is-drop-target'); }
  });

  boardEl.addEventListener('dragleave', (e) => {
    const col = e.target.closest('.column');
    if (col && !col.contains(e.relatedTarget)) col.classList.remove('is-drop-target');
  });

  boardEl.addEventListener('drop', (e) => {
    const col = e.target.closest('.column');
    if (!col || !dragId) return;
    e.preventDefault();
    const id = dragId;
    const lead = findLead(id);
    const target = col.dataset.stage;
    boardEl.dispatchEvent(new Event('dragend'));
    if (lead && target !== lead.stage) openModal(id, { targetStage: target });
  });

  /* ======================================================================
     11. LEAD UPDATE MODAL
     One centered dialog: lead info on the left, Stage → Status →
     Sub-status → Related data on the right.
     ====================================================================== */

  const backdrop = $('#modalBackdrop');
  const modalEl = $('#modal');

  const modal = {
    open: false,
    mode: 'edit',     // 'edit' | 'create'
    lead: null,       // original lead (edit mode)
    draft: null,      // working copy
    move: null,       // { from, to } when opened from drag & drop
    selects: {},
    returnFocus: null,
  };

  function autoStatus(stageId) {
    const list = statusesForStage(stageId);
    return list.length === 1 ? list[0] : '';
  }

  function openModal(leadId, opts) {
    closeAllPopovers();
    toggleFiltersPanel(false);
    const lead = leadId ? findLead(leadId) : null;
    modal.mode = lead ? 'edit' : 'create';
    modal.lead = lead;
    modal.move = null;
    modal.returnFocus = document.activeElement;

    if (lead) {
      modal.draft = {
        stage: lead.stage, status: lead.status, subStatus: lead.subStatus,
        details: Object.assign({}, lead.details),
      };
      if (opts.targetStage && opts.targetStage !== lead.stage) {
        modal.move = { from: lead.stage, to: opts.targetStage };
        modal.draft.stage = opts.targetStage;
        modal.draft.status = autoStatus(opts.targetStage);
        modal.draft.subStatus = '';
      }
    } else {
      const stage = opts.stage || 'fresh';
      modal.draft = {
        stage, status: autoStatus(stage), subStatus: '', details: {},
        name: '', phone: '', project: '', category: 'Residential', agent: CURRENT_USER,
      };
    }

    buildModal();
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    modal.open = true;

    // Focus the first thing the user needs to decide
    setTimeout(() => {
      if (modal.mode === 'create') $('#mName').focus();
      else if (!modal.draft.status) modal.selects.status.button.focus();
      else if (STATUS_CONFIG[modal.draft.status].subStatuses.length && !modal.draft.subStatus) modal.selects.sub.button.focus();
      else modal.selects.stage.button.focus();
    }, 60);
  }

  function closeModal() {
    if (!modal.open) return;
    closeAllPopovers();
    modal.open = false;
    backdrop.classList.remove('is-open');
    setTimeout(() => {
      if (modal.open) return;
      backdrop.hidden = true;
      modalEl.innerHTML = '';
      document.body.style.overflow = '';
      const rf = modal.returnFocus;
      if (rf && document.contains(rf)) rf.focus({ preventScroll: true });
    }, 180);
  }

  backdrop.addEventListener('mousedown', (e) => { modal.downOnBackdrop = e.target === backdrop; });
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop && modal.downOnBackdrop) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (!modal.open) {
      if (e.key === 'Escape') { closeAllPopovers(); toggleFiltersPanel(false); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    if (e.key === 'Tab') trapFocus(e);
  });

  function trapFocus(e) {
    const f = $$('button:not(:disabled), input, textarea, [tabindex]:not([tabindex="-1"])', modalEl).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Modal skeleton ---------- */

  function buildModal() {
    const isCreate = modal.mode === 'create';
    const lead = modal.lead;
    const title = isCreate ? 'Add Lead' : 'Update Lead';
    const subtitle = isCreate
      ? 'Create a lead and place it in the pipeline.'
      : `#${lead.id} · Set where this lead is in the pipeline and why.`;

    modalEl.innerHTML = `
      <header class="modal-head">
        <div>
          <h2 id="modalTitle">${title}</h2>
          <p>${esc(subtitle)}</p>
        </div>
        <button type="button" class="icon-btn modal-close" id="modalClose" aria-label="Close">${icon('x')}</button>
      </header>
      <nav class="stepper" id="mStepper" aria-label="Pipeline stage"></nav>
      <div class="modal-body">
        <aside class="lead-panel" id="mLeadPanel"></aside>
        <section class="workflow">
          <div id="mMoveBanner"></div>
          <div>
            <div class="wf-section-head">
              <h3><span class="wf-step-num">1</span>Pipeline position</h3>
              <span class="field-hint">Stage → Status → Sub-status</span>
            </div>
            <div class="wf-grid-3">
              <div class="form-field"><label class="form-label" id="lblMStage">Stage <span class="req">*</span></label><div id="mStageSlot"></div></div>
              <div class="form-field"><label class="form-label" id="lblMStatus">Status <span class="req">*</span></label><div id="mStatusSlot"></div></div>
              <div class="form-field"><label class="form-label" id="lblMSub">Sub-status <span class="req" id="mSubReq">*</span></label><div id="mSubSlot"></div></div>
            </div>
          </div>
          <div>
            <div class="wf-section-head">
              <h3><span class="wf-step-num">2</span>Related details</h3>
              <div class="wf-crumb" id="mCrumb"></div>
            </div>
            <div id="mDetails"></div>
          </div>
        </section>
      </div>
      <footer class="modal-foot">
        <div class="save-summary" id="mSummary"></div>
        <div class="foot-actions">
          <button type="button" class="btn btn-secondary" id="mCancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="mSave">${icon('check')}${isCreate ? 'Add Lead' : 'Save Changes'}</button>
        </div>
      </footer>`;

    $('#modalClose', modalEl).addEventListener('click', closeModal);
    $('#mCancel', modalEl).addEventListener('click', closeModal);
    $('#mSave', modalEl).addEventListener('click', saveModal);
    $('#mStepper', modalEl).addEventListener('click', (e) => {
      const b = e.target.closest('.step');
      if (b) setDraftStage(b.dataset.stage);
    });

    // Pipeline position selects
    modal.selects.stage = createSelect({
      id: 'mStage', labelledBy: 'lblMStage',
      options: STAGES.map((s, i) => ({ value: s.id, label: s.name, color: s.color, hint: `Stage ${i + 1}` })),
      value: modal.draft.stage,
      onChange: (v) => setDraftStage(v),
    });
    modal.selects.status = createSelect({ id: 'mStatus', labelledBy: 'lblMStatus', placeholder: 'Select status', onChange: (v) => setDraftStatus(v) });
    modal.selects.sub = createSelect({ id: 'mSub', labelledBy: 'lblMSub', placeholder: 'Select sub-status', onChange: (v) => setDraftSub(v) });
    $('#mStageSlot', modalEl).appendChild(modal.selects.stage.el);
    $('#mStatusSlot', modalEl).appendChild(modal.selects.status.el);
    $('#mSubSlot', modalEl).appendChild(modal.selects.sub.el);

    renderLeadPanel();
    renderWorkflow();
  }

  /* ---------- Left panel: lead information ---------- */

  function renderLeadPanel() {
    const panel = $('#mLeadPanel', modalEl);
    if (modal.mode === 'create') {
      const d = modal.draft;
      panel.innerHTML = `
        <div class="lp-identity">
          <span class="avatar avatar-lg" style="--av:#8e99aa">${icon('user')}</span>
          <div><div class="lp-name">New lead</div><div class="lp-sub">#LD-${state.nextId} · will be assigned on save</div></div>
        </div>
        <div class="lp-form">
          <div class="form-field"><label class="form-label" for="mName">Client name <span class="req">*</span></label><input class="input" id="mName" autocomplete="off" placeholder="e.g. Ahmed Mohamed" value="${esc(d.name)}"></div>
          <div class="form-field"><label class="form-label" for="mPhone">Phone <span class="req">*</span></label><input class="input" id="mPhone" inputmode="tel" autocomplete="off" placeholder="01X XXXX XXXX" value="${esc(d.phone)}"></div>
          <div class="form-field"><label class="form-label" id="lblMProject">Project</label><div id="mProjectSlot"></div></div>
          <div class="form-field"><label class="form-label" id="lblMCategory">Category</label><div id="mCategorySlot"></div></div>
          <div class="form-field"><label class="form-label" id="lblMAgent">Assigned to</label><div id="mAgentSlot"></div></div>
        </div>`;
      $('#mName', panel).addEventListener('input', (e) => { d.name = e.target.value; renderSummary(); });
      $('#mPhone', panel).addEventListener('input', (e) => { d.phone = e.target.value; renderSummary(); });
      const proj = createSelect({ id: 'mProject', labelledBy: 'lblMProject', placeholder: 'Select project', options: PROJECTS.map((p) => ({ value: p, label: p })), value: d.project, onChange: (v) => { d.project = v; } });
      const cat = createSelect({ id: 'mCategory', labelledBy: 'lblMCategory', options: CATEGORIES.map((c) => ({ value: c, label: c })), value: d.category, onChange: (v) => { d.category = v; } });
      const ag = createSelect({ id: 'mAgent', labelledBy: 'lblMAgent', options: AGENTS.map((a) => ({ value: a, label: a, hint: a === CURRENT_USER ? 'You' : '' })), value: d.agent, onChange: (v) => { d.agent = v; } });
      $('#mProjectSlot', panel).appendChild(proj.el);
      $('#mCategorySlot', panel).appendChild(cat.el);
      $('#mAgentSlot', panel).appendChild(ag.el);
      return;
    }

    const l = modal.lead;
    const stage = stageById(l.stage);
    const followUp = l.nextFollowUp
      ? `<div class="lp-row"><dt>Next follow-up</dt><dd>${esc(relativeTime(l.nextFollowUp))}</dd></div>` : '';
    panel.innerHTML = `
      <div class="lp-identity">
        ${avatar(l.name, 'lg').replace(/--av:[^"]+/, '--av:#13296b')}
        <div><div class="lp-name">${esc(l.name)}</div><div class="lp-sub">#${esc(l.id)} · ${esc(l.category)}</div></div>
      </div>
      <dl class="lp-list">
        <div class="lp-row"><dt>Phone</dt><dd><span style="font-variant-numeric:tabular-nums">${esc(formatPhone(l.phone))}</span>
          <button type="button" class="icon-btn copy-btn" id="mCopyPhone" title="Copy phone number" aria-label="Copy phone number">${icon('copy')}</button></dd></div>
        <div class="lp-row"><dt>Project</dt><dd>${l.project ? esc(l.project) : '<span class="lt-muted">Not set</span>'}</dd></div>
        <div class="lp-row"><dt>Assigned to</dt><dd>${avatar(l.agent)}${esc(l.agent)}</dd></div>
        <div class="lp-row"><dt>Created</dt><dd>${esc(formatDate(l.createdAt))}</dd></div>
        <div class="lp-row"><dt>Last activity</dt><dd>${esc(relativeTime(l.lastActivity))}</dd></div>
        ${followUp}
      </dl>
      <div>
        <div class="lp-section-title">Current position</div>
        <div class="lp-current">
          <div class="lp-current-stage"><span class="dot" style="--c:${stage.color}"></span>${esc(stage.name)}</div>
          <div class="lc-state">${stateBadges(l)}</div>
        </div>
      </div>
      <div class="lp-activity">
        <div class="lp-section-title">Recent activity</div>
        <ol>${l.history.slice(0, 4).map((h) => `<li>${esc(h.text)}<time>${esc(relativeTime(h.at))} · ${esc(h.by)}</time></li>`).join('')}</ol>
      </div>`;

    $('#mCopyPhone', panel).addEventListener('click', () => {
      const text = formatPhone(l.phone);
      const done = () => toast('Phone number copied', text, 'info');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(l.phone).then(done, done);
      else done();
    });
  }

  /* ---------- Right panel: Stage → Status → Sub-status → Related data ---------- */

  function setDraftStage(stageId) {
    const d = modal.draft;
    if (d.stage === stageId) return;
    d.stage = stageId;
    d.status = autoStatus(stageId);
    d.subStatus = '';
    modal.selects.stage.setValue(stageId);
    renderWorkflow();
    modal.selects.status.flash();
  }

  function setDraftStatus(statusId) {
    const d = modal.draft;
    d.status = statusId;
    d.subStatus = '';
    renderWorkflow();
    if (STATUS_CONFIG[statusId].subStatuses.length) modal.selects.sub.flash();
  }

  function setDraftSub(subId) {
    modal.draft.subStatus = subId;
    renderWorkflow();
  }

  function renderWorkflow() {
    const d = modal.draft;
    const st = d.status ? STATUS_CONFIG[d.status] : null;

    // Stepper
    const cur = stageIndex(d.stage);
    const origin = modal.lead ? modal.lead.stage : null;
    $('#mStepper', modalEl).innerHTML = STAGES.map((s, i) => {
      const cls = i < cur ? 'is-done' : i === cur ? 'is-current' : '';
      const showOrigin = origin && origin === s.id && origin !== d.stage;
      return (i ? '<span class="step-line" aria-hidden="true"></span>' : '') +
        `<button type="button" class="step ${cls}" data-stage="${s.id}" style="--stage:${s.color}" aria-current="${i === cur ? 'step' : 'false'}" title="Move to ${esc(s.name)}">
          <span class="step-dot">${i < cur ? icon('check') : i + 1}</span>${esc(s.name)}${showOrigin ? '<span class="step-origin">Was here</span>' : ''}
        </button>`;
    }).join('');

    // Move banner (drag & drop, or stage changed in the modal)
    const banner = $('#mMoveBanner', modalEl);
    if (modal.lead && d.stage !== modal.lead.stage) {
      const from = stageById(modal.lead.stage).name, to = stageById(d.stage).name;
      banner.innerHTML = `<div class="move-banner">${icon('info')}<div>Moving <strong>${esc(modal.lead.name)}</strong> from <strong>${esc(from)}</strong> to <strong>${esc(to)}</strong>. Choose the new status${statusesForStage(d.stage).some((s) => STATUS_CONFIG[s].subStatuses.length) ? ' and sub-status' : ''}, then save to complete the move.</div></div>`;
    } else {
      banner.innerHTML = '';
    }

    // Status options: only statuses of the selected stage
    modal.selects.status.setOptions(
      statusesForStage(d.stage).map((sid) => ({ value: sid, label: STATUS_CONFIG[sid].label, color: toneDot(sid) })),
      d.status
    );

    // Sub-status options: only sub-statuses of the selected status
    const subs = st ? st.subStatuses : [];
    $('#mSubReq', modalEl).hidden = !(st && subs.length);
    const subSelect = modal.selects.sub;
    if (!st || !subs.length) {
      subSelect.setOptions([], '');
      subSelect.setDisabled(true);
      subSelect.setPlaceholder(st ? `No sub-status for ${st.label}` : 'Select a status first');
    } else {
      subSelect.setPlaceholder('Select sub-status');
      subSelect.setOptions(subs.map((s) => ({ value: s.id, label: s.label })), d.subStatus);
      subSelect.setDisabled(false);
    }

    // Crumb next to "Related details"
    const sub = subStatusOf(d.status, d.subStatus);
    $('#mCrumb', modalEl).innerHTML = st
      ? `<span class="badge-status tone-${st.tone}"><span class="dot"></span>${esc(st.label)}</span>` +
        (sub ? icon('chevronRight', 'lc-sep') + `<span class="badge-sub">${esc(sub.label)}</span>` : '')
      : '';

    renderDetails();
    renderSummary();
  }

  function detailsEmpty(title, text, iconName = 'layers') {
    return `<div class="details-empty">${icon(iconName)}<div><strong>${esc(title)}</strong>${esc(text)}</div></div>`;
  }

  function renderDetails() {
    const d = modal.draft;
    const box = $('#mDetails', modalEl);
    const st = d.status ? STATUS_CONFIG[d.status] : null;

    if (!st) {
      box.innerHTML = detailsEmpty('Choose a status', `Pick the status that describes this lead in ${stageById(d.stage).name}. The matching sub-statuses and details will appear here.`);
      return;
    }
    if (!st.subStatuses.length) {
      box.innerHTML = detailsEmpty(`No extra details for ${st.label}`, st.emptyHint || 'Save to apply this status.', 'check');
      return;
    }
    const sub = subStatusOf(d.status, d.subStatus);
    if (!sub) {
      box.innerHTML = detailsEmpty('Choose a sub-status',
        `${st.label} needs a reason: ${st.subStatuses.map((s) => s.label).join(', ')}. The related details will appear here.`);
      return;
    }

    // Prefill the project field from the lead's project when empty
    const leadProject = modal.mode === 'edit' ? modal.lead.project : d.project;
    ['project', 'projectName'].forEach((k) => {
      if (st.fields.includes(k) && !d.details[k] && leadProject) d.details[k] = leadProject;
    });

    box.innerHTML = `<div class="details-card"><div class="details-grid" id="mFieldGrid"></div></div>`;
    const grid = $('#mFieldGrid', box);
    st.fields.forEach((fieldId, i) => {
      const def = FIELD_DEFS[fieldId];
      const primary = sub.field === fieldId;
      const wrap = document.createElement('div');
      wrap.className = `form-field${def.full ? ' is-full' : ''}${primary ? ' is-primary' : ''}`;
      wrap.style.animationDelay = `${i * 30}ms`;
      const inputId = `mf-${fieldId}`;
      const labelId = `lbl-${inputId}`;
      wrap.innerHTML = `<label class="form-label" id="${labelId}" for="${inputId}">${esc(def.label)}${primary ? `<span class="primary-tag" title="Matches the selected sub-status">${esc(sub.label === def.label ? 'Sub-status' : sub.label)}</span>` : ''}</label>`;
      const value = d.details[fieldId] == null ? '' : d.details[fieldId];

      if (def.type === 'select') {
        const sel = createSelect({
          id: inputId, labelledBy: labelId, placeholder: def.placeholder || 'Select',
          options: [{ value: '', label: '—' }].concat(def.options.map((o) => ({ value: o, label: o }))),
          value, onChange: (v) => { d.details[fieldId] = v; renderSummary(); },
        });
        wrap.appendChild(sel.el);
      } else if (def.type === 'money') {
        wrap.insertAdjacentHTML('beforeend',
          `<div class="input-group"><span class="input-addon">EGP</span><input class="input" id="${inputId}" inputmode="numeric" autocomplete="off" placeholder="0" value="${value === '' ? '' : Number(value).toLocaleString('en-US')}"></div>`);
        const input = $('input', wrap);
        input.addEventListener('input', () => {
          const digits = input.value.replace(/[^\d]/g, '');
          d.details[fieldId] = digits ? Number(digits) : '';
          const pos = input.value.length - input.selectionStart;
          input.value = digits ? Number(digits).toLocaleString('en-US') : '';
          const np = Math.max(0, input.value.length - pos);
          input.setSelectionRange(np, np);
          renderSummary();
        });
      } else if (def.type === 'textarea') {
        wrap.insertAdjacentHTML('beforeend', `<textarea class="textarea" id="${inputId}" rows="3" placeholder="${esc(def.placeholder || '')}">${esc(value)}</textarea>`);
        $('textarea', wrap).addEventListener('input', (e) => { d.details[fieldId] = e.target.value; renderSummary(); });
      } else {
        const type = def.type === 'date' ? 'date' : 'text';
        wrap.insertAdjacentHTML('beforeend', `<input class="input" type="${type}" id="${inputId}" autocomplete="off" placeholder="${esc(def.placeholder || '')}" value="${esc(value)}">`);
        $('input', wrap).addEventListener('input', (e) => { d.details[fieldId] = e.target.value; renderSummary(); });
      }
      grid.appendChild(wrap);
    });
  }

  /* ---------- Validation + "what happens on save" summary ---------- */

  function validation() {
    const d = modal.draft;
    if (modal.mode === 'create') {
      if (!d.name.trim()) return 'Enter the client name to continue.';
      if (d.phone.replace(/\D/g, '').length < 10) return 'Enter a valid phone number to continue.';
    }
    if (!d.status) return 'Select a status to continue.';
    if (STATUS_CONFIG[d.status].subStatuses.length && !d.subStatus) return 'Select a sub-status to continue.';
    return '';
  }

  function detailsChanged() {
    if (!modal.lead) return false;
    const a = modal.lead.details, b = modal.draft.details;
    const st = modal.draft.status && STATUS_CONFIG[modal.draft.status];
    if (!st) return false;
    return st.fields.some((k) => String(a[k] == null ? '' : a[k]) !== String(b[k] == null ? '' : b[k]));
  }

  function renderSummary() {
    const el = $('#mSummary', modalEl);
    if (!el) return;
    const d = modal.draft;
    const error = validation();
    $('#mSave', modalEl).disabled = !!error;
    el.className = 'save-summary';
    if (error) {
      el.classList.add('is-invalid');
      el.innerHTML = `${icon('info')}<span>${esc(error)}</span>`;
      return;
    }
    const st = STATUS_CONFIG[d.status];
    const sub = subStatusOf(d.status, d.subStatus);
    const stateText = `<b>${esc(st.label)}</b>${sub ? ' › <b>' + esc(sub.label) + '</b>' : ''}`;
    const stageName = esc(stageById(d.stage).name);

    if (modal.mode === 'create') {
      el.classList.add('is-changed');
      el.innerHTML = `${icon('arrowRight')}<span>On save: new lead added to <b>${stageName}</b> as ${stateText}</span>`;
      return;
    }
    const l = modal.lead;
    const stageChanged = d.stage !== l.stage;
    const stateChanged = d.status !== l.status || d.subStatus !== l.subStatus;
    const dataChanged = detailsChanged();
    if (!stageChanged && !stateChanged && !dataChanged) {
      el.innerHTML = `${icon('check')}<span>No changes yet. The lead stays in <b>${stageName}</b> as ${stateText}.</span>`;
      return;
    }
    const parts = [];
    if (stageChanged) parts.push(`card moves to <b>${stageName}</b>`);
    if (stateChanged || stageChanged) parts.push(`status becomes ${stateText}`);
    if (dataChanged) parts.push('details are updated');
    el.classList.add('is-changed');
    el.innerHTML = `${icon('arrowRight')}<span>On save: ${parts.join(', ')}.</span>`;
  }

  /* ---------- Save ---------- */

  function saveModal() {
    if (validation()) return;
    const d = modal.draft;
    const st = STATUS_CONFIG[d.status];
    const sub = subStatusOf(d.status, d.subStatus);
    const now = new Date().toISOString();

    // Keep only values for the fields of the chosen status (others are preserved untouched)
    const cleanDetails = {};
    st.fields.forEach((k) => { if (d.details[k] !== undefined) cleanDetails[k] = d.details[k]; });

    let lead;
    let message;
    if (modal.mode === 'create') {
      lead = seedLead({
        id: `LD-${state.nextId++}`,
        name: d.name.trim(), phone: d.phone.replace(/\D/g, ''),
        project: d.project, category: d.category, agent: d.agent,
        stage: d.stage, status: d.status, subStatus: d.subStatus,
        details: cleanDetails, lastActivity: now, createdAt: now,
      });
      lead.history = [{ at: now, by: CURRENT_USER, text: `Lead created in ${stageById(d.stage).name}` }];
      state.leads.unshift(lead);
      message = { title: 'Lead added', text: `${lead.name} was added to ${stageById(lead.stage).name}.` };
    } else {
      lead = modal.lead;
      const prevStage = lead.stage;
      const stageChanged = prevStage !== d.stage;
      const stateChanged = lead.status !== d.status || lead.subStatus !== d.subStatus;
      Object.assign(lead.details, cleanDetails);
      if (cleanDetails.project) lead.project = cleanDetails.project;
      else if (cleanDetails.projectName) lead.project = cleanDetails.projectName;
      lead.stage = d.stage;
      lead.status = d.status;
      lead.subStatus = d.subStatus;
      lead.lastActivity = now;
      const stateLabel = `${st.label}${sub ? ' › ' + sub.label : ''}`;
      let historyText;
      if (stageChanged) {
        historyText = `Moved to ${stageById(d.stage).name} · ${stateLabel}`;
        message = { title: 'Lead moved', text: `${lead.name} moved to ${stageById(d.stage).name} as ${stateLabel}.` };
      } else if (stateChanged) {
        historyText = `Status changed to ${stateLabel}`;
        message = { title: 'Lead updated', text: `${lead.name} is now ${stateLabel}.` };
      } else {
        historyText = `Details updated (${stateLabel})`;
        message = { title: 'Lead updated', text: `${lead.name}'s details were saved.` };
      }
      lead.history.unshift({ at: now, by: CURRENT_USER, text: historyText });
    }

    const hidden = !matchesLead(lead);
    closeModal();
    render();
    if (hidden) message.text += ' It is hidden by the current filters.';
    toast(message.title, message.text);
    if (!hidden) highlightLead(lead);
  }

  function highlightLead(lead) {
    if (state.collapsed.has(lead.stage)) { state.collapsed.delete(lead.stage); render(); }
    const sel = state.view === 'kanban' ? `.lead-card[data-id="${lead.id}"]` : `tr[data-id="${lead.id}"]`;
    const el = (state.view === 'kanban' ? boardEl : listEl).querySelector(sel);
    if (!el) return;
    if (state.view === 'kanban') {
      const col = el.closest('.column');
      const b = boardEl.getBoundingClientRect(), c = col.getBoundingClientRect();
      if (c.left < b.left || c.right > b.right) boardEl.scrollTo({ left: boardEl.scrollLeft + c.left - b.left - 24, behavior: 'smooth' });
      const body = el.closest('.col-body');
      body.scrollTop = Math.max(0, el.offsetTop - body.offsetTop - 10);
      el.classList.add('is-updated');
      setTimeout(() => el.classList.remove('is-updated'), 2300);
    } else {
      el.scrollIntoView({ block: 'nearest' });
      el.style.background = '#f0f6ff';
      setTimeout(() => { el.style.transition = 'background 1.2s'; el.style.background = ''; }, 900);
    }
  }

  /* ======================================================================
     12. TOASTS
     ====================================================================== */

  function toast(title, text, kind) {
    const stack = $('#toastStack');
    const t = document.createElement('div');
    t.className = `toast${kind === 'info' ? ' is-info' : ''}`;
    t.setAttribute('role', 'status');
    t.innerHTML = `<span class="toast-icon">${icon(kind === 'info' ? 'info' : 'check')}</span><div><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
    stack.appendChild(t);
    while (stack.children.length > 3) stack.firstChild.remove();
    setTimeout(() => {
      t.classList.add('is-leaving');
      setTimeout(() => t.remove(), 220);
    }, 3800);
  }

  /* ======================================================================
     13. BOOT
     ====================================================================== */

  // Inject static icons declared in index.html via data-icon
  $$('[data-icon]').forEach((el) => {
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
  });

  initToolbar();
  syncFilterControls();
  render();

  // Exposed for quick inspection in the browser console during demos
  window.SalesPipeline = { state, STAGES, STATUS_CONFIG, FIELD_DEFS };
})();
