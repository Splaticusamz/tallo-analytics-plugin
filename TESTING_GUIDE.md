# Testing Guide — Tallo Analytics Plugin

This guide provides comprehensive test scenarios to verify all features work correctly before deploying the plugin.

## Pre-Testing Setup

1. **Set up Google Sheet** following `SHEET_SETUP.md`
2. **Deploy Apps Script** and get the web app URL
3. **Install the plugin** in Figma for testing
4. **Configure API URL** in Settings tab

---

## Test 1: Google Sheets Integration

### Test 1.1: Taxonomy Loading

**Steps:**
1. Open Settings tab
2. Paste Apps Script URL
3. Click "Save & Load Taxonomy"

**Expected Results:**
- ✅ Success message appears
- ✅ Taxonomy counts update (74 screens, 75 events, etc.)
- ✅ Source shows "Loaded from Google Sheets"
- ✅ Dropdowns in Tag tab populate with data from Sheet

**Edge Cases:**
- Invalid URL → Should show error message
- Offline/unreachable URL → Should fall back to hardcoded data
- Empty Sheet → Should show counts as 0

### Test 1.2: Taxonomy Refresh

**Steps:**
1. Add a new screen to Google Sheet manually
2. Click "Refresh" in Settings tab

**Expected Results:**
- ✅ New screen appears in dropdown
- ✅ Count updates
- ✅ No duplicate entries

---

## Test 2: Custom Entries

### Test 2.1: Add Custom Screen

**Steps:**
1. Go to Tag tab
2. Click "+" next to Screen Name dropdown
3. Enter: `test__custom_screen`
4. Click Save

**Expected Results:**
- ✅ Modal closes
- ✅ Screen appears in dropdown immediately
- ✅ Screen is selected automatically
- ✅ Entry appears in Google Sheet's Custom tab
- ✅ Entry persists after closing and reopening plugin

### Test 2.2: Add Custom Event

**Steps:**
1. Click "+" next to Event dropdown
2. Enter:
   - Event: `test_button_clicked`
   - Category: Custom
   - Description: Test event
   - Props: `test_id,is_active`
3. Click Save

**Expected Results:**
- ✅ Event appears in dropdown
- ✅ Event is selected automatically
- ✅ Suggested props chips appear
- ✅ Entry in Google Sheet's Custom tab
- ✅ Can tag components with custom event

### Test 2.3: Duplicate Prevention

**Steps:**
1. Try to add a custom screen that already exists
2. Try to add a custom event that already exists

**Expected Results:**
- ✅ Error: "Entry already exists"
- ✅ No duplicate created

### Test 2.4: Delete Custom Entry

**Steps:**
1. Go to Settings tab → Manage Custom Entries
2. Click Delete on a custom screen
3. Confirm deletion

**Expected Results:**
- ✅ Entry removed from list
- ✅ Entry removed from Google Sheet
- ✅ Entry no longer in dropdown
- ✅ Existing tags using that entry still work (data preserved)

---

## Test 3: Screen Frame Assignment

### Test 3.1: Set Screen Frame

**Steps:**
1. Select a top-level frame
2. In Tag tab, enter screen name: `test__screen_frame`
3. Click "Set Screen"

**Expected Results:**
- ✅ Success notification
- ✅ Screen Frame assignment UI shows current screen name
- ✅ Frame marked with plugin data

### Test 3.2: Auto-Derived Screen Name

**Steps:**
1. Select a component inside the screen frame from Test 3.1
2. Open Tag tab

**Expected Results:**
- ✅ Green info box shows: "Inside screen frame: test__screen_frame"
- ✅ Screen Name dropdown is disabled/read-only
- ✅ Screen name is auto-filled
- ✅ When saving tag, screen_name is automatically set

### Test 3.3: Deep Nesting

**Steps:**
1. Create frame hierarchy: Frame A → Frame B → Frame C → Component
2. Set Frame A as screen: `test__nested_screen`
3. Select Component (inside Frame C)

**Expected Results:**
- ✅ Component correctly derives screen name from Frame A
- ✅ Info shows Frame A's name

### Test 3.4: No Screen Frame Warning

**Steps:**
1. Select a component NOT inside any screen frame
2. Open Tag tab

**Expected Results:**
- ✅ Screen Name dropdown is enabled
- ✅ No green info box
- ✅ User can manually select screen name

### Test 3.5: Scan Screen Frames

**Steps:**
1. Set 5+ frames as screens
2. Go to Audit tab
3. Click "Screens" button

**Expected Results:**
- ✅ List shows all screen frames
- ✅ Each shows frame name and screen name
- ✅ Clicking navigates to that frame

### Test 3.6: Clear Screen Frame

**Steps:**
1. Select a frame that is set as a screen
2. Click "Clear" button in screen frame UI

**Expected Results:**
- ✅ Screen assignment removed
- ✅ Components inside no longer auto-derive screen name

