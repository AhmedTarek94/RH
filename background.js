// Background script for RaterHub Task Monitor

// Initialize default settings
chrome.runtime.onInstalled.addListener(() => {
  const defaultSettings = {
    enabled: false,
    mode: "alarm_and_click", // 'alarm_only' or 'alarm_and_click'
    refreshInterval: 10, // seconds
    alertSoundType: "default", // 'default', 'file', or 'url'
    alertSoundData: "",
    showTestButton: false, // Control test button visibility
    enableDesktopNotifications: true, // Enable desktop notifications
    enableMouseMovementDetection: true, // Stop alarm on mouse movement
    enableIncompleteTasksHandling: true, // Handle incomplete tasks
    enableErrorDetection: true, // Enable enhanced error detection
    darkThemeEnabled: true, // Dark theme setting
  };

  chrome.storage.sync.set(defaultSettings);
  createContextMenus();
  inspectOpenTabsForTargetUrls();

  // Clean up old analytics and filter storage keys
  cleanupOldStorageKeys();

  // Start periodic tab scanning for 403 errors
  startTabScanner();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
  inspectOpenTabsForTargetUrls();

  // Start periodic tab scanning for 403 errors
  startTabScanner();
});

function inspectOpenTabsForTargetUrls() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (isRaterHubTab(tab.url)) {
        injectContentScript(tab.id);
      }
    });
  });
}

function isRaterHubTab(url) {
  if (!url) return false;

  const targetUrls = [
    "https://www.raterhub.com/evaluation/rater",
    "https://www.raterhub.com/evaluation/rater/task/index",
    "https://www.raterhub.com/evaluation/rater/task/show?taskIds=",
  ];

  return targetUrls.some(
    (targetUrl) => url === targetUrl || url.startsWith(targetUrl)
  );
}

function injectContentScript(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      files: ["content.js"],
    })
    .then(() => {
      console.log(`Content script injected into tab ${tabId}`);
    })
    .catch((error) => {
      console.log(
        `Content script already exists in tab ${tabId}, sending message`
      );
      sendMessageToTab(tabId, { action: "settingsUpdated" });
    });
}

function sendMessageToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    console.log(`Failed to send message to tab ${tabId}`);
  });
}

// Create context menus
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "raterhub-monitor",
      title: "RHAT",
      contexts: ["all"],
    });

    chrome.contextMenus.create({
      id: "toggle-enabled",
      title: "Enable/Disable Monitor",
      parentId: "raterhub-monitor",
      contexts: ["all"],
    });

    chrome.contextMenus.create({
      id: "mode-separator",
      type: "separator",
      parentId: "raterhub-monitor",
      contexts: ["all"],
    });

    chrome.contextMenus.create({
      id: "mode-alarm-only",
      title: "Mode: Alarm only",
      type: "radio",
      parentId: "raterhub-monitor",
      contexts: ["all"],
    });

    chrome.contextMenus.create({
      id: "mode-alarm-and-click",
      title: "Mode: Alarm & acquire",
      type: "radio",
      parentId: "raterhub-monitor",
      contexts: ["all"],
    });

    chrome.contextMenus.create({
      id: "interval-separator",
      type: "separator",
      parentId: "raterhub-monitor",
      contexts: ["all"],
    });

    const intervals = [0.5, 1, 2, 5, 10, 30, 60];
    intervals.forEach((interval) => {
      chrome.contextMenus.create({
        id: `interval-${interval}`,
        title: `Refresh: ${interval}s`,
        type: "radio",
        parentId: "raterhub-monitor",
        contexts: ["all"],
      });
    });

    updateContextMenus();
  });
}

