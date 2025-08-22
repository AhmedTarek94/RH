# RHAT Real-time Synchronization Test Plan

## Overview
This document outlines the test plan for verifying the real-time synchronization functionality implemented across all RHAT extension components.

## Test Objectives
- Verify real-time theme synchronization between options page, popup, and background
- Test individual setting changes propagate instantly across all components
- Ensure storage change events are properly handled
- Validate cross-component message passing
- Confirm UI updates occur without page reloads

## Test Environment
- Chrome Browser (latest version)
- RHAT Extension loaded in developer mode
- All extension components (options.html, popup.html, background.js) active

## Test Cases

### 1. Theme Synchronization Test
**Objective:** Verify theme changes sync across all components in real-time

**Steps:**
1. Open options page (chrome://extensions → RHAT → Options)
2. Open popup (click extension icon)
3. In options page, toggle dark/light theme
4. Verify popup theme updates instantly without reload
5. Verify background script receives theme change notification
6. Repeat test from popup to options page

**Expected Results:**
- Theme changes propagate within 1 second
- No page reloads required
- All components maintain consistent theme state

### 2. Individual Setting Synchronization Test
**Objective:** Test real-time sync for individual settings

**Settings to Test:**
- `enabled` (monitoring toggle)
- `mode` (alarm_only/alarm_and_click)
- `refreshInterval` (0.5, 1, 2, 5, 10, 30, 60)
- `showTestButton`
- `enableDesktopNotifications`
- `enableMouseMovementDetection`
- `enableIncompleteTasksHandling`
- `enableErrorDetection`

**Steps:**
1. Open options page and popup side by side
2. Change one setting in options page
3. Verify popup updates instantly
4. Change same setting in popup
5. Verify options page updates instantly
6. Repeat for each setting

**Expected Results:**
- All setting changes propagate instantly (< 500ms)
- UI reflects current state without manual refresh
- No conflicting state between components

### 3. Storage Change Event Test
**Objective:** Verify storage.onChanged events are properly handled

**Steps:**
1. Open browser console for background script
2. Make setting changes from both options and popup
3. Verify console shows storage change notifications
4. Check that changes are broadcast to all components

**Expected Results:**
- Storage changes trigger proper event handling
- All components receive change notifications
- No missing or duplicate events

### 4. Cross-component Message Test
**Objective:** Test message passing between components

**Steps:**
1. Use test_sync_complete.html to send test messages
2. Verify messages are received by background script
3. Check that messages are properly routed to other components
4. Test response handling

**Expected Results:**
- Messages are delivered successfully
- Proper error handling for unavailable components
- Response mechanism works correctly

### 5. Performance Test
**Objective:** Ensure synchronization doesn't impact performance

**Steps:**
1. Rapidly toggle multiple settings
2. Monitor CPU and memory usage
3. Check for any UI lag or freezing
4. Test with multiple RaterHub tabs open

**Expected Results:**
- No significant performance impact
- UI remains responsive during rapid changes
- Memory usage remains stable

### 6. Error Handling Test
**Objective:** Verify robust error handling

**Steps:**
1. Simulate network issues (offline mode)
2. Test with corrupted storage data
3. Verify graceful degradation
4. Check error logging

**Expected Results:**
- Extension handles errors gracefully
- No crashes or unhandled exceptions
- Proper error messages in console

## Test Tools

### Manual Testing
1. **Options Page**: `chrome://extensions → RHAT → Options`
2. **Popup**: Click extension icon in toolbar
3. **Background Console**: `chrome://extensions → RHAT → background page`
4. **Test Page**: `test_sync_complete.html`

### Automated Testing
Use the test page to run comprehensive tests:
```javascript
// Run all tests
testThemeSync();
testSettingsSync();
testRealTimeUpdates();
testCrossComponent();
```

## Test Data

### Sample Test Values
```javascript
const testValues = {
  enabled: [true, false],
  mode: ['alarm_only', 'alarm_and_click'],
  refreshInterval: [0.5, 1, 2, 5, 10, 30, 60],
  darkThemeEnabled: [true, false]
};
```

## Success Criteria

- ✅ All theme changes sync within 1 second
- ✅ All setting changes sync within 500ms  
- ✅ No page reloads required for UI updates
- ✅ No performance degradation during rapid changes
- ✅ Proper error handling and logging
- ✅ Cross-component communication works reliably

## Known Issues to Test

1. **Race Conditions**: Rapid consecutive changes
2. **Offline Mode**: Sync behavior when offline
3. **Storage Limits**: Handling large sound files
4. **Multiple Tabs**: Consistency across multiple RaterHub tabs

## Test Execution

### Phase 1: Basic Functionality (Day 1)
- [ ] Theme synchronization
- [ ] Basic setting changes
- [ ] Storage event handling

### Phase 2: Advanced Testing (Day 2)  
- [ ] Performance under load
- [ ] Error conditions
- [ ] Cross-component messaging
- [ ] Multiple tab scenarios

### Phase 3: Regression Testing (Day 3)
- [ ] Verify no existing functionality broken
- [ ] Test edge cases
- [ ] Final validation

## Logging and Reporting

All tests should generate logs showing:
- Timestamp of changes
- Source component
- Target components
- Sync latency
- Any errors encountered

## Dependencies

- Chrome DevTools for debugging
- Network tab for monitoring messages
- Console for error tracking
- Performance panel for metrics

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sync delays | Medium | Optimize message handling |
| Message loss | High | Add retry mechanism |
| Performance issues | Medium | Monitor and optimize |
| Browser compatibility | Low | Test on multiple Chrome versions |

## Exit Criteria

Testing is complete when:
- All test cases pass
- No critical bugs remain
- Performance meets requirements
- Documentation is updated
- Code review completed
