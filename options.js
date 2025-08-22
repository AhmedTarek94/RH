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
  const playPauseSoundBtn = document.getElementById("playPauseSoundBtn");
  const stopSoundBtn = document.getElementById("stopSoundBtn");
  const playPauseIcon = document.getElementById("playPauseIcon");
  const soundErrorMsg = document.getElementById("soundErrorMsg");
  let testAudio = null;
  let isPlaying = false;
  
  // New settings elements
  const desktopNotificationsToggle = document.getElementById("desktopNotificationsToggle");
  const mouseMovementToggle = document.getElementById("mouseMovementToggle");
  const incompleteTasksToggle = document.getElementById("incompleteTasksToggle");
  const errorDetectionToggle = document.getElementById("errorDetectionToggle");
  const themeToggle = document.getElementById("themeToggle");
  const themeStatusDot = document.getElementById("themeStatusDot");
  const themeStatusText = document.getElementById("themeStatusText");

  // Apply dark theme immediately on load (default)
  updateThemeStatus(true);
  
  // Load current settings (will override theme if different)
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
  playPauseSoundBtn.addEventListener("click", handlePlayPauseSound);
  stopSoundBtn.addEventListener("click", handleStopSound);
  
  // Test button toggle
  document.getElementById("showTestButton").addEventListener("change", handleShowTestButtonChange);
  
  // Sound source select
  document.getElementById("soundSourceSelect").addEventListener("change", updateSoundSourceSection);
  
  // Sound input event listeners
  alertSoundFile.addEventListener("change", handleFileChange);
  alertSoundUrl.addEventListener("input", handleUrlChange);
  
  // New settings event listeners
  desktopNotificationsToggle.addEventListener("change", handleDesktopNotificationsChange);
  mouseMovementToggle.addEventListener("change", handleMouseMovementChange);
  incompleteTasksToggle.addEventListener("change", handleIncompleteTasksChange);
  errorDetectionToggle.addEventListener("change", handleErrorDetectionChange);
  themeToggle.addEventListener("change", handleThemeChange);

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
      "enableErrorDetection",
      "darkThemeEnabled"
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
      
      // Update theme toggle
      themeToggle.checked = data.darkThemeEnabled || false;
      updateThemeStatus(data.darkThemeEnabled || false);
      
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

  function updateThemeStatus(isDarkTheme) {
    if (isDarkTheme) {
      themeStatusDot.className = "status-dot active";
      themeStatusText.textContent = "Dark Mode";
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      themeStatusDot.className = "status-dot";
      themeStatusText.textContent = "Light Mode";
      document.documentElement.setAttribute('data-theme', 'light');
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
      mode: "alarm_and_click",
      refreshInterval: 10,
      alertSoundType: "default",
      alertSoundData: "",
      showTestButton: false,
      enableDesktopNotifications: true,
      enableMouseMovementDetection: true,
      enableIncompleteTasksHandling: true,
      enableErrorDetection: true,
      darkThemeEnabled: true
    };
    chrome.storage.sync.set(defaultSettings, () => {
      loadSettings();
      showSaveStatus("Settings reset to defaults!", "success");
      notifyContentScript();
    });
  }


  // Play/Pause alert sound
  function handlePlayPauseSound() {
    soundErrorMsg.style.display = "none";
    chrome.storage.sync.get(["alertSoundType", "alertSoundData"], (data) => {
      if (data.alertSoundType === "default") {
        // Play default alarm sound from extension
        if (!testAudio) {
          testAudio = new Audio(chrome.runtime.getURL("alarm.mp3"));
          testAudio.volume = 1.0;
          testAudio.play();
          isPlaying = true;
          playPauseIcon.innerHTML = "&#10073;&#10073;";
          testAudio.onended = resetPlayPause;
        } else if (isPlaying) {
          testAudio.pause();
          isPlaying = false;
          playPauseIcon.innerHTML = "&#9654;";
        } else {
          testAudio.play();
          isPlaying = true;
          playPauseIcon.innerHTML = "&#10073;&#10073;";
        }
      } else if (data.alertSoundType === "file") {
        chrome.storage.local.get(["alertSoundData"], (localData) => {
          if (!localData.alertSoundData) {
            soundErrorMsg.textContent = "No MP3 file selected.";
            soundErrorMsg.style.display = "block";
            return;
          }
          if (!testAudio) {
            testAudio = new Audio(localData.alertSoundData);
            testAudio.volume = 1.0;
            testAudio.play();
            isPlaying = true;
            playPauseIcon.innerHTML = "&#10073;&#10073;";
            testAudio.onended = resetPlayPause;
          } else if (isPlaying) {
            testAudio.pause();
            isPlaying = false;
            playPauseIcon.innerHTML = "&#9654;";
          } else {
            testAudio.play();
            isPlaying = true;
            playPauseIcon.innerHTML = "&#10073;&#10073;";
          }
        });
      } else if (data.alertSoundType === "url" && data.alertSoundData) {
        if (!data.alertSoundData.match(/\.mp3($|\?)/i)) {
          soundErrorMsg.textContent = "URL must end with .mp3";
          soundErrorMsg.style.display = "block";
          return;
        }
        if (!testAudio) {
          testAudio = new Audio(data.alertSoundData);
          testAudio.volume = 1.0;
          testAudio.play();
          isPlaying = true;
          playPauseIcon.innerHTML = "&#10073;&#10073;";
          testAudio.onended = resetPlayPause;
        } else if (isPlaying) {
          testAudio.pause();
          isPlaying = false;
          playPauseIcon.innerHTML = "&#9654;";
        } else {
          testAudio.play();
          isPlaying = true;
          playPauseIcon.innerHTML = "&#10073;&#10073;";
        }
      } else {
        soundErrorMsg.textContent = "No sound file or link selected.";
        soundErrorMsg.style.display = "block";
      }
    });
  }

  function handleStopSound() {
    soundErrorMsg.style.display = "none";
    if (testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
      isPlaying = false;
      playPauseIcon.innerHTML = "&#9654;";
      testAudio = null;
    } else {
      soundErrorMsg.textContent = "No sound is playing.";
      soundErrorMsg.style.display = "block";
    }
  }

  function resetPlayPause() {
    isPlaying = false;
    playPauseIcon.innerHTML = "&#9654;";
    testAudio = null;
  }

  // Handle file selection changes
  function handleFileChange() {
    if (alertSoundFile.files.length > 0) {
      const file = alertSoundFile.files[0];
      if (!file.name.toLowerCase().endsWith(".mp3")) {
        soundErrorMsg.textContent = "Please select an MP3 file.";
        soundErrorMsg.style.display = "block";
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
    }
  }

  // Handle URL input changes
  function handleUrlChange() {
    const url = alertSoundUrl.value.trim();
    if (url) {
      if (!url.match(/\.mp3($|\?)/i)) {
        soundErrorMsg.textContent = "URL must end with .mp3";
        soundErrorMsg.style.display = "block";
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
      // If URL is empty, revert to default
      chrome.storage.sync.set(
        { alertSoundType: "default", alertSoundData: "" },
        () => {
          showSaveStatus("Default sound will be used.", "success");
          notifyContentScript(); // Notify popup about the change
        }
      );
    }
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

  function handleThemeChange() {
    const darkThemeEnabled = themeToggle.checked;
    chrome.storage.sync.set({ darkThemeEnabled }, () => {
      updateThemeStatus(darkThemeEnabled);
      showSaveStatus();
      
      // Notify all parts of the extension about theme change
      chrome.runtime.sendMessage({ 
        action: "themeChanged", 
        darkThemeEnabled 
      }).catch(() => {
        // Ignore errors if no other pages are open
      });
    });
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

  // Listen for messages from popup and background
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  function handleRuntimeMessage(message, sender, sendResponse) {
    console.log("Options received message:", message.action, message);
    
    if (message.action === 'settingsUpdated') {
      // Reload settings to update UI
      loadSettings();
    } else if (message.action === 'themeChanged') {
      // Update theme based on message from popup
      updateThemeStatus(message.darkThemeEnabled);
      themeToggle.checked = message.darkThemeEnabled;
      
      // If this theme change came from another source, update storage to stay in sync
      if (sender.id !== chrome.runtime.id) {
        chrome.storage.sync.set({ darkThemeEnabled: message.darkThemeEnabled });
      }
    } else if (message.action === 'settingChanged') {
      // Handle individual setting changes for real-time synchronization
      console.log(`Setting changed: ${message.setting} = ${message.value}`);
      
      // Update the specific setting in the UI
      switch (message.setting) {
        case 'enabled':
          enabledToggle.checked = message.value;
          updateStatus(message.value);
          break;
        case 'mode':
          if (message.value === 'alarm_only') {
            alarmOnlyMode.checked = true;
          } else {
            alarmAndClickMode.checked = true;
          }
          break;
        case 'refreshInterval':
          updateIntervalButtons(message.value);
          currentIntervalSpan.textContent = message.value;
          break;
        case 'darkThemeEnabled':
          themeToggle.checked = message.value;
          updateThemeStatus(message.value);
          break;
        case 'alertSoundType':
          document.getElementById("soundSourceSelect").value = message.value;
          updateSoundSourceSection();
          break;
        case 'alertSoundData':
          if (document.getElementById("soundSourceSelect").value === "url") {
            alertSoundUrl.value = message.value;
          }
          break;
        case 'showTestButton':
          document.getElementById("showTestButton").checked = message.value;
          break;
        case 'enableDesktopNotifications':
          desktopNotificationsToggle.checked = message.value;
          break;
        case 'enableMouseMovementDetection':
          mouseMovementToggle.checked = message.value;
          break;
        case 'enableIncompleteTasksHandling':
          incompleteTasksToggle.checked = message.value;
          break;
        case 'enableErrorDetection':
          errorDetectionToggle.checked = message.value;
          break;
      }
    }
    return true; // Keep message channel open for async response
  }
});