// Update context menu states based on current settings
function updateContextMenus() {
  chrome.storage.sync.get(["enabled", "mode", "refreshInterval"], (data) => {
    const settings = {
      enabled: data.enabled || false,
      mode: data.mode || "alarm_only",
      refreshInterval:
        (typeof data.refreshInterval === "number"
          ? data.refreshInterval
          : parseFloat(data.refreshInterval)) || 1,
    };

    chrome.contextMenus
      .update("toggle-enabled", {
        title: settings.enabled ? "✓ Enabled" : "✗ Disabled",
      })
      .catch(() => {});

    chrome.contextMenus
      .update("mode-alarm-only", {
        checked: settings.mode === "alarm_only",
      })
      .catch(() => {});

    chrome.contextMenus
      .update("mode-alarm-and-click", {
        checked: settings.mode === "alarm_and_click",
      })
      .catch(() => {});

    const intervals = [0.5, 1, 2, 5, 10, 30, 60];
    intervals.forEach((interval) => {
      chrome.contextMenus
        .update(`interval-${interval}`, {
          checked: settings.refreshInterval === interval,
        })
        .catch(() => {});
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "toggle-enabled":
      handleToggleEnabled();
      break;
    case "mode-alarm-only":
      updateSetting("mode", "alarm_only");
      break;
    case "mode-alarm-and-click":
      updateSetting("mode", "alarm_and_click");
      break;
    default:
      if (info.menuItemId.startsWith("interval-")) {
        const interval = parseFloat(info.menuItemId.replace("interval-", ""));
        updateSetting("refreshInterval", interval);
      }
      break;
  }
});

function handleToggleEnabled() {
  chrome.storage.sync.get(["enabled"], (data) => {
    const newEnabled = !data.enabled;
    updateSetting("enabled", newEnabled);

    if (newEnabled) {
      activateMonitoringOnExistingTabs();
    }
  });
}

function updateSetting(key, value) {
  chrome.storage.sync.set({ [key]: value }, () => {
    updateContextMenus();
    notifyContentScripts();
  });
}

function activateMonitoringOnExistingTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (isRaterHubTab(tab.url)) {
        injectContentScript(tab.id);
      }
    });
  });
}

// Notify content script of settings changes
function notifyContentScripts() {
  chrome.tabs.query(
    { url: "https://www.raterhub.com/evaluation/rater" },
    (tabs) => {
      console.log(`Found ${tabs.length} RaterHub tabs to notify`);

      tabs.forEach((tab) => {
        sendMessageToTab(tab.id, { action: "settingsUpdated" });
      });
    }
  );
}

// Listen for storage changes to update context menus
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    console.log("Background: Storage changed:", changes);
    updateContextMenus();
  }
});

// Listen for messages from options page and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message.action, message);

  if (message.action === "themeChanged") {
    // Forward theme change message to all parts of the extension
    const themeMessage = {
      action: "themeChanged",
      darkThemeEnabled: message.darkThemeEnabled,
      source: sender.id, // Track where the change came from
    };

    // Send to all extension pages (options, popup, etc.)
    chrome.runtime.sendMessage(themeMessage).catch((error) => {
      console.log("No other extension pages open to receive theme change");
    });

    // Also notify content scripts if needed
    chrome.tabs.query(
      { url: "https://www.raterhub.com/evaluation/rater" },
      (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, themeMessage).catch((error) => {
            console.log(`Content script not ready in tab ${tab.id}:`, error);
          });
        });
      }
    );

    return true;
  }

  // Handle settings updates to ensure all parts are synchronized
  if (message.action === "settingsUpdated") {
    // Forward to all content scripts
    chrome.tabs.query(
      { url: "https://www.raterhub.com/evaluation/rater" },
      (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, message).catch((error) => {
            console.log(`Content script not ready in tab ${tab.id}:`, error);
          });
        });
      }
    );

    // Forward to other extension pages
    chrome.runtime.sendMessage(message).catch((error) => {
      console.log("No other extension pages open to receive settings update");
    });

    return true;
  }

  // Handle specific setting changes for real-time synchronization
  if (message.action === "settingChanged") {
    // Forward the specific setting change to all parts of the extension
    const settingMessage = {
      action: "settingChanged",
      setting: message.setting,
      value: message.value,
      source: sender.id,
    };

    // Send to all extension pages (options, popup, etc.)
    chrome.runtime.sendMessage(settingMessage).catch((error) => {
      console.log("No other extension pages open to receive setting change");
    });

    // Also notify content scripts if needed
    chrome.tabs.query(
      { url: "https://www.raterhub.com/evaluation/rater" },
      (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, settingMessage).catch((error) => {
            console.log(`Content script not ready in tab ${tab.id}:`, error);
          });
        });
      }
    );

    return true;
  }

  return false;
});

// Listen for storage changes to broadcast to all extension components
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    console.log(
      "Background: Storage changed, broadcasting to all components:",
      changes
    );

    // Broadcast each changed setting to all extension components
    Object.entries(changes).forEach(([key, change]) => {
      const settingMessage = {
        action: "settingChanged",
        setting: key,
        value: change.newValue,
        source: "storage",
      };

      // Send to all extension pages (options, popup, etc.)
      chrome.runtime.sendMessage(settingMessage).catch((error) => {
        console.log("No other extension pages open to receive setting change");
      });

      // Also notify content scripts if needed
      chrome.tabs.query(
        { url: "https://www.raterhub.com/evaluation/rater" },
        (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, settingMessage).catch((error) => {
              console.log(`Content script not ready in tab ${tab.id}:`, error);
            });
          });
        }
      );
    });
  }
});

