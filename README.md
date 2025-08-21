# RHAT - RaterHub Automated Tasks

A Chrome extension that automates task monitoring and acquisition on RaterHub platform.

## Features

- **Automatic Task Monitoring**: Continuously checks for available tasks
- **Smart Notifications**: Audio alerts and desktop notifications
- **Auto-Acquire Mode**: Automatically clicks "Acquire" when tasks are available
- **Customizable Settings**: Adjust refresh intervals, sound alerts, and more
- **Error Handling**: Automatically detects and handles 403 errors
- **Incomplete Task Detection**: Identifies and handles incomplete tasks
- **Mouse Movement Detection**: Stops alarms when user activity is detected

## New Features in v1.5

- **Desktop Notifications**: Browser notifications for task availability
- **Mouse Movement Detection**: Automatically stops alarm sounds when mouse movement is detected
- **Incomplete Tasks Handling**: Detects and handles incomplete tasks with popup notifications
- **Enhanced Error Detection**: Improved 403 error detection and handling

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your toolbar

## Usage

1. Navigate to `https://www.raterhub.com/evaluation/rater`
2. Click the RHAT extension icon to open the popup
3. Configure your settings (refresh interval, mode, etc.)
4. Enable monitoring using the toggle switch
5. The extension will automatically monitor for tasks

## Settings

Access the settings page by right-clicking the extension icon and selecting "Options" or by navigating to the extension options in Chrome.

### Available Settings:
- **Monitor Status**: Enable/disable monitoring
- **Operation Mode**: Alarm only or Alarm & acquire
- **Refresh Interval**: How often to check for tasks (1s to 60s)
- **Alert Sound**: Customize alert sounds (default, file, or URL)
- **Desktop Notifications**: Enable browser notifications
- **Mouse Movement Detection**: Stop alarm on mouse movement
- **Incomplete Tasks Handling**: Handle incomplete tasks
- **Enhanced Error Detection**: Improved error detection

## Development

The extension consists of several key components:

- `manifest.json`: Extension configuration
- `background.js`: Background script for core functionality
- `content.js`: Content script injected into RaterHub pages
- `popup.js`: Popup interface logic
- `options.js`: Settings page logic
- `styles.css`: Styling for popup and options pages

## License

This project is for personal/educational use. Please ensure compliance with RaterHub's terms of service.

## Disclaimer

This extension is designed to assist with task monitoring but should be used responsibly. Always follow RaterHub's guidelines and terms of service.
