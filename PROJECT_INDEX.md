# RHAT Extension - Project Index

## Project Overview
**RaterHub Automated Tasks (RHAT)** - Chrome extension developed by Ahmed Tarek for monitoring RaterHub task availability with auto-refresh, notifications, and real-time synchronization.

## Quick Links
- [📋 Manifest Configuration](#manifest-configuration)
- [⚙️ Core Files](#core-files)
- [🎨 UI Components](#ui-components)
- [🔧 Utilities & Assets](#utilities--assets)
- [📚 Documentation](#documentation)
- [🧪 Testing](#testing)
- [🚀 Roadmap](#roadmap)

## Manifest Configuration

### `manifest.json`
- **Manifest Version**: 3
- **Permissions**: activeTab, tabs, storage, contextMenus, scripting
- **Host Permissions**: https://www.raterhub.com/*
- **Content Scripts**: Injected on RaterHub evaluation pages
- **Web Accessible Resources**: alarm.mp3

## Core Files

### Background Script
**File**: `background.js`
- **Purpose**: Main service worker for extension lifecycle
- **Features**:
  - Context menu creation and management
  - Tab monitoring and content script injection
  - 403 error detection and handling
  - Settings synchronization
  - Theme message routing and forwarding

### Content Script
**File**: `content.js`
- **Purpose**: Injected into RaterHub pages for monitoring
- **Features**:
  - Task availability detection
  - Auto-refresh functionality
  - Alarm sound playback
  - Incomplete task handling
  - Page state management

## UI Components

### Popup Interface
**Files**: `popup.html`, `popup.js`
- **Purpose**: Quick access toolbar popup
- **Features**:
  - Enable/disable toggle
  - Mode selection (alarm_only/alarm_and_click)
  - Refresh interval settings
  - Sound source configuration
  - Theme toggle with real-time sync
  - Options page link

### Options Page
**Files**: `options.html`, `options.js`
- **Purpose**: Comprehensive settings management
- **Features**:
  - Detailed configuration options
  - Sound file upload/URL input
  - Sound testing functionality
  - Advanced settings management
  - Theme system with cross-page synchronization

## Utilities & Assets

### Audio Resources
- `alarm.mp3` - Default alarm sound
- `audio_test.js` - Audio testing utilities

### Icons
- `icon.png` - Main extension icon
- `icons/icon16.png` - 16x16 toolbar icon
- `icons/icon48.png` - 48x48 extension icon
- `icons/icon128.png` - 128x128 store icon

### Styles
- `styles.css` - Extension styling with theme support

## Documentation

### Core Documentation
- `INSTALLATION_GUIDE.md` - Setup and testing instructions
- `REFACTOR_SUMMARY.md` - Recent refactoring changes and fixes
- `README.md` - Main project documentation

### Planning & Roadmap
- `UPGRADES.md` - Comprehensive feature roadmap
- `MILESTONES.md` - Implementation tracking and status
- `PROJECT_INDEX.md` - This file (project overview)
- `ENHANCED_UI_PLAN.md` - UI enhancement plans
- `THEME_INTEGRATION_SUMMARY.md` - Theme system documentation

### Implementation Tracking
- `TODO_SYNC_IMPLEMENTATION.md` - Theme synchronization progress
- `TEST_PLAN.md` - Testing procedures and validation
- `SYNC_IMPLEMENTATION_SUMMARY.md` - Real-time sync implementation details
- `SYNC_TEST_PLAN.md` - Synchronization testing procedures
- `REAL_TIME_SYNC_COMPLETE.md` - Complete sync feature documentation

## Testing

### Test Files
- `test_extension.html` - Extension functionality tests
- `test_file_storage.html` - Storage system tests
- `test_sync.html` - Synchronization tests
- `test_theme.html` - Theme functionality tests
- `test_theme_sync.html` - Theme synchronization testing
- `test_sync_complete.html` - Complete synchronization test suite
- `live_sync_test.html` - Live real-time synchronization testing

## Key Features

### Current Functionality
1. **Auto-monitoring**: Periodic checking for available tasks
2. **Dual Modes**: Alarm only vs Alarm + auto-acquire
3. **Custom Sounds**: Default, file upload, or URL sounds
4. **Error Handling**: 403 detection and automatic recovery
5. **Context Menu**: Right-click access to controls
6. **Settings Persistence**: Sync storage across devices
7. **Theme System**: Light/Dark themes with real-time sync

### Monitoring Logic
- Checks for "No tasks are currently available" message
- Detects "Acquire if available" buttons
- Handles incomplete tasks with user prompts
- Manages page redirects and error states

### Theme System
- Real-time synchronization between all extension pages
- No page reloads required for theme updates
- Persistent theme preferences across sessions
- Graceful error handling for closed pages

## Technical Architecture

### Storage System
- **Sync Storage**: Settings and preferences (cross-device)
- **Local Storage**: Large files (MP3 data)
- **Dual Strategy**: Reliability through redundancy

### Communication Flow
1. Background script manages extension lifecycle
2. Content scripts handle page-specific logic
3. Popup/Options UI for user configuration
4. Message passing between components
5. Real-time theme synchronization

### Error Handling
- Comprehensive audio playback fallbacks
- 403 error detection and recovery
- Network error handling for URL sounds
- Storage operation error recovery
- Theme synchronization fallback mechanisms

## Development Status

### Current Version: 1.7.0
- ✅ Core monitoring functionality
- ✅ Audio alert system
- ✅ Settings management
- ✅ Context menu controls
- ✅ Comprehensive error handling
- ✅ Theme system with real-time synchronization
- ✅ Individual setting updates without page reloads
- ✅ Performance optimization
- ✅ Complete testing framework

### Recent Improvements
- Audio playback reliability fixes
- Dual storage strategy implementation
- HTML structure cleanup
- Enhanced error handling
- Theme system implementation
- Real-time synchronization

## Dependencies

### Chrome APIs Used
- `chrome.storage` (sync and local)
- `chrome.tabs` and `chrome.scripting`
- `chrome.contextMenus`
- `chrome.runtime` messaging
- `chrome.action` for popup

### External Dependencies
- MP3 files for custom sounds
- Direct MP3 URLs for online sounds
- RaterHub website structure compatibility

## File Structure
```
RHAT_Extension/
├── manifest.json                 # Extension configuration (v1.7.0)
├── background.js                 # Service worker
├── content.js                    # Page monitoring
├── popup.html                    # Toolbar popup UI
├── popup.js                      # Popup functionality
├── options.html                  # Settings page
├── options.js                    # Options functionality
├── styles.css                    # Styling with themes
├── alarm.mp3                     # Default sound
├── icons/                        # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── INSTALLATION_GUIDE.md         # Setup and testing instructions
├── REFACTOR_SUMMARY.md           # Recent refactoring changes
├── UPGRADES.md                   # Comprehensive feature roadmap
├── MILESTONES.md                 # Progress tracking (v1.7.0)
├── PROJECT_INDEX.md              # This file (updated for v1.7.0)
├── ENHANCED_UI_PLAN.md           # UI enhancement plans
├── THEME_INTEGRATION_SUMMARY.md  # Theme system documentation
├── TODO_SYNC_IMPLEMENTATION.md   # Theme synchronization progress
├── TEST_PLAN.md                  # Testing procedures
├── SYNC_IMPLEMENTATION_SUMMARY.md # Real-time sync implementation
├── SYNC_TEST_PLAN.md             # Synchronization testing procedures
├── REAL_TIME_SYNC_COMPLETE.md    # Complete sync feature documentation
├── test_extension.html           # Extension functionality tests
├── test_file_storage.html        # Storage system tests
├── test_sync.html                # Synchronization tests
├── test_theme.html               # Theme functionality tests
├── test_theme_sync.html          # Theme synchronization testing
├── test_sync_complete.html       # Complete synchronization test suite
├── live_sync_test.html           # Live real-time synchronization testing
└── audio_test.js                 # Audio testing utilities
```

## Common Development Tasks

### Adding New Features
1. Update `UPGRADES.md` with feature description
2. Add to `MILESTONES.md` with status tracking
3. Implement in relevant core files
4. Update UI components if needed
5. Test thoroughly
6. Update documentation

### Testing Procedures
1. Load extension in Chrome (developer mode)
2. Test all sound sources (default, file, URL)
3. Verify monitoring functionality on RaterHub
4. Check error handling scenarios
5. Test settings persistence
6. Verify cross-device sync (if applicable)
7. Test theme synchronization

### Debugging Tips
- Check Chrome extension console for errors
- Use content script logging on RaterHub pages
- Test audio playback in isolation
- Verify storage operations
- Monitor network requests for URL sounds
- Test theme synchronization with test pages

## Browser Compatibility

### Currently Supported
- ✅ Google Chrome (primary)
- ⏳ Firefox (planned)
- ⏳ Microsoft Edge (planned)
- ⏳ Safari (planned)

### Requirements
- Chrome Manifest V3 support
- Web Audio API support
- Storage API access
- Scripting permissions

## Performance Considerations

### Resource Usage
- Lower refresh intervals = higher CPU usage
- File-based sounds = local storage usage
- URL sounds = network requests
- Multiple tabs = increased memory usage
- Theme synchronization = minimal message overhead

### Optimization Tips
- Use appropriate refresh intervals
- Compress custom sound files
- Monitor storage usage
- Test on lower-end devices

## Security & Privacy

### Data Handling
- Settings stored in encrypted sync storage
- File data in local storage
- No personal data collection
- Minimal permissions required

### User Privacy
- No tracking or analytics
- Optional data sharing for improvements
- Clear privacy policy compliance

## Version History

### v1.7.0 - Current
- Real-time synchronization across all extension components
- Individual setting updates without page reloads
- Enhanced cross-component communication
- Performance optimization and reduced CPU usage
- Comprehensive testing framework
- Developer attribution (Ahmed Tarek)

### v1.5.0
- Theme system implementation
- Real-time synchronization foundation
- Enhanced UI components
- Basic testing framework

### v1.0.0
- Initial stable release
- Core monitoring functionality
- Basic audio alerts
- Settings management

### Future Versions
- v2.0.0: Major feature overhaul
- Cross-browser compatibility
- Advanced analytics and reporting

## Contributing Guidelines

### Code Standards
- Consistent JavaScript style
- Comprehensive error handling
- Clear documentation comments
- Regular testing procedures

### Documentation Updates
- Keep all MD files current
- Update this index with new features
- Maintain change logs
- Track milestone progress

### Testing Requirements
- Test all new features thoroughly
- Verify backward compatibility
- Check cross-browser functionality
- Validate error handling
- Test theme synchronization

---

*This index file was automatically generated and should be updated whenever significant changes occur to the project structure or functionality.*
