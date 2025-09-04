// Background script for RaterHub Task Monitor

// Import Gmail services (these will be available in the service worker context)
importScripts("auth-service.js", "gmail-service.js", "email-templates.js");

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
    // Gmail integration settings
    enableGmailNotifications: false, // Enable Gmail notifications
    notificationEmail: "", // Email address for notifications
    gmailAuthStatus: "not_authenticated", // Authentication status
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
    // Define URL patterns for RaterHub pages
    const raterHubUrlPatterns = [
      "https://www.raterhub.com/evaluation/rater*",
      "https://www.raterhub.com/evaluation/rater/task/*",
    ];

    chrome.contextMenus.create({
      id: "raterhub-monitor",
      title: "RHAT",
      contexts: ["all"],
      documentUrlPatterns: raterHubUrlPatterns,
    });

    chrome.contextMenus.create({
      id: "toggle-enabled",
      title: "Enable/Disable Monitor",
      parentId: "raterhub-monitor",
      contexts: ["all"],
      documentUrlPatterns: raterHubUrlPatterns,
    });

    chrome.contextMenus.create({
      id: "mode-separator",
      type: "separator",
      parentId: "raterhub-monitor",
      contexts: ["all"],
      documentUrlPatterns: raterHubUrlPatterns,
    });

    chrome.contextMenus.create({
      id: "mode-alarm-only",
      title: "Mode: Alarm only",
      type: "radio",
      parentId: "raterhub-monitor",
      contexts: ["all"],
      documentUrlPatterns: raterHubUrlPatterns,
    });

    chrome.contextMenus.create({
      id: "mode-alarm-and-click",
      title: "Mode: Alarm & acquire",
      type: "radio",
      parentId: "raterhub-monitor",
      contexts: ["all"],
      documentUrlPatterns: raterHubUrlPatterns,
    });

    chrome.contextMenus.create({
      id: "interval-separator",
      type: "separator",
      parentId: "raterhub-monitor",
      contexts: ["all"],
      documentUrlPatterns: raterHubUrlPatterns,
    });

    const intervals = [0.5, 1, 2, 5, 10, 30, 60];
    intervals.forEach((interval) => {
      chrome.contextMenus.create({
        id: `interval-${interval}`,
        title: `Refresh: ${interval}s`,
        type: "radio",
        parentId: "raterhub-monitor",
        contexts: ["all"],
        documentUrlPatterns: raterHubUrlPatterns,
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

  // Handle audio playing requests from content script
  if (message.action === "playAlarm") {
    console.log("Background: Received playAlarm request from content script");
    playAlarmInBackground();
    return true;
  }

  // Handle stop alarm requests from content script
  if (message.action === "stopAlarm") {
    console.log("Background: Received stopAlarm request from content script");
    stopAlarmInBackground();
    return true;
  }

  // Handle task detection for Gmail notifications
  if (message.action === "taskDetected") {
    console.log("Background: Received task detection notification");
    handleTaskDetected(message.taskData);
    return true;
  }

  // Handle Gmail authentication requests
  if (message.action === "gmailAuthenticate") {
    console.log("Background: Received Gmail authentication request");
    handleGmailAuthentication(sendResponse);
    return true;
  }

  // Handle test email requests
  if (message.action === "sendTestEmail") {
    console.log("Background: Received test email request");
    handleTestEmail(sendResponse);
    return true;
  }

  // Handle Gmail authentication status requests
  if (message.action === "getGmailAuthStatus") {
    console.log("Background: Received Gmail auth status request");
    handleGetGmailAuthStatus(sendResponse);
    return true;
  }

  // Handle Gmail authentication clearing
  if (message.action === "clearGmailAuth") {
    console.log("Background: Received clear Gmail auth request");
    handleClearGmailAuth(sendResponse);
    return true;
  }

  // Handle immediate authentication status check
  if (message.action === "checkAuthStatus") {
    console.log("Background: Received immediate auth status check");
    handleImmediateAuthStatusCheck(sendResponse);
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

        // Handle task/index page with enhanced error detection
        setTimeout(() => {
          enhancedErrorDetection(tabId, tab.url);
        }, 1000); // Wait 1 second for page to fully render
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
        `Activated task/index tab ${activeInfo.tabId}, handling with enhanced error detection`
      );

      chrome.storage.sync.get(["enabled"], (data) => {
        if (data.enabled) {
          setTimeout(() => {
            enhancedErrorDetection(activeInfo.tabId, tab.url);
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
            `Task/index page detected in tab ${tab.id}, handling with enhanced error detection`
          );
          enhancedErrorDetection(tab.id, tab.url);
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

// Enhanced Error Detection function that handles task/index URL redirection
function enhancedErrorDetection(tabId, url) {
  chrome.storage.sync.get(["enableErrorDetection"], (settings) => {
    if (!settings.enableErrorDetection) {
      console.log("Error detection is disabled.");
      return;
    }

    // Handle task/index URL redirection instantly
    if (url.endsWith("/task/index")) {
      console.log(
        `Instantly redirecting task/index URL in enhancedErrorDetection for tab ${tabId}`
      );
      redirectTabToMainPage(tabId);
      return; // Redirect instantly, no further processing
    }

    console.log("Performing error detection...");
    // Additional error detection logic can be added here if needed
  });
}

// Audio playing functions using offscreen document
async function playAlarmInBackground() {
  try {
    console.log("Background: Requesting alarm playback via offscreen document");

    // Get current settings to determine sound type
    const syncSettings = await new Promise((resolve) => {
      chrome.storage.sync.get(["alertSoundType", "alertSoundData"], resolve);
    });

    let settings = { ...syncSettings };

    // If sound type is file, get data from local storage
    if (settings.alertSoundType === "file") {
      const localData = await new Promise((resolve) => {
        chrome.storage.local.get(["alertSoundData"], resolve);
      });
      settings.alertSoundData = localData.alertSoundData || "";
    }

    console.log("Background: Sound settings:", {
      alertSoundType: settings.alertSoundType,
      alertSoundData: settings.alertSoundData ? "data available" : "no data",
    });

    // Ensure offscreen document is created
    await createOffscreenDocument();

    // Send message to offscreen document to play alarm
    chrome.runtime.sendMessage(
      {
        action: "playAlarm",
        settings: {
          alertSoundType: settings.alertSoundType || "default",
          alertSoundData: settings.alertSoundData || "",
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Background: Error sending playAlarm to offscreen:",
            chrome.runtime.lastError
          );
          createFallbackNotification();
        } else {
          console.log(
            "Background: Alarm playback request sent to offscreen document"
          );
        }
      }
    );
  } catch (error) {
    console.error("Background: Error in playAlarmInBackground:", error);
    createFallbackNotification();
  }
}

function stopAlarmInBackground() {
  try {
    console.log("Background: Requesting alarm stop via offscreen document");

    // Send message to offscreen document to stop alarm
    chrome.runtime.sendMessage({ action: "stopAlarm" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Background: Error sending stopAlarm to offscreen:",
          chrome.runtime.lastError
        );
      } else {
        console.log(
          "Background: Alarm stop request sent to offscreen document"
        );
      }
    });

    // Also clear any existing notifications
    chrome.notifications.getAll((notifications) => {
      Object.keys(notifications).forEach((notificationId) => {
        if (
          notificationId.includes("raterhub") ||
          notificationId.includes("RHAT") ||
          notificationId.includes("Tasks Available")
        ) {
          chrome.notifications.clear(notificationId, (wasCleared) => {
            if (wasCleared) {
              console.log("Background: Cleared notification:", notificationId);
            }
          });
        }
      });
    });
  } catch (error) {
    console.error("Background: Error stopping alarm:", error);
  }
}

async function createOffscreenDocument() {
  try {
    // Check if offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    });

    if (existingContexts.length > 0) {
      console.log("Background: Offscreen document already exists");
      return;
    }

    console.log("Background: Creating offscreen document");

    // Create offscreen document
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Handle audio playback for task notifications",
    });

    console.log("Background: Offscreen document created successfully");
  } catch (error) {
    console.error("Background: Error creating offscreen document:", error);
    throw error;
  }
}

function createFallbackNotification() {
  // Create a simple notification as final fallback
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title: "RHAT - Tasks Available!",
      message: "🎉 Tasks are available! Click to return to RaterHub.",
      priority: 2,
      requireInteraction: true,
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Background: Notification error:",
          chrome.runtime.lastError
        );
      } else {
        console.log(
          "Background: Fallback notification created:",
          notificationId
        );
      }
    }
  );
}

