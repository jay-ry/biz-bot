(function () {
  'use strict';

  var script = document.currentScript;
  var token = script ? new URL(script.src).searchParams.get('token') : null;
  if (!token) { console.warn('[BizBot] No token in script src'); return; }

  var widgetOrigin = script ? new URL(script.src).origin : window.location.origin;
  var apiUrl = (script && script.dataset.api) || widgetOrigin;

  var btn = document.createElement('button');
  Object.assign(btn.style, {
    position: 'fixed', bottom: '24px', right: '24px',
    width: '56px', height: '56px', borderRadius: '50%',
    background: '#550000', border: 'none', cursor: 'pointer',
    fontSize: '24px', color: 'white', zIndex: '2147483647',
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
  });
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  btn.setAttribute('aria-label', 'Open chat');
  btn.setAttribute('aria-expanded', 'false');
  document.body.appendChild(btn);

  var iframe = document.createElement('iframe');
  var iframeSrc = widgetOrigin + '/widget?token=' + encodeURIComponent(token) + '&api=' + encodeURIComponent(apiUrl);
  iframe.src = iframeSrc;
  iframe.setAttribute('allow', 'microphone');
  iframe.setAttribute('aria-label', 'BizBot chat widget');
  Object.assign(iframe.style, {
    position: 'fixed', bottom: '96px', right: '24px',
    width: '380px', height: '600px',
    border: 'none', borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    zIndex: '2147483646',
    display: 'none',
    background: '#000',
  });
  document.body.appendChild(iframe);

  var open = false;
  btn.addEventListener('click', function () {
    open = !open;
    iframe.style.display = open ? 'block' : 'none';
    btn.setAttribute('aria-expanded', String(open));
    btn.style.background = open ? '#6a0000' : '#550000';
  });

  // Close on mobile if viewport is narrow
  window.addEventListener('resize', function () {
    if (window.innerWidth < 480) {
      Object.assign(iframe.style, { width: 'calc(100vw - 16px)', right: '8px', bottom: '88px' });
    } else {
      Object.assign(iframe.style, { width: '380px', right: '24px', bottom: '96px' });
    }
  });
})();
