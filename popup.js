// Popup script for RaterHub Task Monitor

document.addEventListener("DOMContentLoaded", () => {
  const enabledToggle = document.getElementById("enabledToggle");
  const modeSelect = document.getElementById("modeSelect");
  const intervalSelect = document.getElementById("intervalSelect");
  const themeToggle = document.getElementById("themeToggle");
  const openOptionsBtn = document.getElementById("openOptionsBtn");
  const soundSourceSelect = document.getElementById("soundSourceSelect");
  const fileInputContainer = document.getElementById("fileInputContainer");
  const urlInputContainer = document.getElementById("urlInputContainer");
  const alertSoundFile = document.getElementById("alertSoundFile");
  const alertSoundUrl = document.getElementById("alertSoundUrl");
  const playPauseSoundBtn = document.getElementById("playPauseSoundBtn");
  const stopSoundBtn = document.getElementById("stopSoundBtn");
  const playPauseIcon = document.getElementById("playPauseIcon");
  const soundErrorMsg = document.getElementById("soundErrorMsg");
  let testAudio = null;
  let isPlaying = false;

  // Load current settings
  loadSettings();

  // Event listeners
  enabledToggle.addEventListener("change", handleEnabledChange);
  modeSelect.addEventListener("change", handleModeChange);
  intervalSelect.addEventListener("change", handleIntervalChange);
  themeToggle.addEventListener("change", handleThemeChange);
  openOptionsBtn.addEventListener("click", openOptionsPage);
  soundSourceSelect.addEventListener("change", handleSoundSourceChange);
  alertSoundFile.addEventListener("change", handleFileChange);
  alertSoundUrl.addEventListener("input", handleUrlChange);
  playPauseSoundBtn.addEventListener("click", handlePlayPauseSound);
  stopSoundBtn.addEventListener("click", handleStopSound);

  // Listen for storage changes (when options page updates settings)
  chrome.storage.onChanged.addListener(handleStorageChange);

  // Listen for messages from options page and background
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  function loadSettings() {
    chrome.storage.sync.get(
      [
        "enabled",
        "mode",
        "refreshInterval",
        "alertSoundType",
        "alertSoundData",
        "darkThemeEnabled",
      ],
      (data) => {
        let interval = data.refreshInterval;
        let soundSource = data.alertSoundType;
        if (typeof interval === "string") interval = parseFloat(interval);
        if (!interval) interval = 1;
        if (!soundSource) soundSource = "default";
        // If settings are missing, set them to defaults
        if (!data.refreshInterval || !data.alertSoundType) {
          chrome.storage.sync.set({
            refreshInterval: 1,
            alertSoundType: "default",
          });
        }
        const settings = {
          enabled: data.enabled || false,
          mode: data.mode || "alarm_only",
          refreshInterval: interval,
          alertSoundType: soundSource,
          alertSoundData: data.alertSoundData || "",
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
    soundSourceSelect.value = settings.alertSoundType;
    if (settings.alertSoundType === "default") {
      fileInputContainer.style.display = "none";
      urlInputContainer.style.display = "none";
    } else if (settings.alertSoundType === "file") {
      fileInputContainer.style.display = "flex";
      urlInputContainer.style.display = "none";
      // For file type, we don't set the file input value, but we can show if a file is already selected
      // The file input will be empty by default for security reasons
    } else {
      fileInputContainer.style.display = "none";
      urlInputContainer.style.display = "flex";
      alertSoundUrl.value = settings.alertSoundData;
    }
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
        alertSoundType: soundSourceSelect.value,
        alertSoundData: alertSoundUrl.value,
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
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
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

  // Save alert sound (file or URL)
  function handleSoundSourceChange() {
    if (soundSourceSelect.value === "default") {
      fileInputContainer.style.display = "none";
      urlInputContainer.style.display = "none";
      chrome.storage.sync.set({ alertSoundType: "default" });
    } else if (soundSourceSelect.value === "file") {
      fileInputContainer.style.display = "flex";
      urlInputContainer.style.display = "none";
      chrome.storage.sync.set({ alertSoundType: "file" });
    } else {
      fileInputContainer.style.display = "none";
      urlInputContainer.style.display = "flex";
      chrome.storage.sync.set({ alertSoundType: "url" });
    }
    soundErrorMsg.style.display = "none";
  }

  function handleFileChange() {
    soundErrorMsg.style.display = "none";
    if (alertSoundFile.files.length > 0) {
      const file = alertSoundFile.files[0];
      if (!file.name.toLowerCase().endsWith(".mp3")) {
        soundErrorMsg.textContent = "Please select an MP3 file.";
        soundErrorMsg.style.display = "block";
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        // Store the file data in both sync and local storage for reliability
        const fileData = e.target.result;
        chrome.storage.local.set({ alertSoundData: fileData }, () => {
          chrome.storage.sync.set({
            alertSoundType: "file",
            alertSoundData: fileData,
          }, () => {
            console.log("File sound saved successfully");
          });
        });
      };
      reader.readAsDataURL(file);
    } else {
      chrome.storage.local.set({ alertSoundData: "" });
      chrome.storage.sync.set({ alertSoundType: "file", alertSoundData: "" });
    }
  }

  function handleUrlChange() {
    soundErrorMsg.style.display = "none";
    const url = alertSoundUrl.value.trim();
    if (!url.match(/\.mp3($|\?)/i)) {
      soundErrorMsg.textContent = "URL must end with .mp3";
      soundErrorMsg.style.display = "block";
      chrome.storage.sync.set({ alertSoundType: "url", alertSoundData: "" });
      return;
    }
    chrome.storage.sync.set({ alertSoundType: "url", alertSoundData: url });
  }

  // Test alert sound
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

  // Handle storage changes (when settings are updated from options page)
  function handleStorageChange(changes, namespace) {
    if (namespace === 'sync') {
      // Reload settings to update UI
      loadSettings();
    }
  }

  // Handle messages from options page and background
  function handleRuntimeMessage(message, sender, sendResponse) {
    console.log("Popup received message:", message.action, message);
    
    if (message.action === 'settingsUpdated') {
      // Reload settings to update UI
      loadSettings();
    } else if (message.action === 'themeChanged') {
      // Update theme based on message from options page
      applyTheme(message.darkThemeEnabled);
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
          modeSelect.value = message.value;
          break;
        case 'refreshInterval':
          intervalSelect.value = String(message.value);
          break;
        case 'darkThemeEnabled':
          themeToggle.checked = message.value;
          applyTheme(message.value);
          break;
        case 'alertSoundType':
          soundSourceSelect.value = message.value;
          handleSoundSourceChange(); // This will update the UI visibility
          break;
        case 'alertSoundData':
          if (soundSourceSelect.value === "url") {
            alertSoundUrl.value = message.value;
          }
          break;
      }
    }
    return true; // Keep message channel open for async response
  }
});
