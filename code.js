// Tallo Analytics Tagger — Figma Plugin Code (code.js)
// This runs in Figma's sandbox. It reads/writes pluginData on selected nodes
// and communicates with the UI via figma.ui.postMessage / figma.ui.onmessage.

figma.showUI(__html__, { width: 420, height: 620, themeColors: true });

// ─── Constants ───────────────────────────────────────────────────────
const PLUGIN_DATA_KEY = "talloAnalytics";
const SCREEN_FRAME_KEY = "talloScreenName";
const RELAUNCH_KEY = "open";

// ─── Helpers ─────────────────────────────────────────────────────────

function getAnalyticsData(node) {
  const raw = node.getPluginData(PLUGIN_DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setAnalyticsData(node, data) {
  node.setPluginData(PLUGIN_DATA_KEY, JSON.stringify(data));
  // Set relaunch button so devs see "View Analytics Tag" in inspect panel
  node.setRelaunchData({ [RELAUNCH_KEY]: "" });
}

function clearAnalyticsData(node) {
  node.setPluginData(PLUGIN_DATA_KEY, "");
  node.setRelaunchData({});
}

function nodeInfo(node) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
  };
}

function findScreenFrame(node) {
  let current = node;
  while (current && current.type !== "PAGE") {
    const screenName = current.getPluginData(SCREEN_FRAME_KEY);
    if (screenName) {
      return {
        id: current.id,
        name: current.name,
        screenName: screenName,
      };
    }
    current = current.parent;
  }
  return null;
}

// ─── Send current selection state to UI ──────────────────────────────

function sendSelectionState() {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) {
    figma.ui.postMessage({ type: "selection", node: null, data: null });
    return;
  }
  if (sel.length > 1) {
    // Batch mode: send all selected nodes and their data
    const nodes = sel.map((n) => {
      const info = nodeInfo(n);
      return {
        id: info.id,
        name: info.name,
        type: info.type,
        data: getAnalyticsData(n),
      };
    });
    figma.ui.postMessage({ type: "selection-multi", nodes });
    return;
  }
  const node = sel[0];
  const data = getAnalyticsData(node);
  const screenFrame = findScreenFrame(node);
  figma.ui.postMessage({ 
    type: "selection", 
    node: nodeInfo(node), 
    data,
    screenFrame
  });
}

// ─── Listen for selection changes ────────────────────────────────────

figma.on("selectionchange", sendSelectionState);

// Also send state on plugin open
sendSelectionState();

// ─── Handle messages from UI ─────────────────────────────────────────

