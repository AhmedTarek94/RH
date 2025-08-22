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

  // Filter UI elements
  const taskTypeCheckboxes = document.querySelectorAll('#taskTypeFilter input[name="taskType"]');
  const minDurationInput = document.getElementById("minDuration");
  const maxDurationInput = document.getElementById("maxDuration");
  const timeRangeToggle = document.getElementById("timeRangeToggle");
  const timeRangeStartInput = document.getElementById("timeRangeStart");
  const timeRangeEndInput = document.getElementById("timeRangeEnd");
  const daysOfWeekCheckboxes = document.querySelectorAll('#daysOfWeekFilter input[name="day"]');
  const minRewardInput = document.getElementById("minReward");
  const presetSelect = document.getElementById("presetSelect");
  const savePresetBtn = document.getElementById("savePresetBtn");
  const deletePresetBtn = document.getElementById("deletePresetBtn");

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
      "darkThemeEnabled",
      "taskTypeFilter",
      "minDuration",
      "maxDuration",
      "timeRangeEnabled",
      "timeRangeStart",
      "timeRangeEnd",
      "daysOfWeekFilter",
      "minReward"
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
      
  // Update filter settings
  updateFilterSettings(data);
      
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

  // Filter-related functions
  function updateFilterSettings(data) {
    // Update task type checkboxes
    const taskTypeFilter = data.taskTypeFilter || ["search", "evaluation", "comparison"];
    taskTypeCheckboxes.forEach(checkbox => {
      checkbox.checked = taskTypeFilter.includes(checkbox.value);
    });

    // Update duration inputs
    minDurationInput.value = data.minDuration || 1;
    maxDurationInput.value = data.maxDuration || 60;

    // Update time range settings
    timeRangeToggle.checked = data.timeRangeEnabled || false;
    timeRangeStartInput.value = data.timeRangeStart || "09:00";
    timeRangeEndInput.value = data.timeRangeEnd || "17:00";
    updateTimeRangeVisibility();

    // Update days of week checkboxes
    const daysOfWeekFilter = data.daysOfWeekFilter || ["mon", "tue", "wed", "thu", "fri"];
    daysOfWeekCheckboxes.forEach(checkbox => {
      checkbox.checked = daysOfWeekFilter.includes(checkbox.value);
    });

    // Update minimum reward
    minRewardInput.value = data.minReward || 0.05;

    // Update preset dropdown
    updatePresetDropdown();
  }

  function updateTimeRangeVisibility() {
    const timeRangeContainer = document.getElementById("timeRangeContainer");
    if (timeRangeToggle.checked) {
      timeRangeContainer.style.display = "block";
    } else {
      timeRangeContainer.style.display = "none";
    }
  }

  function updatePresetDropdown() {
    // This would load saved presets from storage
    chrome.storage.sync.get(["filterPresets"], (data) => {
      const presets = data.filterPresets || {};
      presetSelect.innerHTML = '<option value="">Select a preset...</option>';
      
      for (const [name, preset] of Object.entries(presets)) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        presetSelect.appendChild(option);
      }
    });
  }

  function handleTaskTypeChange() {
    const selectedTypes = Array.from(taskTypeCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    chrome.storage.sync.set({ taskTypeFilter: selectedTypes }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleDurationChange() {
    const minDuration = parseInt(minDurationInput.value) || 1;
    const maxDuration = parseInt(maxDurationInput.value) || 60;
    
    // Validate min <= max
    if (minDuration > maxDuration) {
      minDurationInput.value = maxDuration;
      chrome.storage.sync.set({ 
        minDuration: maxDuration, 
        maxDuration: maxDuration 
      }, () => {
        showSaveStatus("Duration range adjusted", "success");
        notifyContentScript();
      });
    } else {
      chrome.storage.sync.set({ 
        minDuration: minDuration, 
        maxDuration: maxDuration 
      }, () => {
        showSaveStatus();
        notifyContentScript();
      });
    }
  }

  function handleTimeRangeToggle() {
    const enabled = timeRangeToggle.checked;
    chrome.storage.sync.set({ timeRangeEnabled: enabled }, () => {
      updateTimeRangeVisibility();
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleTimeRangeChange() {
    const startTime = timeRangeStartInput.value;
    const endTime = timeRangeEndInput.value;
    
    chrome.storage.sync.set({ 
      timeRangeStart: startTime, 
      timeRangeEnd: endTime 
    }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleDaysOfWeekChange() {
    const selectedDays = Array.from(daysOfWeekCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    chrome.storage.sync.set({ daysOfWeekFilter: selectedDays }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleMinRewardChange() {
    const minReward = parseFloat(minRewardInput.value) || 0.05;
    chrome.storage.sync.set({ minReward: minReward }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handlePresetSelect() {
    const presetName = presetSelect.value;
    if (!presetName) return;

    chrome.storage.sync.get(["filterPresets"], (data) => {
      const presets = data.filterPresets || {};
      const preset = presets[presetName];
      
      if (preset) {
        // Apply the preset settings
        chrome.storage.sync.set(preset, () => {
          loadSettings();
          showSaveStatus(`Preset "${presetName}" applied!`, "success");
          notifyContentScript();
        });
      }
    });
  }

  function handleSavePreset() {
    const presetName = prompt("Enter a name for this preset:");
    if (!presetName) return;

    // Get current filter settings
    chrome.storage.sync.get([
      "taskTypeFilter", "minDuration", "maxDuration", 
      "timeRangeEnabled", "timeRangeStart", "timeRangeEnd",
      "daysOfWeekFilter", "minReward"
    ], (data) => {
      const preset = {
        taskTypeFilter: data.taskTypeFilter || ["search", "evaluation", "comparison"],
        minDuration: data.minDuration || 1,
        maxDuration: data.maxDuration || 60,
        timeRangeEnabled: data.timeRangeEnabled || false,
        timeRangeStart: data.timeRangeStart || "09:00",
        timeRangeEnd: data.timeRangeEnd || "17:00",
        daysOfWeekFilter: data.daysOfWeekFilter || ["mon", "tue", "wed", "thu", "fri"],
        minReward: data.minReward || 0.05
      };

      // Save the preset
      chrome.storage.sync.get(["filterPresets"], (storageData) => {
        const presets = storageData.filterPresets || {};
        presets[presetName] = preset;
        
        chrome.storage.sync.set({ filterPresets: presets }, () => {
          updatePresetDropdown();
          showSaveStatus(`Preset "${presetName}" saved!`, "success");
        });
      });
    });
  }

  function handleDeletePreset() {
    const presetName = presetSelect.value;
    if (!presetName) {
      alert("Please select a preset to delete.");
      return;
    }

    if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
      chrome.storage.sync.get(["filterPresets"], (data) => {
        const presets = data.filterPresets || {};
        delete presets[presetName];
        
        chrome.storage.sync.set({ filterPresets: presets }, () => {
          updatePresetDropdown();
          showSaveStatus(`Preset "${presetName}" deleted!`, "success");
        });
      });
    }
  }

  // Add event listeners for filter controls
  taskTypeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", handleTaskTypeChange);
  });

  minDurationInput.addEventListener("change", handleDurationChange);
  maxDurationInput.addEventListener("change", handleDurationChange);
  timeRangeToggle.addEventListener("change", handleTimeRangeToggle);
  timeRangeStartInput.addEventListener("change", handleTimeRangeChange);
  timeRangeEndInput.addEventListener("change", handleTimeRangeChange);
  daysOfWeekCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", handleDaysOfWeekChange);
  });
  minRewardInput.addEventListener("change", handleMinRewardChange);
  presetSelect.addEventListener("change", handlePresetSelect);
  savePresetBtn.addEventListener("click", handleSavePreset);
  deletePresetBtn.addEventListener("click", handleDeletePreset);

  // Initialize time range visibility
  updateTimeRangeVisibility();

  // Tab switching functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show corresponding tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Filtering master switch functionality
  const filteringToggle = document.getElementById("filteringToggle");
  const filteringStatusDot = document.getElementById("filteringStatusDot");
  const filteringStatusText = document.getElementById("filteringStatusText");

  filteringToggle.addEventListener("change", handleFilteringToggleChange);

  function handleFilteringToggleChange() {
    const enabled = filteringToggle.checked;
    chrome.storage.sync.set({ filteringEnabled: enabled }, () => {
      updateFilteringStatus(enabled);
      showSaveStatus();
      notifyContentScript();
    });
  }

  function updateFilteringStatus(enabled) {
    if (enabled) {
      filteringStatusDot.className = "status-dot active";
      filteringStatusText.textContent = "Filtering Enabled";
    } else {
      filteringStatusDot.className = "status-dot";
      filteringStatusText.textContent = "Filtering Disabled";
    }
  }

  // Load filtering enabled state
  chrome.storage.sync.get(["filteringEnabled"], (data) => {
    filteringToggle.checked = data.filteringEnabled || false;
    updateFilteringStatus(data.filteringEnabled || false);
  });

  // Compact mode functionality
  const compactModeToggle = document.getElementById('compactModeToggle');

  function setupCompactModeToggle() {
    compactModeToggle.addEventListener('click', () => {
      const isCompact = document.body.classList.toggle('compact-mode');
      compactModeToggle.classList.toggle('compact', isCompact);
      chrome.storage.sync.set({ compactMode: isCompact });
      
      // Update button text based on mode
      compactModeToggle.innerHTML = isCompact ? '📋' : '📱';
      compactModeToggle.title = isCompact ? 'Switch to regular view' : 'Switch to compact view';
    });
  }

  function loadCompactMode() {
    chrome.storage.sync.get(['compactMode'], (data) => {
      const isCompact = data.compactMode || false;
      if (isCompact) {
        document.body.classList.add('compact-mode');
        compactModeToggle.classList.add('compact');
        compactModeToggle.innerHTML = '📋';
        compactModeToggle.title = 'Switch to regular view';
      } else {
        document.body.classList.remove('compact-mode');
        compactModeToggle.classList.remove('compact');
        compactModeToggle.innerHTML = '📱';
        compactModeToggle.title = 'Switch to compact view';
      }
    });
  }

  // Setup and load compact mode
  setupCompactModeToggle();
  loadCompactMode();
});