---

## Test 4: Copy/Paste Metadata

### Test 4.1: Copy Tag

**Steps:**
1. Tag a component with full metadata (event, description, properties)
2. Click "Copy Tag"

**Expected Results:**
- ✅ Toast: "Tag copied to clipboard!"
- ✅ Data stored in plugin storage

### Test 4.2: Paste Tag (Same Screen)

**Steps:**
1. Select another component in same screen frame
2. Click "Paste Tag"
3. Click "Save Tag"

**Expected Results:**
- ✅ Event, description, properties all pasted
- ✅ Screen name NOT pasted (auto-derived from frame)
- ✅ Toast: "Tag pasted! Remember to save."

### Test 4.3: Paste Tag (Different Screen)

**Steps:**
1. Copy tag from component in screen A
2. Select component in screen B
3. Paste tag

**Expected Results:**
- ✅ Event, description, properties pasted
- ✅ Screen name is screen B's name (not screen A's)

### Test 4.4: Paste with No Clipboard Data

**Steps:**
1. Close and reopen plugin (clears clipboard? — storage persists)
2. Click "Paste Tag" without copying first

**Expected Results:**
- ✅ Error: "No tag in clipboard" OR data persists from before

### Test 4.5: Persistence After Plugin Close

**Steps:**
1. Copy a tag
2. Close plugin
3. Reopen plugin
4. Paste tag

**Expected Results:**
- ✅ Paste works (clientStorage persists)

---

## Test 5: Version Control & History

### Test 5.1: Change Logging — Create

**Steps:**
1. Tag a new component
2. Check Google Sheet's History tab

**Expected Results:**
- ✅ New row in History
- ✅ Columns: Timestamp, Node ID, Node Name, Action = "create", New Value = JSON

### Test 5.2: Change Logging — Update

**Steps:**
1. Edit an existing tag
2. Change event from A to B
3. Save
4. Check History tab

**Expected Results:**
- ✅ New row with Action = "update"
- ✅ Old Value shows previous JSON
- ✅ New Value shows updated JSON

### Test 5.3: Change Logging — Delete

**Steps:**
1. Clear a tag from a component
2. Check History tab

**Expected Results:**
- ✅ New row with Action = "delete"
- ✅ Old Value shows deleted JSON
- ✅ New Value is empty

### Test 5.4: Sync All Tags to Sheet

**Steps:**
1. Tag 10+ components
2. Go to Audit tab
3. Click "Sync to Sheet"

**Expected Results:**
- ✅ Toast: "Syncing..."
- ✅ Success: "Synced X tags to Google Sheets!"
- ✅ New "Tags" tab created in Sheet (or updated if exists)
- ✅ All tags appear with full data

### Test 5.5: Offline Mode (API Unreachable)

**Steps:**
1. Disconnect internet or enter invalid API URL
2. Try to save a tag
3. Try to add custom entry

**Expected Results:**
- ✅ Tag saves locally (Figma pluginData works)
- ✅ Change logging fails silently (no user error)
- ✅ Custom entry shows error (API required)
- ✅ Taxonomy uses hardcoded fallback

---

## Test 6: Export JSON (Developer Handoff)

### Test 6.1: Export All Tags

**Steps:**
1. Tag 5+ components
2. Go to Audit tab
3. Click "Export JSON"

**Expected Results:**
- ✅ JSON copied to clipboard
- ✅ Format includes: node_name, node_id, node_type, event, screen_name, description, properties, tagged_at
- ✅ Can paste into tracking plan tools

### Test 6.2: Export Empty

**Steps:**
1. Clear all tags
2. Click "Export JSON"

**Expected Results:**
- ✅ Error: "No tagged components found."

---

## Test 7: Code Generation

### Test 7.1: Code with Standard Event

**Steps:**
1. Tag component with standard event `like_clicked`
2. Go to Code tab

**Expected Results:**
- ✅ React Native props code shows
- ✅ Segment payload shows
- ✅ Usage example shows
- ✅ All include correct event and screen names

### Test 7.2: Code with Custom Event

**Steps:**
1. Add custom event
2. Tag component with it
3. Go to Code tab

**Expected Results:**
- ✅ Code generates correctly
- ✅ Custom event name appears in code
- ✅ No errors or missing data

### Test 7.3: Copy Code Snippets

**Steps:**
1. Click "COPY" on each code block

**Expected Results:**
- ✅ Code copied to clipboard
- ✅ Button changes to "COPIED ✓"
- ✅ Toast notification

---

## Test 8: Volume & Performance

### Test 8.1: Tag 100+ Components

**Steps:**
1. Create a page with 100+ components
2. Tag all of them (use copy/paste to speed up)
3. Scan page

**Expected Results:**
- ✅ Scan completes in <5 seconds
- ✅ All 100+ show in audit list
- ✅ Plugin remains responsive
- ✅ No crashes or freezes

