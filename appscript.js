// Tallo Analytics Plugin — Google Apps Script
// Deploy this as a web app with "Execute as: Me" and "Who has access: Anyone"
// Then paste the deployment URL into the plugin's Settings tab

// Configuration: Update these constants to match your Sheet
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SCREENS_TAB = "Screens";
const EVENTS_TAB = "Events";
const PROPERTIES_TAB = "Properties";
const CUSTOM_TAB = "Custom";
const HISTORY_TAB = "History";

// API Authentication Token - Change this to a secure random token
const API_TOKEN = "tallo_analytics_plugin_secure_token_2024_xyz789";

// ─── Helper Functions ────────────────────────────────────────────────────────

// Append a row and reset formatting so it doesn't inherit header styles
function appendRowClean(sheet, rowData) {
  sheet.appendRow(rowData);
  const newRow = sheet.getLastRow();
  const range = sheet.getRange(newRow, 1, 1, rowData.length);
  range.setFontWeight("normal")
       .setFontStyle("normal")
       .setBackground(null)
       .setFontColor(null)
       .setFontSize(10);
}

// Issue 6: Auto-create sheets with headers if they don't exist
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
    }
  }
  
  return sheet;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

function doGet(e) {
  // Check for API token
  const token = e.parameter.token;
  if (token !== API_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Unauthorized: Invalid or missing API token"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = e.parameter.action;
  
  if (action === "getTaxonomy") {
    return getTaxonomy();
  }
  
  // Default response with API info
  return ContentService.createTextOutput(JSON.stringify({
    name: "Tallo Analytics Plugin API",
    version: "2.0.0",
    status: "ready",
    endpoints: {
      getTaxonomy: "GET ?action=getTaxonomy&token=YOUR_TOKEN - Returns all dropdown data",
      addCustom: "POST {action: 'addCustom', token: 'YOUR_TOKEN', type: 'screen'|'event', ...}",
      deleteCustom: "POST {action: 'deleteCustom', token: 'YOUR_TOKEN', type: 'screen'|'event', name: '...'}",
      logChange: "POST {action: 'logChange', token: 'YOUR_TOKEN', ...}",
      syncTags: "POST {action: 'syncTags', token: 'YOUR_TOKEN', tags: [...]}"
    },
    testUrl: e.parameter.action === undefined 
      ? "Add ?action=getTaxonomy&token=YOUR_TOKEN to this URL to test"
      : "Invalid action: " + action
  }, null, 2)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Check for API token
    const token = data.token;
    if (token !== API_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Unauthorized: Invalid or missing API token"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = data.action;
    
    if (action === "addCustom") {
      return addCustomEntry(data);
    }
    
    if (action === "deleteCustom") {
      return deleteCustomEntry(data);
    }
    
    if (action === "logChange") {
      return logChange(data);
    }
    
    if (action === "syncTags") {
      return syncTags(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      error: "Invalid action"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    // Issue 4: Add error logging in doPost
    Logger.log(err);
    Logger.log(err.stack);
    return ContentService.createTextOutput(JSON.stringify({
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Get Taxonomy ────────────────────────────────────────────────────────────

function getTaxonomy() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Read Screens tab (columns: screen_name, category) - auto-create if missing
  const screensSheet = getOrCreateSheet(SCREENS_TAB, ["screen_name", "category"]);
  const screensData = screensSheet.getDataRange().getValues();
  const screens = screensData.slice(1)
    .filter(row => row[0] && String(row[0]).trim()) // Has screen name and it's not empty
    .map(row => ({
      name: String(row[0]).trim(),
      category: row[1] ? String(row[1]).trim() : "Other"
    }));
  
  // Read Events tab (columns: event, category, description, props) - auto-create if missing
  const eventsSheet = getOrCreateSheet(EVENTS_TAB, ["event", "category", "description", "props"]);
  const eventsData = eventsSheet.getDataRange().getValues();
  const events = eventsData.slice(1).map(row => ({
    event: row[0],
    cat: row[1],
    desc: row[2] || "",
    props: row[3] && String(row[3]).trim() ? String(row[3]).split(",").map(p => p.trim()) : []
  })).filter(e => e.event);
  
  // Read Properties tab (columns: property_name, type) - auto-create if missing
  const propsSheet = getOrCreateSheet(PROPERTIES_TAB, ["property_name", "type"]);
  const propsData = propsSheet.getDataRange().getValues();
  const propertyTypes = {};
  propsData.slice(1).forEach(row => {
    if (row[0]) propertyTypes[row[0]] = row[1] || "string";
  });
  
  // Read Custom tab (columns: type, name, category, description, props) - auto-create if missing
  const customSheet = getOrCreateSheet(CUSTOM_TAB, ["type", "name", "category", "description", "props", "created_at"]);
  const customData = customSheet.getDataRange().getValues();
  const customScreens = [];
  const customEvents = [];
  
  customData.slice(1).forEach(row => {
    if (row[0] === "screen" && row[1] && String(row[1]).trim()) {
      customScreens.push({
        name: String(row[1]).trim(),
        category: "Custom",
        isCustom: true
      });
    } else if (row[0] === "event" && row[1]) {
      customEvents.push({
        event: row[1],
        cat: row[2] || "Custom",
        desc: row[3] || "",
        props: row[4] && String(row[4]).trim() ? String(row[4]).split(",").map(p => p.trim()) : [],
        isCustom: true
      });
    }
  });
  
  const result = {
    screens: [...screens, ...customScreens],
    events: [...events, ...customEvents],
    propertyTypes: propertyTypes,
    customScreens: customScreens.map(s => s.name),
    customEvents: customEvents
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Add Custom Entry ────────────────────────────────────────────────────────

function addCustomEntry(data) {
  // Auto-create Custom tab if missing
  const customSheet = getOrCreateSheet(CUSTOM_TAB, ["type", "name", "category", "description", "props", "created_at"]);
  
  // Check if entry already exists
  const existingData = customSheet.getDataRange().getValues();
  const exists = existingData.slice(1).some(row => 
    row[0] === data.type && row[1] === data.name
  );
  
  if (exists) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Entry already exists"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Append new row: type, name, category, description, props
  const props = data.props ? data.props.join(", ") : "";
  appendRowClean(customSheet, [
    data.type,
    data.name,
    data.category || "",
    data.description || "",
    props,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Delete Custom Entry ─────────────────────────────────────────────────────

function deleteCustomEntry(data) {
  // Auto-create Custom tab if missing (though this is unlikely for delete)
  const customSheet = getOrCreateSheet(CUSTOM_TAB, ["type", "name", "category", "description", "props", "created_at"]);
  
  const allData = customSheet.getDataRange().getValues();
  
  // Find row to delete (skip header)
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.type && allData[i][1] === data.name) {
      customSheet.deleteRow(i + 1); // +1 because sheet rows are 1-indexed
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: "Entry not found"
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Log Change ──────────────────────────────────────────────────────────────

function logChange(data) {
  // Auto-create History tab if missing
  const historySheet = getOrCreateSheet(HISTORY_TAB, ["Timestamp", "File Name", "Node ID", "Node Name", "Action", "Field", "Old Value", "New Value"]);
  
  // Append: Timestamp | File Name | Node ID | Node Name | Action | Field | Old Value | New Value
  appendRowClean(historySheet, [
    new Date().toISOString(),
    data.fileName || "Unknown",
    data.nodeId || "",
    data.nodeName || "",
    data.action || "",
    data.field || "",
    data.oldValue || "",
    data.newValue || ""
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Sync Tags ───────────────────────────────────────────────────────────────

function syncTags(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fileKey = data.fileKey || "";
  
  // Log to help debug
  Logger.log("Received fileKey: " + fileKey);
  Logger.log("Received tags count: " + (data.tags ? data.tags.length : 0));
  Logger.log("Received screenFrames count: " + (data.screenFrames ? data.screenFrames.length : 0));
  
  // Issue 5: Handle optional changes array for history logging
  const changes = data.changes || [];
  
  // ─── Sync Tags Tab (Issue 3: Implement upsert logic) ─────────────────────────
  const tagsSheet = getOrCreateSheet("Tags", [
    "Synced At",
    "File Name", 
    "Figma Link",
    "Node ID",
    "Node Name",
    "Node Type",
    "Event",
    "Screen Name",
    "Description", 
    "Properties",
    "Tagged At"
  ]);
  
  // Get existing data to implement upsert logic using node_id as unique key
  const existingData = tagsSheet.getDataRange().getValues();
  const existingRowMap = new Map(); // node_id -> row number
  
  for (let i = 1; i < existingData.length; i++) { // Skip header row
    const nodeId = existingData[i][3]; // Node ID column
    if (nodeId) {
      existingRowMap.set(nodeId, i + 1); // +1 because sheet rows are 1-indexed
    }
  }
  
  const tags = data.tags || [];
  const currentNodeIds = new Set();
  
  // Process each tag - update if exists, insert if new
  tags.forEach(tag => {
    const nodeId = tag.node_id || "";
    currentNodeIds.add(nodeId);
    
    // Construct Figma deep link
    const figmaUrl = fileKey && nodeId 
      ? `https://www.figma.com/design/${fileKey}/?node-id=${nodeId.replace(':', '-')}`
      : "";
    
    const rowData = [
      new Date().toISOString(),
      data.fileName || "Unknown",
      "", // Figma link will be set as formula below
      nodeId,
      tag.node_name || "",
      tag.node_type || "",
      tag.event || "",
      tag.screen_name || "",
      tag.description || "",
      JSON.stringify(tag.properties || {}),
      tag.tagged_at || ""
    ];
    
    if (existingRowMap.has(nodeId)) {
      // Update existing row
      const rowNum = existingRowMap.get(nodeId);
      const range = tagsSheet.getRange(rowNum, 1, 1, rowData.length);
      range.setValues([rowData]);
      
      // Update Figma link formula
      if (figmaUrl) {
        tagsSheet.getRange(rowNum, 3).setFormula(`=HYPERLINK("${figmaUrl}", "Open in Figma")`);
      } else {
        tagsSheet.getRange(rowNum, 3).setValue("(File not saved to cloud)");
      }
    } else {
      // Insert new row
      appendRowClean(tagsSheet, rowData);
      const newRowNum = tagsSheet.getLastRow();
      
      // Set Figma link formula
      if (figmaUrl) {
        tagsSheet.getRange(newRowNum, 3).setFormula(`=HYPERLINK("${figmaUrl}", "Open in Figma")`);
      } else {
        tagsSheet.getRange(newRowNum, 3).setValue("(File not saved to cloud)");
      }
    }
  });
  
  // Remove rows for node_ids that are no longer present
  const rowsToDelete = [];
  for (const [nodeId, rowNum] of existingRowMap) {
    if (!currentNodeIds.has(nodeId)) {
      rowsToDelete.push(rowNum);
    }
  }
  
  // Delete rows in reverse order to avoid index shifting
  rowsToDelete.sort((a, b) => b - a).forEach(rowNum => {
    tagsSheet.deleteRow(rowNum);
  });
  
  // ─── Sync Screen Assignments Tab (Issue 3: Implement upsert logic) ───────────
  const screensSheet = getOrCreateSheet("Screen Assignments", [
    "Synced At",
    "File Name",
    "Figma Link", 
    "Node ID",
    "Frame Name",
    "Frame Type",
    "Screen Name"
  ]);
  
  // Migration: Remove old "Assigned" column if it exists
  if (screensSheet.getLastColumn() >= 8) {
    const headerRow = screensSheet.getRange(1, 1, 1, screensSheet.getLastColumn()).getValues()[0];
    if (headerRow[7] === "Assigned") {
      screensSheet.deleteColumn(8);
    }
  }
  
  // Get existing screen data for upsert
  const existingScreenData = screensSheet.getDataRange().getValues();
  const existingScreenRowMap = new Map(); // node_id -> row number
  
  for (let i = 1; i < existingScreenData.length; i++) { // Skip header row
    const nodeId = existingScreenData[i][3]; // Node ID column
    if (nodeId) {
      existingScreenRowMap.set(nodeId, i + 1);
    }
  }
  
  const screenFrames = data.screenFrames || [];
  const currentScreenNodeIds = new Set();
  
  // Process each screen frame - update if exists, insert if new
  screenFrames.forEach(screen => {
    const nodeId = screen.node_id || "";
    currentScreenNodeIds.add(nodeId);
    
    // Construct Figma deep link
    const figmaUrl = fileKey && nodeId 
      ? `https://www.figma.com/design/${fileKey}/?node-id=${nodeId.replace(':', '-')}`
      : "";
    
    const rowData = [
      new Date().toISOString(),
      data.fileName || "Unknown",
      "", // Figma link will be set as formula below
      nodeId,
      screen.node_name || "",
      screen.node_type || "",
      screen.screen_name || ""
    ];
    
    if (existingScreenRowMap.has(nodeId)) {
      // Update existing row
      const rowNum = existingScreenRowMap.get(nodeId);
      const range = screensSheet.getRange(rowNum, 1, 1, rowData.length);
      range.setValues([rowData]);
      
      // Update Figma link formula
      if (figmaUrl) {
        screensSheet.getRange(rowNum, 3).setFormula(`=HYPERLINK("${figmaUrl}", "Open in Figma")`);
      } else {
        screensSheet.getRange(rowNum, 3).setValue("(File not saved to cloud)");
      }
    } else {
      // Insert new row
      appendRowClean(screensSheet, rowData);
      const newRowNum = screensSheet.getLastRow();
      
      // Set Figma link formula
      if (figmaUrl) {
        screensSheet.getRange(newRowNum, 3).setFormula(`=HYPERLINK("${figmaUrl}", "Open in Figma")`);
      } else {
        screensSheet.getRange(newRowNum, 3).setValue("(File not saved to cloud)");
      }
    }
  });
  
  // Remove screen assignment rows for node_ids that are no longer present
  const screenRowsToDelete = [];
  for (const [nodeId, rowNum] of existingScreenRowMap) {
    if (!currentScreenNodeIds.has(nodeId)) {
      screenRowsToDelete.push(rowNum);
    }
  }
  
  // Delete rows in reverse order to avoid index shifting
  screenRowsToDelete.sort((a, b) => b - a).forEach(rowNum => {
    screensSheet.deleteRow(rowNum);
  });
  
  // ─── Issue 5: Log changes to History tab if provided ─────────────────────────
  if (changes.length > 0) {
    const historySheet = getOrCreateSheet(HISTORY_TAB, [
      "Timestamp",
      "File Name",
      "Node ID", 
      "Node Name",
      "Action",
      "Field",
      "Old Value",
      "New Value"
    ]);
    
    changes.forEach(change => {
      appendRowClean(historySheet, [
        new Date().toISOString(),
        change.fileName || "Unknown",
        change.nodeId || "",
        change.nodeName || "",
        change.action || "",
        change.field || "",
        change.oldValue || "",
        change.newValue || ""
      ]);
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    count: tags.length,
    screenCount: screenFrames.length,
    changesLogged: changes.length
  })).setMimeType(ContentService.MimeType.JSON);
}
