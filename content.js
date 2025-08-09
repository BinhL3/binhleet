(() => {
  const mac = navigator.platform.toUpperCase().includes('MAC');

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

  function showToast(text) {
    try {
      const toast = document.createElement('div');
      toast.textContent = text;
      toast.style.position = 'fixed';
      toast.style.right = '16px';
      toast.style.bottom = '16px';
      toast.style.zIndex = '2147483647';
      toast.style.background = 'rgba(32,33,36,0.95)';
      toast.style.color = 'white';
      toast.style.padding = '8px 10px';
      toast.style.borderRadius = '6px';
      toast.style.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial';
      toast.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.transition = 'opacity 200ms ease';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 220);
      }, 800);
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