### Test 8.2: Large Property Sets

**Steps:**
1. Tag component with 20+ properties

**Expected Results:**
- ✅ All properties save
- ✅ UI remains usable (scrollable)
- ✅ Code generation works

### Test 8.3: Sync Large Dataset

**Steps:**
1. Tag 100+ components
2. Sync to Sheet

**Expected Results:**
- ✅ Sync completes (may take 10-30 seconds)
- ✅ All data appears in Sheet
- ✅ No data loss

---

## Test 9: Edge Cases

### Test 9.1: Special Characters

**Steps:**
1. Use screen name: `test__screen_with-dashes`
2. Use event: `test_event_with_unicode_émojis`
3. Use description with quotes: `"Test" description's 'quotes'`

**Expected Results:**
- ✅ All save correctly
- ✅ No JSON parsing errors
- ✅ Data intact after reload

### Test 9.2: Empty Fields

**Steps:**
1. Save tag with only event (no description, no properties)

**Expected Results:**
- ✅ Tag saves
- ✅ No errors

### Test 9.3: Very Long Description

**Steps:**
1. Enter 500+ character description

**Expected Results:**
- ✅ Description saves
- ✅ UI doesn't break
- ✅ Code generation works

### Test 9.4: Duplicate Property Keys

**Steps:**
1. Add property: `test_id`
2. Try to add another property: `test_id`

**Expected Results:**
- ⚠️ Behavior depends on implementation
- Ideally: Prevent duplicate OR overwrite

### Test 9.5: Component Deletion

**Steps:**
1. Tag a component
2. Delete the component from Figma
3. Scan page

**Expected Results:**
- ✅ Deleted component doesn't appear in audit
- ✅ No errors

---

## Test 10: Multi-User Scenarios

### Test 10.1: Concurrent Editing

**Setup:** Two users with same file and plugin

**Steps:**
1. User A tags component X
2. User B tags component Y
3. Both sync to Sheet

**Expected Results:**
- ✅ Both tags appear in Sheet
- ✅ No data loss or conflicts

### Test 10.2: Custom Entry Conflicts

**Steps:**
1. User A adds custom event `shared_event`
2. User B refreshes taxonomy
3. User B sees custom event

**Expected Results:**
- ✅ Custom entries sync across users
- ✅ No duplicate detection issues

---

## Test 11: Migration & Backward Compatibility

### Test 11.1: Existing Tags (Pre-Update)

**Steps:**
1. Create tags with old plugin version (if applicable)
2. Update to new version
3. Open plugin

**Expected Results:**
- ✅ Old tags still load
- ✅ No data loss
- ✅ Old tags can be edited with new features

### Test 11.2: Missing Screen Frames

**Steps:**
1. Tag component with manual screen name (no frame)
2. Later, set a screen frame on parent
3. Select component

**Expected Results:**
- ⚠️ Behavior depends on design:
  - Option A: Auto-derive overrides manual
  - Option B: Manual persists until re-saved
  - **Recommendation:** Auto-derive should always override

---

## Test 12: Plugin Reload & State Persistence

### Test 12.1: Plugin Close/Reopen

**Steps:**
1. Configure API URL
2. Add custom entries
3. Close plugin
4. Reopen plugin

**Expected Results:**
- ✅ API URL still configured
- ✅ Custom entries still in dropdowns
- ✅ Clipboard data persists

### Test 12.2: File Close/Reopen

**Steps:**
1. Tag components
2. Close Figma file
3. Reopen file
4. Open plugin

**Expected Results:**
- ✅ All tags still present (pluginData persists)
- ✅ Relaunch buttons work in Dev Mode

---

## Stress Test Checklist

Run all tests above, then:

- [ ] 100+ components tagged
- [ ] 20+ custom screens added
- [ ] 20+ custom events added
- [ ] 5+ screen frames set
- [ ] 10+ copy/paste operations
- [ ] 5+ syncs to Sheet
- [ ] Offline mode tested
- [ ] All code snippets copied
- [ ] All edge cases tested
- [ ] Multi-user scenario tested
- [ ] Plugin reloaded 10+ times
- [ ] No crashes, freezes, or data loss

---

## Bug Report Template

If you find issues, document them:

**Bug:** [Short description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** 

**Actual:** 

**Environment:**
- Figma version: 
- Browser (if web): 
- API URL configured: Yes/No

---

## Final Validation

Before deploying to production:

1. ✅ All critical features work
2. ✅ No data loss scenarios
3. ✅ Google Sheet integration functional
4. ✅ Offline mode degrades gracefully
5. ✅ Performance acceptable with large datasets
6. ✅ Documentation (README, SHEET_SETUP) up to date
7. ✅ Test with fresh Figma file
8. ✅ Test with existing file (migration)