function createAuthRequiredNotification() {
  // Create a notification to inform user about authentication requirement
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title: "RHAT - Gmail Authentication Required",
      message: "Please authenticate with Gmail to enable email notifications.",
      priority: 2,
      requireInteraction: true,
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Background: Auth notification error:",
          chrome.runtime.lastError
        );
      } else {
        console.log(
          "Background: Auth required notification created:",
          notificationId
        );
      }
    }
  );
}

// Gmail integration functions

// Authentication status management
function getAuthenticationStatusIndicator() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      [
        "gmailAuthStatus",
        "gmailAuthError",
        "gmailAuthTimestamp",
        "gmailAuthToken",
      ],
      (data) => {
        const status = {
          status: data.gmailAuthStatus || "not_authenticated",
          isAuthenticated: data.gmailAuthStatus === "authenticated",
          isAuthenticating: data.gmailAuthStatus === "authenticating",
          hasError:
            data.gmailAuthStatus === "authentication_error" ||
            data.gmailAuthStatus === "authentication_failed",
          error: data.gmailAuthError || null,
          timestamp: data.gmailAuthTimestamp || null,
          hasToken: !!data.gmailAuthToken,
          // Human-readable status message
          message: getStatusMessage(data.gmailAuthStatus, data.gmailAuthError),
        };
        resolve(status);
      }
    );
  });
}

