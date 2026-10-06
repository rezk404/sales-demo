/* ==========================================================================
   Sales Pipeline prototype (frontend only, no backend)

   Two views under Leads › Deals:
     FRESH  new incoming leads (list only, intake data)
     COLD   leads being worked by Sales (list + Kanban)

   Cold hierarchy:  STAGE (Kanban column) → LEAD → STATUS → SUB-STATUS → RELATED DATA

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
  const AGENTS = ['Ahmed Ali', 'Mohamed Mahmoud', 'Ahmed Gad', 'Youssef Ali', 'Mona Samir'];
  const MANAGERS = ['Ahmed Gad', 'Sherine Fawzy'];
  const USERS = ['Ahmed Gad', 'Sherine Fawzy', 'Ahmed Ali', 'Mohamed Mahmoud', 'Youssef Ali', 'Mona Samir'];
  const CURRENT_USER = 'Ahmed Gad';
  const AGENT_COLORS = {
    'Ahmed Ali': '#1d82f5', 'Mohamed Mahmoud': '#0f9d8a', 'Ahmed Gad': '#5b6fd6',
    'Youssef Ali': '#d9822b', 'Mona Samir': '#c2477a', 'Sherine Fawzy': '#7a5bd6',
  };
  const PIPELINES = [{ value: 'sales', label: 'Sales Pipeline' }];

  /* Lead source: Platform options depend on the selected Channel */
  const CHANNELS = [
    { id: 'direct', label: 'Direct', platforms: ['Facebook', 'Instagram', 'Google Ads', 'Website', 'Landing Page', 'WhatsApp', 'Property Finder', 'Aqarmap', 'Bayut', 'Other Property Portal'] },
    { id: 'indirect', label: 'Indirect', platforms: ['Referral', 'Broker', 'Agency / Partner', 'Existing Client', 'Employee Referral', 'Partner Referral'] },
  ];
  const channelById = (id) => CHANNELS.find((c) => c.id === id);
  const channelOf = (platform) => { const c = CHANNELS.find((ch) => ch.platforms.includes(platform)); return c ? c.id : ''; };
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
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    power: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>',
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
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
  function localISODate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const isoDay = (offsetDays) => localISODate(new Date(NOW + offsetDays * 86400000));

  const MANAGER_OF = {
    'Ahmed Ali': 'Ahmed Gad', 'Mohamed Mahmoud': 'Ahmed Gad', 'Ahmed Gad': 'Sherine Fawzy',
    'Youssef Ali': 'Sherine Fawzy', 'Mona Samir': 'Sherine Fawzy',
  };

  function seedLead(o) {
    const lead = Object.assign({
      pipeline: 'sales', pool: 'cold', details: {}, nextFollowUp: null,
      unit: '', notes: '', budget: '', platform: '',
      manager: MANAGER_OF[o.agent] || 'Ahmed Gad', createdBy: CURRENT_USER,
    }, o);
    lead.details = Object.assign({}, lead.details);
    lead.channel = lead.platform ? channelOf(lead.platform) : (o.channel || '');
    if (lead.budget === '' && lead.details.budget) lead.budget = lead.details.budget;
    if (!o.history) {
      const sub = subStatusOf(lead.status, lead.subStatus);
      lead.history = [{ at: lead.createdAt, by: lead.createdBy, text: 'Lead created' }];
      if (lead.pool === 'cold') {
        lead.history.unshift({ at: lead.createdAt, by: lead.manager, text: 'Moved to Cold' });
        if (lead.status !== 'fresh_lead') {
          lead.history.unshift({ at: lead.lastActivity, by: lead.agent, text: `Status set to ${STATUS_CONFIG[lead.status].label}${sub ? ' › ' + sub.label : ''}` });
        }
      }
    }
    return lead;
  }

  const DEMO_LEADS = [
    /* ---------------- FRESH: new incoming leads (list only) ---------------- */
    { pool: 'fresh', id: 'LD-10531', name: 'Hesham Lotfy',    phone: '01012223334', project: 'Palm Hills',    agent: 'Ahmed Ali',       platform: 'Facebook',        budget: 6000000,  unit: 'Apartment',  stage: 'fresh', status: 'fresh_lead', subStatus: '', createdAt: minutesAgo(22),  lastActivity: minutesAgo(22),  notes: 'Asked about 3-bedroom units with installments.' },
    { pool: 'fresh', id: 'LD-10530', name: 'Nour El-Din Samy', phone: '01148807712', project: 'ZED East',     agent: 'Mohamed Mahmoud', platform: 'Instagram',       budget: 9500000,  unit: 'Duplex',     stage: 'fresh', status: 'fresh_lead', subStatus: '', createdAt: minutesAgo(75),  lastActivity: minutesAgo(75) },
    { pool: 'fresh', id: 'LD-10529', name: 'Farida Wael',     phone: '01223415560', project: 'SODIC',         agent: 'Youssef Ali',     platform: 'Referral',        budget: 12000000, unit: 'Townhouse',  stage: 'fresh', status: 'fresh_lead', subStatus: '', createdAt: minutesAgo(190), lastActivity: minutesAgo(190), notes: 'Referred by Rania Ahmed (existing client).' },
    { pool: 'fresh', id: 'LD-10528', name: 'Ayman Rashad',    phone: '01067789012', project: 'Mountain View', agent: 'Mona Samir',      platform: 'Google Ads',      budget: 4200000,  unit: 'Apartment',  stage: 'fresh', status: 'fresh_lead', subStatus: '', createdAt: daysAgo(1, 2),   lastActivity: daysAgo(1, 2) },
    { pool: 'fresh', id: 'LD-10527', name: 'Salma Nabil',     phone: '01553342287', project: 'Hyde Park',     agent: 'Ahmed Gad',       platform: 'Property Finder', budget: 7800000,  unit: 'Penthouse',  stage: 'fresh', status: 'fresh_lead', subStatus: '', createdAt: daysAgo(1, 6),   lastActivity: daysAgo(1, 6) },
    { pool: 'fresh', id: 'LD-10526', name: 'Bassem Fekry',    phone: '01279904413', project: 'Palm Hills',    agent: 'Ahmed Ali',       platform: 'Broker',          budget: 15000000, unit: 'Twin House', stage: 'fresh', status: 'fresh_lead', subStatus: '', createdAt: daysAgo(2, 1),   lastActivity: daysAgo(2, 1) },
    { pool: 'fresh', id: 'LD-10525', name: 'Ola Hamed',       phone: '01001987345', project: '',              agent: '',                platform: 'WhatsApp',        budget: '',       unit: '',           stage: 'fresh', status: 'fresh_lead', subStatus: '', createdAt: daysAgo(2, 5),   lastActivity: daysAgo(2, 5), manager: 'Ahmed Gad', notes: 'Not assigned yet. Wants a call after 6 PM.' },

    /* ---------------- COLD: leads being worked by Sales (Kanban) ---------------- */
    /* Stage 1: Fresh Leads (moved here from the Fresh view) */
    { id: 'LD-10511', name: 'Karim Adel',     phone: '01012844310', project: 'Mountain View', agent: 'Mona Samir',      platform: 'Facebook',        unit: 'Apartment', stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: minutesAgo(40),  createdAt: daysAgo(3) },
    { id: 'LD-10509', name: 'Nadine Ahmed',   phone: '01123570098', project: 'ZED East',      agent: 'Ahmed Gad',       platform: 'Landing Page',    stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: minutesAgo(160), createdAt: daysAgo(3, 4) },
    { id: 'LD-10507', name: 'Hany Fathy',     phone: '01224019876', project: 'Palm Hills',    agent: 'Youssef Ali',     platform: 'Existing Client', stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: daysAgo(1, 3),   createdAt: daysAgo(4) },
    { id: 'LD-10506', name: 'Yasmin Fouad',   phone: '01556120473', project: 'Hyde Park',     agent: 'Mohamed Mahmoud', platform: 'Bayut',           stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: daysAgo(1, 7),   createdAt: daysAgo(4, 5) },

    /* Stage 2: Contact & Follow-Up */
    { id: 'LD-10498', name: 'Laila Mostafa',  phone: '01007719342', project: 'SODIC',         agent: 'Ahmed Ali',       platform: 'Instagram',       stage: 'contact', status: 'no_answer', subStatus: 'location',
      details: { location: 'New Cairo', note: 'Prefers a compound close to the AUC area.' }, lastActivity: minutesAgo(55), createdAt: daysAgo(6), nextFollowUp: dayAt(1, 11) },
    { id: 'LD-10495', name: 'Amr Salah',      phone: '01143308817', project: 'Hyde Park',     agent: 'Mohamed Mahmoud', platform: 'Google Ads',      stage: 'contact', status: 'no_answer', subStatus: 'budget',
      details: { budget: 4500000 }, lastActivity: minutesAgo(210), createdAt: daysAgo(7), nextFollowUp: dayAt(0, 17, 30) },
    { id: 'LD-10491', name: 'Dina Sherif',    phone: '01287765021', project: 'Mountain View', agent: 'Ahmed Gad',       platform: 'Facebook',        stage: 'contact', status: 'call_later', subStatus: '',
      lastActivity: daysAgo(1, 1), createdAt: daysAgo(8), nextFollowUp: dayAt(0, 17) },
    { id: 'LD-10489', name: 'Mostafa Kamel',  phone: '01019926734', project: 'ZED East',      agent: 'Youssef Ali',     platform: 'Aqarmap',         stage: 'contact', status: 'no_answer', subStatus: 'project',
      details: { project: 'ZED East' }, lastActivity: daysAgo(2, 5), createdAt: daysAgo(9) },
    { id: 'LD-10486', name: 'Reem Hamdy',     phone: '01501238846', project: 'Palm Hills',    agent: 'Mona Samir',      platform: 'WhatsApp',        stage: 'contact', status: 'call_later', subStatus: '',
      lastActivity: daysAgo(3, 2), createdAt: daysAgo(10), nextFollowUp: dayAt(-1, 16) },

    /* Stage 3: Lead Qualification */
    { id: 'LD-10482', name: 'Ahmed Mohamed',  phone: '01001234567', project: 'Palm Hills',    agent: 'Ahmed Ali',       platform: 'Facebook',        unit: 'Apartment', stage: 'qualification', status: 'qualified', subStatus: 'budget',
      details: { budget: 8500000, project: 'Palm Hills', downPayment: 850000, quarter: 'Q1 2027', note: 'Looking for a 3-bedroom apartment with a garden view.' },
      lastActivity: minutesAgo(35), createdAt: daysAgo(12) },
    { id: 'LD-10479', name: 'Rania Ahmed',    phone: '01114459023', project: 'SODIC',         agent: 'Mohamed Mahmoud', platform: 'Referral',        stage: 'qualification', status: 'qualified', subStatus: 'down_payment',
      details: { downPayment: 1200000, budget: 12000000, project: 'SODIC' }, lastActivity: minutesAgo(320), createdAt: daysAgo(14) },
    { id: 'LD-10476', name: 'Tamer Ibrahim',  phone: '01229087415', project: 'Hyde Park',     agent: 'Ahmed Gad',       platform: 'Property Finder', stage: 'qualification', status: 'low_budget', subStatus: 'budget',
      details: { budget: 2500000, project: 'Hyde Park' }, lastActivity: daysAgo(1, 4), createdAt: daysAgo(15) },
    { id: 'LD-10472', name: 'Sherif Nabil',   phone: '01066231978', project: 'ZED East',      agent: 'Youssef Ali',     platform: 'Website',         stage: 'qualification', status: 'not_interested', subStatus: 'location',
      details: { location: 'Sheikh Zayed', note: 'Only interested in West Cairo projects.' }, lastActivity: daysAgo(2, 1), createdAt: daysAgo(17) },
    { id: 'LD-10470', name: 'Heba Mansour',   phone: '01558804312', project: 'Mountain View', agent: 'Mona Samir',      platform: 'Agency / Partner', stage: 'qualification', status: 'qualified', subStatus: 'project',
      details: { project: 'Mountain View', budget: 7000000 }, lastActivity: daysAgo(3, 6), createdAt: daysAgo(18) },

    /* Stage 4: Meeting Management */
    { id: 'LD-10461', name: 'Ahmed Hassan',   phone: '01009873421', project: 'Palm Hills',    agent: 'Ahmed Ali',       platform: 'Facebook',        stage: 'meeting', status: 'schedule_meeting', subStatus: 'office',
      details: { office: 'New Cairo HQ', note: 'Meeting with the client and his wife.' }, lastActivity: minutesAgo(90), createdAt: daysAgo(21), nextFollowUp: dayAt(2, 12) },
    { id: 'LD-10458', name: 'Sara Mohamed',   phone: '01127764090', project: 'Palm Hills',    agent: 'Mohamed Mahmoud', platform: 'Employee Referral', stage: 'meeting', status: 'meeting_done', subStatus: 'budget',
      details: { office: 'Sheikh Zayed Branch', site: 'Palm Hills October', budget: 9000000, projectName: 'Palm Hills', note: 'Liked the twin house model. Will confirm budget with family.' },
      lastActivity: minutesAgo(260), createdAt: daysAgo(25) },
    { id: 'LD-10455', name: 'Omar Khaled',    phone: '01206618853', project: 'ZED East',      agent: 'Ahmed Gad',       platform: 'Instagram',       stage: 'meeting', status: 'reschedule_meeting', subStatus: 'site',
      details: { site: 'ZED East Sales Center', note: 'Client is travelling. New visit next week.' }, lastActivity: daysAgo(1, 2), createdAt: daysAgo(26), nextFollowUp: dayAt(5, 13) },
    { id: 'LD-10451', name: 'Noha Ragab',     phone: '01023345786', project: 'Mountain View', agent: 'Youssef Ali',     platform: 'Google Ads',      stage: 'meeting', status: 'schedule_meeting', subStatus: 'site',
      details: { site: 'Mountain View iCity' }, lastActivity: daysAgo(2, 3), createdAt: daysAgo(27), nextFollowUp: dayAt(1, 15) },
    { id: 'LD-10447', name: 'Khaled Ezzat',   phone: '01519902247', project: 'SODIC',         agent: 'Mona Samir',      platform: 'Partner Referral', stage: 'meeting', status: 'meeting_done', subStatus: 'project_name',
      details: { office: 'New Cairo HQ', projectName: 'SODIC', budget: 11000000 }, lastActivity: daysAgo(4, 1), createdAt: daysAgo(30) },

    /* Stage 5: Deal / Closing */
    { id: 'LD-10439', name: 'Mahmoud Galal',  phone: '01005561239', project: 'Palm Hills',    agent: 'Ahmed Ali',       platform: 'Website',         stage: 'deal', status: 'deal', subStatus: 'reservation',
      details: { eoi: 100000, reservation: 500000, reservationDate: isoDay(-5), unitType: 'Apartment' }, lastActivity: minutesAgo(150), createdAt: daysAgo(40) },
    { id: 'LD-10435', name: 'Mariam Adel',    phone: '01148830276', project: 'Mountain View', agent: 'Mohamed Mahmoud', platform: 'Facebook',        stage: 'deal', status: 'deal', subStatus: 'eoi',
      details: { eoi: 150000, unitType: 'Twin House' }, lastActivity: daysAgo(1, 5), createdAt: daysAgo(38) },
    { id: 'LD-10430', name: 'Hossam Fawzy',   phone: '01283391054', project: 'SODIC',         agent: 'Ahmed Gad',       platform: 'Broker',          stage: 'deal', status: 'deal', subStatus: 'contract',
      details: { eoi: 200000, reservation: 750000, contract: 'CN-2026-0412', reservationDate: isoDay(-18), unitType: 'Townhouse' }, lastActivity: daysAgo(3), createdAt: daysAgo(52) },
    { id: 'LD-10426', name: 'Sara Hassan',    phone: '01067712380', project: 'Hyde Park',     agent: 'Youssef Ali',     platform: 'Existing Client', stage: 'deal', status: 'deal', subStatus: 'unit_type',
      details: { unitType: 'Penthouse', eoi: 120000 }, lastActivity: daysAgo(6, 2), createdAt: daysAgo(47) },
  ];

  /* ======================================================================
     5. APPLICATION STATE
     ====================================================================== */

  const state = {
    leads: DEMO_LEADS.map(seedLead),
    section: 'fresh',      // 'fresh' | 'cold'
    coldView: 'kanban',    // 'kanban' | 'list'  (Fresh is list only)
    search: '',
    filters: { project: '', agent: '', stage: '', status: '', channel: '', platform: '' },
    collapsed: new Set(),
    nextId: 10532,
  };

  const findLead = (id) => state.leads.find((l) => l.id === id);
  const isCold = () => state.section === 'cold';
  const poolCount = (pool) => state.leads.filter((l) => l.pool === pool).length;

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
      reposition: () => position(),
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

  /* ---------- Popover handling (select menus, filter panel) ---------- */

  function closeAllPopovers(except) {
    if (openSelectApi && openSelectApi !== except) openSelectApi.close();
  }

  document.addEventListener('mousedown', (e) => {
    if (openSelectApi && !openSelectApi.el.contains(e.target) && !openSelectApi.contains(e.target)) openSelectApi.close();
    const panel = $('#filtersPanel');
    if (!panel.hidden && !panel.contains(e.target) && !$('#filtersBtn').contains(e.target) &&
        !(e.target.closest && e.target.closest('.cselect-menu'))) {
      toggleFiltersPanel(false);
    }
  });
  window.addEventListener('resize', () => closeAllPopovers());
  // Keep an open menu attached to its button while anything behind it scrolls
  document.addEventListener('scroll', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('cselect-menu')) return;
    if (openSelectApi) openSelectApi.reposition();
  }, true);

  /* ======================================================================
     7. FILTERING
     ====================================================================== */

  function normalizedQuery() {
    return state.search.trim().toLowerCase().replace(/^#/, '');
  }

  function matchesLead(lead, section = state.section) {
    if (lead.pool !== section) return false;
    const f = state.filters;
    if (f.project && lead.project !== f.project) return false;
    if (f.agent && lead.agent !== f.agent) return false;
    if (f.channel && lead.channel !== f.channel) return false;
    if (f.platform && lead.platform !== f.platform) return false;
    if (section === 'cold') {
      if (f.stage && lead.stage !== f.stage) return false;
      if (f.status && lead.status !== f.status) return false;
    }
    const q = normalizedQuery();
    if (q) {
      const hay = [lead.name, lead.id, lead.project, lead.agent, lead.platform].join(' ').toLowerCase();
      const digits = q.replace(/[\s-]/g, '');
      const phoneHit = /^\d{3,}$/.test(digits) && lead.phone.includes(digits);
      if (!hay.includes(q) && !phoneHit) return false;
    }
    return true;
  }

  /* Filters that live in the Filters panel (the toolbar shows the others) */
  function panelFilterCount() {
    const f = state.filters;
    const keys = isCold() ? ['stage', 'status', 'channel', 'platform'] : ['channel', 'platform'];
    return keys.filter((k) => f[k]).length;
  }

  function hl(text) {
    const q = normalizedQuery();
    const s = String(text || '');
    if (!q) return esc(s);
    const i = s.toLowerCase().indexOf(q);
    if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
  }

  /* ======================================================================
     8. RENDERING
     ====================================================================== */

  const boardEl = $('#board');
  const listEl = $('#listView');

  function statusBadge(statusId) {
    const st = STATUS_CONFIG[statusId];
    return `<span class="badge-status tone-${st.tone}"><span class="dot"></span>${esc(st.label)}</span>`;
  }
  function stateBadges(lead) {
    const sub = subStatusOf(lead.status, lead.subStatus);
    return statusBadge(lead.status) + (sub ? icon('chevronRight', 'lc-sep') + `<span class="badge-sub">${esc(sub.label)}</span>` : '');
  }
  function agentHTML(name) {
    if (!name) return '<span class="lc-agent"><span class="unassigned">Unassigned</span></span>';
    return `<span class="lc-agent">${avatar(name)}<span class="lc-agent-name">${hl(name)}</span></span>`;
  }
  function sourceText(lead) {
    const ch = channelById(lead.channel);
    if (!ch) return '';
    return lead.platform ? `${ch.label} · ${lead.platform}` : ch.label;
  }

  /* Footer time: upcoming / overdue follow-up wins over last activity */
  function cardTime(lead) {
    if (lead.nextFollowUp) {
      const overdue = new Date(lead.nextFollowUp) < new Date();
      return `<span class="lc-time is-followup${overdue ? ' is-overdue' : ''}" title="${overdue ? 'Overdue follow-up' : 'Next follow-up'}">${icon('calendar')}${esc(relativeTime(lead.nextFollowUp))}</span>`;
    }
    return `<span class="lc-time" title="Last activity">${icon('clock')}${esc(relativeTime(lead.lastActivity))}</span>`;
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
          ${lead.platform ? `<span class="lc-source" title="${esc(sourceText(lead))}">${icon('share')}${hl(lead.platform)}</span>` : ''}
        </div>
        <div class="lc-state">${stateBadges(lead)}</div>
        <div class="lc-foot">${agentHTML(lead.agent)}${cardTime(lead)}</div>
      </article>`;
  }

  function columnHTML(stage, visible) {
    const all = state.leads.filter((l) => l.pool === 'cold' && l.stage === stage.id);
    const shown = visible.filter((l) => l.stage === stage.id)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    const filtering = shown.length !== all.length;
    const collapsed = state.collapsed.has(stage.id);
    let body;
    if (shown.length) body = shown.map(cardHTML).join('');
    else if (!all.length) body = '<div class="col-empty"><strong>No record found.</strong></div>';
    else body = '<div class="col-empty"><strong>No matching leads</strong>Adjust the search or filters.</div>';

    return `
      <section class="column${collapsed ? ' is-collapsed' : ''}" data-stage="${stage.id}" style="--stage:${stage.color}" aria-label="${esc(stage.name)}">
        <header class="col-head">
          <span class="dot"></span>
          <h2 class="col-title">${esc(stage.name)}</h2>
          <span class="col-count" title="${filtering ? `${shown.length} of ${all.length} leads shown` : `${all.length} leads`}">${filtering ? `${shown.length}/${all.length}` : all.length}</span>
          <button type="button" class="icon-btn col-collapse" data-action="collapse" title="${collapsed ? 'Expand' : 'Collapse'}" aria-label="${collapsed ? 'Expand' : 'Collapse'} ${esc(stage.name)}">${icon(collapsed ? 'expand' : 'collapse')}</button>
        </header>
        <div class="col-body">
          ${body}
          <div class="drop-hint">${icon('arrowRight')}Move to ${esc(stage.name)}</div>
        </div>
      </section>`;
  }

  function emptyRow(cols, freshView) {
    const filtered = state.search.trim() || Object.values(state.filters).some(Boolean);
    const title = filtered ? 'No matching leads' : (freshView ? 'No fresh leads' : 'No record found.');
    const text = filtered ? 'Adjust the search or filters.' : (freshView ? 'New incoming leads appear here.' : '');
    return `<tr class="lt-empty"><td colspan="${cols}"><strong>${title}</strong>${text}</td></tr>`;
  }

  function freshListHTML(visible) {
    const rows = visible.slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((l) => `<tr tabindex="0" data-id="${esc(l.id)}">
          <td class="lt-name"><strong>${hl(l.name)}</strong><small>#${hl(l.id)}</small></td>
          <td class="lt-num">${esc(formatPhone(l.phone))}</td>
          <td>${l.project ? hl(l.project) : '<span class="lt-muted">--</span>'}</td>
          <td${l.budget ? ' class="lt-num"' : ''}>${l.budget ? esc(formatMoney(l.budget)) : '<span class="lt-muted">--</span>'}</td>
          <td>${l.unit ? esc(l.unit) : '<span class="lt-muted">--</span>'}</td>
          <td>${agentHTML(l.agent)}</td>
          <td class="lt-source">${l.channel ? `<b>${esc(channelById(l.channel).label)}</b>${l.platform ? ' · ' + hl(l.platform) : ''}` : '--'}</td>
          <td class="lt-muted">${esc(relativeTime(l.createdAt))}</td>
          <td>${statusBadge(l.status)}</td>
          <td class="lt-actions"><button type="button" class="btn btn-secondary btn-xs" data-action="to-cold" title="Start working this lead in the Cold pipeline">Move to Cold${icon('arrowRight')}</button></td>
        </tr>`).join('');
    return `<table class="lead-table">
      <thead><tr><th>Name</th><th>Number</th><th>Project</th><th>Budget</th><th>Unit</th><th>Sales Name</th><th>Channel · Platform</th><th>Created</th><th>Status</th><th class="lt-actions"></th></tr></thead>
      <tbody>${rows || emptyRow(10, true)}</tbody>
    </table>`;
  }

  function coldListHTML(visible) {
    const rows = visible.slice()
      .sort((a, b) => stageIndex(a.stage) - stageIndex(b.stage) || new Date(b.lastActivity) - new Date(a.lastActivity))
      .map((l) => {
        const stage = stageById(l.stage);
        return `<tr tabindex="0" data-id="${esc(l.id)}">
          <td class="lt-name"><strong>${hl(l.name)}</strong><small>#${hl(l.id)}</small></td>
          <td class="lt-num">${esc(formatPhone(l.phone))}</td>
          <td>${l.project ? hl(l.project) : '<span class="lt-muted">--</span>'}</td>
          <td><span class="lt-stage"><span class="dot" style="--c:${stage.color}"></span>${esc(stage.name)}</span></td>
          <td><div class="lt-state">${stateBadges(l)}</div></td>
          <td>${agentHTML(l.agent)}</td>
          <td class="lt-source">${l.platform ? hl(l.platform) : '--'}</td>
          <td>${cardTime(l)}</td>
        </tr>`;
      }).join('');
    return `<table class="lead-table">
      <thead><tr><th>Name</th><th>Number</th><th>Project</th><th>Stage</th><th>Status › Sub-status</th><th>Sales Name</th><th>Platform</th><th>Last Activity / Follow-up</th></tr></thead>
      <tbody>${rows || emptyRow(8, false)}</tbody>
    </table>`;
  }

  function render() {
    const visible = state.leads.filter((l) => matchesLead(l));
    const kanban = isCold() && state.coldView === 'kanban';
    boardEl.hidden = !kanban;
    listEl.hidden = kanban;
    if (kanban) {
      const scroll = boardEl.scrollLeft;
      const colScroll = {};
      $$('.column', boardEl).forEach((c) => { colScroll[c.dataset.stage] = $('.col-body', c).scrollTop; });
      boardEl.innerHTML = STAGES.map((s) => columnHTML(s, visible)).join('');
      boardEl.scrollLeft = scroll;
      $$('.column', boardEl).forEach((c) => { if (colScroll[c.dataset.stage]) $('.col-body', c).scrollTop = colScroll[c.dataset.stage]; });
    } else {
      listEl.innerHTML = isCold() ? coldListHTML(visible) : freshListHTML(visible);
    }
    renderChrome();
    renderActiveFilters(visible.length);
  }

  /* Tabs, sidebar, breadcrumb, counts, view toggle */
  function renderChrome() {
    const cold = isCold();
    const fresh = poolCount('fresh'), coldN = poolCount('cold');
    $('#tabFreshCount').textContent = fresh;
    $('#tabColdCount').textContent = coldN;
    $('#sbFreshCount').textContent = fresh;
    $('#sbColdCount').textContent = coldN;
    $$('.sec-tab').forEach((t) => {
      const on = t.dataset.section === state.section;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    $$('.sb-subitem2').forEach((a) => {
      const on = a.dataset.section === state.section;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('#crumbSection').textContent = cold ? 'Cold' : 'Fresh';
    $('#sectionCaption').textContent = cold ? 'Leads currently being worked by Sales' : 'New incoming leads, not yet in the sales pipeline';
    $('#viewToggle').hidden = !cold;
    $$('.vt-btn').forEach((b) => {
      const on = b.dataset.view === state.coldView;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $$('[data-cold-only]').forEach((el) => { el.hidden = !cold; });
    const n = panelFilterCount();
    $('#filtersCount').textContent = n;
    $('#filtersCount').hidden = n === 0;
  }

  function setSection(section) {
    if (section !== 'fresh' && section !== 'cold') return;
    state.section = section;
    try { history.replaceState(null, '', '#' + section); } catch (e) { /* file:// or sandbox */ }
    toggleFiltersPanel(false);
    closeAllPopovers();
    syncFilterControls();
    render();
    if ($('#app').classList.contains('is-nav-open')) $('#app').classList.remove('is-nav-open');
  }

  function setColdView(view) {
    state.coldView = view;
    render();
  }

  /* ======================================================================
     9. TOOLBAR, SEARCH & FILTERS
     ====================================================================== */

  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');
  const controls = {};

  const allOption = (label) => [{ value: '', label }];
  const agentOptions = (label) => allOption(label).concat(AGENTS.map((a) => ({ value: a, label: a, hint: a === CURRENT_USER ? 'You' : '' })));
  const projectOptions = (label) => allOption(label).concat(PROJECTS.map((p) => ({ value: p, label: p })));
  const stageOptions = (label) => allOption(label).concat(STAGES.map((s) => ({ value: s.id, label: s.name, color: s.color })));
  const channelOptions = (label) => allOption(label).concat(CHANNELS.map((c) => ({ value: c.id, label: c.label })));

  /* Platform options follow the selected channel; with no channel they are grouped */
  function platformOptions(channelId, label) {
    const chans = channelId ? [channelById(channelId)] : CHANNELS;
    const opts = label ? allOption(label) : [];
    chans.forEach((c) => c.platforms.forEach((p) => opts.push({ value: p, label: p, group: channelId ? null : c.label })));
    return opts;
  }
  function statusFilterOptions() {
    const stages = state.filters.stage ? [stageById(state.filters.stage)] : STAGES;
    const opts = allOption('All statuses');
    stages.forEach((s) => statusesForStage(s.id).forEach((sid) =>
      opts.push({ value: sid, label: STATUS_CONFIG[sid].label, color: toneDot(sid), group: s.name })));
    return opts;
  }

  function setFilter(key, value) {
    const f = state.filters;
    f[key] = value;
    if (key === 'stage' && value && f.status && STATUS_CONFIG[f.status].stage !== value) f.status = '';
    if (key === 'channel' && value && f.platform && channelOf(f.platform) !== value) f.platform = '';
    if (key === 'platform' && value) f.channel = channelOf(value);
    syncFilterControls();
    render();
  }

  function initToolbar() {
    controls.pipeline = createSelect({ id: 'pipelineBtn', variant: 'inline', labelledBy: 'lblPipeline', options: PIPELINES, value: 'sales' });
    controls.project = createSelect({ id: 'projectBtn', variant: 'inline', labelledBy: 'lblProject', options: projectOptions('All'), value: '', onChange: (v) => setFilter('project', v) });
    controls.agent = createSelect({ id: 'agentBtn', variant: 'inline', labelledBy: 'lblAgent', options: agentOptions('All'), value: '', onChange: (v) => setFilter('agent', v) });
    $('#pipelineSelect').appendChild(controls.pipeline.el);
    $('#projectSelect').appendChild(controls.project.el);
    $('#agentSelect').appendChild(controls.agent.el);

    controls.fStage = createSelect({ id: 'fStageBtn', labelledBy: 'lblFStage', options: stageOptions('All stages'), value: '', onChange: (v) => setFilter('stage', v) });
    controls.fStatus = createSelect({ id: 'fStatusBtn', labelledBy: 'lblFStatus', options: statusFilterOptions(), value: '', onChange: (v) => setFilter('status', v) });
    controls.fChannel = createSelect({ id: 'fChannelBtn', labelledBy: 'lblFChannel', options: channelOptions('All channels'), value: '', onChange: (v) => setFilter('channel', v) });
    controls.fPlatform = createSelect({ id: 'fPlatformBtn', labelledBy: 'lblFPlatform', options: platformOptions('', 'All platforms'), value: '', onChange: (v) => setFilter('platform', v) });
    $('#fpStage').appendChild(controls.fStage.el);
    $('#fpStatus').appendChild(controls.fStatus.el);
    $('#fpChannel').appendChild(controls.fChannel.el);
    $('#fpPlatform').appendChild(controls.fPlatform.el);

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

    $$('.vt-btn').forEach((b) => b.addEventListener('click', () => setColdView(b.dataset.view)));
    $$('.sec-tab').forEach((t) => t.addEventListener('click', () => setSection(t.dataset.section)));
    $('#addLeadBtn').addEventListener('click', () => openIntakeModal(null));
    $('#topAddBtn').addEventListener('click', () => openIntakeModal(null));
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
    if (show) {
      updateFiltersResult();
      (isCold() ? controls.fStage : controls.fChannel).button.focus();
    }
  }

  function resetFilters(includeSearch) {
    Object.keys(state.filters).forEach((k) => { state.filters[k] = ''; });
    if (includeSearch) { searchInput.value = ''; state.search = ''; searchClear.hidden = true; }
    syncFilterControls();
    render();
  }

  function syncFilterControls() {
    const f = state.filters;
    controls.project.setValue(f.project);
    controls.agent.setValue(f.agent);
    controls.fStage.setValue(f.stage);
    controls.fStatus.setOptions(statusFilterOptions(), f.status);
    controls.fChannel.setValue(f.channel);
    controls.fPlatform.setOptions(platformOptions(f.channel, 'All platforms'), f.platform);
  }

  function updateFiltersResult() {
    const total = poolCount(state.section);
    const n = state.leads.filter((l) => matchesLead(l)).length;
    $('#filtersResult').textContent = `${n} of ${total} ${isCold() ? 'cold' : 'fresh'} leads match`;
  }

  function renderActiveFilters(visibleCount) {
    const f = state.filters;
    const chips = [];
    if (state.search.trim()) chips.push({ key: 'search', label: 'Search', value: `“${state.search.trim()}”` });
    if (f.project) chips.push({ key: 'project', label: 'Project', value: f.project });
    if (f.agent) chips.push({ key: 'agent', label: 'Agent', value: f.agent });
    if (isCold() && f.stage) chips.push({ key: 'stage', label: 'Stage', value: stageById(f.stage).name });
    if (isCold() && f.status) chips.push({ key: 'status', label: 'Status', value: STATUS_CONFIG[f.status].label });
    if (f.channel) chips.push({ key: 'channel', label: 'Channel', value: channelById(f.channel).label });
    if (f.platform) chips.push({ key: 'platform', label: 'Platform', value: f.platform });

    if (!$('#filtersPanel').hidden) updateFiltersResult();
    const wrap = $('#activeFilters');
    if (!chips.length) { wrap.hidden = true; wrap.innerHTML = ''; return; }
    wrap.hidden = false;
    wrap.innerHTML =
      `<span class="af-result">Showing <strong>${visibleCount}</strong> of ${poolCount(state.section)} leads</span>` +
      chips.map((c) => `<span class="af-chip">${esc(c.label)}: <b>${esc(c.value)}</b><button type="button" data-clear="${c.key}" aria-label="Remove ${esc(c.label)} filter">${icon('x')}</button></span>`).join('') +
      '<button type="button" class="link-btn" data-clear="all">Clear all</button>';
  }

  $('#activeFilters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-clear]');
    if (!b) return;
    const key = b.dataset.clear;
    if (key === 'all') return resetFilters(true);
    if (key === 'search') return clearSearch();
    setFilter(key, '');
  });

  /* ======================================================================
     10. SIDEBAR
     ====================================================================== */

  function initSidebar() {
    const app = $('#app');
    try { if (localStorage.getItem('salesDemo.sidebar') === 'collapsed') app.classList.add('is-sb-collapsed'); } catch (e) { /* storage blocked */ }

    $('#sbLeads').addEventListener('click', () => {
      if (app.classList.contains('is-sb-collapsed')) { app.classList.remove('is-sb-collapsed'); saveSidebar(); }
      const g = $('#sbLeadsGroup');
      g.classList.toggle('is-open');
      $('#sbLeads').setAttribute('aria-expanded', String(g.classList.contains('is-open')));
    });
    $$('[data-section]', $('#sidebar')).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      setSection(a.dataset.section);
    }));
    $$('[data-nav]', $('#sidebar')).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      if (a.dataset.nav === 'Deals') return setSection(state.section);
      toast(a.dataset.nav, `${a.dataset.nav} is outside this Sales prototype.`, 'info');
    }));
    $('#sbToggle').addEventListener('click', () => {
      app.classList.toggle('is-sb-collapsed');
      saveSidebar();
      const collapsed = app.classList.contains('is-sb-collapsed');
      $('#sbToggle').setAttribute('aria-label', collapsed ? 'Expand menu' : 'Collapse menu');
      $('#sbToggle').title = collapsed ? 'Expand menu' : 'Collapse menu';
    });
    $('#menuBtn').addEventListener('click', () => app.classList.toggle('is-nav-open'));
    $('#sbOverlay').addEventListener('click', () => app.classList.remove('is-nav-open'));

    function saveSidebar() {
      try { localStorage.setItem('salesDemo.sidebar', app.classList.contains('is-sb-collapsed') ? 'collapsed' : 'open'); } catch (e) { /* storage blocked */ }
    }
  }

  /* ======================================================================
     11. LIST + BOARD INTERACTIONS (click, keyboard, drag & drop)
     ====================================================================== */

  function openLead(id) {
    const lead = findLead(id);
    if (!lead) return;
    if (lead.pool === 'fresh') openIntakeModal(id);
    else openLeadModal(id, {});
  }

  boardEl.addEventListener('click', (e) => {
    const column = e.target.closest('.column');
    if (e.target.closest('[data-action="collapse"]') || (column && column.classList.contains('is-collapsed'))) {
      const id = column.dataset.stage;
      state.collapsed.has(id) ? state.collapsed.delete(id) : state.collapsed.add(id);
      render();
      return;
    }
    const card = e.target.closest('.lead-card');
    if (card) openLead(card.dataset.id);
  });
  boardEl.addEventListener('keydown', (e) => {
    const card = e.target.closest('.lead-card');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLead(card.dataset.id); }
  });

  listEl.addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    if (e.target.closest('[data-action="to-cold"]')) return requestMoveToCold(row.dataset.id);
    openLead(row.dataset.id);
  });
  listEl.addEventListener('keydown', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (row && e.target === row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLead(row.dataset.id); }
  });

  /* Fresh → Cold: the lead enters the Cold pipeline in the Fresh Leads stage */
  function requestMoveToCold(id) {
    const lead = findLead(id);
    if (!lead.agent) {
      openIntakeModal(id, 'Assign a Sales Name before moving this lead to Cold.');
      return;
    }
    moveToCold(lead);
  }

  function moveToCold(lead) {
    const now = new Date().toISOString();
    Object.assign(lead, { pool: 'cold', stage: 'fresh', status: 'fresh_lead', subStatus: '', lastActivity: now });
    lead.history.unshift({ at: now, by: CURRENT_USER, text: 'Moved to Cold › Fresh Leads' });
    render();
    toast('Moved to Cold', `${lead.name} is now in Cold › Fresh Leads.`);
  }

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
    if (col.dataset.stage === findLead(dragId).stage) { e.dataTransfer.dropEffect = 'none'; clearDropTargets(); return; }
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
    const target = col.dataset.stage;
    boardEl.dispatchEvent(new Event('dragend'));
    if (target !== findLead(id).stage) openLeadModal(id, { targetStage: target });
  });

  /* ======================================================================
     12. MODALS
     One centered dialog, two layouts:
       intake    → Add Lead / update a Fresh lead (creation fields)
       workflow  → Cold lead: Stage → Status → Sub-status → Related details
     ====================================================================== */

  const backdrop = $('#modalBackdrop');
  const modalEl = $('#modal');
  const modal = { open: false, kind: '', mode: '', lead: null, draft: null, selects: {}, returnFocus: null, downOnBackdrop: false };

  function showModal(focusSel) {
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    modal.open = true;
    setTimeout(() => { const el = typeof focusSel === 'function' ? focusSel() : $(focusSel, modalEl); if (el) el.focus(); }, 60);
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
    const f = $$('button:not(:disabled), input:not(:disabled), textarea, [tabindex]:not([tabindex="-1"])', modalEl).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function pathHTML(stageId, extra) {
    const stage = stageById(stageId);
    return `<div class="modal-path"><span class="dot" style="--c:#1d82f5"></span>Sales Pipeline${icon('arrowRight')}<span class="dot" style="--c:${stage.color}"></span>${esc(stage.name)}${extra || ''}</div>`;
  }

  function footHint(text) {
    const el = $('#mHint', modalEl);
    if (!el) return;
    el.innerHTML = text ? `${icon('info')}${esc(text)}` : '';
  }

  function moneyInput(id, value) {
    return `<div class="input-group"><span class="input-addon">EGP</span><input class="input" id="${id}" inputmode="numeric" autocomplete="off" placeholder="0" value="${value === '' || value == null ? '' : Number(value).toLocaleString('en-US')}"></div>`;
  }
  function bindMoney(input, onValue) {
    input.addEventListener('input', () => {
      const digits = input.value.replace(/[^\d]/g, '');
      const pos = input.value.length - input.selectionStart;
      input.value = digits ? Number(digits).toLocaleString('en-US') : '';
      const np = Math.max(0, input.value.length - pos);
      input.setSelectionRange(np, np);
      onValue(digits ? Number(digits) : '');
    });
  }

  /* ---------------------------------------------------------------------
     12a. INTAKE MODAL: Add Lead / update a Fresh lead
     --------------------------------------------------------------------- */

  function openIntakeModal(leadId, hint) {
    closeAllPopovers();
    toggleFiltersPanel(false);
    const lead = leadId ? findLead(leadId) : null;
    Object.assign(modal, { kind: 'intake', mode: lead ? 'edit' : 'create', lead, selects: {}, returnFocus: document.activeElement });
    modal.draft = lead
      ? {
          name: lead.name, phone: formatPhone(lead.phone), pipeline: lead.pipeline, budget: lead.budget,
          createdDate: localISODate(lead.createdAt), project: lead.project, agent: lead.agent, unit: lead.unit,
          manager: lead.manager, createdBy: lead.createdBy, channel: lead.channel || 'direct', platform: lead.platform, notes: lead.notes,
        }
      : {
          name: '', phone: '', pipeline: 'sales', budget: '', createdDate: localISODate(new Date()),
          project: '', agent: '', unit: '', manager: '', createdBy: CURRENT_USER, channel: 'direct', platform: '', notes: '',
        };
    buildIntakeModal();
    showModal(hint ? '#fAgent' : '#fName');
    if (hint) footHint(hint);
  }

  function buildIntakeModal() {
    const d = modal.draft;
    const edit = modal.mode === 'edit';
    modalEl.innerHTML = `
      <header class="modal-head">
        <div>
          <h2 id="modalTitle">${edit ? 'Update Lead' : 'Add Lead'}</h2>
          <div class="modal-path"><span class="dot" style="--c:#1d82f5"></span>Sales Pipeline${icon('arrowRight')}${statusBadge('fresh_lead')}<span class="muted">${edit ? '· #' + esc(modal.lead.id) + ' ' : ''}· Fresh</span></div>
        </div>
        <button type="button" class="icon-btn modal-close" id="modalClose" aria-label="Close">${icon('x')}</button>
      </header>
      <div class="modal-body modal-body--single">
        <section class="crm-card">
          <div class="crm-card-head"><h3>Lead Details</h3></div>
          <div class="crm-card-body">
            <div class="intake-grid">
              <div class="form-field"><label class="form-label" for="fName">Name <span class="req">*</span></label><input class="input" id="fName" autocomplete="off" placeholder="e.g. Ahmed Mohamed" value="${esc(d.name)}"></div>
              <div class="form-field"><label class="form-label" for="fPhone">Number <span class="req">*</span></label><input class="input" id="fPhone" inputmode="tel" autocomplete="off" placeholder="01X XXXX XXXX" value="${esc(d.phone)}"></div>
              <div class="form-field"><label class="form-label" id="lblFPipelineM">Sales Pipeline <span class="req">*</span></label><div id="fPipelineSlot"></div></div>
              <div class="form-field"><label class="form-label" id="lblFStatusM">Status</label><div id="fStatusSlot"></div></div>
              <div class="form-field"><label class="form-label" for="fBudget">Budget</label>${moneyInput('fBudget', d.budget)}</div>
              <div class="form-field"><label class="form-label" for="fDate">Lead Creation Date <span class="req">*</span></label><input class="input" type="date" id="fDate" value="${esc(d.createdDate)}"></div>
              <div class="form-field"><label class="form-label" id="lblFProjectM">Project</label><div id="fProjectSlot"></div></div>
              <div class="form-field"><label class="form-label" id="lblFAgentM">Sales Name</label><div id="fAgentSlot"></div></div>
              <div class="form-field"><label class="form-label" id="lblFUnitM">Unit</label><div id="fUnitSlot"></div></div>
              <div class="form-field"><label class="form-label" id="lblFManagerM">Manager</label><div id="fManagerSlot"></div></div>
              <div class="form-field"><label class="form-label" id="lblFCreatedByM">Created By</label><div id="fCreatedBySlot"></div></div>
              <div class="form-field"><span class="form-label" id="lblFChannelM">Channel</span>
                <div class="segmented" role="radiogroup" aria-labelledby="lblFChannelM" id="fChannel">
                  ${CHANNELS.map((c) => `<button type="button" class="seg-btn" role="radio" data-channel="${c.id}" aria-checked="${d.channel === c.id}" tabindex="${d.channel === c.id ? 0 : -1}">${esc(c.label)}</button>`).join('')}
                </div>
              </div>
              <div class="form-field intake-platform"><label class="form-label" id="lblFPlatformM">Platform</label><div id="fPlatformSlot"></div></div>
              <div class="form-field intake-notes"><label class="form-label" for="fNotes">Feedback / Notes</label><textarea class="textarea" id="fNotes" rows="3" placeholder="Feedback from the first contact, preferences, best time to call…">${esc(d.notes)}</textarea></div>
            </div>
          </div>
        </section>
      </div>
      <footer class="modal-foot">
        <div class="foot-actions">
          <button type="button" class="btn btn-primary" id="mSave">${icon('check')}Save</button>
          <button type="button" class="btn-cancel" id="mCancel">Cancel</button>
          <span class="foot-hint" id="mHint"></span>
        </div>
        ${edit ? `<button type="button" class="btn btn-secondary" id="mToCold">Move to Cold${icon('arrowRight')}</button>` : ''}
      </footer>`;

    $('#modalClose', modalEl).addEventListener('click', closeModal);
    $('#mCancel', modalEl).addEventListener('click', closeModal);
    $('#mSave', modalEl).addEventListener('click', () => saveIntake(false));
    if (edit) $('#mToCold', modalEl).addEventListener('click', () => saveIntake(true));

    $('#fName', modalEl).addEventListener('input', (e) => { d.name = e.target.value; footHint(''); });
    $('#fPhone', modalEl).addEventListener('input', (e) => { d.phone = e.target.value; footHint(''); });
    $('#fDate', modalEl).addEventListener('input', (e) => { d.createdDate = e.target.value; });
    $('#fNotes', modalEl).addEventListener('input', (e) => { d.notes = e.target.value; });
    bindMoney($('#fBudget', modalEl), (v) => { d.budget = v; });

    const sel = (slot, cfg) => { const s = createSelect(cfg); $(slot, modalEl).appendChild(s.el); return s; };
    sel('#fPipelineSlot', { id: 'fPipeline', labelledBy: 'lblFPipelineM', options: PIPELINES, value: d.pipeline, onChange: (v) => { d.pipeline = v; } });
    sel('#fStatusSlot', { id: 'fStatusM', labelledBy: 'lblFStatusM', options: [{ value: 'fresh_lead', label: 'Fresh Lead', color: toneDot('fresh_lead') }], value: 'fresh_lead', disabled: true });
    sel('#fProjectSlot', { id: 'fProject', labelledBy: 'lblFProjectM', placeholder: 'Select project', options: allOption('--').concat(PROJECTS.map((p) => ({ value: p, label: p }))), value: d.project, onChange: (v) => { d.project = v; } });
    sel('#fAgentSlot', { id: 'fAgent', labelledBy: 'lblFAgentM', placeholder: 'Select sales name', options: allOption('--').concat(AGENTS.map((a) => ({ value: a, label: a, hint: a === CURRENT_USER ? 'You' : '' }))), value: d.agent,
      onChange: (v) => { d.agent = v; if (v && !d.manager) { d.manager = MANAGER_OF[v] || ''; modal.selects.manager.setValue(d.manager); } footHint(''); } });
    sel('#fUnitSlot', { id: 'fUnit', labelledBy: 'lblFUnitM', placeholder: 'Select unit', options: allOption('--').concat(UNIT_TYPES.map((u) => ({ value: u, label: u }))), value: d.unit, onChange: (v) => { d.unit = v; } });
    modal.selects.manager = sel('#fManagerSlot', { id: 'fManager', labelledBy: 'lblFManagerM', placeholder: 'Select manager', options: allOption('--').concat(MANAGERS.map((m) => ({ value: m, label: m }))), value: d.manager, onChange: (v) => { d.manager = v; } });
    sel('#fCreatedBySlot', { id: 'fCreatedBy', labelledBy: 'lblFCreatedByM', options: USERS.map((u) => ({ value: u, label: u, hint: u === CURRENT_USER ? 'You' : '' })), value: d.createdBy, onChange: (v) => { d.createdBy = v; } });
    modal.selects.platform = sel('#fPlatformSlot', { id: 'fPlatform', labelledBy: 'lblFPlatformM', placeholder: 'Select platform', options: platformOptions(d.channel), value: d.platform, onChange: (v) => { d.platform = v; } });

    // Channel → Platform
    const seg = $('#fChannel', modalEl);
    const setChannel = (id, focus) => {
      if (d.channel !== id) {
        d.channel = id;
        if (d.platform && channelOf(d.platform) !== id) d.platform = '';
        modal.selects.platform.setOptions(platformOptions(id), d.platform);
        modal.selects.platform.flash();
      }
      $$('.seg-btn', seg).forEach((b) => {
        const on = b.dataset.channel === id;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
    };
    seg.addEventListener('click', (e) => { const b = e.target.closest('.seg-btn'); if (b) setChannel(b.dataset.channel); });
    seg.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const i = CHANNELS.findIndex((c) => c.id === d.channel);
      const n = CHANNELS[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + CHANNELS.length) % CHANNELS.length];
      setChannel(n.id, true);
    });
  }

  function intakeError(toCold) {
    const d = modal.draft;
    if (!d.name.trim()) return ['Enter the client name.', '#fName'];
    if (d.phone.replace(/\D/g, '').length < 10) return ['Enter a valid number (at least 10 digits).', '#fPhone'];
    if (!d.createdDate) return ['Choose the lead creation date.', '#fDate'];
    if (toCold && !d.agent) return ['Assign a Sales Name before moving this lead to Cold.', '#fAgent'];
    return null;
  }

  function saveIntake(toCold) {
    const err = intakeError(toCold);
    if (err) {
      footHint(err[0]);
      const el = $(err[1], modalEl);
      if (el) el.focus();
      return;
    }
    const d = modal.draft;
    const now = new Date();
    const timePart = (iso) => { const t = new Date(iso); return [t.getHours(), t.getMinutes()]; };
    const dateFrom = (ymd, base) => {
      const [y, m, day] = ymd.split('-').map(Number);
      const [h, min] = timePart(base);
      return new Date(y, m - 1, day, h, min).toISOString();
    };
    const fields = {
      name: d.name.trim(), phone: d.phone.replace(/\D/g, ''), pipeline: d.pipeline, budget: d.budget,
      project: d.project, agent: d.agent, unit: d.unit, manager: d.manager, createdBy: d.createdBy,
      channel: d.channel, platform: d.platform, notes: d.notes.trim(),
    };
    let lead;
    if (modal.mode === 'create') {
      lead = seedLead(Object.assign({
        pool: 'fresh', id: `LD-${state.nextId++}`, stage: 'fresh', status: 'fresh_lead', subStatus: '',
        createdAt: dateFrom(d.createdDate, now.toISOString()), lastActivity: now.toISOString(),
        details: d.budget ? { budget: d.budget } : {},
        history: [{ at: now.toISOString(), by: CURRENT_USER, text: 'Lead created' }],
      }, fields));
      state.leads.unshift(lead);
    } else {
      lead = modal.lead;
      const createdAt = localISODate(lead.createdAt) === d.createdDate ? lead.createdAt : dateFrom(d.createdDate, lead.createdAt);
      Object.assign(lead, fields, { createdAt, lastActivity: now.toISOString() });
      if (d.budget) lead.details.budget = d.budget;
      lead.history.unshift({ at: now.toISOString(), by: CURRENT_USER, text: 'Lead details updated' });
    }
    closeModal();
    if (toCold) {
      moveToCold(lead);
      return;
    }
    if (state.section !== 'fresh') setSection('fresh'); else render();
    toast(modal.mode === 'create' ? 'Lead added' : 'Lead updated',
      modal.mode === 'create' ? `${lead.name} was added to Fresh.` : `${lead.name}'s details were saved.`);
    highlightLead(lead);
  }

  /* ---------------------------------------------------------------------
     12b. WORKFLOW MODAL: Cold lead update
     --------------------------------------------------------------------- */

  function autoStatus(stageId) {
    const list = statusesForStage(stageId);
    return list.length === 1 ? list[0] : '';
  }

  function openLeadModal(leadId, opts) {
    closeAllPopovers();
    toggleFiltersPanel(false);
    const lead = findLead(leadId);
    Object.assign(modal, { kind: 'workflow', mode: 'edit', lead, selects: {}, returnFocus: document.activeElement });
    modal.draft = { stage: lead.stage, status: lead.status, subStatus: lead.subStatus, details: Object.assign({}, lead.details) };
    if (lead.budget && !modal.draft.details.budget) modal.draft.details.budget = lead.budget;
    if (opts.targetStage && opts.targetStage !== lead.stage) {
      Object.assign(modal.draft, { stage: opts.targetStage, status: autoStatus(opts.targetStage), subStatus: '' });
    }
    buildWorkflowModal();
    showModal(() => {
      const d = modal.draft;
      if (!d.status) return modal.selects.status.button;
      if (STATUS_CONFIG[d.status].subStatuses.length && !d.subStatus) return modal.selects.sub.button;
      return modal.selects.stage.button;
    });
  }

  function infoRow(label, value) {
    return `<div class="info-row"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
  }

  function buildWorkflowModal() {
    const l = modal.lead;
    const none = '<span class="lt-muted">--</span>';
    modalEl.innerHTML = `
      <header class="modal-head">
        <div>
          <h2 id="modalTitle">Update Lead</h2>
          <div id="mPath"></div>
        </div>
        <button type="button" class="icon-btn modal-close" id="modalClose" aria-label="Close">${icon('x')}</button>
      </header>
      <div class="modal-body">
        <aside>
          <section class="crm-card">
            <div class="crm-card-head"><h3>Lead Info</h3></div>
            <div class="crm-card-body">
              <div class="info-identity">
                <span class="avatar avatar-lg" style="--av:#13296b">${esc(initials(l.name))}</span>
                <div><div class="info-name">${esc(l.name)}</div><div class="info-sub">#${esc(l.id)}</div></div>
              </div>
              <dl class="info-list">
                ${infoRow('Number', `<span class="lt-num">${esc(formatPhone(l.phone))}</span><button type="button" class="icon-btn copy-btn" id="mCopyPhone" title="Copy number" aria-label="Copy number">${icon('copy')}</button>`)}
                ${infoRow('Project', l.project ? esc(l.project) : none)}
                ${infoRow('Sales Name', l.agent ? `${avatar(l.agent)}${esc(l.agent)}` : none)}
                ${infoRow('Manager', l.manager ? esc(l.manager) : none)}
                ${infoRow('Channel', l.channel ? esc(channelById(l.channel).label) : none)}
                ${infoRow('Platform', l.platform ? esc(l.platform) : none)}
                ${infoRow('Budget', l.budget ? esc(formatMoney(l.budget)) : none)}
                ${infoRow('Unit', l.unit ? esc(l.unit) : none)}
                ${infoRow('Created', esc(formatDate(l.createdAt)))}
                ${infoRow('Last activity', esc(relativeTime(l.lastActivity)))}
                ${l.nextFollowUp ? infoRow('Follow-up', esc(relativeTime(l.nextFollowUp))) : ''}
              </dl>
              ${l.notes ? `<div class="info-notes"><span>Feedback / Notes</span>${esc(l.notes)}</div>` : ''}
            </div>
          </section>
          <section class="crm-card">
            <div class="crm-card-head"><h3>History</h3></div>
            <div class="crm-card-body">
              <ol class="history">${l.history.slice(0, 3).map((h) => `<li>${esc(h.text)}<time>${esc(relativeTime(h.at))} · ${esc(h.by)}</time></li>`).join('')}</ol>
            </div>
          </section>
        </aside>
        <div>
          <section class="crm-card">
            <div class="crm-card-head"><h3>Sales Status</h3><span id="mMoveNote"></span></div>
            <div class="crm-card-body">
              <div class="wf-grid-3">
                <div class="form-field"><label class="form-label" id="lblMStage">Stage <span class="req">*</span></label><div id="mStageSlot"></div></div>
                <div class="form-field"><label class="form-label" id="lblMStatus">Status <span class="req">*</span></label><div id="mStatusSlot"></div></div>
                <div class="form-field"><label class="form-label" id="lblMSub">Sub-status <span class="req" id="mSubReq">*</span></label><div id="mSubSlot"></div></div>
              </div>
            </div>
          </section>
          <section class="crm-card">
            <div class="crm-card-head"><h3>Related Details</h3><div class="wf-crumb" id="mCrumb"></div></div>
            <div class="crm-card-body" id="mDetails"></div>
          </section>
        </div>
      </div>
      <footer class="modal-foot">
        <div class="foot-actions">
          <button type="button" class="btn btn-primary" id="mSave">${icon('check')}Save Changes</button>
          <button type="button" class="btn-cancel" id="mCancel">Cancel</button>
          <span class="foot-hint" id="mHint"></span>
        </div>
      </footer>`;

    $('#modalClose', modalEl).addEventListener('click', closeModal);
    $('#mCancel', modalEl).addEventListener('click', closeModal);
    $('#mSave', modalEl).addEventListener('click', saveWorkflow);
    $('#mCopyPhone', modalEl).addEventListener('click', () => {
      const done = () => toast('Number copied', formatPhone(l.phone), 'info');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(l.phone).then(done, done);
      else done();
    });

    modal.selects.stage = createSelect({
      id: 'mStage', labelledBy: 'lblMStage',
      options: STAGES.map((s) => ({ value: s.id, label: s.name, color: s.color })),
      value: modal.draft.stage, onChange: (v) => setDraftStage(v),
    });
    modal.selects.status = createSelect({ id: 'mStatus', labelledBy: 'lblMStatus', placeholder: 'Select status', onChange: (v) => setDraftStatus(v) });
    modal.selects.sub = createSelect({ id: 'mSub', labelledBy: 'lblMSub', placeholder: 'Select sub-status', onChange: (v) => setDraftSub(v) });
    $('#mStageSlot', modalEl).appendChild(modal.selects.stage.el);
    $('#mStatusSlot', modalEl).appendChild(modal.selects.status.el);
    $('#mSubSlot', modalEl).appendChild(modal.selects.sub.el);
    renderWorkflow();
  }

  function setDraftStage(stageId) {
    const d = modal.draft;
    if (d.stage === stageId) return;
    Object.assign(d, { stage: stageId, status: autoStatus(stageId), subStatus: '' });
    renderWorkflow();
    modal.selects.status.flash();
  }
  function setDraftStatus(statusId) {
    Object.assign(modal.draft, { status: statusId, subStatus: '' });
    renderWorkflow();
    if (STATUS_CONFIG[statusId].subStatuses.length) modal.selects.sub.flash();
  }
  function setDraftSub(subId) {
    modal.draft.subStatus = subId;
    renderWorkflow();
  }

  function renderWorkflow() {
    const d = modal.draft;
    const l = modal.lead;
    const st = d.status ? STATUS_CONFIG[d.status] : null;
    const moving = d.stage !== l.stage;

    $('#mPath', modalEl).innerHTML = pathHTML(d.stage, `<span class="muted">· #${esc(l.id)} · Cold</span>`);
    $('#mMoveNote', modalEl).innerHTML = moving
      ? `<span class="move-note">${icon('arrowRight')}Moving from ${esc(stageById(l.stage).name)}</span>` : '';

    // Status options: only the statuses of the selected stage
    modal.selects.status.setOptions(
      statusesForStage(d.stage).map((sid) => ({ value: sid, label: STATUS_CONFIG[sid].label, color: toneDot(sid) })),
      d.status
    );

    // Sub-status options: only the sub-statuses of the selected status
    const subs = st ? st.subStatuses : [];
    const subSelect = modal.selects.sub;
    $('#mSubReq', modalEl).hidden = !(st && subs.length);
    if (!st || !subs.length) {
      subSelect.setOptions([], '');
      subSelect.setDisabled(true);
      subSelect.setPlaceholder(st ? 'None' : 'Select a status first');
    } else {
      subSelect.setPlaceholder('Select sub-status');
      subSelect.setOptions(subs.map((s) => ({ value: s.id, label: s.label })), d.subStatus);
      subSelect.setDisabled(false);
    }

    const sub = subStatusOf(d.status, d.subStatus);
    $('#mCrumb', modalEl).innerHTML = st
      ? statusBadge(d.status) + (sub ? icon('chevronRight', 'lc-sep') + `<span class="badge-sub">${esc(sub.label)}</span>` : '')
      : '';

    renderDetails();
    footHint(workflowError() || '');
    $('#mSave', modalEl).disabled = !!workflowError();
  }

  function renderDetails() {
    const d = modal.draft;
    const box = $('#mDetails', modalEl);
    const st = d.status ? STATUS_CONFIG[d.status] : null;
    if (!st) { box.innerHTML = '<div class="details-empty">Select a status to see the related details.</div>'; return; }
    if (!st.subStatuses.length) { box.innerHTML = `<div class="details-empty">${esc(st.label)} has no sub-status and no extra details.</div>`; return; }
    const sub = subStatusOf(d.status, d.subStatus);
    if (!sub) { box.innerHTML = '<div class="details-empty">Select a sub-status to see the related details.</div>'; return; }

    ['project', 'projectName'].forEach((k) => {
      if (st.fields.includes(k) && !d.details[k] && modal.lead.project) d.details[k] = modal.lead.project;
    });

    box.innerHTML = '<div class="details-grid" id="mFieldGrid"></div>';
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
        const s = createSelect({
          id: inputId, labelledBy: labelId, placeholder: def.placeholder || 'Select',
          options: allOption('--').concat(def.options.map((o) => ({ value: o, label: o }))),
          value, onChange: (v) => { d.details[fieldId] = v; },
        });
        wrap.appendChild(s.el);
      } else if (def.type === 'money') {
        wrap.insertAdjacentHTML('beforeend', moneyInput(inputId, value));
        bindMoney($('input', wrap), (v) => { d.details[fieldId] = v; });
      } else if (def.type === 'textarea') {
        wrap.insertAdjacentHTML('beforeend', `<textarea class="textarea" id="${inputId}" rows="3" placeholder="${esc(def.placeholder || '')}">${esc(value)}</textarea>`);
        $('textarea', wrap).addEventListener('input', (e) => { d.details[fieldId] = e.target.value; });
      } else {
        const type = def.type === 'date' ? 'date' : 'text';
        wrap.insertAdjacentHTML('beforeend', `<input class="input" type="${type}" id="${inputId}" autocomplete="off" placeholder="${esc(def.placeholder || '')}" value="${esc(value)}">`);
        $('input', wrap).addEventListener('input', (e) => { d.details[fieldId] = e.target.value; });
      }
      grid.appendChild(wrap);
    });
  }

  function workflowError() {
    const d = modal.draft;
    if (!d.status) return 'Select a status.';
    if (STATUS_CONFIG[d.status].subStatuses.length && !d.subStatus) return 'Select a sub-status.';
    return '';
  }

  function saveWorkflow() {
    if (workflowError()) return;
    const d = modal.draft;
    const lead = modal.lead;
    const st = STATUS_CONFIG[d.status];
    const sub = subStatusOf(d.status, d.subStatus);
    const now = new Date().toISOString();
    const stageChanged = lead.stage !== d.stage;
    const stateChanged = lead.status !== d.status || lead.subStatus !== d.subStatus;

    st.fields.forEach((k) => { if (d.details[k] !== undefined) lead.details[k] = d.details[k]; });
    if (st.fields.includes('budget') && d.details.budget) lead.budget = d.details.budget;
    const proj = (st.fields.includes('project') && d.details.project) || (st.fields.includes('projectName') && d.details.projectName);
    if (proj) lead.project = proj;
    Object.assign(lead, { stage: d.stage, status: d.status, subStatus: d.subStatus, lastActivity: now });

    const stateLabel = `${st.label}${sub ? ' › ' + sub.label : ''}`;
    let historyText, message;
    if (stageChanged) {
      historyText = `Moved to ${stageById(d.stage).name} · ${stateLabel}`;
      message = ['Lead moved', `${lead.name} moved to ${stageById(d.stage).name} as ${stateLabel}.`];
    } else if (stateChanged) {
      historyText = `Status changed to ${stateLabel}`;
      message = ['Lead updated', `${lead.name} is now ${stateLabel}.`];
    } else {
      historyText = `Details updated (${stateLabel})`;
      message = ['Lead updated', `${lead.name}'s details were saved.`];
    }
    lead.history.unshift({ at: now, by: CURRENT_USER, text: historyText });

    const hidden = !matchesLead(lead);
    closeModal();
    render();
    toast(message[0], message[1] + (hidden ? ' It is hidden by the current filters.' : ''));
    if (!hidden) highlightLead(lead);
  }

  function highlightLead(lead) {
    if (lead.pool === 'cold' && state.collapsed.has(lead.stage)) { state.collapsed.delete(lead.stage); render(); }
    const kanban = isCold() && state.coldView === 'kanban';
    const el = kanban
      ? boardEl.querySelector(`.lead-card[data-id="${lead.id}"]`)
      : listEl.querySelector(`tr[data-id="${lead.id}"]`);
    if (!el) return;
    if (kanban) {
      const col = el.closest('.column');
      const b = boardEl.getBoundingClientRect(), c = col.getBoundingClientRect();
      if (c.left < b.left || c.right > b.right) boardEl.scrollTo({ left: boardEl.scrollLeft + c.left - b.left - 24, behavior: 'smooth' });
      const body = el.closest('.col-body');
      body.scrollTop = Math.max(0, el.offsetTop - body.offsetTop - 10);
    } else {
      el.scrollIntoView({ block: 'nearest' });
    }
    el.classList.add('is-updated');
    setTimeout(() => el.classList.remove('is-updated'), 2300);
  }

  /* ======================================================================
     13. TOASTS
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
    }, 3600);
  }

  /* ======================================================================
     14. BOOT
     ====================================================================== */

  $$('[data-icon]').forEach((el) => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); });

  initSidebar();
  initToolbar();
  const fromHash = (location.hash || '').replace('#', '');
  if (fromHash === 'cold') state.section = 'cold';
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if ((h === 'fresh' || h === 'cold') && h !== state.section) setSection(h);
  });
  syncFilterControls();
  render();

  // Exposed for quick inspection in the browser console during demos
  window.SalesPipeline = { state, STAGES, STATUS_CONFIG, FIELD_DEFS, CHANNELS };
})();
