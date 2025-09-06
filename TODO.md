# RHAT Test Pages Integration - TODO

## Overview

Test pages have been updated to simulate the complete RaterHub task detection workflow:

- test-main.html: Simulates main page with "Acquire if available" button
- test-task.html: Simulates task page with alarm and Gmail notification

## Changes Made

- [x] Updated test-main.html: Changed acquire link to button with "Acquire if available" text
- [x] Updated test-task.html: Added checkForPendingAlarm() call on page load
- [x] Updated content.js: Added test page recognition in handleUrlRedirectAndPageControl()
- [x] Manifest.json: Already includes test pages in content_scripts matches

## Testing Steps

- [ ] Load test-main.html in browser with RHAT extension enabled
- [ ] Click "Force Show Button" to display the acquire button
- [ ] Verify extension detects the "Acquire if available" button
- [ ] Verify button click navigates to test-task.html
- [ ] Verify alarm plays on test-task.html load (if alarm_and_click mode)
- [ ] Verify Gmail notification is sent (if Gmail enabled)
- [ ] Test both alarm_only and alarm_and_click modes
- [ ] Verify mouse movement stops alarm
- [ ] Test error scenarios (403 simulation)

## Expected Workflow

1. **Main Page (test-main.html)**:

   - Extension monitors for "Acquire if available" button
   - When found, stops monitoring and handles based on mode

2. **Task Page (test-task.html)**:
   - Page loads and calls checkForPendingAlarm()
   - Alarm plays (if pending from navigation)
   - Gmail notification sent (if pending from navigation)
   - Extension stops monitoring on task pages

## Verification Checklist

- [ ] Extension recognizes test pages as valid monitoring pages
- [ ] Acquire button detection works correctly
- [ ] Page navigation triggers alarm and Gmail notification
- [ ] Alarm playback works through offscreen document
- [ ] Mouse movement detection stops alarm
- [ ] Error handling works (403 simulation)
- [ ] Both extension modes work correctly

## Files to Verify

- [ ] content.js: Test page handling logic
- [ ] test-main.html: Acquire button implementation
- [ ] test-task.html: Alarm checking on load
- [ ] background.js: Task detection and alarm handling
- [ ] offscreen.js: Audio playback functionality

## Notes

- Test pages use file:// protocol, ensure extension permissions allow this
- Extension must be enabled and monitoring active for detection to work
- Check browser console for detailed logs during testing
- Use extension popup/options to verify settings and status