// Handle tab updates - inject content script if needed when RaterHub page loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("https://www.raterhub.com/evaluation/rater")
  ) {
    console.log(`RaterHub tab loaded: ${tabId}`);

    // Check if monitoring is enabled
    chrome.storage.sync.get(["enabled"], (data) => {
      if (data.enabled) {
        console.log(
          `Monitoring is enabled, ensuring content script is active in tab ${tabId}`
        );

        // Try to send message first, if it fails, inject content script
        sendMessageToTab(tabId, { action: "settingsUpdated" });

        // If this is a task/show page, immediately check for 403 errors
        if (isTaskShowTab(tab.url)) {
          console.log(
            `Task/show page detected, checking for 403 errors immediately`
          );
          setTimeout(() => {
            chrome.storage.sync.get(["enableErrorDetection"], (settings) => {
              if (settings.enableErrorDetection) {
                checkTabFor403Error(tabId, tab.url);
              }
            });
          }, 1000); // Wait 1 second for page to fully render
        }

        // If this is the main page, immediately check for monitoring status
        if (isMainPageTab(tab.url)) {
          console.log(
            `Main page detected, checking monitoring status immediately`
          );
          setTimeout(() => {
            checkTabForMainPageMonitoring(tabId, tab.url);
          }, 1000); // Wait 1 second for page to fully render
        }

        // If this is a task/index page, redirect to main page
        if (isTaskIndexTab(tab.url)) {
          console.log(`Task/index page detected, redirecting to main page`);
          setTimeout(() => {
            redirectTabToMainPage(tabId);
          }, 1000); // Wait 1 second for page to fully render
        }
      }
    });
  }
});

// Handle tab activation - check for 403 errors when switching to task/show tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && isTaskShowTab(tab.url)) {
      console.log(
        `Activated task/show tab ${activeInfo.tabId}, checking for 403 errors`
      );

      chrome.storage.sync.get(["enabled", "enableErrorDetection"], (data) => {
        if (data.enabled && data.enableErrorDetection) {
          setTimeout(() => {
            checkTabFor403Error(activeInfo.tabId, tab.url);
          }, 500); // Wait 500ms for tab to fully activate
        }
      });
    } else if (tab.url && isMainPageTab(tab.url)) {
      console.log(
        `Activated main page tab ${activeInfo.tabId}, checking monitoring status`
      );

      chrome.storage.sync.get(["enabled"], (data) => {
        if (data.enabled) {
          setTimeout(() => {
            checkTabForMainPageMonitoring(activeInfo.tabId, tab.url);
          }, 500); // Wait 500ms for tab to fully activate
        }
      });
    } else if (tab.url && isTaskIndexTab(tab.url)) {
      console.log(
        `Activated task/index tab ${activeInfo.tabId}, redirecting to main page`
      );

      chrome.storage.sync.get(["enabled"], (data) => {
        if (data.enabled) {
          setTimeout(() => {
            redirectTabToMainPage(activeInfo.tabId);
          }, 500); // Wait 500ms for tab to fully activate
        }
      });
    }
  });
});

// Function to scan all tabs for 403 errors on task/show pages
function startTabScanner() {
  // Scan every 2 seconds for 403 errors and main page detection
  setInterval(() => {
    scanAllTabsFor403Errors();
    scanAllTabsForMainPage();
  }, 2000);
}

function scanAllTabsFor403Errors() {
  chrome.storage.sync.get(["enabled", "enableErrorDetection"], (data) => {
    if (!data.enabled || !data.enableErrorDetection) {
      return; // Only scan if extension is enabled AND error detection is enabled
    }

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (isTaskShowTab(tab.url)) {
          checkTabFor403Error(tab.id, tab.url);
        }
      });
    });
  });
}

function scanAllTabsForMainPage() {
  chrome.storage.sync.get(["enabled"], (data) => {
    if (!data.enabled) {
      return; // Only scan if extension is enabled
    }

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (isMainPageTab(tab.url)) {
          checkTabForMainPageMonitoring(tab.id, tab.url);
        } else if (isTaskIndexTab(tab.url)) {
          console.log(
            `Task/index page detected in tab ${tab.id}, redirecting to main page`
          );
          redirectTabToMainPage(tab.id);
        }
      });
    });
  });
}

