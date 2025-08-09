(() => {
  const mac = navigator.platform.toUpperCase().includes('MAC');
  const TOAST_DURATION_MS = 2500; 
  const SPINNER_DURATION_MS = 700;

  function ensureToastStyles() {
    if (document.getElementById('lc-hotkey-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'lc-hotkey-toast-styles';
    style.textContent = `@keyframes lcSpin { to { transform: rotate(360deg); } }`;
    document.documentElement.appendChild(style);
  }

  function isInEditor() {
    return Boolean(
      document.querySelector('[data-key="code-area"], .monaco-editor, [data-testid="console-panel"]')
    );
  }

  function clickIfVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0;
    if (!visible) return false;
    element.click();
    return true;
  }

  function findResetButton() {
    const iconBtn = document.querySelector('button svg[data-icon="arrow-rotate-left"]');
    if (iconBtn) return iconBtn.closest('button');

    return (
      document.querySelector('button[aria-label="Reset"], [data-testid="editor-reset-button"]') ||
      Array.from(document.querySelectorAll('button')).find(b => /^(reset|revert)$/i.test(b.textContent?.trim() || ''))
    );
  }

  function findResetConfirmButton() {
    const containers = document.querySelectorAll('[role="dialog"], [data-state="open"], .rc-dialog, .ant-modal, .chakra-modal__content')
    for (const container of containers) {
      const btn = Array.from(container.querySelectorAll('button')).find(b =>
        /^(reset|confirm|yes)$/i.test((b.textContent || '').trim())
      );
      if (btn) return btn;
    }

    const visibleButtons = Array.from(document.querySelectorAll('button')).filter(b => {
      const rect = b.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    const warningStrings = [
      'Are you sure?',
      'discarded and reset to the default code',
      'reset to the default code'
    ];
    for (const button of visibleButtons) {
      const container = button.closest('div');
      const text = (container?.innerText || '').toLowerCase();
      const matchesWarning = warningStrings.some(s => text.includes(s.toLowerCase()));
      const label = (button.textContent || '').trim();
      if (matchesWarning && /^(confirm|reset|yes)$/i.test(label)) {
        return button;
      }
    }

    return visibleButtons.find(b => /^(confirm|reset|yes)$/i.test((b.textContent || '').trim())) || null;
  }

  function autoConfirmResetWithRetries() {
    const attempts = [100, 250, 500, 1000, 1500];
    attempts.forEach(delay => {
      setTimeout(() => {
        const confirm = findResetConfirmButton();
        if (confirm) clickIfVisible(confirm);
      }, delay);
    });
  }

  function showToast(text, durationMs = TOAST_DURATION_MS) {
    try {
      ensureToastStyles();
      const sample = document.querySelector('.bg-green-s, .text-green-s, button.bg-green-s');
      const cs = sample ? getComputedStyle(sample) : null;

      const bg = cs && cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ? cs.backgroundColor
        : '#00b8a3';
      const fg = cs && cs.color ? cs.color : '#ffffff';
      const radius = cs && cs.borderRadius && cs.borderRadius !== '0px' ? cs.borderRadius : '10px';
      const font = cs && cs.font ? cs.font : '13px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial';

      const existing = document.getElementById('lc-hotkey-reset-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'lc-hotkey-reset-toast';
      toast.style.position = 'fixed';
      toast.style.right = '16px';
      toast.style.bottom = '16px';
      toast.style.zIndex = '2147483647';
      toast.style.display = 'inline-flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '8px';
      toast.style.padding = '8px 12px';
      toast.style.background = bg;
      toast.style.color = fg;
      toast.style.borderRadius = radius;
      toast.style.font = font;
      toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
      toast.style.transition = 'opacity 160ms ease, transform 160ms ease';

      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('width', '16');
      icon.setAttribute('height', '16');
      icon.setAttribute('fill', 'currentColor');

      const spinnerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      spinnerGroup.setAttribute('id', 'lc-spinner');
      spinnerGroup.setAttribute('style', 'transform-origin: 12px 12px; animation: lcSpin 800ms linear infinite;');
      const spinnerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      spinnerCircle.setAttribute('cx', '12');
      spinnerCircle.setAttribute('cy', '12');
      spinnerCircle.setAttribute('r', '9');
      spinnerCircle.setAttribute('fill', 'none');
      spinnerCircle.setAttribute('stroke', 'currentColor');
      spinnerCircle.setAttribute('stroke-width', '2');
      spinnerCircle.setAttribute('stroke-linecap', 'round');
      spinnerCircle.setAttribute('stroke-dasharray', '56');
      spinnerCircle.setAttribute('stroke-dashoffset', '42');
      spinnerGroup.appendChild(spinnerCircle);

      const checkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      checkGroup.setAttribute('id', 'lc-check');
      checkGroup.setAttribute('style', 'opacity:0; transform: scale(0.85); transform-origin: 12px 12px; transition: opacity 180ms ease, transform 180ms ease;');
      const checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      checkPath.setAttribute('d', 'M9 16.2l-3.5-3.5L4 14.2 9 19l12-12-1.5-1.5z');
      checkGroup.appendChild(checkPath);

      icon.appendChild(spinnerGroup);
      icon.appendChild(checkGroup);

      const label = document.createElement('span');
      label.textContent = text;
      label.style.fontWeight = '600';

      toast.appendChild(icon);
      toast.appendChild(label);
      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      // Transition spinner → check
      setTimeout(() => {
        spinnerGroup.style.display = 'none';
        checkGroup.style.opacity = '1';
        checkGroup.style.transform = 'scale(1)';
      }, Math.min(600, Math.max(250, SPINNER_DURATION_MS)));

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(6px)';
        setTimeout(() => toast.remove(), 200);
      }, durationMs);
    } catch (_) {}
  }

  function handleHotkeys(event) {
    const active = document.activeElement;
    const isEditable = active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.getAttribute('contenteditable') === 'true'
    );
    const insideMonaco = !!(active && typeof active.closest === 'function' && active.closest('.monaco-editor'));

    if (isEditable && !insideMonaco) return;

    if (!mac || !event.metaKey) return;

    if ((event.code === 'Backslash' || event.key === '\\') && !event.shiftKey && !event.altKey) {
      const resetButton = findResetButton();
      if (clickIfVisible(resetButton)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        showToast('Reset');
        autoConfirmResetWithRetries();
      }
      return;
    }
  }

  function init() {
    if (!isInEditor()) {
      const observer = new MutationObserver(() => {
        if (isInEditor()) {
          window.addEventListener('keydown', handleHotkeys, true);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { subtree: true, childList: true });
      return;
    }

    window.addEventListener('keydown', handleHotkeys, true);
  }

  (function hookHistory() {
    const push = history.pushState;
    const replace = history.replaceState;
    history.pushState = function () { push.apply(this, arguments); setTimeout(init, 50); };
    history.replaceState = function () { replace.apply(this, arguments); setTimeout(init, 50); };
    window.addEventListener('popstate', () => setTimeout(init, 50));
  })();

  init();
})();


