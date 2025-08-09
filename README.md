## LeetCode Reset Hotkey Extension

Adds a single hotkey on LeetCode problem pages:

- Cmd+\\ (Mac): Reset code

Works on `leetcode.com`.

### Install locally

1. Open Chrome → `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked and select:
   - `binhleet`
4. Open a LeetCode problem page and press Cmd+\\ to reset.

If the hotkey doesn't work immediately, reload the tab once. It also handles SPA route changes.

### Customize

Edit `content.js`:

- Update `findResetButton` / `findResetConfirmButton`
- Change shortcut in `handleHotkeys`

Reload the extension after edits.