function isTaskShowTab(url) {
  if (!url) return false;
  return url.includes("/task/show") && url.includes("taskIds=");
}

function isMainPageTab(url) {
  if (!url) return false;
  return url === "https://www.raterhub.com/evaluation/rater";
}

function isTaskIndexTab(url) {
  if (!url) return false;
  return url === "https://www.raterhub.com/evaluation/rater/task/index";
}

function checkTabFor403Error(tabId, url) {
  // Execute script to check page content for 403 error
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: checkPageFor403Error,
    })
    .then((results) => {
      if (
        results &&
        results[0] &&
        results[0].result &&
        results[0].result.has403Error
      ) {
        console.log(
          `RaterHub Monitor: 403 error detected in tab ${tabId}, redirecting to main page`
        );
        redirectTabToMainPage(tabId);
      }
    })
    .catch((error) => {
      console.log(`Failed to check tab ${tabId} for 403 error:`, error);
    });
}

function checkTabForMainPageMonitoring(tabId, url) {
  // Execute script to check if monitoring is already active on this tab
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: checkMainPageMonitoringStatus,
    })
    .then((results) => {
      if (results && results[0] && results[0].result) {
        const status = results[0].result;
        if (!status.isMonitoring && status.shouldMonitor) {
          console.log(
            `RaterHub Monitor: Main page detected in tab ${tabId}, starting monitoring`
          );
          startMonitoringOnTab(tabId);
        }
      }
    })
    .catch((error) => {
      console.log(
        `Failed to check tab ${tabId} for main page monitoring:`,
        error
      );
    });
}

// Function to be executed in the tab context to check 403 errors
function checkPageFor403Error() {
  const has403Error =
    document.body.innerText.includes("Error 403 Forbidden") ||
    document.body.innerText.includes("This task has already been SUBMITTED");

  return {
    has403Error: has403Error,
    url: window.location.href,
    bodyText: document.body.innerText.substring(0, 200), // First 200 chars for debugging
  };
}

// Function to be executed in the tab context to check main page monitoring status
function checkMainPageMonitoringStatus() {
  // Check if this is the main page
  const isMainPage =
    window.location.href === "https://www.raterhub.com/evaluation/rater";

  // Check if monitoring is already active (by looking for the global variable)
  const isMonitoring = window.raterHubMonitorLoaded && window.isMonitoring;

  // Check if we should be monitoring (extension enabled and on main page)
  const shouldMonitor = isMainPage && !isMonitoring;

  return {
    isMainPage: isMainPage,
    isMonitoring: isMonitoring,
    shouldMonitor: shouldMonitor,
    url: window.location.href,
  };
}

function redirectTabToMainPage(tabId) {
  const mainUrl = "https://www.raterhub.com/evaluation/rater";
  chrome.tabs.update(tabId, { url: mainUrl });
}

function startMonitoringOnTab(tabId) {
  // Send message to start monitoring on the specific tab
  sendMessageToTab(tabId, { action: "startMonitoring" });
}

// Clean up old analytics and filter storage keys
function cleanupOldStorageKeys() {
  console.log("Cleaning up old analytics and filter storage keys...");

  // Keys to remove from chrome.storage.sync
  const syncKeysToRemove = [
    "analyticsSettings",
    "analyticsEvents",
    "analyticsSessions",
    "filters",
    "filterPresets",
    "filteringEnabled",
  ];

  // Keys to remove from chrome.storage.local
  const localKeysToRemove = [
    "analyticsSettings",
    "analyticsEvents",
    "analyticsSessions",
    "filters",
    "filterPresets",
    "filteringEnabled",
  ];

  // Remove keys from sync storage
  chrome.storage.sync.remove(syncKeysToRemove, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error removing sync storage keys:",
        chrome.runtime.lastError
      );
    } else {
      console.log("Successfully removed sync storage keys:", syncKeysToRemove);
    }
  });

  // Remove keys from local storage
  chrome.storage.local.remove(localKeysToRemove, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error removing local storage keys:",
        chrome.runtime.lastError
      );
    } else {
      console.log(
        "Successfully removed local storage keys:",
        localKeysToRemove
      );
    }
  });

  console.log("Storage cleanup completed!");
}
