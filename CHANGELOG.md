# Changelog

All notable changes to the Tallo Analytics Plugin will be documented in this file.

## [2.0.0] - 2026-02-08

### 🚀 Major Features Added

#### Google Sheets Integration
- Connect to Google Sheets via Apps Script for dynamic dropdown data
- Automatic fallback to hardcoded data when offline
- No org API keys required - uses personal Google Apps Script deployment
- New Settings tab for API configuration
- Real-time taxonomy status display (screens, events, custom entries count)

#### Custom Dropdown Entries
- Add custom screens with format validation (`feature__screen`)
- Add custom events with category, description, and suggested properties
- Custom entries sync to Google Sheets automatically
- Team-wide availability (all users see custom entries)
- Duplicate prevention
- Delete custom entries from Settings tab with sync-back to Sheet

#### Screen Frame Assignment
- Mark top-level frames as "screens" with assigned screen names
- Components inside screen frames auto-derive their screen name
- Eliminates repetitive manual screen name entry
- Works with deep nesting (unlimited levels)
- Visual indicators showing parent screen frame
- Scan all screen frames in Audit tab
- Set/Clear screen frame UI in Tag form

#### Copy/Paste Metadata
- Copy analytics tags from one component
- Paste to another component (even across different screens)
- Screen name automatically updates based on destination
- Clipboard persists across plugin sessions
- Copy/Paste buttons in Tag form

#### Version Control & Backup
- **Change History**: Every save/clear logged to Google Sheets with timestamp, old/new values
- **Sync to Sheet**: Bulk backup all tags from current page to Google Sheets
- Three layers of data safety:
  1. Figma pluginData (primary storage)
  2. Google Sheets Tags tab (backup)
  3. Google Sheets History tab (change log)
- New "Sync to Sheet" button in Audit tab

### 🔧 Improvements

#### UI Enhancements
- New Settings tab with API configuration and taxonomy management
- Screen frame assignment UI with current status display
- Copy/Paste buttons in Tag form
- "+" buttons next to dropdowns for adding custom entries
- Modal dialog for creating custom entries
- Improved Audit tab with separate "Scan Tags" and "Screens" buttons
- Taxonomy status display showing source and counts

#### Code Changes
- Added `SCREEN_FRAME_KEY` constant for screen frame storage
- New `findScreenFrame()` function for parent chain traversal
- Extended message handlers for all new features
- Change logging on every save/clear operation
- API URL save/load using `figma.clientStorage`
- Screen assignment get/set/clear handlers

#### Network Access
- Enabled network access for `script.google.com` and `script.googleusercontent.com`
- Apps Script middleware for secure Google Sheets communication

### 📚 Documentation

#### New Files
- `appscript.js` - Complete Google Apps Script implementation
- `SHEET_SETUP.md` - Detailed Google Sheet setup guide
- `TESTING_GUIDE.md` - Comprehensive testing scenarios (12 test suites)
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `CHANGELOG.md` - This file

#### Updated Files
- `README.md` - Complete rewrite with all new features documented
- `manifest.json` - Added network access configuration

### 🔐 Security

- Apps Script uses "Anyone with link" access (not publicly discoverable)
- No sensitive data transmitted (only analytics taxonomy and metadata)
- All data stored locally in Figma unless explicitly synced
- Google Sheets access controlled by Sheet owner's Share settings

### ⚡ Performance

- Taxonomy loading is asynchronous (non-blocking UI)
- Change logging fails silently if offline (doesn't interrupt workflow)
- Hardcoded fallback ensures plugin works without network
- Optimized for large datasets (100+ components tested)

### 🐛 Bug Fixes

- Screen Name dropdown now correctly disables when inside screen frame
- Screen frame input field populates when editing existing screen assignment
- Custom entry modal closes on successful save
- Duplicate custom entries properly prevented
- Toast notifications show for all user actions

### ⚠️ Breaking Changes

- None - Plugin remains backward compatible with existing tags
- Old tags continue to work without any migration needed
- Screen frames are opt-in (components without screen frames work as before)

### 🔄 Migration Notes

- Existing tags will continue to function normally
- No data migration required
- To use new features, simply configure API URL in Settings
- Custom entries and screen frames are additive features

---

## [1.0.0] - Initial Release

### Features
- Tag components with analytics metadata
- Select from predefined screens and events (hardcoded)
- Add event properties with types
- Generate React Native code snippets
- Generate Segment payloads
- Scan page for tagged components
- Export all tags as JSON
- View tags in Dev Mode via relaunch button

### Components
- Tag tab for component tagging
- Code tab for snippet generation
- Audit tab for page scanning and export
- Hardcoded taxonomy (74 screens, 75 events)

---

## Version Numbering

This plugin follows [Semantic Versioning](https://semver.org/):
- **Major** (X.0.0) - Breaking changes or major feature overhauls
- **Minor** (0.X.0) - New features, backward compatible
- **Patch** (0.0.X) - Bug fixes, backward compatible
