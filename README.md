# Tallo Analytics Tagger — Figma Plugin

A powerful Figma plugin for tagging UI components with analytics metadata, generating React Native code snippets, and syncing data to Google Sheets for team collaboration.

## 🚀 Features

### Core Features
- **Tag Components** — Attach analytics metadata (event, screen, description, properties) to any Figma layer
- **Code Generation** — Auto-generate React Native analytics props and Segment payloads
- **Developer Handoff** — Export structured JSON for tracking plans
- **Audit Tools** — Scan entire pages to find all tagged components

### New Features (v2.0)

#### 📊 Google Sheets Integration
- Connect to a Google Sheet (via Apps Script) to manage dropdown data dynamically
- No org API keys required — uses personal Google Apps Script deployment
- Automatic fallback to hardcoded data if offline

#### 🎨 Custom Entries
- Add custom screens and events on-the-fly
- Custom entries sync to Google Sheets and are available to all team members
- Delete custom entries from Settings tab

#### 🖼️ Screen Frame Assignment
- Mark top-level frames as "screens"
- Components inside screen frames **auto-derive their screen name**
- No more manual screen name entry for every component
- Scan all screen frames on the page

#### 📋 Copy/Paste Metadata
- Copy analytics metadata from one component
- Paste to another component (screen name auto-updates)
- Persist across plugin sessions

#### ☁️ Version Control & Backup
- **Change History** — Every save/clear is logged to Google Sheets with timestamp and old/new values
- **Sync to Sheet** — Bulk backup all tags from the current page to Google Sheets
- Three layers of data safety: Figma pluginData, Google Sheets backup, change history

---

## 📦 Installation

### Option 1: Development Mode (for testing)

1. Clone this repository
2. Open Figma → Plugins → Development → Import plugin from manifest
3. Select `manifest.json` from this folder

### Option 2: Published Plugin (coming soon)

Search for "Tallo Analytics Tagger" in the Figma Community plugins.

---

## ⚙️ Setup

### 1. Basic Setup (Works Offline)

The plugin works out of the box with hardcoded taxonomy data. No setup required.

### 2. Google Sheets Setup (Recommended)

For dynamic dropdown data, custom entries, and team sync:

1. **Create Google Sheet** — Follow the detailed guide in [`SHEET_SETUP.md`](SHEET_SETUP.md)
   - Create tabs: Screens, Events, Properties, Custom, History
   - Populate with your taxonomy data
   
2. **Deploy Apps Script**
   - Copy `appscript.js` to your Sheet's Apps Script editor
   - Deploy as web app with "Anyone" access
   - Copy the deployment URL

3. **Configure Plugin**
   - Open plugin in Figma
   - Go to **Settings** tab
   - Paste your Apps Script URL
   - Click "Save & Load Taxonomy"

---

## 🏷️ Usage

### Tagging a Component

1. Select a component in Figma
2. Open the plugin → **Tag** tab
3. Choose:
   - **Screen Name** (or auto-derived from screen frame)
   - **Event** (e.g., `like_clicked`)
   - **Description** (e.g., "Heart icon on post card")
   - **Event Properties** (e.g., `post_id`, `is_liked`)
4. Click **💾 Save Tag**

### Setting Up Screen Frames

1. Select a top-level frame (e.g., your "Home Screen" frame)
2. In the **Tag** tab, enter screen name: `home__main`
3. Click **Set Screen**
4. Now, all components inside this frame will auto-derive `screen_name: "home__main"`

### Adding Custom Entries

**Custom Screen:**
1. Go to **Tag** tab
2. Click **+** next to Screen Name dropdown
3. Enter: `my_feature__my_screen`
4. Click Save

**Custom Event:**
1. Click **+** next to Event dropdown
2. Fill in: name, category, description, props
3. Click Save

Custom entries sync to Google Sheets (if configured) and are available to all team members.

### Copy/Paste Tags

