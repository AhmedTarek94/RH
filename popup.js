// Popup script for RaterHub Task Monitor

document.addEventListener("DOMContentLoaded", () => {
  const enabledToggle = document.getElementById("enabledToggle");
  const modeSelect = document.getElementById("modeSelect");
  const intervalSelect = document.getElementById("intervalSelect");
  const themeToggle = document.getElementById("themeToggle");
  const openOptionsBtn = document.getElementById("openOptionsBtn");
  let testAudio = null;
  let isPlaying = false;

  // Apply dark theme immediately on load (default)
  applyTheme(true);

  // Load current settings (will override theme if different)
  loadSettings();

  // Event listeners
  enabledToggle.addEventListener("change", handleEnabledChange);
  modeSelect.addEventListener("change", handleModeChange);
  intervalSelect.addEventListener("change", handleIntervalChange);
  themeToggle.addEventListener("change", handleThemeChange);
  openOptionsBtn.addEventListener("click", openOptionsPage);

  // Listen for storage changes (when options page updates settings)
  chrome.storage.onChanged.addListener(handleStorageChange);

  // Listen for messages from options page and background
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  function loadSettings() {
    chrome.storage.sync.get(
      ["enabled", "mode", "refreshInterval", "darkThemeEnabled"],
      (data) => {
        console.log("Data retrieved from storage:", data); // Log the retrieved data
        if (chrome.runtime.lastError) {
          console.error("Error accessing storage:", chrome.runtime.lastError);
          return;
        }
        let interval = data.refreshInterval;
        if (typeof interval === "string") interval = parseFloat(interval);
        if (!interval) interval = 1;
        // If settings are missing, set them to defaults
        if (!data.refreshInterval) {
          chrome.storage.sync.set({
            refreshInterval: 1,
          });
        }
        const settings = {
          enabled: data.enabled || false,
          mode: data.mode || "alarm_only",
          refreshInterval: interval,
          darkTheme: data.darkThemeEnabled || false,
        };
        updateUI(settings);
      }
    );
  }

  function updateUI(settings) {
    enabledToggle.checked = settings.enabled;
    modeSelect.value = settings.mode;
    intervalSelect.value = String(settings.refreshInterval);
    themeToggle.checked = settings.darkTheme;

    // Apply theme when loading settings
    applyTheme(settings.darkTheme);
    updateStatus(settings.enabled);
  }

  function updateStatus(enabled) {
    // No statusDot/statusText in popup.html, so do nothing
  }

  function handleEnabledChange() {
    const enabled = enabledToggle.checked;
    chrome.storage.sync.set({ enabled }, () => {
      updateStatus(enabled);
      notifyContentScript();

      // Notify options page about the specific setting change
      chrome.runtime
        .sendMessage({
          action: "settingChanged",
          setting: "enabled",
          value: enabled,
        })
        .catch(() => {
          // Ignore errors if options page is not open
        });
    });
  }

  function handleModeChange() {
    const mode = modeSelect.value;
    chrome.storage.sync.set({ mode }, () => {
      notifyContentScript();
    });
  }

  function handleIntervalChange() {
    let refreshInterval = intervalSelect.value;
    if (typeof refreshInterval === "string")
      refreshInterval = parseFloat(refreshInterval);
    chrome.storage.sync.set({ refreshInterval }, () => {
      updateUI({
        enabled: enabledToggle.checked,
        mode: modeSelect.value,
        refreshInterval,
      });
      notifyContentScript();
    });
  }

  function handleThemeChange() {
    const darkThemeEnabled = themeToggle.checked;
    chrome.storage.sync.set({ darkThemeEnabled }, () => {
      // Apply theme immediately to the popup
      applyTheme(darkThemeEnabled);
      // Notify other parts of the extension about theme change
      chrome.runtime.sendMessage({ action: "themeChanged", darkThemeEnabled });
    });
  }

  function applyTheme(darkTheme) {
    if (darkTheme) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }

  function notifyContentScript() {
    chrome.tabs.query(
      { url: "https://www.raterhub.com/evaluation/rater" },
      (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs
            .sendMessage(tab.id, { action: "settingsUpdated" })
            .catch(() => {
              // Ignore errors if content script is not ready
            });
        });
      }
    );
  }

  function openOptionsPage() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  // Handle storage changes (when settings are updated from options page)
  function handleStorageChange(changes, namespace) {
    if (namespace === "sync") {
      // Reload settings to update UI
      loadSettings();
    }
  }

  // Handle messages from options page and background
  function handleRuntimeMessage(message, sender, sendResponse) {
    console.log("Popup received message:", message.action, message);

    if (message.action === "settingsUpdated") {
      // Reload settings to update UI
      loadSettings();
    } else if (message.action === "themeChanged") {
      // Update theme based on message from options page
      applyTheme(message.darkThemeEnabled);
      themeToggle.checked = message.darkThemeEnabled;

      // If this theme change came from another source, update storage to stay in sync
      if (sender.id !== chrome.runtime.id) {
        chrome.storage.sync.set({ darkThemeEnabled: message.darkThemeEnabled });
      }
    } else if (message.action === "settingChanged") {
      // Handle individual setting changes for real-time synchronization
      console.log(`Setting changed: ${message.setting} = ${message.value}`);

      // Update the specific setting in the UI
      switch (message.setting) {
        case "enabled":
          enabledToggle.checked = message.value;
          updateStatus(message.value);
          break;
        case "mode":
          modeSelect.value = message.value;
          break;
        case "refreshInterval":
          intervalSelect.value = String(message.value);
          break;
        case "darkThemeEnabled":
          themeToggle.checked = message.value;
          applyTheme(message.value);
          break;
      }
    }
    return true; // Keep message channel open for async response
  }
});
