// Options page script for RaterHub Task Monitor

document.addEventListener("DOMContentLoaded", () => {
  const enabledToggle = document.getElementById("enabledToggle");
  const alarmOnlyMode = document.getElementById("alarmOnlyMode");
  const alarmAndClickMode = document.getElementById("alarmAndClickMode");
  const intervalButtons = document.querySelectorAll(".interval-btn");
  const currentIntervalSpan = document.getElementById("currentInterval");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const resetBtn = document.getElementById("resetBtn");
  const saveStatus = document.getElementById("saveStatus");
  const alertSoundFile = document.getElementById("alertSoundFile");
  const alertSoundUrl = document.getElementById("alertSoundUrl");
  const saveAlertSoundBtn = document.getElementById("saveAlertSoundBtn");
  const testAlertSoundBtn = document.getElementById("testAlertSoundBtn");
  const soundErrorMsg = document.getElementById("soundErrorMsg");
  
  // New settings elements
  const desktopNotificationsToggle = document.getElementById("desktopNotificationsToggle");
  const mouseMovementToggle = document.getElementById("mouseMovementToggle");
  const incompleteTasksToggle = document.getElementById("incompleteTasksToggle");
  const errorDetectionToggle = document.getElementById("errorDetectionToggle");

  // Load current settings
  loadSettings();

  // Event listeners
  enabledToggle.addEventListener("change", handleEnabledChange);
  alarmOnlyMode.addEventListener("change", handleModeChange);
  alarmAndClickMode.addEventListener("change", handleModeChange);

  // Interval buttons
  intervalButtons.forEach((btn) => {
    btn.addEventListener("click", handleIntervalChange);
  });

  resetBtn.addEventListener("click", handleReset);
  saveAlertSoundBtn.addEventListener("click", handleSaveAlertSound);
  testAlertSoundBtn.addEventListener("click", handleTestAlertSound);
  
  // Test button toggle
  document.getElementById("showTestButton").addEventListener("change", handleShowTestButtonChange);
  
  // Sound source select
  document.getElementById("soundSourceSelect").addEventListener("change", updateSoundSourceSection);
  
  // New settings event listeners
  desktopNotificationsToggle.addEventListener("change", handleDesktopNotificationsChange);
  mouseMovementToggle.addEventListener("change", handleMouseMovementChange);
  incompleteTasksToggle.addEventListener("change", handleIncompleteTasksChange);
  errorDetectionToggle.addEventListener("change", handleErrorDetectionChange);

  function loadSettings() {
    chrome.storage.sync.get([
      "enabled", 
      "mode", 
      "refreshInterval", 
      "alertSoundType", 
      "alertSoundData",
      "showTestButton",
      "enableDesktopNotifications",
      "enableMouseMovementDetection",
      "enableIncompleteTasksHandling",
      "enableErrorDetection"
    ], (data) => {
      // Update UI elements
      document.getElementById("enabledToggle").checked = data.enabled || false;
      
      // Update radio buttons based on mode
      if (data.mode === "alarm_and_click") {
        alarmAndClickMode.checked = true;
      } else {
        alarmOnlyMode.checked = true;
      }
      
      // Update interval buttons and display
      updateIntervalButtons(data.refreshInterval || 1);
      currentIntervalSpan.textContent = data.refreshInterval || 1;
      
      // Update sound source
      document.getElementById("soundSourceSelect").value = data.alertSoundType || "default";
      document.getElementById("showTestButton").checked = data.showTestButton || false;
      
      // Update new settings
      desktopNotificationsToggle.checked = data.enableDesktopNotifications !== undefined ? data.enableDesktopNotifications : true;
      mouseMovementToggle.checked = data.enableMouseMovementDetection !== undefined ? data.enableMouseMovementDetection : true;
      incompleteTasksToggle.checked = data.enableIncompleteTasksHandling !== undefined ? data.enableIncompleteTasksHandling : true;
      errorDetectionToggle.checked = data.enableErrorDetection !== undefined ? data.enableErrorDetection : true;
      
      // Update sound source section visibility
      updateSoundSourceSection();
    });
  }

  function updateStatus(enabled) {
    if (enabled) {
      statusDot.className = "status-dot active";
      statusText.textContent = "Active - Monitoring enabled";
    } else {
      statusDot.className = "status-dot";
      statusText.textContent = "Disabled - Monitoring paused";
    }
  }

  function updateIntervalButtons(selectedInterval) {
    intervalButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (parseInt(btn.dataset.value) === selectedInterval) {
        btn.classList.add("active");
      }
    });

    currentIntervalSpan.textContent = selectedInterval;
  }

  function showSaveStatus(message = "Settings saved!", type = "success") {
    saveStatus.textContent = message;
    saveStatus.className = `save-message ${type}`;
    saveStatus.style.opacity = "1";

    setTimeout(() => {
      saveStatus.style.opacity = "0.7";
      setTimeout(() => {
        saveStatus.textContent = "Settings saved automatically";
        saveStatus.className = "save-message";
      }, 1000);
    }, 2000);
  }

  function handleEnabledChange() {
    const enabled = enabledToggle.checked;
    chrome.storage.sync.set({ enabled }, () => {
      updateStatus(enabled);
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleModeChange() {
    const mode = alarmOnlyMode.checked ? "alarm_only" : "alarm_and_click";
    chrome.storage.sync.set({ mode }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleRefreshIntervalChange() {
    // This function is no longer needed as we handle interval changes through buttons
  }

  function handleShowTestButtonChange() {
    const showTestButton = document.getElementById("showTestButton").checked;
    chrome.storage.sync.set({ showTestButton }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleIntervalChange(event) {
    const interval = parseInt(event.target.dataset.value);
    updateIntervalButtons(interval);

    chrome.storage.sync.set({ refreshInterval: interval }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  // New setting handlers
  function handleDesktopNotificationsChange() {
    const enabled = desktopNotificationsToggle.checked;
    chrome.storage.sync.set({ enableDesktopNotifications: enabled }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleMouseMovementChange() {
    const enabled = mouseMovementToggle.checked;
    chrome.storage.sync.set({ enableMouseMovementDetection: enabled }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleIncompleteTasksChange() {
    const enabled = incompleteTasksToggle.checked;
    chrome.storage.sync.set({ enableIncompleteTasksHandling: enabled }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleErrorDetectionChange() {
    const enabled = errorDetectionToggle.checked;
    chrome.storage.sync.set({ enableErrorDetection: enabled }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleReset() {
    const defaultSettings = {
      enabled: false,
      mode: "alarm_only",
      refreshInterval: 1,
      alertSoundType: "default",
      alertSoundData: "",
      showTestButton: false,
      enableDesktopNotifications: true,
      enableMouseMovementDetection: true,
      enableIncompleteTasksHandling: true,
      enableErrorDetection: true
    };
    chrome.storage.sync.set(defaultSettings, () => {
      loadSettings();
      showSaveStatus("Settings reset to defaults!", "success");
      notifyContentScript();
    });
  }

  // Save alert sound (file or URL)
  function handleSaveAlertSound() {
    soundErrorMsg.style.display = "none";
    if (alertSoundFile.files.length > 0) {
      const file = alertSoundFile.files[0];
      if (!file.name.toLowerCase().endsWith(".mp3")) {
        soundErrorMsg.textContent = "Please select an MP3 file.";
        soundErrorMsg.style.display = "inline-block";
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        const fileData = e.target.result;
        // Store in both sync and local storage for reliability
        chrome.storage.local.set({ alertSoundData: fileData }, () => {
          chrome.storage.sync.set(
            { alertSoundType: "file", alertSoundData: fileData },
            () => {
              showSaveStatus("Sound file saved!", "success");
              notifyContentScript(); // Notify popup about the change
            }
          );
        });
      };
      reader.readAsDataURL(file);
    } else if (alertSoundUrl.value.trim()) {
      const url = alertSoundUrl.value.trim();
      if (!url.match(/\.mp3($|\?)/i)) {
        soundErrorMsg.textContent = "URL must end with .mp3";
        soundErrorMsg.style.display = "inline-block";
        return;
      }
      chrome.storage.sync.set(
        { alertSoundType: "url", alertSoundData: url },
        () => {
          showSaveStatus("Sound URL saved!", "success");
          notifyContentScript(); // Notify popup about the change
        }
      );
    } else {
      chrome.storage.sync.set(
        { alertSoundType: "default", alertSoundData: "" },
        () => {
          showSaveStatus("Default sound will be used.", "success");
          notifyContentScript(); // Notify popup about the change
        }
      );
    }
  }

  // Test alert sound
  function handleTestAlertSound() {
    soundErrorMsg.style.display = "none";
    chrome.storage.sync.get(["alertSoundType", "alertSoundData"], (data) => {
      let audio;
      if (data.alertSoundType === "default") {
        // Play default alarm sound from extension
        audio = new Audio(chrome.runtime.getURL("alarm.mp3"));
        audio.volume = 1.0;
        audio.play();
      } else if (data.alertSoundType === "file" && data.alertSoundData) {
        audio = new Audio(data.alertSoundData);
        audio.volume = 1.0;
        audio.play();
      } else if (data.alertSoundType === "url" && data.alertSoundData) {
        if (!data.alertSoundData.match(/\.mp3($|\?)/i)) {
          soundErrorMsg.textContent = "URL must end with .mp3";
          soundErrorMsg.style.display = "inline-block";
          return;
        }
        audio = new Audio(data.alertSoundData);
        audio.volume = 1.0;
        audio.play();
      } else {
        soundErrorMsg.textContent = "No sound file or link selected.";
        soundErrorMsg.style.display = "inline-block";
      }
    });
  }

  // Update sound source section visibility
  function updateSoundSourceSection() {
    const soundSourceSelect = document.getElementById("soundSourceSelect");
    const fileInputContainer = document.getElementById("fileInputContainer");
    const urlInputContainer = document.getElementById("urlInputContainer");
    const alertSoundFile = document.getElementById("alertSoundFile");
    const alertSoundUrl = document.getElementById("alertSoundUrl");
    
    // Hide all containers first
    fileInputContainer.style.display = "none";
    urlInputContainer.style.display = "none";
    
    // Show appropriate container based on selection
    if (soundSourceSelect.value === "file") {
      fileInputContainer.style.display = "block";
      alertSoundUrl.value = ""; // Clear URL when switching to file
    } else if (soundSourceSelect.value === "url") {
      urlInputContainer.style.display = "block";
      alertSoundFile.value = ""; // Clear file when switching to URL
    }
  }

  // Handle alert sound data changes
  function handleAlertSoundDataChange() {
    // This function can be used for additional validation if needed
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
    
    // Also notify the popup if it's open
    chrome.runtime.sendMessage({ action: "settingsUpdated" }).catch(() => {
      // Ignore errors if popup is not open
    });
  }
});
