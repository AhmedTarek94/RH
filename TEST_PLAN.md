# Theme Synchronization Test Plan

## Overview
This document outlines the testing procedures for verifying that theme synchronization works correctly between the options page, popup, and any other extension components.

## Test Environment
- Chrome browser with the extension loaded
- Options page (chrome://extensions -> RHAT -> Options)
- Popup (click extension icon in toolbar)
- Test page (test_theme_sync.html)

## Test Cases

### 1. Basic Theme Toggle Functionality
**Objective**: Verify that theme toggling works on individual pages
**Steps**:
1. Open Options page
2. Toggle theme switch - should change immediately
3. Open Popup
4. Toggle theme switch - should change immediately
5. Open test_theme_sync.html
6. Click "Toggle Theme" button - should change immediately

**Expected Results**:
- Each page should update its theme instantly when toggled
- No page reloads should be required

### 2. Cross-Page Synchronization
**Objective**: Verify that theme changes sync between pages
**Steps**:
1. Open Options page and Popup side by side
2. In Options page, toggle theme
3. Observe Popup - should update within 1 second
4. In Popup, toggle theme
5. Observe Options page - should update within 1 second
6. Open test_theme_sync.html
7. Toggle theme from any page - all should sync

**Expected Results**:
- All open extension pages should synchronize theme changes
- Changes should propagate within 1 second

### 3. Storage Persistence
**Objective**: Verify theme setting persists across browser sessions
**Steps**:
1. Set theme to Dark mode in Options page
2. Close all extension pages
3. Reopen Options page - should be Dark mode
4. Reopen Popup - should be Dark mode
5. Set theme to Light mode
6. Close and reopen pages - should be Light mode

**Expected Results**:
- Theme setting should persist across browser restarts
- All pages should load with correct theme

### 4. Error Handling
**Objective**: Verify graceful handling of communication failures
**Steps**:
1. Open only Options page (no other pages open)
2. Toggle theme - should work without errors
3. Open only Popup
4. Toggle theme - should work without errors
5. Check browser console for error messages

**Expected Results**:
- No console errors when pages are not open
- Graceful fallback to storage-based synchronization

### 5. Multiple Tabs Coordination
**Objective**: Verify theme sync works with multiple RaterHub tabs
**Steps**:
1. Open multiple RaterHub tabs
2. Open Options page and set theme
3. All RaterHub tabs should maintain consistent theme
4. Change theme from Popup
5. Verify all tabs update

**Expected Results**:
- All RaterHub tabs should respect theme settings
- Theme changes should propagate to all tabs

## Test Tools

### test_theme_sync.html
Use this page to:
- Monitor current theme status
- Test message passing between components
- Verify storage synchronization
- Simulate theme changes

### Browser Developer Tools
- Console: Monitor for errors and debug messages
- Network: Check message traffic
- Storage: Verify chrome.storage.sync values

## Expected Console Output
When theme synchronization is working correctly, you should see:
- `Background received message: themeChanged` in background script
- `Popup received message: themeChanged` in popup (if open)
- Theme change acknowledgments

## Troubleshooting

### Common Issues:
1. **Theme not syncing**: Check if background script is running
2. **Console errors**: Verify message handlers are properly implemented
3. **Storage not persisting**: Check chrome.storage.sync permissions

### Debug Steps:
1. Open browser console (F12)
2. Check for error messages
3. Verify background script is active
4. Test individual message passing
5. Check storage values

## Success Criteria
- ✅ Theme changes sync between all open extension pages within 1 second
- ✅ No page reloads required for theme updates
- ✅ Theme setting persists across browser sessions
- ✅ No console errors during normal operation
- ✅ Graceful handling of closed pages/communication failures

## Automated Testing (Future Enhancement)
Consider adding automated tests using:
- Puppeteer for browser automation
- Jest for unit testing
- Chrome extension testing frameworks
