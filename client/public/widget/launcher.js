(function () {
  'use strict';

  var script = document.currentScript;
  var token = script ? new URL(script.src).searchParams.get('token') : null;
  if (!token) { console.warn('[BizBot] No token in script src. If using async or defer, remove those attributes.'); return; }

  var widgetOrigin = script ? new URL(script.src).origin : window.location.origin;
  var apiUrl = (script && script.dataset.api) || widgetOrigin;

  // Fallback brand color used when config fetch fails or hasn't completed yet
  var FALLBACK_COLOR = '#6366f1';

  var btn = document.createElement('button');
  Object.assign(btn.style, {
    position: 'fixed', bottom: '24px', right: '24px',
    width: '56px', height: '56px', borderRadius: '50%',
    background: FALLBACK_COLOR, border: 'none', cursor: 'pointer',
    fontSize: '24px', color: 'white', zIndex: '2147483647',
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
    // Hide until brand color is loaded so there is no flash of wrong color
    visibility: 'hidden',
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
  iframe.setAttribute('title', 'BizBot chat widget');
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

  // Track current brand color so the click handler can reference it
  var brandColor = FALLBACK_COLOR;
  var open = false;

  btn.addEventListener('click', function () {
    open = !open;
    iframe.style.display = open ? 'block' : 'none';
    btn.setAttribute('aria-expanded', String(open));
    // Use brightness filter for hover/open state instead of a hardcoded darker hex
    btn.style.filter = open ? 'brightness(0.85)' : '';
    btn.style.background = brandColor;
  });

  // Add hover effect via pointer events so it mirrors the open-state brightness
  btn.addEventListener('mouseenter', function () {
    if (!open) { btn.style.filter = 'brightness(0.85)'; }
  });
  btn.addEventListener('mouseleave', function () {
    if (!open) { btn.style.filter = ''; }
  });

  // Close on mobile if viewport is narrow; debounced to avoid thrashing on rapid resize
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth < 480) {
        Object.assign(iframe.style, { width: 'calc(100vw - 16px)', right: '8px', bottom: '88px' });
      } else {
        Object.assign(iframe.style, { width: '380px', right: '24px', bottom: '96px' });
      }
    }, 100);
  });

  /**
   * Validates that a CSS color value is safe to inject into a style attribute.
   * Accepts hex, rgb/rgba, hsl/hsla, and named colors.
   * Rejects anything that could be used for CSS injection (e.g. values containing
   * semicolons, parentheses outside rgb/hsl functions, or url() references).
   *
   * @param {string} value - The color string to validate
   * @returns {boolean} True if the value is a recognized, safe CSS color format
   */
  function isSafeColor(value) {
    return /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-zA-Z]+)$/.test(String(value));
  }

  /**
   * Apply the resolved brand color to the button and make it visible.
   * Called after a successful config fetch or after a failed one (with fallback).
   *
   * @param {string} color - CSS hex color string (e.g. "#6366f1")
   */
  function applyBrandColor(color) {
    brandColor = color;
    btn.style.background = brandColor;
    btn.style.visibility = 'visible';
  }

  // Fetch widget config to get brand color; fall back gracefully on any error
  fetch(apiUrl + '/api/widget-config?token=' + encodeURIComponent(token))
    .then(function (res) {
      if (!res.ok) {
        throw new Error('[BizBot] Config fetch returned ' + res.status);
      }
      return res.json();
    })
    .then(function (config) {
      // Validate the brand color before writing it to a style attribute to prevent CSS injection
      if (config && config.brandColor && isSafeColor(config.brandColor)) {
        applyBrandColor(config.brandColor);
      } else {
        applyBrandColor(FALLBACK_COLOR);
      }
    })
    .catch(function (err) {
      console.warn('[BizBot] Could not load widget config, using fallback color.', err);
      applyBrandColor(FALLBACK_COLOR);
    });
})();