function getStatusMessage(status, error) {
  switch (status) {
    case "not_authenticated":
      return "Not authenticated with Gmail";
    case "authenticating":
      return "Authenticating with Gmail...";
    case "authenticated":
      return "Successfully authenticated with Gmail";
    case "authentication_failed":
      return "Authentication failed - no token received";
    case "authentication_error":
      return error?.userMessage || "Authentication error occurred";
    case "authentication_required":
      return "Re-authentication required";
    default:
      return "Unknown authentication status";
  }
}

// Broadcast authentication status changes to all extension components
function broadcastAuthStatusChange() {
  getAuthenticationStatusIndicator().then((status) => {
    const authMessage = {
      action: "authStatusChanged",
      authStatus: status,
      source: "background",
    };

    // Send to all extension pages (options, popup, etc.)
    chrome.runtime.sendMessage(authMessage).catch((error) => {
      console.log("No extension pages open to receive auth status change");
    });

    // Also notify content scripts if needed
    chrome.tabs.query(
      { url: "https://www.raterhub.com/evaluation/rater*" },
      (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, authMessage).catch((error) => {
            console.log(`Content script not ready in tab ${tab.id}:`, error);
          });
        });
      }
    );
  });
}

async function handleTaskDetected(taskData) {
  try {
    console.log("Background: Handling task detection for Gmail notifications");

    // Check authentication status first
    const authStatus = await getAuthenticationStatusIndicator();

    if (!authStatus.isAuthenticated) {
      console.log(
        "Background: Not authenticated with Gmail, skipping notification"
      );

      // Notify user about authentication requirement
      createAuthRequiredNotification();

      // Update status to indicate re-authentication is needed
      chrome.storage.sync.set({
        gmailAuthStatus: "authentication_required",
        gmailAuthTimestamp: new Date().toISOString(),
      });

      // Broadcast the status change
      broadcastAuthStatusChange();

      return;
    }

    // Get Gmail settings
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(
        ["enableGmailNotifications", "notificationEmail"],
        resolve
      );
    });

    if (!settings.enableGmailNotifications || !settings.notificationEmail) {
      console.log(
        "Background: Gmail notifications disabled or no email configured"
      );
      return;
    }

    console.log(
      "Background: Sending task notification email to:",
      settings.notificationEmail
    );

    // Send the email using Gmail service
    const result = await GmailService.sendTaskNotification(
      taskData,
      settings.notificationEmail
    );

    console.log(
      "Background: Task notification email sent successfully:",
      result.id
    );

    // Update last notification time
    chrome.storage.sync.set({
      lastNotificationTime: new Date().toISOString(),
      lastNotificationEmail: settings.notificationEmail,
    });
  } catch (error) {
    console.error("Background: Failed to send task notification email:", error);

    // Handle authentication errors with detailed status updates
    if (
      error.message.includes("invalid_grant") ||
      error.message.includes("401") ||
      error.message.includes("unauthorized")
    ) {
      console.log("Background: Gmail authentication error detected");

      const errorDetails = {
        type: "AUTH_EXPIRED",
        message: error.message,
        userMessage:
          "Your Gmail authentication has expired. Please re-authenticate.",
        timestamp: new Date().toISOString(),
      };

      chrome.storage.sync.set({
        gmailAuthStatus: "authentication_required",
        gmailAuthError: errorDetails,
        gmailAuthTimestamp: new Date().toISOString(),
      });

      // Broadcast the status change
      broadcastAuthStatusChange();

      // Show notification to user
      createAuthRequiredNotification();
    } else {
      // Handle other types of errors
      console.log(
        "Background: Non-authentication error in task notification:",
        error
      );

      // Create a general error notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon.png"),
        title: "RHAT - Email Notification Failed",
        message:
          "Failed to send task notification email. Check console for details.",
        priority: 1,
      });
    }
  }
}

