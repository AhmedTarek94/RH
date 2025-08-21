# RHAT Extension Installation & Testing Guide

## Overview
This guide will help you install and test the refactored RHAT (RaterHub Automated Tasks) Chrome extension.

## Installation Steps

### 1. Load the Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the folder containing all the RHAT extension files
6. The extension should now appear in your extensions list

### 2. Verify Installation

- Look for the RHAT icon in your Chrome toolbar
- Click the icon to open the popup
- Click "Options" to open the settings page
- Verify all settings load correctly

## Testing the Refactored Features

### 1. Alarm Sound Testing

#### Test Default Alarm:
1. Open the Options page
2. Ensure "Sound Source" is set to "Default"
3. Click "Test Sound" button
4. You should hear the default alarm sound

#### Test Custom File:
1. Set "Sound Source" to "Local file"
2. Select an MP3 file from your computer
3. Click "Save Sound" then "Test Sound"
4. You should hear your custom sound

#### Test URL Sound:
1. Set "Sound Source" to "Online audio link"
2. Enter a direct MP3 URL (must end with .mp3)
3. Click "Save Sound" then "Test Sound"
4. You should hear the online sound

### 2. Monitoring Functionality Test

1. Navigate to `https://www.raterhub.com/evaluation/rater`
2. Enable the monitor using the toggle switch
3. Set a refresh interval (e.g., 5 seconds)
4. Choose between "Alarm only" or "Alarm & acquire" mode
5. The extension should start monitoring the page

### 3. Context Menu Test

1. Right-click anywhere on a webpage
2. You should see RHAT options in the context menu:
   - Enable/Disable Monitor
   - Change operation mode
   - Set refresh interval

### 4. Storage Persistence Test

1. Change various settings in the Options page
2. Close and reopen Chrome
3. Open the Options page again
4. Verify your settings are preserved

## Troubleshooting

### Common Issues:

#### Alarm Not Playing:
- Check browser sound settings
- Ensure the tab isn't muted
- Verify MP3 files are valid (for custom sounds)

#### Extension Not Loading:
- Check Chrome console for errors (`Ctrl+Shift+J`)
- Verify all files are present in the extension folder
- Ensure manifest.json is valid

#### Settings Not Saving:
- Check Chrome storage permissions
- Verify you're using a supported Chrome version

#### Context Menu Not Appearing:
- Reload the extension
- Check background.js for errors

### Debugging:

1. Open Chrome Developer Tools (`Ctrl+Shift+J`)
2. Check the Console tab for any error messages
3. For content script debugging, inspect the RaterHub page
4. For background script debugging, go to `chrome://extensions/` and click "Service Worker" next to RHAT

## Expected Behavior

### When Tasks Are Available:
- **Alarm Only Mode**: Sound plays, page refreshes stop
- **Alarm & Acquire Mode**: Sound plays, "Acquire if available" is clicked automatically

### Error Handling:
- 403 errors are detected and handled gracefully
- Incomplete tasks are properly identified
- Network issues with URL sounds are handled with fallbacks

## Performance Notes

- Lower refresh intervals (0.5s-2s) use more CPU resources
- Higher intervals (30s-60s) are more resource-friendly
- File-based sounds are stored locally for better performance
- URL sounds require internet connection

## Support

If you encounter issues:
1. Check this guide first
2. Review the browser console for error messages
3. Verify all files are properly loaded
4. Test with default settings first

## Success Indicators

- ✅ Extension loads without errors
- ✅ Options page displays correctly
- ✅ Alarm sounds play when tested
- ✅ Settings persist across browser restarts
- ✅ Context menu options work
- ✅ Monitoring functionality operates on RaterHub pages
