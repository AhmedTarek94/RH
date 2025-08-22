# RHAT - RaterHub Automated Tasks

A Chrome extension developed by **Ahmed Tarek** that automates task monitoring and acquisition on RaterHub platform.

## Developer
**Ahmed Tarek** - Extension Developer & Maintainer

## Version History

### v1.7 - Real-time Synchronization Release
- **Instant Theme Sync**: Real-time theme synchronization between all extension components
- **Individual Setting Updates**: Targeted UI updates without page reloads
- **Enhanced Message Passing**: Robust cross-component communication
- **Performance Optimization**: Reduced CPU usage with efficient updates
- **Comprehensive Testing**: Complete test framework and documentation

### v1.5 - Enhanced Features
- **Desktop Notifications**: Browser notifications for task availability
- **Mouse Movement Detection**: Automatically stops alarm sounds when mouse movement is detected
- **Incomplete Tasks Handling**: Detects and handles incomplete tasks with popup notifications
- **Enhanced Error Detection**: Improved 403 error detection and handling
- **Theme System**: Light/Dark theme support with cross-page synchronization

## Features

- **Automatic Task Monitoring**: Continuously checks for available tasks
- **Smart Notifications**: Audio alerts and desktop notifications
- **Auto-Acquire Mode**: Automatically clicks "Acquire" when tasks are available
- **Customizable Settings**: Adjust refresh intervals, sound alerts, and more
- **Error Handling**: Automatically detects and handles 403 errors
- **Incomplete Task Detection**: Identifies and handles incomplete tasks
- **Mouse Movement Detection**: Stops alarms when user activity is detected
- **Theme Support**: Light/Dark theme with real-time synchronization

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

## Real-time Synchronization System

The extension now features advanced real-time synchronization developed by Ahmed Tarek:

- **Instant Theme Updates**: Theme changes apply immediately across all components
- **Individual Setting Sync**: Each setting update triggers targeted UI updates
- **Cross-Component Communication**: Robust message passing between options page, popup, and background
- **No Page Reloads**: All updates happen without requiring page refreshes
- **Performance Optimized**: Efficient updates with minimal CPU usage
- **Error Resilient**: Graceful handling of unavailable components

## Development

The extension consists of several key components developed by Ahmed Tarek:

- `manifest.json`: Extension configuration
- `background.js`: Background script for core functionality and message routing
- `content.js`: Content script injected into RaterHub pages
- `popup.js`: Popup interface logic with real-time synchronization
- `options.js`: Settings page logic with instant updates
- `styles.css`: Comprehensive styling with theme variables
- Test files for comprehensive validation

### Technical Implementation:
- Chrome runtime messaging for real-time communication
- Storage change detection and broadcasting
- Individual setting update handlers
- CSS custom properties for theme management
- Comprehensive error handling and logging

## Testing

Use the provided test files to verify functionality:
- `test_sync_complete.html`: Comprehensive real-time synchronization testing
- `test_theme_sync.html`: Theme synchronization validation
- Automated test suites for all features

## License

This project is developed by Ahmed Tarek for personal/educational use. Please ensure compliance with RaterHub's terms of service.

## Disclaimer

This extension is designed to assist with task monitoring but should be used responsibly. Always follow RaterHub's guidelines and terms of service. The developer (Ahmed Tarek) is not responsible for any misuse of this extension.
