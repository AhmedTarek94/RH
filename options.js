// Options page script for RaterHub Task Monitor

document.addEventListener("DOMContentLoaded", async () => {
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
  const desktopNotificationsToggle = document.getElementById(
    "desktopNotificationsToggle"
  );
  const mouseMovementToggle = document.getElementById("mouseMovementToggle");
  const incompleteTasksToggle = document.getElementById(
    "incompleteTasksToggle"
  );
  const errorDetectionToggle = document.getElementById("errorDetectionToggle");
  const themeToggle = document.getElementById("themeToggle");
  const themeStatusDot = document.getElementById("themeStatusDot");
  const themeStatusText = document.getElementById("themeStatusText");

  // Apply dark theme immediately on load (default)
  updateThemeStatus(true);

  // Initialize tab functionality
  initializeTabs();

  // Load and display extension version
  loadExtensionVersion();

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

  // Test switch toggle
  const testSwitchLabel = document.getElementById("testSwitchLabel");
  const testSwitchSlider = document.getElementById("testSwitchSlider");
  if (testSwitchLabel && testSwitchSlider) {
    testSwitchLabel.addEventListener("click", handleTestSwitchToggle);
  }

  // Sound source select
  document
    .getElementById("soundSourceSelect")
    .addEventListener("change", updateSoundSourceSection);

  // Sound input event listeners
  alertSoundFile.addEventListener("change", handleFileChange);
  alertSoundUrl.addEventListener("input", handleUrlChange);

  // New settings event listeners
  desktopNotificationsToggle.addEventListener(
    "change",
    handleDesktopNotificationsChange
  );
  mouseMovementToggle.addEventListener("change", handleMouseMovementChange);
  incompleteTasksToggle.addEventListener("change", handleIncompleteTasksChange);
  errorDetectionToggle.addEventListener("change", handleErrorDetectionChange);
  themeToggle.addEventListener("change", handleThemeChange);

  function loadSettings() {
    if (!chrome.storage || !chrome.storage.sync) {
      console.error("chrome.storage.sync is not available.");
      // Fallback or show error message in UI if needed
      return;
    }
    chrome.storage.sync.get(
      [
        "enabled",
        "mode",
        "refreshInterval",
        "alertSoundType",
        "alertSoundData",
        "alertSoundFileName",
        "showTestButton",
        "enableDesktopNotifications",
        "enableMouseMovementDetection",
        "enableIncompleteTasksHandling",
        "enableErrorDetection",
        "darkThemeEnabled",
      ],
      (data) => {
        // Update UI elements
        const enabled = data.enabled || false;
        document.getElementById("enabledToggle").checked = enabled;
        updateStatus(enabled); // Update status text and dot to match toggle state

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
        document.getElementById("soundSourceSelect").value =
          data.alertSoundType || "default";
        const testSwitchSlider = document.getElementById("testSwitchSlider");
        if (testSwitchSlider) {
          if (data.showTestButton) {
            testSwitchSlider.classList.add("checked");
          } else {
            testSwitchSlider.classList.remove("checked");
          }
        }

        // Load persistent file name only if sound source is file and name exists
        if (data.alertSoundType === "file" && data.alertSoundFileName) {
          updateSelectedFileName(data.alertSoundFileName);
        } else {
          updateSelectedFileName("");
          // Ensure storage is updated to reflect the reset if not already empty
          if (data.alertSoundFileName) {
            chrome.storage.sync.set({ alertSoundFileName: "" });
          }
        }

        // Update new settings
        desktopNotificationsToggle.checked =
          data.enableDesktopNotifications !== undefined
            ? data.enableDesktopNotifications
            : true;
        mouseMovementToggle.checked =
          data.enableMouseMovementDetection !== undefined
            ? data.enableMouseMovementDetection
            : true;
        incompleteTasksToggle.checked =
          data.enableIncompleteTasksHandling !== undefined
            ? data.enableIncompleteTasksHandling
            : true;
        errorDetectionToggle.checked =
          data.enableErrorDetection !== undefined
            ? data.enableErrorDetection
            : true;

        // Update theme toggle
        themeToggle.checked = data.darkThemeEnabled || false;
        updateThemeStatus(data.darkThemeEnabled || false);

        // Update sound source section visibility
        updateSoundSourceSection();
      }
    );
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
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      themeStatusDot.className = "status-dot";
      themeStatusText.textContent = "Light Mode";
      document.documentElement.setAttribute("data-theme", "light");
    }
  }

  function updateIntervalButtons(selectedInterval) {
    intervalButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (parseFloat(btn.dataset.value) === selectedInterval) {
        btn.classList.add("active");
      }
    });

    currentIntervalSpan.textContent = selectedInterval;
  }

  function showSaveStatus(message = "Settings saved!", type = "success") {
    if (!saveStatus) {
      console.error("saveStatus element not found");
      return;
    }
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

      // Notify popup about the specific setting change
      chrome.runtime
        .sendMessage({
          action: "settingChanged",
          setting: "enabled",
          value: enabled,
        })
        .catch(() => {
          // Ignore errors if popup is not open
        });
    });
  }

  function handleModeChange() {
    const mode = alarmOnlyMode.checked ? "alarm_only" : "alarm_and_click";
    chrome.storage.sync.set({ mode }, () => {
      showSaveStatus();
      notifyContentScript();

      // Notify popup about the specific setting change
      chrome.runtime
        .sendMessage({
          action: "settingChanged",
          setting: "mode",
          value: mode,
        })
        .catch(() => {
          // Ignore errors if popup is not open
        });
    });
  }

  function handleTestSwitchToggle() {
    const testSwitchSlider = document.getElementById("testSwitchSlider");
    if (!testSwitchSlider) return;

    const isChecked = testSwitchSlider.classList.contains("checked");
    const newValue = !isChecked;

    if (newValue) {
      testSwitchSlider.classList.add("checked");
    } else {
      testSwitchSlider.classList.remove("checked");
    }

    chrome.storage.sync.set({ showTestButton: newValue }, () => {
      showSaveStatus();
      notifyContentScript();
    });
  }

  function handleIntervalChange(event) {
    const interval = parseFloat(event.target.dataset.value);
    updateIntervalButtons(interval);

    chrome.storage.sync.set({ refreshInterval: interval }, () => {
      showSaveStatus();
      notifyContentScript();

      // Notify popup about the specific setting change
      chrome.runtime
        .sendMessage({
          action: "settingChanged",
          setting: "refreshInterval",
          value: interval,
        })
        .catch(() => {
          // Ignore errors if popup is not open
        });
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
      alertSoundFileName: "",
      showTestButton: false,
      enableDesktopNotifications: true,
      enableMouseMovementDetection: true,
      enableIncompleteTasksHandling: true,
      enableErrorDetection: true,
      darkThemeEnabled: true,
    };
    chrome.storage.sync.set(defaultSettings, () => {
      loadSettings();
      showSaveStatus("Settings reset to defaults!", "success");
      notifyContentScript();
    });
  }

  // Play/Pause alert sound
  async function handlePlayPauseSound() {
    if (soundErrorMsg) {
      soundErrorMsg.style.display = "none";
    }
    chrome.storage.sync.get(
      ["alertSoundType", "alertSoundData"],
      async (data) => {
        const soundType = data.alertSoundType || "default";

        if (soundType === "default") {
          // Play default alarm sound from extension
          if (!testAudio) {
            testAudio = new Audio(chrome.runtime.getURL("alarm.mp3"));
            testAudio.volume = 1.0;
            testAudio.onended = resetPlayPause;
            try {
              await testAudio.play();
              isPlaying = true;
              playPauseIcon.innerHTML = "&#10073;&#10073;";
            } catch (error) {
              console.error("Error playing default alarm sound:", error);
              if (soundErrorMsg) {
                soundErrorMsg.textContent =
                  "Unable to play sound. Please try again or check browser settings.";
                soundErrorMsg.style.display = "block";
              }
              testAudio = null;
            }
          } else if (isPlaying) {
            testAudio.pause();
            isPlaying = false;
            playPauseIcon.innerHTML = "&#9654;";
          } else {
            try {
              await testAudio.play();
              isPlaying = true;
              playPauseIcon.innerHTML = "&#10073;&#10073;";
            } catch (error) {
              console.error("Error resuming default alarm sound:", error);
              if (soundErrorMsg) {
                soundErrorMsg.textContent =
                  "Unable to resume sound. Please try again.";
                soundErrorMsg.style.display = "block";
              }
            }
          }
        } else if (soundType === "file") {
          chrome.storage.local.get(["alertSoundData"], async (localData) => {
            if (!localData.alertSoundData) {
              if (soundErrorMsg) {
                soundErrorMsg.textContent =
                  "No MP3 file selected. Please choose a file first.";
                soundErrorMsg.style.display = "block";
              }
              return;
            }
            if (!testAudio) {
              testAudio = new Audio(localData.alertSoundData);
              testAudio.volume = 1.0;
              testAudio.onended = resetPlayPause;
              try {
                await testAudio.play();
                isPlaying = true;
                playPauseIcon.innerHTML = "&#10073;&#10073;";
              } catch (error) {
                console.error("Error playing file sound:", error);
                if (soundErrorMsg) {
                  soundErrorMsg.textContent =
                    "Unable to play sound file. Please try again.";
                  soundErrorMsg.style.display = "block";
                }
                testAudio = null;
              }
            } else if (isPlaying) {
              testAudio.pause();
              isPlaying = false;
              playPauseIcon.innerHTML = "&#9654;";
            } else {
              try {
                await testAudio.play();
                isPlaying = true;
                playPauseIcon.innerHTML = "&#10073;&#10073;";
              } catch (error) {
                console.error("Error resuming file sound:", error);
                if (soundErrorMsg) {
                  soundErrorMsg.textContent =
                    "Unable to resume sound. Please try again.";
                  soundErrorMsg.style.display = "block";
                }
              }
            }
          });
        } else if (soundType === "url") {
          if (!data.alertSoundData) {
            if (soundErrorMsg) {
              soundErrorMsg.textContent =
                "No URL provided. Please enter a valid MP3 URL first.";
              soundErrorMsg.style.display = "block";
            }
            return;
          }
          if (!data.alertSoundData.match(/\.mp3($|\?)/i)) {
            if (soundErrorMsg) {
              soundErrorMsg.textContent = "URL must end with .mp3";
              soundErrorMsg.style.display = "block";
            }
            return;
          }
          if (!testAudio) {
            testAudio = new Audio(data.alertSoundData);
            testAudio.volume = 1.0;
            testAudio.onended = resetPlayPause;
            try {
              await testAudio.play();
              isPlaying = true;
              playPauseIcon.innerHTML = "&#10073;&#10073;";
            } catch (error) {
              console.error("Error playing URL sound:", error);
              if (soundErrorMsg) {
                soundErrorMsg.textContent =
                  "Unable to play sound from URL. Please check the URL and try again.";
                soundErrorMsg.style.display = "block";
              }
              testAudio = null;
            }
          } else if (isPlaying) {
            testAudio.pause();
            isPlaying = false;
            playPauseIcon.innerHTML = "&#9654;";
          } else {
            try {
              await testAudio.play();
              isPlaying = true;
              playPauseIcon.innerHTML = "&#10073;&#10073;";
            } catch (error) {
              console.error("Error resuming URL sound:", error);
              if (soundErrorMsg) {
                soundErrorMsg.textContent =
                  "Unable to resume sound. Please try again.";
                soundErrorMsg.style.display = "block";
              }
            }
          }
        }
      }
    );
  }

  function handleStopSound() {
    if (soundErrorMsg) {
      soundErrorMsg.style.display = "none";
    }
    if (testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
      isPlaying = false;
      playPauseIcon.innerHTML = "&#9654;";
      testAudio = null;
    } else {
      if (soundErrorMsg) {
        soundErrorMsg.textContent = "No sound is playing.";
        soundErrorMsg.style.display = "block";
      }
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
        // Store in local storage only for reliability
        chrome.storage.local.set({ alertSoundData: fileData }, () => {
          // Update sync storage with file type and persistent file name
          chrome.storage.sync.set(
            {
              alertSoundType: "file",
              alertSoundFileName: file.name,
            },
            () => {
              updateSelectedFileName(file.name);
              showSaveStatus("Sound file saved!", "success");
              notifyContentScript(); // Notify popup about the change
            }
          );
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Handle case when no file is selected (clear selection)
      chrome.storage.local.set({ alertSoundData: "" });
      chrome.storage.sync.set({
        alertSoundType: "file",
        alertSoundFileName: "",
      });
      updateSelectedFileName("");
      showSaveStatus("Sound file cleared!", "success");
      notifyContentScript();
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
        { alertSoundType: "url", alertSoundData: url, alertSoundFileName: "" },
        () => {
          showSaveStatus("Sound URL saved!", "success");
          notifyContentScript(); // Notify popup about the change
        }
      );
    } else {
      // If URL is empty, revert to default
      chrome.storage.sync.set(
        {
          alertSoundType: "default",
          alertSoundData: "",
          alertSoundFileName: "",
        },
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
      // Load file name from storage if available
      chrome.storage.sync.get(["alertSoundFileName"], (data) => {
        if (data.alertSoundFileName) {
          updateSelectedFileName(data.alertSoundFileName);
        } else {
          updateSelectedFileName("");
        }
      });
    } else if (soundSourceSelect.value === "url") {
      urlInputContainer.style.display = "block";
      alertSoundFile.value = ""; // Clear file when switching to URL
      // Clear file name when switching to URL
      updateSelectedFileName("");
    } else {
      // Clear file name when switching to default
      updateSelectedFileName("");
    }
  }

  function updateSelectedFileName(fileName) {
    const fileInputLabel = document.querySelector(
      'label[for="alertSoundFile"]'
    );
    if (fileName) {
      fileInputLabel.textContent = fileName;
    } else {
      fileInputLabel.textContent = "Choose MP3 file";
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
      chrome.runtime
        .sendMessage({
          action: "themeChanged",
          darkThemeEnabled,
        })
        .catch(() => {
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

    if (message.action === "settingsUpdated") {
      // Reload settings to update UI
      loadSettings();
    } else if (message.action === "themeChanged") {
      // Update theme based on message from popup
      updateThemeStatus(message.darkThemeEnabled);
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
          if (message.value === "alarm_only") {
            alarmOnlyMode.checked = true;
          } else {
            alarmAndClickMode.checked = true;
          }
          break;
        case "refreshInterval":
          updateIntervalButtons(message.value);
          currentIntervalSpan.textContent = message.value;
          break;
        case "darkThemeEnabled":
          themeToggle.checked = message.value;
          updateThemeStatus(message.value);
          break;
        case "alertSoundType":
          document.getElementById("soundSourceSelect").value = message.value;
          updateSoundSourceSection();
          break;
        case "alertSoundData":
          if (document.getElementById("soundSourceSelect").value === "url") {
            alertSoundUrl.value = message.value;
          }
          break;

        case "showTestButton":
          const testSwitchSlider = document.getElementById("testSwitchSlider");
          if (testSwitchSlider) {
            if (message.value) {
              testSwitchSlider.classList.add("checked");
            } else {
              testSwitchSlider.classList.remove("checked");
            }
          }
          break;
        case "enableDesktopNotifications":
          desktopNotificationsToggle.checked = message.value;
          break;
        case "enableMouseMovementDetection":
          mouseMovementToggle.checked = message.value;
          break;
        case "enableIncompleteTasksHandling":
          incompleteTasksToggle.checked = message.value;
          break;
        case "enableErrorDetection":
          errorDetectionToggle.checked = message.value;
          break;
      }
    }
    return true; // Keep message channel open for async response
  }

  // Tab switching functionality
  function initializeTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetTab = button.getAttribute("data-tab");

        // Remove active class from all buttons and contents
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        // Add active class to clicked button and corresponding content
        button.classList.add("active");
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add("active");
        }
      });
    });

    // Initialize Gmail notifications tab controls
    initializeGmailNotificationsControls();
  }

  function initializeGmailNotificationsControls() {
    const gmailToggle = document.getElementById("gmailNotificationsToggle");
    const emailInput = document.getElementById("notificationEmailInput");
    const authBtn = document.getElementById("gmailAuthBtn");
    const authStatusDot = document.getElementById("gmailAuthStatusDot");
    const authStatusText = document.getElementById("gmailAuthStatusText");
    const testEmailBtn = document.getElementById("testEmailBtn");
    const testEmailStatus = document.getElementById("testEmailStatus");
    const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
    const notificationHistory = document.getElementById("notificationHistory");

    // Load initial settings and check authentication status
    loadGmailSettings();

    // Event listeners
    gmailToggle.addEventListener("change", () => {
      chrome.storage.sync.set({
        enableGmailNotifications: gmailToggle.checked,
      });
      showSaveStatus();
    });

    // Remove automatic saving on input change - will save only when save button is clicked

    // Handle form submission for email save button
    const emailForm = document.getElementById("notificationEmailForm");
    emailForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent page reload
      const emailValue = emailInput.value.trim();

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailValue) {
        showEmailError("Please enter an email address.");
        return;
      }
      if (!emailRegex.test(emailValue)) {
        showEmailError("Please enter a valid email address.");
        return;
      }

      // Clear any previous error
      clearEmailError();

      // Save the email
      chrome.storage.sync.set({ notificationEmail: emailValue }, () => {
        showSaveStatus("Email address saved successfully!", "success");
      });
    });

    authBtn.addEventListener("click", handleAuthButtonClick);

    const clearBtn = document.getElementById("gmailClearBtn");
    clearBtn.addEventListener("click", handleClearAuth);

    testEmailBtn.addEventListener("click", handleTestEmail);

    refreshHistoryBtn.addEventListener("click", () => {
      loadNotificationHistory();
    });

    // Load notification history initially
    loadNotificationHistory();

    // Check authentication status more frequently for better responsiveness
    setInterval(checkAuthenticationStatus, 2000); // Check every 2 seconds

    // Also check immediately when page loads and when tab becomes visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkAuthenticationStatus();
      }
    });

    // Check status when Gmail tab becomes active
    const gmailTab = document.querySelector('[data-tab="gmail-notifications"]');
    if (gmailTab) {
      gmailTab.addEventListener("click", () => {
        setTimeout(checkAuthenticationStatus, 100); // Small delay to ensure tab is active
      });
    }

    // Listen for authentication status changes from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "authStatusChanged") {
        console.log(
          "Options: Received auth status change:",
          message.authStatus
        );
        updateAuthStatusUI(message.authStatus);
        return true;
      }
    });

    function loadGmailSettings() {
      chrome.storage.sync.get(
        ["enableGmailNotifications", "notificationEmail"],
        (data) => {
          gmailToggle.checked = data.enableGmailNotifications || false;
          emailInput.value = data.notificationEmail || "";
        }
      );

      // Check current authentication status
      checkAuthenticationStatus();
    }

    async function checkAuthenticationStatus() {
      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: "getGmailAuthStatus" }, resolve);
        });

        if (response && response.authStatus) {
          updateAuthStatusUI(response.authStatus);
        } else {
          // Fallback to stored status if service worker is not available
          chrome.storage.sync.get(["gmailAuthStatus"], (data) => {
            updateAuthStatusUI({
              status: data.gmailAuthStatus || "not_authenticated",
            });
          });
        }
      } catch (error) {
        console.error("Failed to check authentication status:", error);
        updateAuthStatusUI({
          status: "error",
          message: "Unable to check status",
        });
      }
    }

    function updateAuthStatusUI(authStatus) {
      const status = authStatus.status || "not_authenticated";
      const message = authStatus.message || getDefaultStatusMessage(status);

      // Update status dot
      if (status === "authenticated") {
        authStatusDot.classList.add("active");
        authStatusDot.classList.remove("warning", "error");
      } else if (
        status === "token_expired" ||
        status === "authentication_required"
      ) {
        authStatusDot.classList.add("warning");
        authStatusDot.classList.remove("active", "error");
      } else if (status === "error" || status.includes("error")) {
        authStatusDot.classList.add("error");
        authStatusDot.classList.remove("active", "warning");
      } else {
        authStatusDot.classList.remove("active", "warning", "error");
      }

      // Update status text
      authStatusText.textContent = message;

      // Update user name display
      updateUserNameDisplay(status);

      // Update button state and text
      updateAuthButton(status, message);
    }

    function getDefaultStatusMessage(status) {
      switch (status) {
        case "not_authenticated":
          return "Not Authenticated";
        case "authenticating":
          return "Authenticating...";
        case "authenticated":
          return "Authenticated";
        case "token_expired":
          return "Token Expired";
        case "authentication_required":
          return "Re-authentication Required";
        case "authentication_error":
          return "Authentication Error";
        case "authentication_failed":
          return "Authentication Failed";
        default:
          return "Unknown Status";
      }
    }

    function updateAuthButton(status, message) {
      switch (status) {
        case "authenticated":
          authBtn.textContent = "Re-authenticate";
          authBtn.disabled = false;
          authBtn.title = "Re-authenticate with Gmail";
          break;
        case "authenticating":
          authBtn.textContent = "Authenticating...";
          authBtn.disabled = true;
          authBtn.title = "Authentication in progress";
          break;
        case "token_expired":
        case "authentication_required":
          authBtn.textContent = "Re-authenticate";
          authBtn.disabled = false;
          authBtn.title =
            "Your authentication has expired. Click to re-authenticate.";
          break;
        case "error":
        case "authentication_error":
        case "authentication_failed":
          authBtn.textContent = "Try Again";
          authBtn.disabled = false;
          authBtn.title = "Authentication failed. Click to try again.";
          break;
        default:
          authBtn.textContent = "Authenticate";
          authBtn.disabled = false;
          authBtn.title = "Authenticate with Gmail";
          break;
      }
    }

    async function updateUserNameDisplay(status) {
      const userNameElement = document.getElementById("gmailAuthUserName");

      if (status === "authenticated") {
        try {
          // Fetch user profile information
          const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              { action: "getGmailUserProfile" },
              resolve
            );
          });

          if (response && response.success && response.profile) {
            const emailAddress = response.profile.emailAddress;
            if (userNameElement) {
              try {
                userNameElement.textContent = `Authenticated as: ${emailAddress}`;
                userNameElement.style.display = "block";
              } catch (e) {
                console.error(
                  "Error setting userNameElement textContent or style:",
                  e
                );
              }
            }
          } else {
            if (userNameElement) {
              try {
                userNameElement.textContent = "Authenticated user";
                userNameElement.style.display = "block";
              } catch (e) {
                console.error(
                  "Error setting userNameElement textContent or style:",
                  e
                );
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          if (userNameElement) {
            try {
              userNameElement.textContent = "Authenticated user";
              userNameElement.style.display = "block";
            } catch (e) {
              console.error(
                "Error setting userNameElement textContent or style:",
                e
              );
            }
          }
        }
      } else {
        if (userNameElement) {
          try {
            userNameElement.style.display = "none";
            userNameElement.textContent = "";
          } catch (e) {
            console.error(
              "Error setting userNameElement textContent or style:",
              e
            );
          }
        }
      }
    }

    async function handleAuthButtonClick() {
      const currentStatus = authStatusText.textContent;

      // Update UI to show authentication in progress
      updateAuthStatusUI({
        status: "authenticating",
        message: "Authenticating...",
      });

      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: "gmailAuthenticate" }, resolve);
        });

        if (response && response.success) {
          updateAuthStatusUI({
            status: "authenticated",
            message: "Authenticated",
          });
          showSaveStatus("Gmail authentication successful!", "success");
        } else {
          const errorMessage = response?.message || "Authentication failed";
          updateAuthStatusUI({
            status: "authentication_error",
            message: errorMessage,
          });
          showSaveStatus("Authentication failed", "error");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        updateAuthStatusUI({
          status: "authentication_error",
          message: "Authentication failed",
        });
        showSaveStatus("Authentication failed", "error");
      }
    }

    async function handleClearAuth() {
      try {
        // Clear authentication data by sending message to background script
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: "clearGmailAuth" }, resolve);
        });

        if (response && response.success) {
          // Update UI to show not authenticated status
          updateAuthStatusUI({
            status: "not_authenticated",
            message: "Not Authenticated",
          });
          showSaveStatus("Gmail authentication cleared!", "success");
        } else {
          const errorMessage =
            response?.message || "Failed to clear authentication";
          console.error("Clear auth error:", errorMessage);
          showSaveStatus("Failed to clear authentication", "error");
        }
      } catch (error) {
        console.error("Clear auth error:", error);
        showSaveStatus("Failed to clear authentication", "error");
      }
    }

    async function handleTestEmail() {
      if (!testEmailStatus) {
        console.error("testEmailStatus element not found");
        return;
      }
      testEmailStatus.style.display = "none";

      // Check if authenticated first
      const authStatus = await getCurrentAuthStatus();
      if (!authStatus.authenticated) {
        testEmailStatus.textContent = "Please authenticate with Gmail first.";
        testEmailStatus.style.color = "red";
        testEmailStatus.style.display = "block";
        return;
      }

      // Check if email is configured
      if (!emailInput.value.trim()) {
        testEmailStatus.textContent =
          "Please enter a notification email address first.";
        testEmailStatus.style.color = "red";
        testEmailStatus.style.display = "block";
        return;
      }

      testEmailStatus.textContent = "Sending test email...";
      testEmailStatus.style.color = "blue";
      testEmailStatus.style.display = "block";

      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: "sendTestEmail" }, resolve);
        });

        if (response && response.success) {
          testEmailStatus.textContent = "Test email sent successfully!";
          testEmailStatus.style.color = "green";
          showSaveStatus("Test email sent!", "success");
        } else {
          const errorMessage = response?.message || "Failed to send test email";
          testEmailStatus.textContent = errorMessage;
          testEmailStatus.style.color = "red";
          showSaveStatus("Test email failed", "error");
        }
      } catch (error) {
        console.error("Test email error:", error);
        testEmailStatus.textContent = "Failed to send test email.";
        testEmailStatus.style.color = "red";
        showSaveStatus("Test email failed", "error");
      }
    }

    async function getCurrentAuthStatus() {
      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: "getGmailAuthStatus" }, resolve);
        });
        return response?.authStatus || { authenticated: false };
      } catch (error) {
        return { authenticated: false };
      }
    }

    function loadNotificationHistory() {
      chrome.storage.local.get(["notificationHistory"], (data) => {
        const history = data.notificationHistory || [];
        notificationHistory.innerHTML = "";

        if (history.length === 0) {
          notificationHistory.innerHTML = `
        <div class="history-item">
          <div class="history-content">
            <div class="history-title">No notifications sent yet</div>
            <div class="history-meta">Configure Gmail notifications to see history</div>
          </div>
        </div>`;
          return;
        }

        // Create scrollable container with max height for 4 entries
        const scrollContainer = document.createElement("div");
        scrollContainer.style.maxHeight = "240px"; // Approx height for 4 entries
        scrollContainer.style.overflowY = "auto";
        scrollContainer.style.border = "1px solid var(--gray-300)";
        scrollContainer.style.borderRadius = "6px";
        scrollContainer.style.padding = "8px";

        // Display most recent first (no reverse)
        history.forEach((item) => {
          const itemDiv = document.createElement("div");
          itemDiv.className = "history-item";

          const contentDiv = document.createElement("div");
          contentDiv.className = "history-content";

          const titleDiv = document.createElement("div");
          titleDiv.className = "history-title";
          const notificationType =
            item.type === "test" ? "Test Email" : "Task Notification";
          titleDiv.textContent = `${notificationType} sent to ${
            item.email
          } at ${new Date(item.timestamp).toLocaleString()}`;

          const metaDiv = document.createElement("div");
          metaDiv.className = "history-meta";
          metaDiv.textContent = `Status: ${item.status}${
            item.errorMessage ? " - " + item.errorMessage : ""
          }`;

          contentDiv.appendChild(titleDiv);
          contentDiv.appendChild(metaDiv);
          itemDiv.appendChild(contentDiv);
          scrollContainer.appendChild(itemDiv);
        });

        notificationHistory.appendChild(scrollContainer);
      });
    }

    function showEmailError(message) {
      const errorElement = document.getElementById("emailError");
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
      }
    }

    function clearEmailError() {
      const errorElement = document.getElementById("emailError");
      if (errorElement) {
        errorElement.style.display = "none";
      }
    }
  }

  // Load and display extension version
  function loadExtensionVersion() {
    const versionElement = document.getElementById("extensionVersion");
    if (versionElement) {
      // Get the version from the manifest
      const manifest = chrome.runtime.getManifest();
      if (manifest && manifest.version) {
        versionElement.textContent = `Version: ${manifest.version}`;
      } else {
        versionElement.textContent = "Version: Unknown";
      }
    }
  }

  // Analytics functionality removed
});
