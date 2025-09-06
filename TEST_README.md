# RHAT Test Pages

This directory contains independent test pages for testing the RHAT (RaterHub Automated Tasks) extension's task detection workflow.

## Test Pages Overview

### `test-main.html`

- **Purpose**: Simulates the RaterHub main page where tasks are monitored
- **Features**:
  - Randomly displays an "Acquire if available" button (30% probability every 3 seconds)
  - Manual test controls to force show/hide the button
  - Simulates the extension's monitoring behavior
  - Button navigates to `test-task.html` when clicked

### `test-task.html`

- **Purpose**: Simulates a RaterHub task page after acquiring a task
- **Features**:
  - Simulates task page detection by the extension
  - Includes test controls for completion, errors, and reset
  - Demonstrates extension's task handling capabilities
  - Includes timer and progress simulation

## How to Use the Test Pages

### Prerequisites

1. **Load the Extension**: Make sure the RHAT extension is loaded in Chrome

   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

2. **Enable Test Features**: In the extension options:
   - Enable the extension
   - Set mode to "Alarm & acquire" for full workflow testing
   - Optionally enable "Show test button" for additional testing

### Testing Steps

#### 1. Test Task Detection (Main Page)

```bash
# Open the test main page
file:///path/to/extension/test-main.html
```

**What to Test:**

- ✅ Extension detects the page as a monitoring target
- ✅ Random button appearance triggers task detection
- ✅ Manual "Force Show Button" triggers immediate detection
- ✅ Alarm plays when task is detected
- ✅ Button click navigates to task page
- ✅ Extension continues monitoring after navigation

#### 2. Test Task Page Handling

```bash
# The main page will automatically navigate here when button is clicked
# Or open directly: file:///path/to/extension/test-task.html
```

**What to Test:**

- ✅ Extension detects this as a task page
- ✅ Alarm continues playing after page navigation
- ✅ Gmail notification is sent (if configured)
- ✅ Task completion handling works
- ✅ Error simulation (403) works
- ✅ Navigation back to main page

#### 3. Test Extension Features

- **Alarm & Click Mode**: Button click should navigate and continue workflow
- **Alarm Only Mode**: Should play alarm without auto-clicking
- **Mouse Movement**: Moving mouse should stop alarm
- **Settings Changes**: Should update behavior dynamically

## Test Scenarios

### Scenario 1: Full Workflow Test

1. Open `test-main.html`
2. Wait for or force the acquire button to appear
3. Verify alarm plays and button auto-clicks (if in alarm_and_click mode)
4. Verify navigation to `test-task.html`
5. Verify alarm continues on task page
6. Test task completion/error simulation

### Scenario 2: Error Handling Test

1. Open `test-task.html` directly
2. Use "Simulate Error (403)" button
3. Verify error handling and redirect to main page
4. Verify monitoring restarts on main page

### Scenario 3: Manual Testing

1. Use browser developer tools console to monitor extension logs
2. Check extension popup for status updates
3. Test different extension settings combinations
4. Verify desktop notifications appear

## Expected Extension Behavior

### On Main Page (`test-main.html`)

```
Console Logs:
- "RaterHub Monitor: Content script loaded"
- "RaterHub Monitor: Starting monitoring with Xs interval"
- "RaterHub Monitor: Tasks available!" (when button appears)
- "RaterHub Monitor: Auto-clicking acquire button immediately"
- "RaterHub Monitor: Button click executed successfully"
```

### On Task Page (`test-task.html`)

```
Console Logs:
- "RaterHub Monitor: On task/show page with taskIds, stopping monitoring"
- "RaterHub Monitor: Continuing alarm after page navigation"
- "RaterHub Monitor: Sending Gmail notification after page navigation"
```

## Troubleshooting

### Extension Not Loading on Test Pages

- Check that `manifest.json` includes the test page patterns:
  ```json
  "matches": [
    "file://*/*test-main.html",
    "file://*/*test-task.html"
  ]
  ```

### Button Not Being Detected

- Check console for "RaterHub Monitor: Searching for acquire button..."
- Verify the button has the correct text: "Acquire if available"
- Test with manual "Force Show Button" control

### Alarm Not Playing

- Check browser console for audio-related errors
- Verify extension has audio permissions
- Test with different sound settings in extension options

### Navigation Not Working

- Check that button click is registered in console
- Verify the href attribute points to correct test page
- Test manual navigation to `test-task.html`

## Test Page Features

### Test Controls

- **Force Show Button**: Immediately shows the acquire button
- **Force Hide Button**: Hides the acquire button
- **Check Status**: Shows current page state
- **Reset Test**: Resets all test states

### Visual Indicators

- 🟢 Green status: Tasks available
- 🔴 Red status: Error state
- ⏱️ Timer: Shows task progress
- 📊 Progress bar: Visual task completion indicator

### Console Logging

All test pages include comprehensive console logging:

- Page load events
- Button state changes
- User interactions
- Extension detection events

## Advanced Testing

### Browser Console Commands

```javascript
// Check extension status
console.log("Extension loaded:", window.raterHubMonitorLoaded);

// Manually trigger button detection
document.querySelector("#acquireButton")?.click();

// Check session storage
console.log("Session storage:", Object.keys(sessionStorage));
```

### Extension Debug Mode

Enable verbose logging by checking the extension's background page console:

1. Go to `chrome://extensions/`
2. Click "background page" link under RHAT extension
3. Monitor console for detailed extension logs

## File Structure

```
extension/
├── test-main.html      # Main page simulation
├── test-task.html      # Task page simulation
├── TEST_README.md      # This documentation
├── manifest.json       # Updated with test page patterns
└── [other extension files...]
```

## Support

If you encounter issues:

1. Check browser console for error messages
2. Verify extension is loaded and enabled
3. Test with different extension settings
4. Check that test pages are accessed via `file://` protocol
5. Ensure no other extensions are interfering

## Version History

- **v1.0**: Initial test pages with basic task detection simulation
- **v1.1**: Added comprehensive test controls and error simulation
- **v1.2**: Enhanced visual indicators and console logging