async function handleGmailAuthentication(sendResponse) {
  try {
    console.log("Background: Starting Gmail authentication via AuthService");

    // Update status to authenticating
    await updateAuthStatus("authenticating");

    // Delegate authentication to the unified AuthService
    const token = await AuthService.authenticate(true);

    console.log("Background: Gmail authentication successful via AuthService");

    // Update status to authenticated
    await updateAuthStatus("authenticated");

    // Broadcast status change
    broadcastAuthStatusChange();

    sendResponse({
      success: true,
      message: "Gmail authentication successful",
      status: "authenticated",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Background: Gmail authentication failed:", error);

    // Update status to error
    await updateAuthStatus("authentication_error");

    // Store error details
    chrome.storage.sync.set({
      gmailAuthError: {
        type: error.type,
        message: error.message,
        userMessage: error.userMessage,
        timestamp: new Date().toISOString(),
      },
    });

    // Broadcast status change
    broadcastAuthStatusChange();

    sendResponse({
      success: false,
      message: error.userMessage || error.message,
      status: "authentication_error",
      error: {
        type: error.type,
        message: error.message,
        userMessage: error.userMessage,
        timestamp: error.timestamp,
      },
    });
  }
}

async function handleTestEmail(sendResponse) {
  try {
    console.log("Background: Starting enhanced test email process");

    // Get the notification email from storage
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(["notificationEmail"], resolve);
    });

    if (!settings.notificationEmail) {
      sendResponse({
        success: false,
        message: "No notification email configured",
        errorType: "INVALID_INPUT",
      });
      return;
    }

    console.log(
      "Background: Sending test email to:",
      settings.notificationEmail
    );

    // Send the email using the enhanced GmailService
    const result = await GmailService.sendTestEmail(settings.notificationEmail);

    console.log("Background: Test email sent successfully:", result.id);
    sendResponse({
      success: true,
      message: "Test email sent successfully",
      emailId: result.id,
    });
  } catch (error) {
    console.error("Background: Failed to send test email:", error);

    // Use enhanced error handling with user-friendly messages
    const errorResponse = {
      success: false,
      message: getUserFriendlyErrorMessage(error),
      errorType: error.type || "UNKNOWN_ERROR",
    };

    // Handle authentication errors specially
    if (
      error.type === "AUTHENTICATION_ERROR" ||
      error.type === "TOKEN_EXPIRED"
    ) {
      await handleAuthenticationError();
      errorResponse.message += " Please try authenticating again.";
    }

    sendResponse(errorResponse);
  }
}

// Enhanced error message helper
function getUserFriendlyErrorMessage(error) {
  switch (error.type) {
    case "NETWORK_ERROR":
      return "Network error: Unable to connect to Gmail API. Check your internet connection.";
    case "AUTHENTICATION_ERROR":
      return "Authentication error: Your Gmail token has expired. Please re-authenticate.";
    case "TOKEN_EXPIRED":
      return "Authentication expired: Please re-authenticate with Gmail.";
    case "PERMISSION_ERROR":
      return "Permission error: Gmail API access denied. Check your OAuth permissions.";
    case "RATE_LIMIT_ERROR":
      return "Rate limit exceeded: Too many requests. Please wait before trying again.";
    case "INVALID_INPUT":
      return "Invalid input: Please check your email address and try again.";
    case "SERVICE_UNAVAILABLE":
      return "Gmail service is temporarily unavailable. Please try again later.";
    default:
      return (
        error.message || "An unexpected error occurred while sending the email."
      );
  }
}