figma.ui.onmessage = (msg) => {
  if (msg.type === "save") {
    const sel = figma.currentPage.selection;
    if (sel.length !== 1) {
      figma.ui.postMessage({ type: "error", message: "Select exactly one component." });
      return;
    }
    const node = sel[0];
    const oldData = getAnalyticsData(node);
    setAnalyticsData(node, msg.data);
    figma.notify("✅ Analytics tag saved to \"" + node.name + "\"");
    
    // Send change log info to UI for logging
    figma.ui.postMessage({
      type: "log-change",
      action: oldData ? "update" : "create",
      nodeId: node.id,
      nodeName: node.name,
      oldValue: oldData ? JSON.stringify(oldData) : "",
      newValue: JSON.stringify(msg.data)
    });

    // Trigger auto-sync to backup changes
    figma.ui.postMessage({ type: "trigger-auto-sync" });

    sendSelectionState();
  }

  if (msg.type === "clear") {
    const sel = figma.currentPage.selection;
    if (sel.length !== 1) return;
    const node = sel[0];
    const oldData = getAnalyticsData(node);
    clearAnalyticsData(node);
    figma.notify("🗑️ Analytics tag removed from \"" + node.name + "\"");
    
    // Send change log info to UI for logging
    if (oldData) {
      figma.ui.postMessage({
        type: "log-change",
        action: "delete",
        nodeId: node.id,
        nodeName: node.name,
        oldValue: JSON.stringify(oldData),
        newValue: ""
      });
    }
    
    // Trigger auto-sync to backup changes
    figma.ui.postMessage({ type: "trigger-auto-sync" });
    
    sendSelectionState();
  }

  if (msg.type === "scan-page") {
    // Walk the entire page and find all nodes with analytics tags
    const results = [];
    function walk(node) {
      const data = getAnalyticsData(node);
      if (data) {
        const info = nodeInfo(node);
        results.push({
          id: info.id,
          name: info.name,
          type: info.type,
          data: data
        });
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(figma.currentPage);
    figma.ui.postMessage({ type: "scan-results", results });
  }

  if (msg.type === "select-node") {
    figma.getNodeByIdAsync(msg.nodeId).then((node) => {
      if (node) {
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
      }
    });
  }

  if (msg.type === "export-all") {
    // Walk entire page and gather all tagged nodes for export
    const results = [];
    function walkExport(node) {
      const data = getAnalyticsData(node);
      if (data) {
        const exportData = {
          node_name: node.name,
          node_id: node.id,
          node_type: node.type,
        };
        // Merge data properties into exportData
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            exportData[key] = data[key];
          }
        }
        results.push(exportData);
      }
      if ("children" in node) {
        for (const child of node.children) {
          walkExport(child);
        }
      }
    }
    walkExport(figma.currentPage);
    figma.ui.postMessage({ type: "export-results", results });
  }

  if (msg.type === "save-api-url") {
    // Save both URL and token to sharedPluginData (shared with all team members)
    figma.root.setSharedPluginData("talloAnalytics", "apiUrl", msg.url || "");
    figma.root.setSharedPluginData("talloAnalytics", "apiToken", msg.token || "");
    figma.ui.postMessage({ type: "api-url-saved" });
  }

  if (msg.type === "get-api-url") {
    // Get both URL and token from sharedPluginData (shared across team)
    const url = figma.root.getSharedPluginData("talloAnalytics", "apiUrl");
    const token = figma.root.getSharedPluginData("talloAnalytics", "apiToken");
    figma.ui.postMessage({ 
      type: "api-url-loaded", 
      url: url || null,
      token: token || null
    });
  }

  if (msg.type === "save-figma-filekey") {
    figma.root.setSharedPluginData("talloAnalytics", "figmaFileKey", msg.fileKey || "");
    figma.notify("✅ File key saved");
  }

  if (msg.type === "get-figma-filekey") {
    const fileKey = figma.root.getSharedPluginData("talloAnalytics", "figmaFileKey");
    figma.ui.postMessage({ type: "figma-filekey-loaded", fileKey: fileKey || null });
  }

  if (msg.type === "set-screen-frame") {
    const sel = figma.currentPage.selection;
    if (sel.length !== 1) {
      figma.ui.postMessage({ type: "error", message: "Select exactly one frame." });
      return;
    }
    const node = sel[0];
    if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
      figma.ui.postMessage({ type: "error", message: "Selection must be a frame or component." });
      return;
    }
    node.setPluginData(SCREEN_FRAME_KEY, msg.screenName);
    figma.notify("✅ Screen frame set: \"" + node.name + "\" → " + msg.screenName);
    
    // Trigger auto-sync to backup screen assignments
    figma.ui.postMessage({ type: "trigger-auto-sync" });
    
    sendSelectionState();
  }

  if (msg.type === "clear-screen-frame") {
    const sel = figma.currentPage.selection;
    if (sel.length !== 1) return;
    const node = sel[0];
    node.setPluginData(SCREEN_FRAME_KEY, "");
    figma.notify("🗑️ Screen frame cleared from \"" + node.name + "\"");
    
    // Trigger auto-sync to backup screen assignments
    figma.ui.postMessage({ type: "trigger-auto-sync" });
    
    sendSelectionState();
  }

  if (msg.type === "scan-screen-frames") {
    // Find all frames with screen assignments
    const results = [];
    function walkScreens(node) {
      const screenName = node.getPluginData(SCREEN_FRAME_KEY);
      if (screenName) {
        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          screenName: screenName
        });
      }
      if ("children" in node) {
        for (const child of node.children) {
          walkScreens(child);
        }
      }
    }
    walkScreens(figma.currentPage);
    figma.ui.postMessage({ type: "screen-frames-results", results });
  }

  if (msg.type === "clear-screen-frames") {
    // Clear screen assignments for specific node IDs (orphan cleanup)
    const nodeIds = msg.nodeIds || [];
    let cleared = 0;
    
    async function clearNodes() {
      for (const id of nodeIds) {
        const node = await figma.getNodeByIdAsync(id);
        if (node) {
          node.setPluginData(SCREEN_FRAME_KEY, "");
          cleared++;
        }
      }
      figma.ui.postMessage({ type: "screen-frames-cleared", count: cleared });
      if (cleared > 0) {
        figma.notify(`🗑️ Cleared ${cleared} orphaned screen assignment${cleared > 1 ? 's' : ''}`);
      }
    }
    clearNodes();
  }

  if (msg.type === "clear-all-screen-frames") {
    // Walk entire page and clear ALL screen assignments
    let cleared = 0;
    function walkClear(node) {
      const screenName = node.getPluginData(SCREEN_FRAME_KEY);
      if (screenName) {
        node.setPluginData(SCREEN_FRAME_KEY, "");
        cleared++;
      }
      if ("children" in node) {
        for (const child of node.children) {
          walkClear(child);
        }
      }
    }
    walkClear(figma.currentPage);
    figma.ui.postMessage({ type: "screen-frames-cleared", count: cleared });
    if (cleared > 0) {
      figma.notify(`🗑️ Cleared all ${cleared} screen assignment${cleared > 1 ? 's' : ''}`);
    }
  }

  if (msg.type === "copy-tag") {
    figma.clientStorage.setAsync("copiedTag", msg.data).then(() => {
      // Success - UI already shows toast
    });
  }

  if (msg.type === "paste-tag") {
    figma.clientStorage.getAsync("copiedTag").then((data) => {
      if (data) {
        figma.ui.postMessage({ type: "tag-pasted", data });
      } else {
        figma.ui.postMessage({ type: "error", message: "No tag in clipboard" });
      }
    });
  }

  if (msg.type === "sync-to-sheet") {
    // Gather all tags and screen frames, send to UI for syncing
    const results = [];
    const screenFrames = [];
    const isAutoSync = msg.isAutoSync || false;
    
    function walkExport(node) {
      // Check if this is a screen frame
      const screenName = node.getPluginData(SCREEN_FRAME_KEY);
      if (screenName) {
        screenFrames.push({
          node_id: node.id,
          node_name: node.name,
          node_type: node.type,
          screen_name: screenName
        });
      }
      
      // Check if this has analytics data
      const data = getAnalyticsData(node);
      if (data) {
        const exportData = {
          node_name: node.name,
          node_id: node.id,
          node_type: node.type,
        };
        // Merge data properties into exportData
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            exportData[key] = data[key];
          }
        }
        results.push(exportData);
      }
      
      if ("children" in node) {
        for (const child of node.children) {
          walkExport(child);
        }
      }
    }
    walkExport(figma.currentPage);
    
    // Get stored fileKey from sharedPluginData (shared across team)
    const storedFileKey = figma.root.getSharedPluginData("talloAnalytics", "figmaFileKey");
    if (!storedFileKey && !isAutoSync) {
      figma.notify("⚠️ Please configure your Figma file URL in Settings to enable deep links", { timeout: 4000 });
    }
    
    figma.ui.postMessage({ 
      type: "sync-data", 
      tags: results,
      screenFrames: screenFrames,
      fileName: figma.root.name,
      fileKey: storedFileKey || "",
      isAutoSync: isAutoSync
    });
  }

  if (msg.type === "get-screen-assignment") {
    figma.getNodeByIdAsync(msg.nodeId).then((node) => {
      if (node) {
        const screenName = node.getPluginData(SCREEN_FRAME_KEY);
        figma.ui.postMessage({ 
          type: "screen-assignment", 
          screenName: screenName || null
        });
      }
    });
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