1. Tag a component fully
2. Click **📋 Copy Tag**
3. Select another component (even in a different screen)
4. Click **📥 Paste Tag**
5. Screen name auto-updates, everything else pastes
6. Click **💾 Save Tag**

### Viewing Code Snippets

1. Select a tagged component
2. Go to **Code** tab
3. Copy:
   - **Analytics Props** — Spread onto your component
   - **Segment Payload** — Full tracking event structure
   - **Usage Example** — Complete code example

### Auditing Tags

**Scan Tagged Components:**
1. Go to **Audit** tab
2. Click **🔍 Scan Tags**
3. View all tagged components on the page
4. Click any to navigate to it

**View Screen Frames:**
1. Go to **Audit** tab
2. Click **🖼️ Screens**
3. View all frames marked as screens
4. Click any to navigate to it

### Syncing to Google Sheets

1. Go to **Audit** tab
2. Click **☁️ Sync to Sheet**
3. All tags on the current page are pushed to Google Sheets
4. Check the "Tags" tab in your Sheet

### Exporting JSON

1. Go to **Audit** tab
2. Click **📥 Export JSON**
3. JSON is copied to clipboard
4. Paste into your tracking plan tool or documentation

---

## 📂 File Structure

```
tallo-analytics-plugin/
├── manifest.json           # Figma plugin manifest
├── code.js                 # Plugin backend (runs in Figma sandbox)
├── ui.html                 # Plugin UI (HTML + CSS + JS)
├── appscript.js            # Google Apps Script (deploy separately)
├── README.md               # This file
├── SHEET_SETUP.md          # Google Sheet setup guide
└── TESTING_GUIDE.md        # Comprehensive testing scenarios
```

---

## 🔧 Settings Tab

### API Configuration
- **Apps Script URL** — Your deployed Google Apps Script web app URL
- **Save & Load Taxonomy** — Fetches dropdown data from Google Sheets
- **Refresh** — Reload taxonomy without reconfiguring URL

### Taxonomy Status
- Shows counts of screens, events, custom screens, custom events
- Shows source (Google Sheets or hardcoded fallback)

### Manage Custom Entries
- View all custom screens and events
- Delete custom entries (syncs back to Sheet)
- Warning: Deleting an entry doesn't affect existing tags

---

## 🧪 Testing

See [`TESTING_GUIDE.md`](TESTING_GUIDE.md) for comprehensive test scenarios including:
- Volume testing (100+ components)
- Custom entries persistence
- Screen frame nesting (5+ levels deep)
- Offline fallback
- Edge cases (special characters, empty fields, etc.)
- Migration compatibility

---

## 🛡️ Data Safety & Version Control

### Three Layers of Protection

1. **Primary Storage** — Figma's `pluginData` API
   - Data is saved directly on Figma layers
   - Survives file saves, closes, and plugin updates
   - Visible in Dev Mode via "View Analytics Tag" button

2. **Backup Storage** — Google Sheets "Tags" tab
   - Click "Sync to Sheet" to push all tags
   - Acts as a backup and team-wide reference
   - Can be re-imported if needed

3. **Change History** — Google Sheets "History" tab
   - Every save/clear is logged with timestamp
   - Shows old and new values for rollback
   - Track who changed what and when

### Offline Mode

