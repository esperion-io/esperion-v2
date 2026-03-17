/**
 * Esperion Chat Widget v2.0.0
 * Self-contained embeddable chat — connects to OpenClaw Gateway via WebSocket.
 * Zero dependencies. Vanilla JS. ES2020+.
 */
(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[data-token]');
  if (!script) return;

  // ══════════════════════════════════════════════
  // CONFIG — read from script attributes
  // ══════════════════════════════════════════════
  const CFG = {
    token:    script.getAttribute('data-token') || '',
    agent:    script.getAttribute('data-agent') || 'mike',
    theme:    script.getAttribute('data-theme') || 'trades',
    calendly: script.getAttribute('data-calendly') || 'https://calendly.com/hello-esperion/30min',
    company:  script.getAttribute('data-company') || '',
    tagline:  script.getAttribute('data-tagline') || '',
    cap:      parseInt(script.getAttribute('data-cap') || '10', 10),
    mock:     script.getAttribute('data-mock') === 'true',
  };

  // Derive WebSocket URL from script src host
  const wsUrl = (() => {
    try {
      const u = new URL(script.src);
      return (u.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + u.host;
    } catch (e) {
      return 'wss://demo.aitools.co.nz';
    }
  })();

  // ══════════════════════════════════════════════
  // INJECT CSS (self-contained)
  // ══════════════════════════════════════════════
  if (!document.getElementById('ecw-styles')) {
    const style = document.createElement('style');
    style.id = 'ecw-styles';
    style.textContent = `
#ecw,#ecw *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
#ecw{--primary:#2563EB;--primary-h:#1D4ED8;--accent:#F59E0B;--text:#1F2937;--text-m:#6B7280;--bg:#FFFFFF;--bg-msg:#F3F4F6;--border:#E5E7EB;--shadow:0 8px 32px rgba(0,0,0,0.14),0 2px 8px rgba(0,0,0,0.07);--radius:16px;--pulse-rgb:37,99,235}
#ecw[data-theme="trades"]{--primary:#2563EB;--primary-h:#1D4ED8;--accent:#F59E0B;--pulse-rgb:37,99,235}
#ecw[data-theme="realestate"]{--primary:#1F2937;--primary-h:#111827;--accent:#D4A843;--pulse-rgb:31,41,55}
#ecw[data-theme="pm"]{--primary:#0D9488;--primary-h:#0F766E;--accent:#06B6D4;--pulse-rgb:13,148,136}
#ecw[data-theme="education"]{--primary:#7C3AED;--primary-h:#6D28D9;--accent:#EC4899;--pulse-rgb:124,58,237}
.ecw-bubble{position:fixed;bottom:24px;right:24px;z-index:9998;width:60px;height:60px;border-radius:50%;background:var(--primary);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:background-color .2s,transform .15s;-webkit-tap-highlight-color:transparent;padding:0}
.ecw-bubble:hover{background:var(--primary-h);transform:scale(1.06)}
.ecw-bubble:active{transform:scale(0.94)}
.ecw-bubble:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
#ecw[data-position="bottom-left"] .ecw-bubble{right:auto;left:24px}
@keyframes ecw-pulse{0%{box-shadow:0 4px 16px rgba(0,0,0,0.2),0 0 0 0 rgba(var(--pulse-rgb),0.45)}70%{box-shadow:0 4px 16px rgba(0,0,0,0.2),0 0 0 14px rgba(var(--pulse-rgb),0)}100%{box-shadow:0 4px 16px rgba(0,0,0,0.2),0 0 0 0 rgba(var(--pulse-rgb),0)}}
.ecw-pulse{animation:ecw-pulse 1.5s ease-out 3}
@media(prefers-reduced-motion:reduce){.ecw-pulse{animation:none}}
.ecw-badge{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:10px;background:var(--accent);color:#fff;font-size:11px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 4px;border:2px solid #fff;pointer-events:none}
#ecw[data-position="bottom-left"] .ecw-badge{right:auto;left:-3px}
.ecw-panel{position:fixed;bottom:100px;right:24px;z-index:9999;width:380px;height:520px;background:var(--bg);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(10px) scale(0.97);transform-origin:bottom right;transition:opacity .2s ease,transform .2s ease;pointer-events:none}
.ecw-panel--open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
#ecw[data-position="bottom-left"] .ecw-panel{right:auto;left:24px;transform-origin:bottom left}
@media(prefers-reduced-motion:reduce){.ecw-panel{transition:none;opacity:1;transform:none}}
.ecw-header{background:var(--primary);color:#fff;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;gap:8px}
.ecw-header-info{display:flex;align-items:center;gap:10px;min-width:0}
.ecw-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;user-select:none}
.ecw-name-wrap{min-width:0}
.ecw-agent-name{font-size:15px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ecw-powered{font-size:11px;opacity:.72;margin-top:1px;transition:color .2s}
.ecw-powered.ecw-reconnecting{opacity:1;color:#FCD34D}
.ecw-header-actions{display:flex;align-items:center;gap:2px;flex-shrink:0}
.ecw-close-btn,.ecw-clear-btn{background:transparent;border:none;color:rgba(255,255,255,0.8);cursor:pointer;padding:6px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:color .15s,background .15s;flex-shrink:0;-webkit-tap-highlight-color:transparent}
.ecw-close-btn:hover,.ecw-clear-btn:hover{color:#fff;background:rgba(255,255,255,0.15)}
.ecw-close-btn:focus-visible,.ecw-clear-btn:focus-visible{outline:2px solid rgba(255,255,255,0.8);outline-offset:2px}
.ecw-offline{background:#FEF2F2;color:#DC2626;border-bottom:1px solid #FECACA;text-align:center;font-size:12px;font-weight:500;padding:6px 12px;flex-shrink:0}
.ecw-messages{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:6px;scroll-behavior:smooth;overscroll-behavior:contain}
.ecw-messages::-webkit-scrollbar{width:4px}
.ecw-messages::-webkit-scrollbar-track{background:transparent}
.ecw-messages::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
.ecw-ts-divider{text-align:center;font-size:11px;color:var(--text-m);margin:6px 0 2px;position:relative}
.ecw-ts-divider::before,.ecw-ts-divider::after{content:'';position:absolute;top:50%;width:28%;height:1px;background:var(--border)}
.ecw-ts-divider::before{left:0}
.ecw-ts-divider::after{right:0}
@keyframes ecw-fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.ecw-msg{display:flex;align-items:flex-end;gap:6px;animation:ecw-fadein .18s ease}
@media(prefers-reduced-motion:reduce){.ecw-msg{animation:none}}
.ecw-msg--user{flex-direction:row-reverse}
.ecw-msg-avatar{width:26px;height:26px;border-radius:50%;background:var(--primary);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;user-select:none}
.ecw-msg-inner{display:flex;flex-direction:column;gap:3px;max-width:calc(100% - 38px)}
.ecw-msg--user .ecw-msg-inner{align-items:flex-end}
.ecw-msg-bubble{padding:9px 13px;border-radius:18px;font-size:14px;line-height:1.5;word-break:break-word;white-space:pre-wrap}
.ecw-msg--assistant .ecw-msg-bubble{background:var(--bg-msg);color:var(--text);border-bottom-left-radius:4px}
.ecw-msg--user .ecw-msg-bubble{background:var(--primary);color:#fff;border-bottom-right-radius:4px}
.ecw-msg-time{font-size:11px;color:var(--text-m);padding:0 3px;opacity:0;transition:opacity .15s;pointer-events:none;user-select:none}
.ecw-msg:hover .ecw-msg-time{opacity:1}
.ecw-typing{display:flex;align-items:center;gap:5px;padding:11px 14px;min-width:52px}
.ecw-typing span{display:block;width:7px;height:7px;border-radius:50%;background:var(--text-m);animation:ecw-bounce 1.2s ease-in-out infinite;flex-shrink:0}
.ecw-typing span:nth-child(2){animation-delay:.15s}
.ecw-typing span:nth-child(3){animation-delay:.30s}
@keyframes ecw-bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}
@media(prefers-reduced-motion:reduce){.ecw-typing span{animation:none;opacity:.5}}
.ecw-error{text-align:center;font-size:12px;color:#DC2626;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:8px 12px;animation:ecw-fadein .18s ease}
.ecw-soft-cta{padding:10px 14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;font-size:13px;color:#92400E;margin:4px 0;animation:ecw-fadein .25s ease;line-height:1.5}
.ecw-soft-cta-link{color:#B45309;font-weight:600;text-decoration:none}
.ecw-soft-cta-link:hover{text-decoration:underline}
.ecw-cta{margin:6px 0 2px;animation:ecw-fadein .25s ease}
.ecw-cta-inner{border:1px solid var(--border);border-radius:12px;padding:16px 14px;text-align:center;background:#f9fafb;display:flex;flex-direction:column;align-items:center;gap:6px}
.ecw-cta-icon{font-size:22px;line-height:1}
.ecw-cta-title{font-size:15px;font-weight:600;color:var(--text)}
.ecw-cta-body{font-size:13px;color:var(--text-m);line-height:1.5}
.ecw-cta-btn{display:inline-block;background:var(--primary);color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;transition:background-color .2s;margin-top:4px}
.ecw-cta-btn:hover{background:var(--primary-h);color:#fff}
.ecw-cta-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.ecw-footer{border-top:1px solid var(--border);padding:10px 12px 12px;flex-shrink:0}
.ecw-input-row{display:flex;gap:8px;align-items:center}
.ecw-input{flex:1;min-width:0;border:1.5px solid var(--border);border-radius:22px;padding:9px 15px;font-size:14px;color:var(--text);background:#fff;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none}
.ecw-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(var(--pulse-rgb),0.12)}
.ecw-input::placeholder{color:var(--text-m)}
.ecw-input:disabled{background:#f9fafb;color:var(--text-m);cursor:not-allowed}
@keyframes ecw-input-error{0%,100%{border-color:var(--border)}50%{border-color:#DC2626;box-shadow:0 0 0 3px rgba(220,38,38,0.15)}}
.ecw-input--error{animation:ecw-input-error .4s ease}
.ecw-send-btn{width:38px;height:38px;border-radius:50%;background:var(--primary);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background-color .2s,transform .12s;-webkit-tap-highlight-color:transparent;padding:0}
.ecw-send-btn:hover:not(:disabled){background:var(--primary-h);transform:scale(1.06)}
.ecw-send-btn:active:not(:disabled){transform:scale(0.93)}
.ecw-send-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.ecw-send-btn:disabled{background:var(--border);color:var(--text-m);cursor:not-allowed}
.ecw-hint{text-align:center;font-size:12px;color:var(--text-m);margin-top:8px}
.ecw-reset-link{color:var(--primary);text-decoration:none}
.ecw-reset-link:hover{text-decoration:underline}
@media(max-width:639px){
  .ecw-bubble{width:52px;height:52px;bottom:16px;right:16px}
  #ecw[data-position="bottom-left"] .ecw-bubble{left:16px;right:auto}
  .ecw-panel{position:fixed;inset:0;width:100%;height:100%;border-radius:0;border:none;bottom:auto;right:auto;transform-origin:bottom center}
  .ecw-panel--open{transform:none}
}
    `;
    document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════
  // AGENT DATA
  // ══════════════════════════════════════════════
  const AGENTS = {
    mike: {
      name: "Mike's Plumbing",
      initial: 'M',
      greeting: "Hey there! 👋 Thanks for reaching out to Mike's Plumbing. How can I help?",
    },
    bayview: {
      name: 'Bayview Realty',
      initial: 'B',
      greeting: "Hi there! 👋 Thanks for getting in touch with Bayview Realty. How can I help you today?",
    },
    pacific: {
      name: 'Pacific Property Management',
      initial: 'P',
      greeting: "Hello! 👋 Welcome to Pacific Property Management. How can I help?",
    },
    studymate: {
      name: 'StudyMate NZ',
      initial: 'S',
      greeting: "Hey! 👋 I'm your StudyMate — here to help with study and career stuff. What can I help with?",
    },
  };

  // Mock responses for data-mock="true" mode
  const MOCK_RESPONSES = {
    mike: [
      "No worries! Can you tell me a bit more about what's going on? Is it a leak, a blocked drain, or something else?",
      "Got it — whereabouts are you based in Auckland? And is this something urgent or can it wait a day or two?",
      "Alright, I'll get that to Mike straight away. He usually gets back within a couple of hours. What's the best number to reach you on?",
      "All sorted — I've got your details noted down. Mike will be in touch shortly. Is there anything else I can help with?",
      "That sounds like it could be a blockage in the trap — hard to say without seeing it. Let me get Mike to take a look. What's your address?",
      "For urgent jobs like that, Mike can usually get out within a few hours. Can I confirm your phone number so he can call ahead?",
      "Yep, Mike and the team handle that sort of job all the time — burst pipes, hot water cylinders, gas fitting, the lot. What do you need done?",
    ],
    bayview: [
      "Great to hear! Are you looking to buy, sell, or are you after a no-obligation appraisal at this stage?",
      "The Auckland market's been picking up nicely — transaction volumes are up about 10% this year and interest rates are coming down. Good time for a move. What area are you thinking?",
      "I'll have one of our agents reach out with some options that fit. What's your budget range and how many bedrooms are you after?",
      "Perfect — I've noted all of that. One of the Bayview team will be in touch today. Anything else I can help with?",
      "For an accurate picture of your property's value, the best option is a free, no-obligation appraisal with one of our agents. Want me to arrange that?",
      "No pressure at all! If you let me know what you're after — area, size, budget — I can have someone send through some options that might suit.",
    ],
    pacific: [
      "Sure thing! Are you looking for a rental property, or is this about an existing tenancy or a maintenance request?",
      "Got it — I can help with that. Can you give me a few more details so the right person follows up with you?",
      "I'll pass this on to our team — someone will be in touch shortly. Is there anything else I can help with?",
      "We manage properties across most of Auckland. I'll have one of our property managers reach out. What's the best number to call?",
    ],
    studymate: [
      "Nice — what subject or topic are you working on? I can help you break it into manageable chunks.",
      "That's a solid plan. Want me to help you create a study schedule, or would you prefer some tips on the topic itself?",
      "Good question — let me help you think through that. What's your deadline looking like?",
      "Totally normal to feel that way before exams! Let's break it down. What subject is it and when's the exam?",
      "For that kind of essay, start with a clear thesis — one sentence that sums up your main argument. Want to try drafting one together?",
      "You're on the right track. Keep going — and if you get stuck on anything specific, just ask. That's what I'm here for!",
    ],
  };

  // SVG Icons
  const ICON_CHAT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';
  const ICON_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  const ICON_SEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  // ══════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════
  const agent = AGENTS[CFG.agent] || AGENTS.mike;
  const companyName = CFG.company || agent.name;
  const companyInitial = companyName.charAt(0).toUpperCase();

  const storageKey = `esperion-demo-${CFG.agent}`;
  const sessionKey = `esperion-demo-${CFG.agent}-session`;
  const panelKey   = `esperion-demo-${CFG.agent}-panel`;

  let messages = [];
  let userMsgCount = 0;
  let sessionId = '';
  let isOpen = false;
  let isStreaming = false;
  let mockCursor = 0;

  // WebSocket state
  let ws = null;
  let wsConnected = false;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let responseTimeout = null;

  // Streaming state
  let currentStreamText = '';
  let streamFinalizeTimer = null;
  let streamBubble = null;
  let reqId = 1;

  // DOM refs
  let root, bubbleBtn, badgeEl, panelEl, msgArea, inputEl, sendBtn, hintEl, poweredEl, offlineBanner;

  // ══════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════
  const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes — matches server idleMinutes

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && Array.isArray(saved.messages) && saved.messages.length > 0) {
        // Check TTL — if last message is older than 30 min, start fresh
        const lastMsg = saved.messages[saved.messages.length - 1];
        const lastTs = lastMsg?.ts || 0;
        if (lastTs && (Date.now() - lastTs) > SESSION_TTL_MS) {
          // Session expired — clear and start fresh
          try { localStorage.removeItem(storageKey); localStorage.removeItem(sessionKey); } catch (e) { /* ignore */ }
        } else {
          messages = saved.messages;
          userMsgCount = saved.userMsgCount || 0;
          mockCursor = saved.mockCursor || 0;
        }
      }
    } catch (e) { /* ignore */ }

    if (messages.length === 0) {
      messages.push({ role: 'assistant', content: agent.greeting, ts: Date.now() });
    }

    try {
      sessionId = localStorage.getItem(sessionKey) || '';
    } catch (e) { /* ignore */ }
    if (!sessionId) {
      sessionId = generateId();
      try { localStorage.setItem(sessionKey, sessionId); } catch (e) { /* ignore */ }
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ messages, userMsgCount, mockCursor }));
    } catch (e) { /* ignore */ }
  }

  function resetState() {
    messages = [{ role: 'assistant', content: agent.greeting, ts: Date.now() }];
    userMsgCount = 0;
    mockCursor = 0;
    sessionId = generateId();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ messages, userMsgCount, mockCursor }));
      localStorage.setItem(sessionKey, sessionId);
    } catch (e) { /* ignore */ }

    renderMessages();
    enableInput();
    if (!CFG.mock) reconnectWS();
    setTimeout(() => { if (inputEl && !inputEl.disabled) inputEl.focus(); }, 50);
  }

  // ══════════════════════════════════════════════
  // WEBSOCKET
  // ══════════════════════════════════════════════
  function connectWS() {
    if (CFG.mock || wsConnected) return;
    clearTimeout(reconnectTimer);

    // Clean up any existing socket
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      try { ws.close(); } catch (e) { /* ignore */ }
      ws = null;
    }

    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      // Wait for connect.challenge event before sending connect request
    };

    ws.onmessage = (event) => {
      try {
        handleFrame(JSON.parse(event.data));
      } catch (e) { /* ignore malformed frames */ }
    };

    ws.onclose = () => {
      wsConnected = false;
      ws = null;
      setReconnectingStatus();
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will also fire; nothing extra needed here
    };
  }

  function reconnectWS() {
    wsConnected = false;
    reconnectAttempt = 0;
    connectWS();
  }

  function wsSend(frame) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(frame));
    }
  }

  function nextId() {
    return String(++reqId);
  }

  function handleFrame(frame) {
    // Server sends connect.challenge first — respond with connect request
    if (frame.type === 'event' && frame.event === 'connect.challenge') {
      ws.send(JSON.stringify({
        type: 'req',
        id: 'connect',
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: { id: 'webchat', version: '1.0.0', platform: 'web', mode: 'webchat' },
          role: 'operator',
          scopes: ['operator.admin', 'operator.write'],
        },
      }));
      return;
    }

    // Connection ack
    if (frame.type === 'res' && frame.id === 'connect') {
      if (frame.ok) {
        wsConnected = true;
        reconnectAttempt = 0;
        setConnectedStatus();
      } else {
        showInlineError('Unable to connect. Please try again later.');
      }
      return;
    }

    // Chat event — streamed response chunks
    if (frame.type === 'event' && frame.event === 'chat') {
      handleChatEvent(frame.payload);
      return;
    }

    // chat.send ack — non-blocking
    // Nothing to do; response arrives via chat events above
  }

  function handleChatEvent(payload) {
    if (!isStreaming) return;

    const state = payload?.state;
    const msg = payload?.message;
    const text = (msg?.content && msg.content[0]?.text) || msg?.text || '';

    // Delta — streaming in progress
    if (state === 'delta' && text) {
      // First delta arrived — cancel the response timeout (model is responding)
      if (responseTimeout) { clearTimeout(responseTimeout); responseTimeout = null; }
      if (!streamBubble) {
        removeTypingIndicator();
        streamBubble = createStreamingBubble();
        currentStreamText = '';
      }
      // Full accumulated text comes in each delta, replace rather than append
      currentStreamText = text;
      streamBubble.innerHTML = formatMarkdown(currentStreamText);
      scrollToBottom();

      // Reset finalize timer
      clearTimeout(streamFinalizeTimer);
      streamFinalizeTimer = setTimeout(finalizeStream, 2000);
      return;
    }

    // Final — complete response
    if (state === 'final' && text) {
      clearTimeout(streamFinalizeTimer);
      if (!streamBubble) {
        removeTypingIndicator();
        streamBubble = createStreamingBubble();
      }
      currentStreamText = text;
      streamBubble.innerHTML = formatMarkdown(currentStreamText);
      scrollToBottom();
      finalizeStream();
      return;
    }

    // Error or aborted
    if (state === 'error' || state === 'aborted') {
      clearTimeout(streamFinalizeTimer);
      if (currentStreamText) {
        finalizeStream();
      } else {
        removeTypingIndicator();
        removeStreamingBubble();
        showInlineError('Something went wrong. Please try again.');
        isStreaming = false;
        if (userMsgCount <= CFG.cap) enableInput();
      }
      return;
    }
  }

  // Simple markdown → HTML (bold, numbered lists, line breaks)
  function formatMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function finalizeStream() {
    if (!isStreaming) return;
    clearTimeout(responseTimeout);
    responseTimeout = null;

    const text = currentStreamText || "I didn't catch that — could you try again.";
    removeStreamingBubble();
    streamBubble = null;
    currentStreamText = '';
    streamFinalizeTimer = null;

    const ts = Date.now();
    messages.push({ role: 'assistant', content: text, ts });
    saveState();
    appendMsgRow('assistant', text, ts);
    scrollToBottom();

    afterResponse();
  }

  function scheduleReconnect() {
    if (CFG.mock) return;
    const delay = Math.min(Math.pow(2, reconnectAttempt) * 1000, 30000);
    reconnectAttempt++;
    reconnectTimer = setTimeout(connectWS, delay);
  }

  function setReconnectingStatus() {
    if (!poweredEl) return;
    poweredEl.textContent = 'Reconnecting...';
    poweredEl.classList.add('ecw-reconnecting');
  }

  function setConnectedStatus() {
    if (!poweredEl) return;
    poweredEl.textContent = CFG.tagline || 'Powered by Esperion';
    poweredEl.classList.remove('ecw-reconnecting');
  }

  // ══════════════════════════════════════════════
  // BUILD UI
  // ══════════════════════════════════════════════
  function buildUI() {
    root = document.createElement('div');
    root.id = 'ecw';
    root.setAttribute('data-theme', CFG.theme);
    root.setAttribute('data-position', 'bottom-right');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Chat widget');

    // ── Bubble ──
    bubbleBtn = document.createElement('button');
    bubbleBtn.className = 'ecw-bubble ecw-pulse';
    bubbleBtn.setAttribute('aria-label', `Open chat with ${companyName}`);
    bubbleBtn.setAttribute('aria-expanded', 'false');
    bubbleBtn.setAttribute('aria-haspopup', 'dialog');
    bubbleBtn.innerHTML = ICON_CHAT;
    bubbleBtn.addEventListener('click', togglePanel);

    badgeEl = document.createElement('span');
    badgeEl.className = 'ecw-badge';
    badgeEl.setAttribute('aria-hidden', 'true');
    badgeEl.textContent = '1';
    bubbleBtn.appendChild(badgeEl);

    // ── Panel ──
    panelEl = document.createElement('div');
    panelEl.className = 'ecw-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-label', `Chat with ${companyName}`);

    // Header
    const header = document.createElement('div');
    header.className = 'ecw-header';

    const headerInfo = document.createElement('div');
    headerInfo.className = 'ecw-header-info';

    const avatarEl = document.createElement('div');
    avatarEl.className = 'ecw-avatar';
    avatarEl.textContent = companyInitial;
    avatarEl.setAttribute('aria-hidden', 'true');

    const nameWrap = document.createElement('div');
    nameWrap.className = 'ecw-name-wrap';

    const nameEl = document.createElement('div');
    nameEl.className = 'ecw-agent-name';
    nameEl.textContent = companyName;

    poweredEl = document.createElement('div');
    poweredEl.className = 'ecw-powered';
    poweredEl.textContent = CFG.tagline || 'Powered by Esperion';

    nameWrap.appendChild(nameEl);
    nameWrap.appendChild(poweredEl);
    headerInfo.appendChild(avatarEl);
    headerInfo.appendChild(nameWrap);

    // Header action buttons (clear + close)
    const headerActions = document.createElement('div');
    headerActions.className = 'ecw-header-actions';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'ecw-clear-btn';
    clearBtn.setAttribute('aria-label', 'Clear conversation');
    clearBtn.setAttribute('title', 'New conversation');
    clearBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.65 6.35A7.96 7.96 0 0 0 12 4C7.58 4 4.01 7.58 4.01 12S7.58 20 12 20c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';
    clearBtn.addEventListener('click', () => {
      if (isStreaming) return;
      resetState();
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ecw-close-btn';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.innerHTML = ICON_CLOSE;
    closeBtn.addEventListener('click', closePanel);

    headerActions.appendChild(clearBtn);
    headerActions.appendChild(closeBtn);

    header.appendChild(headerInfo);
    header.appendChild(headerActions);

    // Offline banner
    offlineBanner = document.createElement('div');
    offlineBanner.className = 'ecw-offline';
    offlineBanner.setAttribute('aria-live', 'polite');
    offlineBanner.textContent = "You're offline";
    offlineBanner.style.display = 'none';

    // Messages area
    msgArea = document.createElement('div');
    msgArea.className = 'ecw-messages';
    msgArea.setAttribute('role', 'log');
    msgArea.setAttribute('aria-live', 'polite');
    msgArea.setAttribute('aria-label', 'Conversation');

    // Footer
    const footer = document.createElement('div');
    footer.className = 'ecw-footer';

    const inputRow = document.createElement('div');
    inputRow.className = 'ecw-input-row';

    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'ecw-input';
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
    sendBtn.className = 'ecw-send-btn';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = ICON_SEND;
    sendBtn.addEventListener('click', handleSend);

    hintEl = document.createElement('div');
    hintEl.className = 'ecw-hint';

    inputRow.appendChild(inputEl);
    inputRow.appendChild(sendBtn);
    footer.appendChild(inputRow);
    footer.appendChild(hintEl);

    panelEl.appendChild(header);
    panelEl.appendChild(offlineBanner);
    panelEl.appendChild(msgArea);
    panelEl.appendChild(footer);

    root.appendChild(bubbleBtn);
    root.appendChild(panelEl);
    document.body.appendChild(root);

    // Global keyboard: Escape closes panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closePanel();
    });

    // Network status
    window.addEventListener('online', () => {
      if (offlineBanner) offlineBanner.style.display = 'none';
      if (!CFG.mock) reconnectWS();
    });
    window.addEventListener('offline', () => {
      if (offlineBanner) offlineBanner.style.display = 'block';
    });
    if (!navigator.onLine) {
      offlineBanner.style.display = 'block';
    }
  }

  // ══════════════════════════════════════════════
  // PANEL OPEN / CLOSE
  // ══════════════════════════════════════════════
  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    isOpen = true;
    try { sessionStorage.setItem(panelKey, 'true'); } catch (e) { /* ignore */ }
    panelEl.classList.add('ecw-panel--open');
    bubbleBtn.setAttribute('aria-expanded', 'true');
    bubbleBtn.setAttribute('aria-label', 'Close chat');
    bubbleBtn.innerHTML = ICON_CLOSE;
    bubbleBtn.appendChild(badgeEl);
    badgeEl.style.display = 'none';
    bubbleBtn.classList.remove('ecw-pulse');
    renderMessages();
    setTimeout(() => { if (inputEl && !inputEl.disabled) inputEl.focus(); }, 100);
  }

  function closePanel() {
    isOpen = false;
    try { sessionStorage.setItem(panelKey, 'false'); } catch (e) { /* ignore */ }
    panelEl.classList.remove('ecw-panel--open');
    bubbleBtn.setAttribute('aria-expanded', 'false');
    bubbleBtn.setAttribute('aria-label', `Open chat with ${companyName}`);
    bubbleBtn.innerHTML = ICON_CHAT;
    bubbleBtn.appendChild(badgeEl);
  }

  // ══════════════════════════════════════════════
  // RENDER MESSAGES
  // ══════════════════════════════════════════════
  function renderMessages() {
    msgArea.innerHTML = '';
    let prevTs = null;

    messages.forEach((msg) => {
      if (msg.role === 'system') return;

      if (prevTs !== null && msg.ts - prevTs > 5 * 60 * 1000) {
        const div = document.createElement('div');
        div.className = 'ecw-ts-divider';
        div.textContent = relativeTime(msg.ts);
        div.setAttribute('aria-hidden', 'true');
        msgArea.appendChild(div);
      }
      prevTs = msg.ts || Date.now();
      appendMsgRow(msg.role, msg.content, msg.ts);
    });

    // Restore correct UI state based on message count
    if (userMsgCount > CFG.cap) {
      renderCapCTA();
    } else if (userMsgCount === CFG.cap) {
      renderSoftCTA();
    }

    scrollToBottom();
  }

  function appendMsgRow(role, content, ts) {
    const isUser = role === 'user';
    const row = document.createElement('div');
    row.className = `ecw-msg ${isUser ? 'ecw-msg--user' : 'ecw-msg--assistant'}`;

    if (!isUser) {
      const av = document.createElement('div');
      av.className = 'ecw-msg-avatar';
      av.textContent = companyInitial;
      av.setAttribute('aria-hidden', 'true');
      row.appendChild(av);
    }

    const inner = document.createElement('div');
    inner.className = 'ecw-msg-inner';

    const bub = document.createElement('div');
    bub.className = 'ecw-msg-bubble';
    bub.textContent = content;

    const time = document.createElement('span');
    time.className = 'ecw-msg-time';
    time.textContent = relativeTime(ts || Date.now());
    time.setAttribute('aria-hidden', 'true');

    inner.appendChild(bub);
    inner.appendChild(time);
    row.appendChild(inner);
    msgArea.appendChild(row);
    return bub;
  }

  // Typing indicator
  function showTypingIndicator() {
    removeTypingIndicator();
    const row = document.createElement('div');
    row.className = 'ecw-msg ecw-msg--assistant';
    row.id = 'ecw-typing-row';

    const av = document.createElement('div');
    av.className = 'ecw-msg-avatar';
    av.textContent = companyInitial;
    av.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('div');
    inner.className = 'ecw-msg-inner';

    const bub = document.createElement('div');
    bub.className = 'ecw-msg-bubble ecw-typing';
    bub.setAttribute('aria-label', 'Agent is typing');
    bub.innerHTML = '<span></span><span></span><span></span>';

    inner.appendChild(bub);
    row.appendChild(av);
    row.appendChild(inner);
    msgArea.appendChild(row);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const el = document.getElementById('ecw-typing-row');
    if (el) el.remove();
  }

  // Streaming bubble (live text update)
  function createStreamingBubble() {
    const row = document.createElement('div');
    row.className = 'ecw-msg ecw-msg--assistant';
    row.id = 'ecw-stream-row';

    const av = document.createElement('div');
    av.className = 'ecw-msg-avatar';
    av.textContent = companyInitial;
    av.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('div');
    inner.className = 'ecw-msg-inner';

    const bub = document.createElement('div');
    bub.className = 'ecw-msg-bubble';

    inner.appendChild(bub);
    row.appendChild(av);
    row.appendChild(inner);
    msgArea.appendChild(row);
    return bub;
  }

  function removeStreamingBubble() {
    const el = document.getElementById('ecw-stream-row');
    if (el) el.remove();
  }

  // ── Soft CTA (after message 10, input still enabled) ──
  function renderSoftCTA() {
    if (msgArea.querySelector('.ecw-soft-cta')) return;
    const banner = document.createElement('div');
    banner.className = 'ecw-soft-cta';

    const text = document.createTextNode('Impressed? See how this could work for your business \u2192 ');
    const link = document.createElement('a');
    link.className = 'ecw-soft-cta-link';
    link.href = CFG.calendly;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Book a Call';

    banner.appendChild(text);
    banner.appendChild(link);
    msgArea.appendChild(banner);
  }

  // ── Full CTA (messages 11+, input disabled) ──
  function renderCapCTA() {
    if (msgArea.querySelector('.ecw-cta')) return;

    inputEl.disabled = true;
    inputEl.placeholder = 'Demo complete — book a call to continue';
    sendBtn.disabled = true;

    const cta = document.createElement('div');
    cta.className = 'ecw-cta';

    const inner = document.createElement('div');
    inner.className = 'ecw-cta-inner';

    const icon = document.createElement('div');
    icon.className = 'ecw-cta-icon';
    icon.textContent = '✨';

    const title = document.createElement('div');
    title.className = 'ecw-cta-title';
    title.textContent = 'Thanks for trying the demo!';

    const body = document.createElement('div');
    body.className = 'ecw-cta-body';
    body.textContent = 'To explore how AI can transform your business, book a quick 30-minute call with our team.';

    const btn = document.createElement('a');
    btn.className = 'ecw-cta-btn';
    btn.href = CFG.calendly;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.textContent = 'Book a Call \u2192';

    inner.appendChild(icon);
    inner.appendChild(title);
    inner.appendChild(body);
    inner.appendChild(btn);
    cta.appendChild(inner);
    msgArea.appendChild(cta);

    // Reset Demo link
    hintEl.innerHTML = '';
    const resetLink = document.createElement('a');
    resetLink.className = 'ecw-reset-link';
    resetLink.href = '#';
    resetLink.setAttribute('role', 'button');
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
    err.className = 'ecw-error';
    err.textContent = msg;
    msgArea.appendChild(err);
    scrollToBottom();
    setTimeout(() => { if (err.parentNode) err.parentNode.removeChild(err); }, 5000);
  }

  function scrollToBottom() {
    requestAnimationFrame(() => { msgArea.scrollTop = msgArea.scrollHeight; });
  }

  // ══════════════════════════════════════════════
  // SEND MESSAGE
  // ══════════════════════════════════════════════
  async function handleSend() {
    const text = (inputEl.value || '').trim();

    // Empty message — flash border red
    if (!text) {
      inputEl.classList.add('ecw-input--error');
      setTimeout(() => inputEl.classList.remove('ecw-input--error'), 600);
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

    appendMsgRow('user', text, ts);
    showTypingIndicator();

    if (CFG.mock) {
      await mockRespond();
    } else {
      if (!wsConnected) {
        removeTypingIndicator();
        showInlineError('Unable to connect. Please try again later.');
        isStreaming = false;
        sendBtn.disabled = false;
        return;
      }

      // 90s timeout — Kimi K2.5 via OpenRouter can be slow on cold starts
      responseTimeout = setTimeout(() => {
        if (!isStreaming) return;
        clearTimeout(streamFinalizeTimer);
        removeTypingIndicator();
        removeStreamingBubble();
        streamBubble = null;
        currentStreamText = '';
        isStreaming = false;
        showInlineError('Response timed out — please try again.');
        if (userMsgCount <= CFG.cap) enableInput();
        else sendBtn.disabled = true;
      }, 90000);

      const ikey = 'ecw-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      wsSend({
        type: 'req',
        id: nextId(),
        method: 'chat.send',
        params: {
          sessionKey: 'demo:' + CFG.agent + ':' + sessionId,
          message: text,
          idempotencyKey: ikey,
          deliver: false,
        },
      });
    }
  }

  // Called after a response has been committed (mock or WS)
  function afterResponse() {
    clearTimeout(responseTimeout);
    responseTimeout = null;
    isStreaming = false;

    if (userMsgCount > CFG.cap) {
      renderCapCTA();
    } else if (userMsgCount === CFG.cap) {
      renderSoftCTA();
      enableInput();
    } else {
      enableInput();
    }

    scrollToBottom();
  }

  // ══════════════════════════════════════════════
  // MOCK MODE — simulated streaming responses
  // ══════════════════════════════════════════════
  function mockRespond() {
    const pool = MOCK_RESPONSES[CFG.agent] || MOCK_RESPONSES.mike;
    const text = pool[mockCursor % pool.length];
    mockCursor++;

    return new Promise((resolve) => {
      const delay = 500 + Math.random() * 900;
      setTimeout(() => {
        removeTypingIndicator();
        const bub = createStreamingBubble();
        let current = '';
        let i = 0;

        function tick() {
          if (i < text.length) {
            current += text[i++];
            bub.textContent = current;
            scrollToBottom();
            setTimeout(tick, 14 + Math.random() * 10);
          } else {
            removeStreamingBubble();
            const ts = Date.now();
            messages.push({ role: 'assistant', content: text, ts });
            saveState();
            appendMsgRow('assistant', text, ts);
            scrollToBottom();
            afterResponse();
            resolve(text);
          }
        }

        tick();
      }, delay);
    });
  }

  // ══════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════
  function generateId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function relativeTime(ts) {
    const diff = Date.now() - (ts || Date.now());
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  }

  // ══════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════
  function init() {
    loadState();
    buildUI();

    if (messages.length > 0) {
      badgeEl.style.display = 'flex';
    }

    // Remove pulse animation after 3s
    setTimeout(() => {
      if (bubbleBtn) bubbleBtn.classList.remove('ecw-pulse');
    }, 3000);

    // Restore panel open state from session
    try {
      if (sessionStorage.getItem(panelKey) === 'true') openPanel();
    } catch (e) { /* ignore */ }

    // Start WebSocket connection
    if (!CFG.mock) connectWS();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
