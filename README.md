# RHAT - RaterHub Automated Tasks

A Chrome extension developed by **Ahmed Tarek** that automates task monitoring, filtering, and analytics on RaterHub platform.

## Developer

**Ahmed Tarek** - Extension Developer & Maintainer

## Version History

### v1.8.2.3 - Stability and Performance Improvements

- **Code Optimization**: Streamlined file handling and validation logic
- **Enhanced Stability**: Improved error handling and resource management
- **Performance Tuning**: Optimized memory usage and processing efficiency
- **Bug Fixes**: Resolved potential storage quota issues and validation edge cases
- **Code Cleanup**: Removed redundant validation layers for better maintainability

### v1.8.2 - Analytics and Filters Implementation

- **Complete Analytics System**: Comprehensive task tracking and performance analytics
- **Robust Task Data Extraction**: Advanced parsing of task type, duration, and reward information
- **Enhanced Filtering**: Complete implementation of all filter functions with custom rule evaluation
- **Error Handling**: Comprehensive error handling with graceful degradation
- **Performance Monitoring**: Real-time CPU and memory usage tracking

### v1.8.0 - Advanced Filtering System

- **Advanced Task Filtering**: Comprehensive filtering system for task selection
- **Multiple Filter Types**: Task type, duration, time range, days of week, and reward filtering
- **Custom Rules**: Support for custom filtering rules and presets
- **Preset Management**: Save and load filter configurations
- **Real-time Filter Application**: Filters applied during task monitoring

### v1.7.2 - Theme Enhancements

- **Dark Theme Default**: Set dark theme as default for better user experience
- **Improved Visibility**: Enhanced radio button visibility in dark mode
- **Default Settings Optimization**: Optimized default settings for better performance

### v1.7.1 - UI Improvements

- **Settings Layout Refactor**: Moved Alert Sound card into settings-grid for better organization and consistency
- **Enhanced User Experience**: Improved visual hierarchy and grouping of related settings

### v1.7 - Real-time Synchronization Release

- **Instant Theme Sync**: Real-time theme synchronization between all extension components
- **Individual Setting Updates**: Targeted UI updates without page reloads
- **Enhanced Message Passing**: Robust cross-component communication
- **Performance Optimization**: Reduced CPU usage with efficient updates

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
- **Advanced Task Filtering**: Comprehensive filtering system with custom rules
- **Performance Analytics**: Track task completion rates, earnings, and performance metrics
- **Customizable Settings**: Adjust refresh intervals, sound alerts, and more
- **Error Handling**: Automatically detects and handles 403 errors
- **Incomplete Task Detection**: Identifies and handles incomplete tasks
- **Mouse Movement Detection**: Stops alarms when user activity is detected
- **Theme Support**: Light/Dark theme with real-time synchronization
- **Preset Management**: Save and load filter configurations
- **Data Export**: Export analytics data to CSV and JSON formats

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
- **Task Filtering**: Advanced filtering options for task selection
- **Filter Presets**: Save and load filter configurations
- **Analytics Settings**: Configure data retention, performance tracking, and auto-export

## Analytics System

The extension now includes a comprehensive analytics system:

- **Task Tracking**: Monitor tasks found, acquired, completed, and failed
- **Performance Metrics**: Track acquisition rates, completion rates, and success rates
- **Earnings Estimation**: Calculate total earnings, hourly rates, and per-task averages
- **Time Analysis**: Monitor task patterns by hour and session duration
- **Performance Monitoring**: Track CPU and memory usage during operation
- **Data Export**: Export analytics data to CSV and JSON formats
- **Customizable Retention**: Configure data retention periods (7-90 days)

## Real-time Synchronization System

The extension features advanced real-time synchronization developed by Ahmed Tarek:

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
- `options.js`: Settings page logic with instant updates and analytics dashboard
- `styles.css`: Comprehensive styling with theme variables
- `filters.js`: Advanced filtering system for task selection
- `analytics.js`: Comprehensive analytics and performance tracking system

### Technical Implementation:

- Chrome runtime messaging for real-time communication
- Storage change detection and broadcasting
- Individual setting update handlers
- CSS custom properties for theme management
- Comprehensive error handling and logging
- Advanced task data extraction algorithms
- Performance monitoring with Chrome APIs
- Data export functionality with Blob creation

## Testing

The extension includes comprehensive functionality validation:

- **Code Validation**: Syntax and logic verification for all implementations
- **Integration Testing**: Compatibility testing between components
- **Functionality Verification**: Parameter handling and edge case testing
- **Error Handling**: Comprehensive error scenario testing
- **Performance Testing**: Memory and CPU usage monitoring

## License

This project is developed by Ahmed Tarek for personal/educational use. Please ensure compliance with RaterHub's terms of service.

## Disclaimer

This extension is designed to assist with task monitoring but should be used responsibly. Always follow RaterHub's guidelines and terms of service. The developer (Ahmed Tarek) is not responsible for any misuse of this extension.
