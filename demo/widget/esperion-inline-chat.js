/**
 * Esperion Inline Chat v2.0.0
 * Split-screen live AI chat + business dashboard widget. Zero dependencies.
 */
(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[data-container]');
  if (!script) return;

  const CFG = {
    container: script.getAttribute('data-container') || '#demo-chat',
    agent: script.getAttribute('data-agent') || 'mike',
    theme: script.getAttribute('data-theme') || 'trades',
    company: script.getAttribute('data-company') || '',
    tagline: script.getAttribute('data-tagline') || 'AI Demo — Powered by Esperion',
    calendly: script.getAttribute('data-calendly') || 'https://calendly.com/hello-esperion/30min',
    cap: parseInt(script.getAttribute('data-cap') || '10', 10),
    mock: script.getAttribute('data-mock') === 'true',
  };

  const wsUrl = (() => {
    try {
      const u = new URL(script.src);
      return (u.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + u.host;
    } catch (e) {
      return 'wss://demo.aitools.co.nz';
    }
  })();

  if (!document.getElementById('eci-styles')) {
    const style = document.createElement('style');
    style.id = 'eci-styles';
    style.textContent = `
.eci-card{
  --eci-primary:#10B981;--eci-primary-h:#059669;--eci-accent:#D97706;
  --eci-text:#1F2937;--eci-text-m:#6B7280;--eci-bg:#FFFFFF;--eci-bg-msg:#F3F4F6;--eci-border:#E5E7EB;
  --eci-surface:#F8FAFC;--eci-surface-2:#F3F4F6;--eci-good:#10B981;--eci-warn:#D97706;--eci-danger:#DC2626;
  --eci-cool:#2563EB;--eci-shadow:0 18px 50px rgba(15,23,42,0.10),0 6px 18px rgba(15,23,42,0.06);
  background:var(--eci-bg);border:1px solid var(--eci-border);border-radius:20px;box-shadow:var(--eci-shadow);
  display:flex;flex-direction:column;overflow:hidden;width:100%;max-width:820px;height:520px;
  font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--eci-text);
}
.eci-card[data-theme="realestate"]{
  --eci-primary:#1F2937;--eci-primary-h:#111827;--eci-accent:#D4A843;--eci-cool:#0F766E;
  --eci-surface:#FAFAF9;
}
.eci-card[data-theme="business"]{
  --eci-primary:#6366F1;--eci-primary-h:#4F46E5;--eci-accent:#10B981;--eci-cool:#6366F1;
  --eci-surface:#F5F3FF;
}
.eci-card *{box-sizing:border-box;margin:0;padding:0;}
.eci-shell{display:grid;grid-template-rows:auto 1fr;min-height:0;height:100%;}
.eci-header{
  background:linear-gradient(135deg,var(--eci-primary),color-mix(in srgb,var(--eci-primary) 78%,#ffffff));
  color:#fff;padding:15px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;
}
.eci-avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;user-select:none;font-family:'Outfit','DM Sans',sans-serif;}
.eci-name-wrap{min-width:0;flex:1;}
.eci-agent-name{font-size:15px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'Outfit','DM Sans',sans-serif;}
.eci-tagline{font-size:11px;opacity:.76;margin-top:2px;}
.eci-tagline.eci-reconnecting{opacity:1;color:#FCD34D;}
.eci-header-right{display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0;}
.eci-status-dot{width:8px;height:8px;border-radius:50%;background:#34D399;flex-shrink:0;}
.eci-status-dot.eci-offline{background:#F87171;}
.eci-clear-btn,.eci-tab{
  background:transparent;border:none;color:rgba(255,255,255,0.78);cursor:pointer;border-radius:999px;
  display:flex;align-items:center;justify-content:center;transition:color .15s,background .15s;
  -webkit-tap-highlight-color:transparent;
}
.eci-clear-btn{padding:6px;}
.eci-clear-btn:hover,.eci-tab:hover{color:#fff;background:rgba(255,255,255,0.14);}
.eci-clear-btn:focus-visible,.eci-tab:focus-visible{outline:2px solid rgba(255,255,255,0.85);outline-offset:2px;}
.eci-mobile-tabs{display:none;gap:8px;margin-left:8px;}
.eci-tab{padding:7px 12px;font-size:12px;font-weight:600;line-height:1;}
.eci-tab[aria-selected="true"]{background:rgba(255,255,255,0.18);color:#fff;}
.eci-body{display:grid;grid-template-columns:minmax(0,45%) minmax(0,55%);min-height:0;flex:1;background:linear-gradient(180deg,#fff 0%,var(--eci-surface) 100%);}
.eci-panel{min-width:0;min-height:0;}
.eci-chat-panel{display:flex;flex-direction:column;background:#fff;border-right:1px solid var(--eci-border);}
.eci-dashboard-panel{display:flex;flex-direction:column;background:linear-gradient(180deg,var(--eci-surface) 0%,#fff 100%);}
.eci-panel-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid var(--eci-border);background:rgba(255,255,255,0.7);backdrop-filter:blur(8px);}
.eci-panel-title{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--eci-text-m);}
.eci-panel-subtitle{font-size:11px;color:var(--eci-text-m);}
.eci-messages{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth;overscroll-behavior:contain;}
.eci-messages::-webkit-scrollbar,.eci-dashboard-content::-webkit-scrollbar{width:4px;}
.eci-messages::-webkit-scrollbar-track,.eci-dashboard-content::-webkit-scrollbar-track{background:transparent;}
.eci-messages::-webkit-scrollbar-thumb,.eci-dashboard-content::-webkit-scrollbar-thumb{background:var(--eci-border);border-radius:4px;}
@keyframes eci-fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.eci-msg{display:flex;align-items:flex-end;gap:6px;animation:eci-fadein .18s ease;}
@media(prefers-reduced-motion:reduce){.eci-msg{animation:none;}}
.eci-msg--user{flex-direction:row-reverse;}
.eci-msg-avatar{width:26px;height:26px;border-radius:50%;background:var(--eci-primary);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;user-select:none;font-family:'Outfit','DM Sans',sans-serif;}
.eci-msg-inner{display:flex;flex-direction:column;gap:3px;max-width:calc(100% - 38px);}
.eci-msg--user .eci-msg-inner{align-items:flex-end;}
.eci-msg-bubble{padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.55;word-break:break-word;white-space:pre-wrap;}
.eci-msg--assistant .eci-msg-bubble{background:var(--eci-bg-msg);color:var(--eci-text);border-bottom-left-radius:4px;}
.eci-msg--user .eci-msg-bubble{background:var(--eci-primary);color:#fff;border-bottom-right-radius:4px;}
.eci-msg-time{font-size:11px;color:var(--eci-text-m);padding:0 3px;opacity:0;transition:opacity .15s;pointer-events:none;user-select:none;}
.eci-msg:hover .eci-msg-time{opacity:1;}
.eci-typing{display:flex;align-items:center;gap:5px;padding:11px 14px;min-width:52px;}
.eci-typing span{display:block;width:7px;height:7px;border-radius:50%;background:var(--eci-text-m);animation:eci-bounce 1.2s ease-in-out infinite;flex-shrink:0;}
.eci-typing span:nth-child(2){animation-delay:.15s;}
.eci-typing span:nth-child(3){animation-delay:.30s;}
@keyframes eci-bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}
@media(prefers-reduced-motion:reduce){.eci-typing span{animation:none;opacity:.5;}}
.eci-error{text-align:center;font-size:12px;color:#DC2626;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:8px 12px;animation:eci-fadein .18s ease;}
.eci-soft-cta{padding:10px 14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;font-size:13px;color:#92400E;margin:4px 0;animation:eci-fadein .25s ease;line-height:1.5;}
.eci-soft-cta a{color:#B45309;font-weight:600;text-decoration:none;}
.eci-soft-cta a:hover{text-decoration:underline;}
.eci-cta{margin:6px 0 2px;animation:eci-fadein .25s ease;}
.eci-cta-inner{border:1px solid var(--eci-border);border-radius:12px;padding:16px 14px;text-align:center;background:#f9fafb;display:flex;flex-direction:column;align-items:center;gap:6px;}
.eci-cta-icon{font-size:22px;line-height:1;}
.eci-cta-title{font-size:15px;font-weight:600;color:var(--eci-text);font-family:'Outfit','DM Sans',sans-serif;}
.eci-cta-body{font-size:13px;color:var(--eci-text-m);line-height:1.5;}
.eci-cta-btn{display:inline-block;background:var(--eci-primary);color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;transition:background-color .2s;margin-top:4px;font-family:'Outfit','DM Sans',sans-serif;}
.eci-cta-btn:hover{background:var(--eci-primary-h);color:#fff;}
.eci-footer{border-top:1px solid var(--eci-border);padding:12px 14px;flex-shrink:0;background:#fff;}
.eci-input-row{display:flex;gap:8px;align-items:center;}
.eci-input{flex:1;min-width:0;border:1.5px solid var(--eci-border);border-radius:22px;padding:10px 16px;font-size:14px;color:var(--eci-text);background:#fff;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none;font-family:'DM Sans',sans-serif;}
.eci-input:focus{border-color:var(--eci-primary);box-shadow:0 0 0 3px rgba(16,185,129,0.12);}
.eci-card[data-theme="realestate"] .eci-input:focus{box-shadow:0 0 0 3px rgba(31,41,55,0.1);}
.eci-card[data-theme="business"] .eci-input:focus{box-shadow:0 0 0 3px rgba(99,102,241,0.12);}
.eci-input::placeholder{color:var(--eci-text-m);}
.eci-input:disabled{background:#f9fafb;color:var(--eci-text-m);cursor:not-allowed;}
@keyframes eci-input-error{0%,100%{border-color:var(--eci-border)}50%{border-color:#DC2626;box-shadow:0 0 0 3px rgba(220,38,38,0.15)}}
.eci-input--error{animation:eci-input-error .4s ease;}
.eci-send-btn{width:38px;height:38px;border-radius:50%;background:var(--eci-primary);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background-color .2s,transform .12s;-webkit-tap-highlight-color:transparent;padding:0;}
.eci-send-btn:hover:not(:disabled){background:var(--eci-primary-h);transform:scale(1.06);}
.eci-send-btn:active:not(:disabled){transform:scale(0.93);}
.eci-send-btn:disabled{background:var(--eci-border);color:var(--eci-text-m);cursor:not-allowed;}
.eci-hint{text-align:center;font-size:12px;color:var(--eci-text-m);margin-top:8px;}
.eci-reset-link{color:var(--eci-primary);text-decoration:none;cursor:pointer;}
.eci-reset-link:hover{text-decoration:underline;}
.eci-dashboard-content{flex:1;overflow-y:auto;padding:14px 14px 0;display:flex;flex-direction:column;gap:12px;}
.eci-dash-card{background:rgba(255,255,255,0.84);border:1px solid var(--eci-border);border-radius:18px;padding:14px;box-shadow:0 10px 28px rgba(15,23,42,0.06);}
.eci-dash-header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px;}
.eci-dash-title{font-size:18px;font-weight:700;font-family:'Outfit','DM Sans',sans-serif;}
.eci-dash-caption{margin-top:2px;font-size:12px;color:var(--eci-text-m);}
.eci-badge{display:inline-flex;align-items:center;justify-content:center;min-height:24px;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;line-height:1;white-space:nowrap;border:1px solid transparent;}
.eci-badge--neutral{background:#F3F4F6;color:#4B5563;border-color:#E5E7EB;}
.eci-badge--success{background:#ECFDF5;color:#047857;border-color:#A7F3D0;}
.eci-badge--warning{background:#FFFBEB;color:#B45309;border-color:#FDE68A;}
.eci-badge--danger{background:#FEF2F2;color:#B91C1C;border-color:#FECACA;}
.eci-badge--cool{background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE;}
.eci-badge--gold{background:#FFFBEB;color:#92400E;border-color:#FCD34D;}
.eci-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px;}
.eci-section{padding-top:12px;border-top:1px solid var(--eci-border);}
.eci-section:first-of-type{padding-top:0;border-top:none;}
.eci-section-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--eci-text-m);margin-bottom:10px;}
.eci-field{display:flex;flex-direction:column;gap:4px;min-width:0;}
.eci-field-label{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--eci-text-m);}
.eci-field-value{font-size:14px;line-height:1.4;color:var(--eci-text);min-height:20px;transition:opacity .24s ease,transform .24s ease,background-color .24s ease;}
.eci-field-value.eci-value--multi{display:flex;flex-wrap:wrap;gap:6px;}
.eci-field-value.eci-updated{animation:eci-update .32s ease;}
@keyframes eci-update{0%{opacity:.45;transform:translateY(2px)}100%{opacity:1;transform:translateY(0)}}
.eci-skeleton{display:block;width:100%;max-width:150px;height:12px;border-radius:999px;background:linear-gradient(90deg,#E5E7EB 0%,#F3F4F6 50%,#E5E7EB 100%);background-size:200% 100%;animation:eci-pulse 1.5s ease-in-out infinite;}
.eci-skeleton--short{max-width:82px;}
.eci-skeleton--tiny{max-width:56px;}
.eci-skeleton--long{max-width:100%;}
@keyframes eci-pulse{0%{background-position:200% 0}100%{background-position:-200% 0}}
.eci-list{display:flex;flex-wrap:wrap;gap:6px;}
.eci-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:var(--eci-surface-2);border:1px solid var(--eci-border);font-size:12px;color:var(--eci-text);}
.eci-status{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;}
.eci-status-step{display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center;}
.eci-pipeline-dot{width:10px;height:10px;border-radius:50%;background:#D1D5DB;}
.eci-status-step.is-active .eci-pipeline-dot,.eci-status-step.is-complete .eci-pipeline-dot{background:var(--eci-primary);}
.eci-status-line{width:100%;height:2px;background:#E5E7EB;margin-top:-12px;}
.eci-status-step.is-complete .eci-status-line{background:color-mix(in srgb,var(--eci-primary) 55%,#E5E7EB);}
.eci-status-label{font-size:11px;font-weight:600;color:var(--eci-text-m);}
.eci-status-step.is-active .eci-status-label,.eci-status-step.is-complete .eci-status-label{color:var(--eci-text);}
.eci-roi{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:14px;border-top:1px solid var(--eci-border);background:rgba(255,255,255,0.82);}
.eci-roi-stat{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:14px;background:var(--eci-surface);border:1px solid var(--eci-border);}
.eci-roi-label{font-size:11px;color:var(--eci-text-m);}
.eci-roi-value{font-size:14px;font-weight:700;color:var(--eci-text);}
.eci-empty-note{font-size:12px;color:var(--eci-text-m);line-height:1.45;}
@media(max-width:767px){
  .eci-card{max-width:100%;height:auto;min-height:520px;}
  .eci-header{padding:14px;}
  .eci-mobile-tabs{display:flex;}
  .eci-body{display:block;}
  .eci-chat-panel,.eci-dashboard-panel{border-right:none;}
  .eci-panel[hidden]{display:none !important;}
  .eci-chat-panel{min-height:400px;}
  .eci-dashboard-panel{min-height:400px;}
  .eci-dashboard-content{padding-bottom:14px;}
}
`;
    document.head.appendChild(style);
  }

  const AGENTS = {
    mike: {
      name: "Mike's Plumbing",
      initial: 'M',
      greeting: "Hey there! 👋 Thanks for reaching out to Mike's Plumbing. How can I help?",
      dashboard: 'trades',
    },
    bayview: {
      name: 'Bayview Realty',
      initial: 'B',
      greeting: "Hi there! 👋 Thanks for getting in touch with Bayview Realty. How can I help you today?",
      dashboard: 'realestate',
    },
    sales: {
      name: 'AI Tools NZ',
      initial: 'A',
      greeting: "Hey! 👋 I'm the AI assistant for AI Tools NZ. Ask me anything about how AI can work for your business — pricing, industries, process, whatever's on your mind.",
      dashboard: 'sales',
    },
  };

  const MOCK_RESPONSES = {
    mike: [
      "No worries! Can you tell me a bit more about what's going on? Is it a leak, a blocked drain, or something else?\n\n<!-- DASHBOARD_DATA: {\"customer\":{\"name\":null,\"phone\":null,\"suburb\":null},\"job\":{\"type\":null,\"urgency\":\"unknown\",\"description\":null,\"revenueEstimate\":null,\"suggestedSlot\":null,\"assignedTo\":null},\"status\":\"qualifying\"} -->",
      "Got it — whereabouts are you based in Auckland? And is this something urgent or can it wait a day or two?\n\n<!-- DASHBOARD_DATA: {\"customer\":{\"name\":\"Sarah Mitchell\",\"phone\":null,\"suburb\":\"Browns Bay\"},\"job\":{\"type\":\"Blocked Drain\",\"urgency\":\"standard\",\"description\":\"Kitchen sink backing up with a likely blocked drain\",\"revenueEstimate\":\"$130–$260\",\"suggestedSlot\":\"Within 2-3 business days\",\"assignedTo\":\"Josh (standard repairs)\"},\"status\":\"quoted\"} -->",
      "Alright, I'll get that to Mike straight away. He usually gets back within a couple of hours. What's the best number to reach you on?\n\n<!-- DASHBOARD_DATA: {\"customer\":{\"name\":\"Sarah Mitchell\",\"phone\":\"021 555 0192\",\"suburb\":\"Browns Bay\"},\"job\":{\"type\":\"Blocked Drain\",\"urgency\":\"urgent\",\"description\":\"Recurring blocked kitchen drain\",\"revenueEstimate\":\"$130–$260\",\"suggestedSlot\":\"Today/Tomorrow\",\"assignedTo\":\"Josh (standard repairs)\"},\"status\":\"booking\"} -->",
    ],
    bayview: [
      "Great to hear! Are you looking to buy, sell, or are you after a no-obligation appraisal at this stage?\n\n<!-- DASHBOARD_DATA: {\"lead\":{\"name\":null,\"phone\":null,\"email\":null},\"type\":\"unknown\",\"score\":\"unknown\",\"buyer\":{\"budget\":null,\"suburbs\":[],\"beds\":null,\"propertyType\":null,\"timeline\":null},\"seller\":{\"address\":null,\"propertyType\":null,\"beds\":null,\"estimatedValue\":null,\"timeline\":null},\"matchedListings\":[],\"recommendedAgent\":null,\"status\":\"qualifying\"} -->",
      "I'll have one of our agents reach out with some options that fit. What's your budget range and how many bedrooms are you after?\n\n<!-- DASHBOARD_DATA: {\"lead\":{\"name\":\"David Chen\",\"phone\":\"021 888 0234\",\"email\":null},\"type\":\"buyer\",\"score\":\"warm\",\"buyer\":{\"budget\":\"$1.2M–$1.5M\",\"suburbs\":[\"Takapuna\",\"Milford\"],\"beds\":\"3+\",\"propertyType\":\"townhouse\",\"timeline\":\"within 3 months\"},\"seller\":{\"address\":null,\"propertyType\":null,\"beds\":null,\"estimatedValue\":null,\"timeline\":null},\"matchedListings\":[\"9A Seaview Avenue, Milford\",\"5/28 The Strand, Takapuna\"],\"recommendedAgent\":\"Sarah Chen\",\"status\":\"matched\"} -->",
      "Perfect — I've noted all of that. One of the Bayview team will be in touch today. Anything else I can help with?\n\n<!-- DASHBOARD_DATA: {\"lead\":{\"name\":\"David Chen\",\"phone\":\"021 888 0234\",\"email\":\"david@example.com\"},\"type\":\"buyer\",\"score\":\"hot\",\"buyer\":{\"budget\":\"$1.2M–$1.5M\",\"suburbs\":[\"Takapuna\",\"Milford\"],\"beds\":\"3+\",\"propertyType\":\"townhouse\",\"timeline\":\"this month\"},\"seller\":{\"address\":null,\"propertyType\":null,\"beds\":null,\"estimatedValue\":null,\"timeline\":null},\"matchedListings\":[\"9A Seaview Avenue, Milford\",\"5/28 The Strand, Takapuna\"],\"recommendedAgent\":\"Sarah Chen\",\"status\":\"booking\"} -->",
    ],
    sales: [
      "Great question! AI Tools NZ builds custom AI systems for NZ businesses — voice agents, chatbots, workflow automation, and AI personal assistants. We don't sell off-the-shelf software — everything is configured specifically for your business. What industry are you in?\n\n<!-- DASHBOARD_DATA: {\"customer\":{\"name\":null,\"business\":null,\"industry\":null,\"email\":null},\"lead\":{\"interest\":\"general\",\"plan\":null,\"budget\":null,\"timeline\":null,\"readiness\":\"curious\"},\"status\":\"qualifying\"} -->",
      "For trades businesses, our most popular setup is an AI voice agent that answers every call 24/7 — so you never miss a job. On the Growth plan that's $500/mo (50% off right now for March Madness, normally $1,000). Most tradies see ROI in the first week from recaptured missed calls alone. Want to try our trades demo? Head to trade.aitools.co.nz\n\n<!-- DASHBOARD_DATA: {\"customer\":{\"name\":null,\"business\":null,\"industry\":\"Trades\",\"email\":null},\"lead\":{\"interest\":\"voice-agent\",\"plan\":\"growth\",\"budget\":null,\"timeline\":\"exploring\",\"readiness\":\"interested\"},\"status\":\"qualified\"} -->",
      "Setup takes 5-10 days from our first call. And NZ businesses may qualify for up to $15,000 in government co-funding through the Responsible AI Adoption programme — that can cover the entire setup cost. Want me to help you book a free 15-minute demo? No obligation.\n\n<!-- DASHBOARD_DATA: {\"customer\":{\"name\":null,\"business\":null,\"industry\":\"Trades\",\"email\":null},\"lead\":{\"interest\":\"voice-agent\",\"plan\":\"growth\",\"budget\":null,\"timeline\":\"this-month\",\"readiness\":\"ready\"},\"status\":\"converting\"} -->",
    ],
  };

  const ROI_STATS = {
    trades: [
      { label: 'Avg intake', value: '2 min', note: 'vs 8 min phone' },
      { label: 'Jobs this week', value: '47', note: '' },
      { label: 'Revenue captured', value: '$18,400', note: '' },
      { label: 'After-hours saved', value: '12', note: 'calls' },
    ],
    realestate: [
      { label: 'Avg qualification', value: '3 min', note: 'vs 15 min phone' },
      { label: 'Leads this week', value: '23', note: '' },
      { label: 'Hot leads', value: '8 (35%)', note: '' },
      { label: 'Appraisals booked', value: '5', note: '' },
    ],
    sales: [
      { label: 'Avg response', value: '<5 sec', note: 'vs hours manual' },
      { label: 'Leads this week', value: '34', note: '' },
      { label: 'Qualified leads', value: '19 (56%)', note: '' },
      { label: 'Demos booked', value: '7', note: '' },
    ],
  };

  const DASHBOARD_DEFAULTS = {
    trades: {
      customer: { name: null, phone: null, suburb: null },
      job: { type: null, urgency: 'unknown', description: null, revenueEstimate: null, suggestedSlot: null, assignedTo: null },
      status: 'new',
    },
    realestate: {
      lead: { name: null, phone: null, email: null },
      type: 'unknown',
      score: 'unknown',
      buyer: { budget: null, suburbs: [], beds: null, propertyType: null, timeline: null },
      seller: { address: null, propertyType: null, beds: null, estimatedValue: null, timeline: null },
      matchedListings: [],
      recommendedAgent: null,
      status: 'new',
    },
    sales: {
      customer: { name: null, business: null, industry: null, email: null },
      lead: { interest: 'unknown', plan: null, budget: null, timeline: null, readiness: 'browsing' },
      status: 'new',
    },
  };

  const ICON_SEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  const DASHBOARD_META_RE = /<!--\s*DASHBOARD_DATA:\s*(\{[\s\S]*?\})\s*-->\s*$/;
  const DASHBOARD_PARTIAL_RE = /\n?<!--[\s\S]*$/;

  const agent = AGENTS[CFG.agent] || AGENTS.mike;
  const dashboardKind = agent.dashboard || (CFG.agent === 'bayview' ? 'realestate' : 'trades');
  const companyName = CFG.company || agent.name;
  const companyInitial = companyName.charAt(0).toUpperCase();

  const storageKey = `esperion-inline-${CFG.agent}`;
  const sessionIdKey = `esperion-inline-${CFG.agent}-session`;
  const activeTabKey = `esperion-inline-${CFG.agent}-tab`;

  let messages = [];
  let userMsgCount = 0;
  let sessionId = '';
  let isStreaming = false;
  let mockCursor = 0;
  let dashboardData = cloneData(DASHBOARD_DEFAULTS[dashboardKind]);
  let activeMobileTab = 'chat';

  let ws = null;
  let wsConnected = false;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let responseTimeout = null;

  let currentStreamText = '';
  let streamFinalizeTimer = null;
  let streamBubble = null;
  let reqId = 1;

  let card, msgArea, inputEl, sendBtn, hintEl, taglineEl, statusDot, chatPanel, dashboardPanel, dashboardContent;
  let dashboardFieldEls = {};
  let dashboardStatusEls = [];
  let chatTabBtn, dashboardTabBtn;

  const SESSION_TTL_MS = 30 * 60 * 1000;

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && Array.isArray(saved.messages) && saved.messages.length > 0) {
        const lastMsg = saved.messages[saved.messages.length - 1];
        const lastTs = lastMsg && lastMsg.ts || 0;
        if (lastTs && (Date.now() - lastTs) > SESSION_TTL_MS) {
          try {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(sessionIdKey);
            localStorage.removeItem(activeTabKey);
          } catch (e) {}
        } else {
          messages = saved.messages;
          userMsgCount = saved.userMsgCount || 0;
          mockCursor = saved.mockCursor || 0;
          dashboardData = mergeDashboardData(cloneData(DASHBOARD_DEFAULTS[dashboardKind]), saved.dashboardData || {});
        }
      }
    } catch (e) {}

    if (messages.length === 0) {
      messages.push({ role: 'assistant', content: agent.greeting, ts: Date.now() });
    } else {
      normalizeStoredMessages();
    }

    try { sessionId = localStorage.getItem(sessionIdKey) || ''; } catch (e) {}
    if (!sessionId) {
      sessionId = genId();
      try { localStorage.setItem(sessionIdKey, sessionId); } catch (e) {}
    }
    try { activeMobileTab = localStorage.getItem(activeTabKey) || 'chat'; } catch (e) {}
  }

  function normalizeStoredMessages() {
    let normalized = false;
    messages = messages.map((msg) => {
      if (!msg || msg.role === 'system') return msg;
      const parsed = extractDashboardPayload(msg.content || '');
      if (parsed.metadata) {
        dashboardData = mergeDashboardData(dashboardData, parsed.metadata);
      }
      if (parsed.displayText !== (msg.content || '')) {
        normalized = true;
        return { role: msg.role, content: parsed.displayText, ts: msg.ts };
      }
      return msg;
    });
    if (normalized) saveState();
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        messages,
        userMsgCount,
        mockCursor,
        dashboardData,
      }));
    } catch (e) {}
  }

  function resetState() {
    messages = [{ role: 'assistant', content: agent.greeting, ts: Date.now() }];
    userMsgCount = 0;
    mockCursor = 0;
    currentStreamText = '';
    dashboardData = cloneData(DASHBOARD_DEFAULTS[dashboardKind]);
    sessionId = genId();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ messages, userMsgCount, mockCursor, dashboardData }));
      localStorage.setItem(sessionIdKey, sessionId);
    } catch (e) {}
    renderMessages();
    renderDashboard(true);
    enableInput();
    if (!CFG.mock) reconnectWS();
    setActiveTab('chat');
    setTimeout(() => {
      if (inputEl && !inputEl.disabled) inputEl.focus();
    }, 50);
  }

  function connectWS() {
    if (CFG.mock || wsConnected) return;
    clearTimeout(reconnectTimer);
    if (ws) {
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      try { ws.close(); } catch (e) {}
      ws = null;
    }
    try { ws = new WebSocket(wsUrl); } catch (e) { scheduleReconnect(); return; }

    ws.onopen = () => {};
    ws.onmessage = (event) => {
      try { handleFrame(JSON.parse(event.data)); } catch (e) {}
    };
    ws.onclose = () => {
      wsConnected = false;
      ws = null;
      setStatus(false);
      scheduleReconnect();
    };
    ws.onerror = () => {};
  }

  function reconnectWS() {
    wsConnected = false;
    reconnectAttempt = 0;
    connectWS();
  }

  function wsSend(frame) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(frame));
  }

  function nextId() {
    return String(++reqId);
  }

  function handleFrame(frame) {
    if (frame.type === 'event' && frame.event === 'connect.challenge') {
      ws.send(JSON.stringify({
        type: 'req',
        id: 'connect',
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: { id: 'webchat', version: '2.0.0', platform: 'web', mode: 'webchat' },
          role: 'operator',
          scopes: ['operator.admin', 'operator.write'],
        },
      }));
      return;
    }

    if (frame.type === 'res' && frame.id === 'connect') {
      if (frame.ok) {
        wsConnected = true;
        reconnectAttempt = 0;
        setStatus(true);
      } else {
        showInlineError('Unable to connect. Please try again later.');
      }
      return;
    }

    if (frame.type === 'event' && frame.event === 'chat') {
      handleChatEvent(frame.payload);
    }
  }

  function handleChatEvent(payload) {
    if (!isStreaming) return;
    const state = payload && payload.state;
    const msg = payload && payload.message;
    const text = (msg && msg.content && msg.content[0] && msg.content[0].text) || msg && msg.text || '';
    const parsed = extractDashboardPayload(text);

    if (parsed.metadata) {
      applyDashboardMetadata(parsed.metadata);
    }

    if (state === 'delta' && text) {
      if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
      }
      if (!streamBubble) {
        removeTyping();
        streamBubble = createStreamBubble();
        currentStreamText = '';
      }
      currentStreamText = parsed.displayText;
      streamBubble.innerHTML = fmtMd(currentStreamText);
      scrollBottom();
      clearTimeout(streamFinalizeTimer);
      streamFinalizeTimer = setTimeout(finalizeStream, 2000);
      return;
    }

    if (state === 'final' && text) {
      clearTimeout(streamFinalizeTimer);
      if (!streamBubble) {
        removeTyping();
        streamBubble = createStreamBubble();
      }
      currentStreamText = parsed.displayText;
      streamBubble.innerHTML = fmtMd(currentStreamText);
      scrollBottom();
      finalizeStream();
      return;
    }

    if (state === 'error' || state === 'aborted') {
      clearTimeout(streamFinalizeTimer);
      if (currentStreamText) {
        finalizeStream();
      } else {
        removeTyping();
        removeStreamRow();
        streamBubble = null;
        currentStreamText = '';
        showInlineError('Something went wrong. Please try again.');
        isStreaming = false;
        if (userMsgCount <= CFG.cap) enableInput();
      }
    }
  }

  function extractDashboardPayload(text) {
    const source = String(text || '');

    // First try to match a complete DASHBOARD_DATA block
    const match = source.match(DASHBOARD_META_RE);
    if (match) {
      const displayText = source.slice(0, match.index).replace(/\s+$/, '');
      try {
        return { displayText, metadata: JSON.parse(match[1]) };
      } catch (e) {
        return { displayText, metadata: null };
      }
    }

    // During streaming: strip any incomplete/partial DASHBOARD_DATA comment
    const partial = source.match(DASHBOARD_PARTIAL_RE);
    if (partial) {
      return { displayText: source.slice(0, partial.index).replace(/\s+$/, ''), metadata: null };
    }

    return { displayText: source.trim(), metadata: null };
  }

  function mergeDashboardData(base, incoming) {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return base;
    const output = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(incoming).forEach((key) => {
      const next = incoming[key];
      const prev = output[key];
      if (next == null) return;
      if (Array.isArray(next)) {
        if (next.length > 0) output[key] = next.slice();
        return;
      }
      if (typeof next === 'object') {
        output[key] = mergeDashboardData(prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : {}, next);
        return;
      }
      if (typeof next === 'string' && next.trim() === '') return;
      output[key] = next;
    });
    return output;
  }

  function applyDashboardMetadata(metadata) {
    const merged = mergeDashboardData(dashboardData, metadata);
    if (JSON.stringify(merged) === JSON.stringify(dashboardData)) return;
    dashboardData = merged;
    saveState();
    renderDashboard();
  }

  function fmtMd(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function finalizeStream() {
    if (!isStreaming) return;
    clearTimeout(responseTimeout);
    responseTimeout = null;
    const text = currentStreamText || "I didn't catch that — could you try again.";
    removeStreamRow();
    streamBubble = null;
    currentStreamText = '';
    streamFinalizeTimer = null;
    const ts = Date.now();
    messages.push({ role: 'assistant', content: text, ts });
    saveState();
    appendMsg('assistant', text, ts);
    scrollBottom();
    afterResponse();
  }

  function scheduleReconnect() {
    if (CFG.mock) return;
    const delay = Math.min(Math.pow(2, reconnectAttempt) * 1000, 30000);
    reconnectAttempt++;
    reconnectTimer = setTimeout(connectWS, delay);
  }

  function setStatus(connected) {
    if (statusDot) statusDot.className = connected ? 'eci-status-dot' : 'eci-status-dot eci-offline';
    if (taglineEl) {
      taglineEl.textContent = connected ? (CFG.tagline || 'Powered by Esperion') : 'Reconnecting...';
      taglineEl.className = connected ? 'eci-tagline' : 'eci-tagline eci-reconnecting';
    }
  }

  function buildUI() {
    const container = document.querySelector(CFG.container);
    if (!container) return;

    card = document.createElement('div');
    card.className = 'eci-card';
    card.setAttribute('data-theme', CFG.theme);
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', `Chat with ${companyName}`);

    const shell = document.createElement('div');
    shell.className = 'eci-shell';

    const header = document.createElement('div');
    header.className = 'eci-header';

    const avatar = document.createElement('div');
    avatar.className = 'eci-avatar';
    avatar.textContent = companyInitial;

    const nameWrap = document.createElement('div');
    nameWrap.className = 'eci-name-wrap';

    const nameEl = document.createElement('div');
    nameEl.className = 'eci-agent-name';
    nameEl.textContent = companyName;

    taglineEl = document.createElement('div');
    taglineEl.className = 'eci-tagline';
    taglineEl.textContent = CFG.tagline || 'Powered by Esperion';

    nameWrap.appendChild(nameEl);
    nameWrap.appendChild(taglineEl);

    const mobileTabs = document.createElement('div');
    mobileTabs.className = 'eci-mobile-tabs';

    chatTabBtn = document.createElement('button');
    chatTabBtn.className = 'eci-tab';
    chatTabBtn.type = 'button';
    chatTabBtn.textContent = '💬 Chat';
    chatTabBtn.addEventListener('click', () => setActiveTab('chat'));

    dashboardTabBtn = document.createElement('button');
    dashboardTabBtn.className = 'eci-tab';
    dashboardTabBtn.type = 'button';
    dashboardTabBtn.textContent = '📊 Dashboard';
    dashboardTabBtn.addEventListener('click', () => setActiveTab('dashboard'));

    mobileTabs.appendChild(chatTabBtn);
    mobileTabs.appendChild(dashboardTabBtn);

    statusDot = document.createElement('div');
    statusDot.className = 'eci-status-dot eci-offline';
    statusDot.setAttribute('aria-label', 'Connection status');

    const clearBtn = document.createElement('button');
    clearBtn.className = 'eci-clear-btn';
    clearBtn.type = 'button';
    clearBtn.setAttribute('aria-label', 'New conversation');
    clearBtn.setAttribute('title', 'New conversation');
    clearBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.65 6.35A7.96 7.96 0 0 0 12 4C7.58 4 4.01 7.58 4.01 12S7.58 20 12 20c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';
    clearBtn.addEventListener('click', () => {
      if (!isStreaming) resetState();
    });

    const headerRight = document.createElement('div');
    headerRight.className = 'eci-header-right';
    headerRight.appendChild(mobileTabs);
    headerRight.appendChild(clearBtn);
    headerRight.appendChild(statusDot);

    header.appendChild(avatar);
    header.appendChild(nameWrap);
    header.appendChild(headerRight);

    const body = document.createElement('div');
    body.className = 'eci-body';

    chatPanel = document.createElement('div');
    chatPanel.className = 'eci-panel eci-chat-panel';

    const chatHead = document.createElement('div');
    chatHead.className = 'eci-panel-head';
    chatHead.innerHTML = '<div><div class="eci-panel-title">Customer View</div><div class="eci-panel-subtitle">Live conversation</div></div>';

    msgArea = document.createElement('div');
    msgArea.className = 'eci-messages';
    msgArea.setAttribute('role', 'log');
    msgArea.setAttribute('aria-live', 'polite');
    msgArea.setAttribute('aria-label', 'Conversation');

    const footer = document.createElement('div');
    footer.className = 'eci-footer';

    const inputRow = document.createElement('div');
    inputRow.className = 'eci-input-row';

    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'eci-input';
    inputEl.setAttribute('placeholder', 'Type a message...');
    inputEl.setAttribute('aria-label', 'Message');
    inputEl.setAttribute('maxlength', '1000');
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    sendBtn = document.createElement('button');
    sendBtn.className = 'eci-send-btn';
    sendBtn.type = 'button';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = ICON_SEND;
    sendBtn.addEventListener('click', handleSend);

    hintEl = document.createElement('div');
    hintEl.className = 'eci-hint';

    inputRow.appendChild(inputEl);
    inputRow.appendChild(sendBtn);
    footer.appendChild(inputRow);
    footer.appendChild(hintEl);

    chatPanel.appendChild(chatHead);
    chatPanel.appendChild(msgArea);
    chatPanel.appendChild(footer);

    dashboardPanel = document.createElement('div');
    dashboardPanel.className = 'eci-panel eci-dashboard-panel';

    const dashboardHead = document.createElement('div');
    dashboardHead.className = 'eci-panel-head';
    dashboardHead.innerHTML = '<div><div class="eci-panel-title">Business Dashboard</div><div class="eci-panel-subtitle">What your team sees in real time</div></div>';

    dashboardContent = document.createElement('div');
    dashboardContent.className = 'eci-dashboard-content';

    const roi = document.createElement('div');
    roi.className = 'eci-roi';
    ROI_STATS[dashboardKind].forEach((item) => {
      const stat = document.createElement('div');
      stat.className = 'eci-roi-stat';
      stat.innerHTML = '<div class="eci-roi-label">' + item.label + '</div><div class="eci-roi-value">' + item.value + (item.note ? ' <span style="font-size:11px;font-weight:500;color:var(--eci-text-m)">' + item.note + '</span>' : '') + '</div>';
      roi.appendChild(stat);
    });

    dashboardPanel.appendChild(dashboardHead);
    dashboardPanel.appendChild(dashboardContent);
    dashboardPanel.appendChild(roi);

    body.appendChild(chatPanel);
    body.appendChild(dashboardPanel);

    shell.appendChild(header);
    shell.appendChild(body);
    card.appendChild(shell);
    container.appendChild(card);

    buildDashboardSkeleton();
    setActiveTab(activeMobileTab);
  }

  function buildDashboardSkeleton() {
    dashboardFieldEls = {};
    dashboardStatusEls = [];
    dashboardContent.innerHTML = '';

    if (dashboardKind === 'trades') {
      dashboardContent.appendChild(createTradesDashboard());
      return;
    }
    if (dashboardKind === 'sales') {
      dashboardContent.appendChild(createSalesDashboard());
      return;
    }
    dashboardContent.appendChild(createRealEstateDashboard());
  }

  function createCardShell(title, caption, badgeKey) {
    const cardEl = document.createElement('div');
    cardEl.className = 'eci-dash-card';

    const header = document.createElement('div');
    header.className = 'eci-dash-header';

    const left = document.createElement('div');
    left.innerHTML = '<div class="eci-dash-title">' + title + '</div><div class="eci-dash-caption">' + caption + '</div>';

    const badge = document.createElement('div');
    badge.className = 'eci-badge eci-badge--neutral';
    badge.innerHTML = '<span class="eci-skeleton eci-skeleton--short"></span>';
    dashboardFieldEls[badgeKey] = badge;

    header.appendChild(left);
    header.appendChild(badge);
    cardEl.appendChild(header);
    return cardEl;
  }

  function createSection(title) {
    const section = document.createElement('div');
    section.className = 'eci-section';
    const heading = document.createElement('div');
    heading.className = 'eci-section-title';
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  }

  function createField(key, label, options) {
    const opts = options || {};
    const field = document.createElement('div');
    field.className = 'eci-field';
    if (opts.gridSpan === 2) field.style.gridColumn = '1 / -1';

    const fieldLabel = document.createElement('div');
    fieldLabel.className = 'eci-field-label';
    fieldLabel.textContent = label;

    const value = document.createElement('div');
    value.className = 'eci-field-value';
    dashboardFieldEls[key] = value;
    renderPlaceholder(value, opts.placeholder || 'long');

    field.appendChild(fieldLabel);
    field.appendChild(value);
    return field;
  }

  function createStatusPipeline(labels) {
    const wrap = document.createElement('div');
    wrap.className = 'eci-section';
    const title = document.createElement('div');
    title.className = 'eci-section-title';
    title.textContent = 'Status Pipeline';
    wrap.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'eci-status';

    dashboardStatusEls = labels.map((label, index) => {
      const step = document.createElement('div');
      step.className = 'eci-status-step';

      const dot = document.createElement('div');
      dot.className = 'eci-pipeline-dot';
      step.appendChild(dot);

      const stepLabel = document.createElement('div');
      stepLabel.className = 'eci-status-label';
      stepLabel.textContent = label;
      step.appendChild(stepLabel);

      if (index < labels.length - 1) {
        const line = document.createElement('div');
        line.className = 'eci-status-line';
        step.appendChild(line);
      }

      grid.appendChild(step);
      return step;
    });

    wrap.appendChild(grid);
    return wrap;
  }

  function createTradesDashboard() {
    const cardEl = createCardShell('Job Intake Card', 'AI-qualified plumbing enquiry', 'trades.badge');

    const details = createSection('Customer Details');
    const detailsGrid = document.createElement('div');
    detailsGrid.className = 'eci-grid';
    detailsGrid.appendChild(createField('trades.customer.name', 'Customer Name', { placeholder: 'short' }));
    detailsGrid.appendChild(createField('trades.customer.phone', 'Phone', { placeholder: 'short' }));
    detailsGrid.appendChild(createField('trades.customer.suburb', 'Suburb', { placeholder: 'short' }));
    detailsGrid.appendChild(createField('trades.job.type', 'Job Type', { placeholder: 'short' }));
    details.appendChild(detailsGrid);

    const ops = createSection('Operational Details');
    const opsGrid = document.createElement('div');
    opsGrid.className = 'eci-grid';
    opsGrid.appendChild(createField('trades.job.revenueEstimate', 'Revenue Estimate', { placeholder: 'short' }));
    opsGrid.appendChild(createField('trades.job.suggestedSlot', 'Suggested Slot', { placeholder: 'short' }));
    opsGrid.appendChild(createField('trades.job.assignedTo', 'Assigned To', { placeholder: 'short' }));
    opsGrid.appendChild(createField('trades.job.description', 'Job Notes', { gridSpan: 2, placeholder: 'long' }));
    ops.appendChild(opsGrid);

    cardEl.appendChild(details);
    cardEl.appendChild(ops);
    cardEl.appendChild(createStatusPipeline(['New', 'Qualifying', 'Quoted', 'Booked']));
    return cardEl;
  }

  function createRealEstateDashboard() {
    const cardEl = createCardShell('Lead Card', 'Qualification and routing summary', 'realestate.badge');

    const contact = createSection('Lead Details');
    const contactGrid = document.createElement('div');
    contactGrid.className = 'eci-grid';
    contactGrid.appendChild(createField('realestate.lead.name', 'Lead Name', { placeholder: 'short' }));
    contactGrid.appendChild(createField('realestate.lead.phone', 'Phone', { placeholder: 'short' }));
    contactGrid.appendChild(createField('realestate.lead.email', 'Email', { gridSpan: 2, placeholder: 'long' }));
    contact.appendChild(contactGrid);

    const buyer = createSection('Buyer Signals');
    const buyerGrid = document.createElement('div');
    buyerGrid.className = 'eci-grid';
    buyerGrid.appendChild(createField('realestate.buyer.budget', 'Budget', { placeholder: 'short' }));
    buyerGrid.appendChild(createField('realestate.buyer.suburbs', 'Target Suburbs', { placeholder: 'long' }));
    buyerGrid.appendChild(createField('realestate.buyer.beds', 'Beds', { placeholder: 'tiny' }));
    buyerGrid.appendChild(createField('realestate.buyer.propertyType', 'Property Type', { placeholder: 'short' }));
    buyerGrid.appendChild(createField('realestate.buyer.timeline', 'Timeline', { gridSpan: 2, placeholder: 'short' }));
    buyer.appendChild(buyerGrid);

    const seller = createSection('Seller Signals');
    const sellerGrid = document.createElement('div');
    sellerGrid.className = 'eci-grid';
    sellerGrid.appendChild(createField('realestate.seller.address', 'Address', { gridSpan: 2, placeholder: 'long' }));
    sellerGrid.appendChild(createField('realestate.seller.propertyType', 'Property Type', { placeholder: 'short' }));
    sellerGrid.appendChild(createField('realestate.seller.beds', 'Beds', { placeholder: 'tiny' }));
    sellerGrid.appendChild(createField('realestate.seller.estimatedValue', 'Estimated Value', { placeholder: 'short' }));
    sellerGrid.appendChild(createField('realestate.seller.timeline', 'Timeline', { placeholder: 'short' }));
    seller.appendChild(sellerGrid);

    const routing = createSection('Routing');
    const routingGrid = document.createElement('div');
    routingGrid.className = 'eci-grid';
    routingGrid.appendChild(createField('realestate.matchedListings', 'Matched Listings', { gridSpan: 2, placeholder: 'long' }));
    routingGrid.appendChild(createField('realestate.recommendedAgent', 'Recommended Agent', { gridSpan: 2, placeholder: 'short' }));
    routing.appendChild(routingGrid);

    cardEl.appendChild(contact);
    cardEl.appendChild(buyer);
    cardEl.appendChild(seller);
    cardEl.appendChild(routing);
    cardEl.appendChild(createStatusPipeline(['New', 'Qualifying', 'Qualified', 'Booked']));
    return cardEl;
  }

  function createSalesDashboard() {
    const cardEl = createCardShell('Lead Qualification', 'AI-qualified business enquiry', 'sales.badge');

    const details = createSection('Visitor Details');
    const detailsGrid = document.createElement('div');
    detailsGrid.className = 'eci-grid';
    detailsGrid.appendChild(createField('sales.customer.name', 'Customer Name', { placeholder: 'short' }));
    detailsGrid.appendChild(createField('sales.customer.business', 'Business', { placeholder: 'short' }));
    detailsGrid.appendChild(createField('sales.customer.industry', 'Industry', { placeholder: 'short' }));
    detailsGrid.appendChild(createField('sales.customer.email', 'Email', { gridSpan: 2, placeholder: 'long' }));
    details.appendChild(detailsGrid);

    const interest = createSection('Interest Signals');
    const interestGrid = document.createElement('div');
    interestGrid.className = 'eci-grid';
    interestGrid.appendChild(createField('sales.lead.interest', 'Interest Area', { placeholder: 'short' }));
    interestGrid.appendChild(createField('sales.lead.plan', 'Suggested Plan', { placeholder: 'short' }));
    interestGrid.appendChild(createField('sales.lead.timeline', 'Timeline', { placeholder: 'short' }));
    interestGrid.appendChild(createField('sales.lead.readiness', 'Readiness', { placeholder: 'short' }));
    interest.appendChild(interestGrid);

    cardEl.appendChild(details);
    cardEl.appendChild(interest);
    cardEl.appendChild(createStatusPipeline(['New', 'Qualifying', 'Qualified', 'Converting']));
    return cardEl;
  }

  function renderSalesDashboardData(force) {
    const readiness = dashboardData.lead.readiness || 'browsing';
    const readinessBadge =
      readiness === 'browsing' ? { text: 'Browsing', className: 'eci-badge--neutral' } :
      readiness === 'curious' ? { text: 'Curious', className: 'eci-badge--cool' } :
      readiness === 'interested' ? { text: 'Interested', className: 'eci-badge--warning' } :
      readiness === 'ready' ? { text: 'Ready to Book', className: 'eci-badge--success' } :
      { text: 'Browsing', className: 'eci-badge--neutral' };
    renderBadge('sales.badge', readinessBadge);

    renderField('sales.customer.name', dashboardData.customer.name);
    renderField('sales.customer.business', dashboardData.customer.business);
    renderField('sales.customer.industry', dashboardData.customer.industry);
    renderField('sales.customer.email', dashboardData.customer.email);
    renderField('sales.lead.interest', dashboardData.lead.interest);
    renderField('sales.lead.plan', dashboardData.lead.plan);
    renderField('sales.lead.timeline', dashboardData.lead.timeline);
    renderField('sales.lead.readiness', dashboardData.lead.readiness);
    renderPipeline(dashboardData.status, {
      order: ['new', 'qualifying', 'qualified', 'converting'],
      aliases: { nurturing: 'qualified' },
    }, force);
  }

  function renderPlaceholder(el, kind) {
    el.className = 'eci-field-value';
    const cls = kind === 'tiny' ? 'eci-skeleton eci-skeleton--tiny' :
      kind === 'short' ? 'eci-skeleton eci-skeleton--short' :
      kind === 'long' ? 'eci-skeleton eci-skeleton--long' :
      'eci-skeleton';
    el.innerHTML = '<span class="' + cls + '"></span>';
  }

  function renderField(key, value, formatter) {
    const el = dashboardFieldEls[key];
    if (!el) return;
    const rendered = formatter ? formatter(value) : defaultFormatValue(value);
    if (!rendered) {
      renderPlaceholder(el, inferPlaceholderKind(key));
      return;
    }
    if (el.dataset.rendered !== rendered.html) {
      el.className = 'eci-field-value' + (rendered.multi ? ' eci-value--multi' : '') + ' eci-updated';
      el.innerHTML = rendered.html;
      el.dataset.rendered = rendered.html;
    } else {
      el.className = 'eci-field-value' + (rendered.multi ? ' eci-value--multi' : '');
    }
  }

  function defaultFormatValue(value) {
    if (Array.isArray(value)) {
      if (!value.length) return null;
      return { html: value.map((item) => '<span class="eci-chip">' + escapeHtml(item) + '</span>').join(''), multi: true };
    }
    if (value == null || value === '') return null;
    return { html: escapeHtml(String(value)), multi: false };
  }

  function inferPlaceholderKind(key) {
    if (/beds$/.test(key)) return 'tiny';
    if (/email|matchedListings|description|address|suburbs/.test(key)) return 'long';
    return 'short';
  }

  function renderTradesDashboardData(force) {
    const urgency = dashboardData.job.urgency || 'unknown';
    const urgencyBadge = badgeConfigFromUrgency(urgency);
    renderBadge('trades.badge', urgencyBadge);

    renderField('trades.customer.name', dashboardData.customer.name);
    renderField('trades.customer.phone', dashboardData.customer.phone);
    renderField('trades.customer.suburb', dashboardData.customer.suburb);
    renderField('trades.job.type', dashboardData.job.type);
    renderField('trades.job.revenueEstimate', dashboardData.job.revenueEstimate);
    renderField('trades.job.suggestedSlot', dashboardData.job.suggestedSlot);
    renderField('trades.job.assignedTo', dashboardData.job.assignedTo);
    renderField('trades.job.description', dashboardData.job.description);
    renderPipeline(dashboardData.status, {
      order: ['new', 'qualifying', 'quoted', 'booking'],
      aliases: { qualified: 'quoted' },
    }, force);
  }

  function renderRealEstateDashboardData(force) {
    const typeBadge = badgeConfigFromLeadType(dashboardData.type || 'unknown');
    const scoreBadge = badgeConfigFromScore(dashboardData.score || 'unknown');
    renderBadge('realestate.badge', {
      text: typeBadge.text + ' • ' + scoreBadge.text,
      className: scoreBadge.className,
    });

    renderField('realestate.lead.name', dashboardData.lead.name);
    renderField('realestate.lead.phone', dashboardData.lead.phone);
    renderField('realestate.lead.email', dashboardData.lead.email);
    renderField('realestate.buyer.budget', dashboardData.buyer.budget);
    renderField('realestate.buyer.suburbs', dashboardData.buyer.suburbs);
    renderField('realestate.buyer.beds', dashboardData.buyer.beds);
    renderField('realestate.buyer.propertyType', dashboardData.buyer.propertyType);
    renderField('realestate.buyer.timeline', dashboardData.buyer.timeline);
    renderField('realestate.seller.address', dashboardData.seller.address);
    renderField('realestate.seller.propertyType', dashboardData.seller.propertyType);
    renderField('realestate.seller.beds', dashboardData.seller.beds);
    renderField('realestate.seller.estimatedValue', dashboardData.seller.estimatedValue);
    renderField('realestate.seller.timeline', dashboardData.seller.timeline);
    renderField('realestate.matchedListings', dashboardData.matchedListings);
    renderField('realestate.recommendedAgent', dashboardData.recommendedAgent);
    renderPipeline(dashboardData.status, {
      order: ['new', 'qualifying', 'qualified', 'booking'],
      aliases: { matched: 'qualified' },
    }, force);
  }

  function renderBadge(key, config) {
    const el = dashboardFieldEls[key];
    if (!el) return;
    if (!config || !config.text) {
      el.className = 'eci-badge eci-badge--neutral';
      el.innerHTML = '<span class="eci-skeleton eci-skeleton--short"></span>';
      delete el.dataset.rendered;
      return;
    }
    const cls = 'eci-badge ' + (config.className || 'eci-badge--neutral');
    if (el.dataset.rendered !== config.text || el.className !== cls) {
      el.className = cls;
      el.innerHTML = escapeHtml(config.text);
      el.dataset.rendered = config.text;
    }
  }

  function renderPipeline(status, config, force) {
    const order = config.order || [];
    const aliases = config.aliases || {};
    const normalizedStatus = aliases[status] || status;
    const map = {};
    order.forEach((step, index) => { map[step] = index; });
    const idx = map.hasOwnProperty(normalizedStatus) ? map[normalizedStatus] : 0;
    dashboardStatusEls.forEach((el, index) => {
      const cls = index < idx ? 'eci-status-step is-complete' : index === idx ? 'eci-status-step is-active' : 'eci-status-step';
      if (force || el.className !== cls) el.className = cls;
    });
  }

  function badgeConfigFromUrgency(urgency) {
    if (urgency === 'emergency') return { text: 'Emergency', className: 'eci-badge--danger' };
    if (urgency === 'urgent') return { text: 'Urgent', className: 'eci-badge--warning' };
    if (urgency === 'standard') return { text: 'Standard', className: 'eci-badge--success' };
    if (urgency === 'quote') return { text: 'Quote', className: 'eci-badge--cool' };
    return { text: 'Waiting for details', className: 'eci-badge--neutral' };
  }

  function badgeConfigFromLeadType(type) {
    if (type === 'buyer') return { text: 'Buyer', className: 'eci-badge--cool' };
    if (type === 'seller') return { text: 'Seller', className: 'eci-badge--gold' };
    if (type === 'browser') return { text: 'Browser', className: 'eci-badge--neutral' };
    if (type === 'agent') return { text: 'Agent', className: 'eci-badge--warning' };
    if (type === 'investor') return { text: 'Investor', className: 'eci-badge--success' };
    return { text: 'Unclassified', className: 'eci-badge--neutral' };
  }

  function badgeConfigFromScore(score) {
    if (score === 'hot') return { text: 'Hot', className: 'eci-badge--danger' };
    if (score === 'warm') return { text: 'Warm', className: 'eci-badge--warning' };
    if (score === 'cold') return { text: 'Cold', className: 'eci-badge--cool' };
    return { text: 'Scoring', className: 'eci-badge--neutral' };
  }

  function renderDashboard(force) {
    if (!dashboardContent) return;
    if (dashboardKind === 'trades') renderTradesDashboardData(!!force);
    else if (dashboardKind === 'sales') renderSalesDashboardData(!!force);
    else renderRealEstateDashboardData(!!force);
  }

  function renderMessages() {
    msgArea.innerHTML = '';
    messages.forEach((msg) => {
      if (!msg || msg.role === 'system') return;
      appendMsg(msg.role, msg.content, msg.ts);
    });
    if (userMsgCount > CFG.cap) renderCapCTA();
    else if (userMsgCount === CFG.cap) renderSoftCTA();
    scrollBottom();
  }

  function appendMsg(role, content, ts) {
    const isUser = role === 'user';
    const row = document.createElement('div');
    row.className = 'eci-msg ' + (isUser ? 'eci-msg--user' : 'eci-msg--assistant');

    if (!isUser) {
      const av = document.createElement('div');
      av.className = 'eci-msg-avatar';
      av.textContent = companyInitial;
      row.appendChild(av);
    }

    const inner = document.createElement('div');
    inner.className = 'eci-msg-inner';

    const bub = document.createElement('div');
    bub.className = 'eci-msg-bubble';
    bub.textContent = content;

    const time = document.createElement('span');
    time.className = 'eci-msg-time';
    time.textContent = relTime(ts || Date.now());

    inner.appendChild(bub);
    inner.appendChild(time);
    row.appendChild(inner);
    msgArea.appendChild(row);
    return bub;
  }

  function showTyping() {
    removeTyping();
    const row = document.createElement('div');
    row.className = 'eci-msg eci-msg--assistant';
    row.id = 'eci-typing-row';

    const av = document.createElement('div');
    av.className = 'eci-msg-avatar';
    av.textContent = companyInitial;

    const inner = document.createElement('div');
    inner.className = 'eci-msg-inner';

    const bub = document.createElement('div');
    bub.className = 'eci-msg-bubble eci-typing';
    bub.innerHTML = '<span></span><span></span><span></span>';

    inner.appendChild(bub);
    row.appendChild(av);
    row.appendChild(inner);
    msgArea.appendChild(row);
    scrollBottom();
  }

  function removeTyping() {
    const el = document.getElementById('eci-typing-row');
    if (el) el.remove();
  }

  function createStreamBubble() {
    const row = document.createElement('div');
    row.className = 'eci-msg eci-msg--assistant';
    row.id = 'eci-stream-row';

    const av = document.createElement('div');
    av.className = 'eci-msg-avatar';
    av.textContent = companyInitial;

    const inner = document.createElement('div');
    inner.className = 'eci-msg-inner';

    const bub = document.createElement('div');
    bub.className = 'eci-msg-bubble';

    inner.appendChild(bub);
    row.appendChild(av);
    row.appendChild(inner);
    msgArea.appendChild(row);
    return bub;
  }

  function removeStreamRow() {
    const el = document.getElementById('eci-stream-row');
    if (el) el.remove();
  }

  function renderSoftCTA() {
    if (msgArea.querySelector('.eci-soft-cta')) return;
    const banner = document.createElement('div');
    banner.className = 'eci-soft-cta';
    banner.innerHTML = 'Impressed? See how this could work for your business → <a href="' + CFG.calendly + '" target="_blank" rel="noopener noreferrer">Book a Call</a>';
    msgArea.appendChild(banner);
  }

  function renderCapCTA() {
    if (msgArea.querySelector('.eci-cta')) return;
    inputEl.disabled = true;
    inputEl.placeholder = 'Demo complete — book a call to continue';
    sendBtn.disabled = true;

    const cta = document.createElement('div');
    cta.className = 'eci-cta';
    cta.innerHTML = '<div class="eci-cta-inner"><div class="eci-cta-icon">✨</div><div class="eci-cta-title">Thanks for trying the demo!</div><div class="eci-cta-body">To explore how AI can transform your business, book a quick 30-minute call with our team.</div><a class="eci-cta-btn" href="' + CFG.calendly + '" target="_blank" rel="noopener noreferrer">Book a Call →</a></div>';
    msgArea.appendChild(cta);

    hintEl.innerHTML = '';
    const resetLink = document.createElement('a');
    resetLink.className = 'eci-reset-link';
    resetLink.href = '#';
    resetLink.textContent = 'Reset Demo';
    resetLink.addEventListener('click', (e) => {
      e.preventDefault();
      resetState();
    });
    hintEl.appendChild(resetLink);
  }

  function enableInput() {
    inputEl.disabled = false;
    inputEl.placeholder = 'Type a message...';
    sendBtn.disabled = false;
    hintEl.innerHTML = '';
  }

  function showInlineError(msg) {
    const err = document.createElement('div');
    err.className = 'eci-error';
    err.textContent = msg;
    msgArea.appendChild(err);
    scrollBottom();
    setTimeout(() => {
      if (err.parentNode) err.remove();
    }, 5000);
  }

  function scrollBottom() {
    requestAnimationFrame(() => {
      msgArea.scrollTop = msgArea.scrollHeight;
    });
  }

  async function handleSend() {
    const text = (inputEl.value || '').trim();
    if (!text) {
      inputEl.classList.add('eci-input--error');
      setTimeout(() => inputEl.classList.remove('eci-input--error'), 600);
      return;
    }
    if (isStreaming || inputEl.disabled) return;
    if (userMsgCount > CFG.cap) return;

    inputEl.value = '';
    const ts = Date.now();
    messages.push({ role: 'user', content: text, ts });
    userMsgCount++;
    saveState();
    isStreaming = true;
    sendBtn.disabled = true;
    appendMsg('user', text, ts);
    showTyping();
    setActiveTab('chat');

    if (CFG.mock) {
      await mockRespond();
    } else {
      if (!wsConnected) {
        removeTyping();
        showInlineError('Unable to connect. Please try again later.');
        isStreaming = false;
        sendBtn.disabled = false;
        return;
      }
      responseTimeout = setTimeout(() => {
        if (!isStreaming) return;
        clearTimeout(streamFinalizeTimer);
        removeTyping();
        removeStreamRow();
        streamBubble = null;
        currentStreamText = '';
        isStreaming = false;
        showInlineError('Response timed out — please try again.');
        if (userMsgCount <= CFG.cap) enableInput();
        else sendBtn.disabled = true;
      }, 90000);

      const ikey = 'eci-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      wsSend({
        type: 'req',
        id: nextId(),
        method: 'chat.send',
        params: {
          sessionKey: 'agent:' + CFG.agent + ':demo:' + sessionId,
          message: text,
          idempotencyKey: ikey,
          deliver: false,
        },
      });
    }
  }

  function afterResponse() {
    clearTimeout(responseTimeout);
    responseTimeout = null;
    isStreaming = false;
    if (userMsgCount > CFG.cap) renderCapCTA();
    else if (userMsgCount === CFG.cap) {
      renderSoftCTA();
      enableInput();
    } else {
      enableInput();
    }
    scrollBottom();
  }

  function mockRespond() {
    const pool = MOCK_RESPONSES[CFG.agent] || MOCK_RESPONSES.mike;
    const raw = pool[mockCursor % pool.length];
    mockCursor++;
    return new Promise((resolve) => {
      setTimeout(() => {
        removeTyping();
        const bub = createStreamBubble();
        let current = '';
        let i = 0;
        function tick() {
          if (i < raw.length) {
            current += raw.charAt(i++);
            const parsed = extractDashboardPayload(current);
            if (parsed.metadata) applyDashboardMetadata(parsed.metadata);
            bub.innerHTML = fmtMd(parsed.displayText);
            currentStreamText = parsed.displayText;
            scrollBottom();
            setTimeout(tick, 14 + Math.random() * 10);
          } else {
            removeStreamRow();
            const parsed = extractDashboardPayload(raw);
            const ts = Date.now();
            messages.push({ role: 'assistant', content: parsed.displayText, ts });
            saveState();
            appendMsg('assistant', parsed.displayText, ts);
            currentStreamText = '';
            scrollBottom();
            afterResponse();
            resolve(parsed.displayText);
          }
        }
        tick();
      }, 500 + Math.random() * 900);
    });
  }

  function setActiveTab(tab) {
    activeMobileTab = tab === 'dashboard' ? 'dashboard' : 'chat';
    if (chatTabBtn) chatTabBtn.setAttribute('aria-selected', activeMobileTab === 'chat' ? 'true' : 'false');
    if (dashboardTabBtn) dashboardTabBtn.setAttribute('aria-selected', activeMobileTab === 'dashboard' ? 'true' : 'false');
    if (window.matchMedia('(max-width: 767px)').matches) {
      if (chatPanel) chatPanel.hidden = activeMobileTab !== 'chat';
      if (dashboardPanel) dashboardPanel.hidden = activeMobileTab !== 'dashboard';
    } else {
      if (chatPanel) chatPanel.hidden = false;
      if (dashboardPanel) dashboardPanel.hidden = false;
    }
    try { localStorage.setItem(activeTabKey, activeMobileTab); } catch (e) {}
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function genId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function relTime(ts) {
    const diff = Date.now() - (ts || Date.now());
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return min + 'm ago';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    return Math.floor(hr / 24) + 'd ago';
  }

  function init() {
    loadState();
    buildUI();
    if (!card) return;
    renderMessages();
    renderDashboard(true);
    if (CFG.mock) setStatus(true);
    else connectWS();
    window.addEventListener('resize', () => setActiveTab(activeMobileTab));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