The plugin works offline:
- Tags save/load via Figma's pluginData (no network required)
- Dropdown data falls back to hardcoded taxonomy
- Change logging fails silently (doesn't interrupt workflow)
- Custom entries require API connection

---

## 🤝 Team Collaboration

### Workflow

1. **Designer tags components** in Figma using the plugin
2. **Custom entries sync** to Google Sheets (entire team sees them)
3. **Developer copies code** snippets from the Code tab
4. **Analytics PM audits** all tags and syncs to Sheet for tracking plan
5. **Team reviews** change history in Google Sheets

### Best Practices

- **Set screen frames** at the start of a new feature to avoid repetitive work
- **Use custom entries** sparingly — stick to standard taxonomy when possible
- **Sync to Sheet regularly** (weekly or before handoffs) for backup
- **Review change history** to track who made changes and why
- **Copy/paste tags** for similar components to speed up tagging

---

## 🔒 Security & Privacy

### Network Access
- Plugin only connects to Google Apps Script (script.google.com)
- Apps Script URL is not public — only people you share it with have access
- No sensitive data is sent (only analytics event names and metadata)

### API Deployment
- Apps Script is deployed as "Execute as: Me, Who has access: Anyone"
- "Anyone" means anyone with the URL — it's not publicly discoverable
- To revoke access, disable the deployment in Apps Script settings

### Data Storage
- Figma pluginData is private to your file
- Google Sheets access is controlled by you (Share settings)
- No third-party services or external databases

---

## 🐛 Troubleshooting

### "Failed to load taxonomy"
- Check that Apps Script URL is correct (should end with `/exec`)
- Verify deployment is set to "Anyone" access
- Test URL in browser with `?action=getTaxonomy` to see JSON response
- Check Google Sheet tabs exist and have correct names

### Custom entries not saving
- Verify Apps Script URL is configured
- Check Custom tab exists in your Google Sheet
- View Apps Script execution logs (Extensions → Apps Script → Executions)

### Screen name not auto-deriving
- Verify parent frame is set as a screen (check "Screens" in Audit tab)
- Component must be a descendant (any level) of the screen frame
- If moving components, re-select to refresh screen context

### Sync to Sheet fails
- Check API URL is configured
- Verify internet connection
- Large syncs (100+ tags) may take 30+ seconds

### Copy/Paste not working
- Verify you've copied a tag first (toast should confirm)
- Clipboard data persists across sessions via `figma.clientStorage`
- If issue persists, close and reopen plugin

---

## 📝 Taxonomy Format

### Screens
Format: `feature__screen` (double underscore)

Examples:
- `auth__sign_in`
- `home__main`
- `profile__edit`

### Events
Naming: `action_performed` (snake_case)

Examples:
- `like_clicked`
- `post_submitted`
- `profile_updated`

### Properties
Types: `string`, `integer`, `boolean`, `enum`

Examples:
- `post_id: string`
- `is_liked: boolean`
- `item_index: integer`

---

## 🚦 Roadmap

- [ ] Multi-page sync (currently only current page)
- [ ] Batch tagging (tag multiple components at once)
- [ ] Tag templates (save/reuse common tag patterns)
- [ ] Figma Variables integration
- [ ] Component variant support
- [ ] iOS/Android platform-specific tags
- [ ] Integration with analytics tools (Segment, Mixpanel, Amplitude)

---

## 🤔 FAQ

**Q: Do I need a Google Sheet to use this?**
A: No. The plugin works offline with hardcoded taxonomy. Google Sheets is optional for dynamic data and team sync.

**Q: Can I use a different spreadsheet service (Airtable, Notion)?**
A: The Apps Script is specific to Google Sheets, but you can adapt the API endpoints to work with any service that has a REST API.

**Q: What happens if I delete the Google Sheet?**
A: Your tags remain in Figma (stored on layers). You'll lose custom entries and sync capability, but existing tags are safe.

**Q: Can I use this for multiple projects?**
A: Yes. Either:
- Use the same Sheet with all projects (prefix screen/event names)
- Create separate Sheets per project and switch URLs in Settings

**Q: Does this work with Figma Variants?**
A: Yes, you can tag component variants individually. Each variant can have different analytics metadata.

**Q: What if two people add the same custom entry?**
A: The Apps Script prevents duplicates. The second person will get an error.

**Q: Can I version control the Google Sheet?**
A: Google Sheets has built-in version history (File → Version history). Plus, the History tab logs all changes.

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🙏 Credits

Built for Tallo by the Tallo Analytics team.

---

## 📧 Support

For issues or questions:
1. Check [`TESTING_GUIDE.md`](TESTING_GUIDE.md) for common scenarios
2. Review [`SHEET_SETUP.md`](SHEET_SETUP.md) for setup help
3. File an issue in the repository
