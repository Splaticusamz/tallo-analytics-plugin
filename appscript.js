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

// ─── Main Entry Point ────────────────────────────────────────────────────────

function doGet(e) {
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
      getTaxonomy: "GET ?action=getTaxonomy - Returns all dropdown data",
      addCustom: "POST {action: 'addCustom', type: 'screen'|'event', ...}",
      deleteCustom: "POST {action: 'deleteCustom', type: 'screen'|'event', name: '...'}",
      logChange: "POST {action: 'logChange', ...}",
      syncTags: "POST {action: 'syncTags', tags: [...]}"
    },
    testUrl: e.parameter.action === undefined 
      ? "Add ?action=getTaxonomy to this URL to test"
      : "Invalid action: " + action
  }, null, 2)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
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
    return ContentService.createTextOutput(JSON.stringify({
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Get Taxonomy ────────────────────────────────────────────────────────────

function getTaxonomy() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Read Screens tab (columns: screen_name, category)
  const screensSheet = ss.getSheetByName(SCREENS_TAB);
  const screensData = screensSheet ? screensSheet.getDataRange().getValues() : [];
  const screens = screensData.slice(1)
    .filter(row => row[0] && String(row[0]).trim()) // Has screen name and it's not empty
    .map(row => ({
      name: String(row[0]).trim(),
      category: row[1] ? String(row[1]).trim() : "Other"
    }));
  
  // Read Events tab (columns: event, category, description, props)
  const eventsSheet = ss.getSheetByName(EVENTS_TAB);
  const eventsData = eventsSheet ? eventsSheet.getDataRange().getValues() : [];
  const events = eventsData.slice(1).map(row => ({
    event: row[0],
    cat: row[1],
    desc: row[2] || "",
    props: row[3] && String(row[3]).trim() ? String(row[3]).split(",").map(p => p.trim()) : []
  })).filter(e => e.event);
  
  // Read Properties tab (columns: property_name, type)
  const propsSheet = ss.getSheetByName(PROPERTIES_TAB);
  const propsData = propsSheet ? propsSheet.getDataRange().getValues() : [];
  const propertyTypes = {};
  propsData.slice(1).forEach(row => {
    if (row[0]) propertyTypes[row[0]] = row[1] || "string";
  });
  
  // Read Custom tab (columns: type, name, category, description, props)
  const customSheet = ss.getSheetByName(CUSTOM_TAB);
  const customData = customSheet ? customSheet.getDataRange().getValues() : [];
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customSheet = ss.getSheetByName(CUSTOM_TAB);
  
  if (!customSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "Custom tab not found"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
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
  customSheet.appendRow([
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customSheet = ss.getSheetByName(CUSTOM_TAB);
  
  if (!customSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "Custom tab not found"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName(HISTORY_TAB);
  
  if (!historySheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "History tab not found"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Append: Timestamp | File Name | Node ID | Node Name | Action | Field | Old Value | New Value
  historySheet.appendRow([
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
  
  // ─── Sync Tags Tab ───────────────────────────────────────────────────────────
  let tagsSheet = ss.getSheetByName("Tags");
  if (!tagsSheet) {
    tagsSheet = ss.insertSheet("Tags");
    tagsSheet.appendRow([
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
  }
  
  // Clear existing data (keep header)
  if (tagsSheet.getLastRow() > 1) {
    tagsSheet.deleteRows(2, tagsSheet.getLastRow() - 1);
  }
  
  // Append all tags
  const tags = data.tags || [];
  let rowIndex = 2; // Start from row 2 (after header)
  
  tags.forEach(tag => {
    // Construct Figma deep link (using new /design/ format)
    const nodeId = tag.node_id || "";
    const figmaUrl = fileKey && nodeId 
      ? `https://www.figma.com/design/${fileKey}/?node-id=${nodeId.replace(':', '-')}`
      : "";
    
    tagsSheet.appendRow([
      new Date().toISOString(),
      data.fileName || "Unknown",
      "", // Placeholder for link - we'll add formula below
      nodeId,
      tag.node_name || "",
      tag.node_type || "",
      tag.event || "",
      tag.screen_name || "",
      tag.description || "",
      JSON.stringify(tag.properties || {}),
      tag.tagged_at || ""
    ]);
    
    // Add HYPERLINK formula to make it clickable
    if (figmaUrl) {
      tagsSheet.getRange(rowIndex, 3).setFormula(`=HYPERLINK("${figmaUrl}", "Open in Figma")`);
    } else {
      tagsSheet.getRange(rowIndex, 3).setValue("(File not saved to cloud)");
    }
    rowIndex++;
  });
  
  // ─── Sync Screen Assignments Tab ────────────────────────────────────────────
  let screensSheet = ss.getSheetByName("Screen Assignments");
  if (!screensSheet) {
    screensSheet = ss.insertSheet("Screen Assignments");
    screensSheet.appendRow([
      "Synced At",
      "File Name",
      "Figma Link",
      "Node ID",
      "Frame Name",
      "Frame Type",
      "Screen Name",
      "Assigned"
    ]);
    
    // Format the Assigned column as checkboxes
    screensSheet.getRange("H2:H1000").insertCheckboxes();
  }
  
  // Clear existing data (keep header)
  if (screensSheet.getLastRow() > 1) {
    screensSheet.deleteRows(2, screensSheet.getLastRow() - 1);
  }
  
  // Append all screen frames
  const screenFrames = data.screenFrames || [];
  let screenRowIndex = 2; // Start from row 2 (after header)
  
  screenFrames.forEach(screen => {
    // Construct Figma deep link (using new /design/ format)
    const nodeId = screen.node_id || "";
    const figmaUrl = fileKey && nodeId 
      ? `https://www.figma.com/design/${fileKey}/?node-id=${nodeId.replace(':', '-')}`
      : "";
    
    screensSheet.appendRow([
      new Date().toISOString(),
      data.fileName || "Unknown",
      "", // Placeholder for link - we'll add formula below
      nodeId,
      screen.node_name || "",
      screen.node_type || "",
      screen.screen_name || "",
      true // Assigned checkbox (true because these are assigned frames)
    ]);
    
    // Add HYPERLINK formula to make it clickable
    if (figmaUrl) {
      screensSheet.getRange(screenRowIndex, 3).setFormula(`=HYPERLINK("${figmaUrl}", "Open in Figma")`);
    } else {
      screensSheet.getRange(screenRowIndex, 3).setValue("(File not saved to cloud)");
    }
    screenRowIndex++;
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    count: tags.length,
    screenCount: screenFrames.length
  })).setMimeType(ContentService.MimeType.JSON);
}
