# Google Sheet Setup Guide

This guide will help you set up the Google Sheet that powers the dynamic dropdown data for the Tallo Analytics Plugin.

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Tallo Analytics Taxonomy"

## Step 2: Create the Required Tabs

Create the following tabs (sheets) in your spreadsheet:

### Tab 1: Screens

**Columns:**
- A: `screen_name`

**Example data:**
```
screen_name
auth__splash
auth__sign_in
auth__create_account
home__main
career__hub
profile__main
```

**Setup:**
1. Paste the current 74 screens from `ui.html` lines 494-524
2. Each screen should be on a new row

### Tab 2: Events

**Columns:**
- A: `event`
- B: `category`
- C: `description`
- D: `props` (comma-separated)

**Example data:**
```
event               category            description                      props
app_opened          Lifecycle           App foregrounded                 
like_clicked        Social & Engagement Like post/comment                post_id,comment_id,is_liked
toggle_clicked      Form & Input        Toggle checkbox/switch           toggle_name,is_checked
```

**Setup:**
1. Copy the current 75 events from `ui.html` lines 526-602
2. Convert the JavaScript object format to CSV rows

### Tab 3: Properties

**Columns:**
- A: `property_name`
- B: `type`

**Example data:**
```
property_name       type
target_user_id      string
post_id             string
is_liked            boolean
item_index          integer
pill_type           enum
```

**Setup:**
1. Copy the property types from `ui.html` lines 604-632
2. Each property should be on a new row

### Tab 4: Custom

**Columns:**
- A: `type` (either "screen" or "event")
- B: `name`
- C: `category` (for events only)
- D: `description` (for events only)
- E: `props` (comma-separated, for events only)
- F: `created_at`

**Setup:**
1. Just create the header row
2. This tab will be populated automatically when users add custom entries from the plugin

### Tab 5: History

**Columns:**
- A: `timestamp`
- B: `file_name`
- C: `node_id`
- D: `node_name`
- E: `action`
- F: `field`
- G: `old_value`
- H: `new_value`

**Setup:**
1. Just create the header row
2. This tab will be populated automatically when users save/clear tags

### Tab 6: Tags (Auto-created)

**Note:** This tab is automatically created when you first use "Sync to Sheet"

**Columns:**
- A: `synced_at`
- B: `file_name`
- C: `figma_link` (clickable link to open component in Figma)
- D: `node_id`
- E: `node_name`
- F: `node_type`
- G: `event`
- H: `screen_name`
- I: `description`
- J: `properties` (JSON)
- K: `tagged_at`

**Purpose:**
- Complete backup of all analytics tags from the current Figma page
- Replaces all data on each sync (full snapshot)
- Click the Figma Link to jump directly to that component in Figma

### Tab 7: Screen Assignments (Auto-created)

**Note:** This tab is automatically created when you first use "Sync to Sheet"

**Columns:**
- A: `synced_at`
- B: `file_name`
- C: `figma_link` (clickable link to open screen frame in Figma)
- D: `node_id`
- E: `frame_name`
- F: `frame_type`
- G: `screen_name`
- H: `assigned` (checkbox, always checked for synced screens)

**Purpose:**
- Shows all screen frames that have been assigned screen names
- Click the Figma Link to jump directly to that screen frame in Figma
- Use the checkbox column to track review/QA status

## Step 3: Deploy the Apps Script

1. In your Google Sheet, click **Extensions > Apps Script**
2. Delete the default `Code.gs` content
3. Copy the entire contents of `appscript.js` from this repo
4. Paste it into the Apps Script editor
5. Save the project (Ctrl/Cmd + S) and name it "Tallo Analytics API"
6. Click **Deploy > New deployment**
7. Click the gear icon next to "Select type" and choose **Web app**
8. Configure:
   - **Description:** "Tallo Analytics Taxonomy API"
   - **Execute as:** Me
   - **Who has access:** Anyone
9. Click **Deploy**
10. Authorize the app (you may need to click "Advanced" and "Go to [Project Name] (unsafe)")
11. **Copy the Web App URL** — it will look like:
    ```
    https://script.google.com/macros/s/ABCD1234.../exec
    ```
12. Save this URL — you'll need it in the plugin's Settings tab

## Step 4: Test the API

Test that the API is working by visiting in your browser:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getTaxonomy
```

You should see a JSON response with your screens, events, and properties.

## Step 5: Configure the Plugin

1. Open the Tallo Analytics Plugin in Figma
2. Go to the **Settings** tab
3. Paste your Web App URL
4. Click **Save & Load Taxonomy**
5. The plugin should now load dropdown data from your Google Sheet

## Updating the Sheet

- Any changes you make to the Screens, Events, or Properties tabs will be reflected in the plugin after users reload the plugin or click "Refresh Taxonomy" in Settings
- Custom entries added by users will appear in the Custom tab
- All tag saves/clears will be logged in the History tab
- Use the "Sync to Sheet" button in the plugin's Audit tab to back up all tags to a new "Tags" tab

## Security Note

The Apps Script deployment is set to "Anyone" access, which means anyone with the URL can read your taxonomy data. This is by design to avoid OAuth complexity. However:

- The URL is not public — only people you share it with will have access
- No sensitive data should be in the taxonomy (it's just analytics event names)
- If you need to revoke access, simply disable the deployment in Apps Script

## Troubleshooting

**Q: The plugin shows "Failed to load taxonomy"**
- Check that you pasted the correct Web App URL (it should end with `/exec`)
- Make sure the deployment is set to "Anyone" access
- Test the URL in your browser with `?action=getTaxonomy` to verify it returns JSON

**Q: Custom entries aren't saving**
- Check that the Custom tab exists in your sheet
- Check the Apps Script execution logs (Extensions > Apps Script > Executions)

**Q: History isn't logging**
- Check that the History tab exists in your sheet
- Make sure the header row matches exactly
