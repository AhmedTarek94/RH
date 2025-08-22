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
- **Theme Support**: Light/Dark theme with real-time synchronization

## New Features in v1.5

- **Desktop Notifications**: Browser notifications for task availability
- **Mouse Movement Detection**: Automatically stops alarm sounds when mouse movement is detected
- **Incomplete Tasks Handling**: Detects and handles incomplete tasks with popup notifications
- **Enhanced Error Detection**: Improved 403 error detection and handling
- **Theme System**: Light/Dark theme support with cross-page synchronization

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
- **Theme**: Light/Dark theme selection

## Theme System

The extension now features a comprehensive theme system:

- **Real-time Synchronization**: Theme changes sync instantly between all extension pages
- **No Page Reloads**: Theme updates without requiring page refreshes
- **Persistent Settings**: Theme preferences are saved across browser sessions
- **Cross-Page Consistency**: Options page, popup, and content pages maintain theme consistency

## Development

The extension consists of several key components:

- `manifest.json`: Extension configuration
- `background.js`: Background script for core functionality and message routing
- `content.js`: Content script injected into RaterHub pages
- `popup.js`: Popup interface logic with theme support
- `options.js`: Settings page logic with theme synchronization
- `styles.css`: Comprehensive styling with theme variables
- `test_theme_sync.html`: Theme synchronization testing page

### Theme Implementation Details:
- Uses CSS custom properties for theme variables
- Implements Chrome runtime messaging for real-time synchronization
- Includes graceful error handling for closed pages
- Features storage-based fallback synchronization

## Testing

Use `test_theme_sync.html` to verify theme synchronization functionality:
- Real-time theme updates between extension components
- Storage persistence testing
- Error handling verification
- Cross-page synchronization validation

## License

This project is for personal/educational use. Please ensure compliance with RaterHub's terms of service.

## Disclaimer

This extension is designed to assist with task monitoring but should be used responsibly. Always follow RaterHub's guidelines and terms of service.