// Handle authentication errors with recovery
async function handleAuthenticationError() {
  console.log("Background: Handling authentication error");

  // Clear invalid token
  await new Promise((resolve) => {
    chrome.storage.sync.remove(["gmailAuthToken"], resolve);
  });

  // Update authentication status
  await updateAuthStatus("authentication_required");

  // Notify user
  createAuthRequiredNotification();
}

// Update authentication status
async function updateAuthStatus(status) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      {
        gmailAuthStatus: status,
        gmailAuthTimestamp: new Date().toISOString(),
      },
      resolve
    );
  });
}

// New handler for getting Gmail authentication status
async function handleGetGmailAuthStatus(sendResponse) {
  try {
    console.log("Background: Getting Gmail authentication status");

    const authStatus = await GmailService.getAuthenticationStatus();

    sendResponse({
      success: true,
      authStatus: authStatus,
    });
  } catch (error) {
    console.error("Background: Failed to get Gmail auth status:", error);

    sendResponse({
      success: false,
      message: "Failed to retrieve authentication status",
      error: error.message,
    });
  }
}

// New handler for clearing Gmail authentication
async function handleClearGmailAuth(sendResponse) {
  try {
    console.log("Background: Clearing Gmail authentication");

    await GmailService.clearAuthentication();

    // Update status
    await updateAuthStatus("not_authenticated");

    // Broadcast status change
    broadcastAuthStatusChange();

    sendResponse({
      success: true,
      message: "Gmail authentication cleared successfully",
    });
  } catch (error) {
    console.error("Background: Failed to clear Gmail auth:", error);

    sendResponse({
      success: false,
      message: "Failed to clear authentication",
      error: error.message,
    });
  }
}

// New handler for immediate authentication status check
async function handleImmediateAuthStatusCheck(sendResponse) {
  try {
    console.log("Background: Performing immediate authentication status check");

    const authStatus = await getAuthenticationStatusIndicator();

    // Also check if the token is still valid by making a test API call
    if (authStatus.isAuthenticated) {
      try {
        // Make a simple API call to verify token validity
        const tokenCheck = await GmailService.verifyToken();
        if (!tokenCheck.valid) {
          console.log("Background: Token verification failed, updating status");

          // Update status to indicate re-authentication is needed
          chrome.storage.sync.set({
            gmailAuthStatus: "authentication_required",
            gmailAuthError: {
              type: "TOKEN_EXPIRED",
              message: "Token verification failed",
              userMessage:
                "Your authentication has expired. Please re-authenticate.",
              timestamp: new Date().toISOString(),
            },
            gmailAuthTimestamp: new Date().toISOString(),
          });

          // Broadcast the status change
          broadcastAuthStatusChange();

          // Return updated status
          const updatedStatus = await getAuthenticationStatusIndicator();
          sendResponse({
            success: true,
            authStatus: updatedStatus,
          });
          return;
        }
      } catch (error) {
        console.error("Background: Token verification error:", error);

        // Update status on verification error
        chrome.storage.sync.set({
          gmailAuthStatus: "authentication_required",
          gmailAuthError: {
            type: "TOKEN_VERIFICATION_ERROR",
            message: error.message,
            userMessage:
              "Unable to verify authentication. Please re-authenticate.",
            timestamp: new Date().toISOString(),
          },
          gmailAuthTimestamp: new Date().toISOString(),
        });

        // Broadcast the status change
        broadcastAuthStatusChange();

        // Return updated status
        const updatedStatus = await getAuthenticationStatusIndicator();
        sendResponse({
          success: true,
          authStatus: updatedStatus,
        });
        return;
      }
    }

    sendResponse({
      success: true,
      authStatus: authStatus,
    });
  } catch (error) {
    console.error(
      "Background: Failed to perform immediate auth status check:",
      error
    );

    sendResponse({
      success: false,
      message: "Failed to check authentication status",
      error: error.message,
    });
  }
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
