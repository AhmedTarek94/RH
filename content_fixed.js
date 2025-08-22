// Content script for RaterHub Task Monitor

// Prevent multiple injection by checking if already loaded
if (window.raterHubMonitorLoaded) {
  console.log("RaterHub Task Monitor: Already loaded, skipping...");
} else {
  window.raterHubMonitorLoaded = true;

  let monitorInterval = null;
  let isMonitoring = false;
  let lastRefreshTime = 0;
  let incompleteTasksDetected = false;
  let currentAudio = null; // Track current audio for stopping
  let currentSettings = {
    enabled: false,
    mode: "alarm_only",
    refreshInterval: 5,
    alertSoundType: "default",
    alertSoundData: "",
    showTestButton: false, // Added for controlling test button visibility
    enableDesktopNotifications: true, // New setting for desktop notifications
    // Filter settings with defaults
    taskTypeFilter: ["search", "evaluation", "comparison"],
    minDuration: 1,
    maxDuration: 60,
    timeRangeEnabled: false,
    timeRangeStart: "09:00",
    timeRangeEnd: "17:00",
    daysOfWeekFilter: ["mon", "tue", "wed", "thu", "fri"],
    minReward: 0.05
  };

  // Initialize the monitor when the page loads
  initialize();

  function initialize() {
    console.log("RaterHub Task Monitor: Content script loaded");

    // Check for URL redirect and forbidden/index/task/show handling
    handleUrlRedirectAndPageControl();

    // Get current settings and start monitoring if enabled
    loadSettings();
    
    // Add test button for development/testing
    addTestButton();
    
    // Add mouse movement detection to stop alarm
    addMouseMovementDetection();
  }

  function loadSettings() {
    chrome.storage.sync.get([
      "enabled", "mode", "refreshInterval", "alertSoundType", "alertSoundData", 
      "showTestButton", "enableDesktopNotifications",
      // Filter settings
      "taskTypeFilter", "minDuration", "maxDuration", "timeRangeEnabled", 
      "timeRangeStart", "timeRangeEnd", "daysOfWeekFilter", "minReward"
    ], (data) => {
      let interval = data.refreshInterval;
      if (typeof interval === "string") interval = parseFloat(interval);
      
      currentSettings = {
        enabled: data.enabled || false,
        mode: data.mode || "alarm_only",
        refreshInterval: interval || 5,
        alertSoundType: data.alertSoundType || "default",
        alertSoundData: data.alertSoundData || "",
        showTestButton: data.showTestButton || false, // Load showTestButton setting
        enableDesktopNotifications: data.enableDesktopNotifications !== undefined ? data.enableDesktopNotifications : true, // Default to true if not set
        // Filter settings with defaults
        taskTypeFilter: data.taskTypeFilter || ["search", "evaluation", "comparison"],
        minDuration: data.minDuration !== undefined ? data.minDuration : 1,
        maxDuration: data.maxDuration !== undefined ? data.maxDuration : 60,
        timeRangeEnabled: data.timeRangeEnabled || false,
        timeRangeStart: data.timeRangeStart || "09:00",
        timeRangeEnd: data.timeRangeEnd || "17:00",
        daysOfWeekFilter: data.daysOfWeekFilter || ["mon", "tue", "wed", "thu", "fri"],
        minReward: data.minReward !== undefined ? data.minReward : 0.05
      };

      console.log("RaterHub Monitor: Current settings:", currentSettings);
      console.log("RaterHub Monitor: Mode is:", currentSettings.mode);
      console.log("RaterHub Monitor: Mode comparison with 'alarm_and_click':", currentSettings.mode === "alarm_and_click");

      // For file type sounds, check local storage as well for reliability
      if (currentSettings.alertSoundType === "file" && !currentSettings.alertSoundData) {
        chrome.storage.local.get(["alertSoundData"], (localData) => {
          if (localData.alertSoundData) {
            currentSettings.alertSoundData = localData.alertSoundData;
            console.log("RaterHub Monitor: Retrieved file data from local storage");
          }
          
          if (currentSettings.enabled) {
            startMonitoring();
          }
          
          // Refresh test button visibility based on new settings
          refreshTestButton();
        });
      } else {
        if (currentSettings.enabled) {
          startMonitoring();
        }
        
        // Refresh test button visibility based on new settings
        refreshTestButton();
      }
    });
  }

  function refreshTestButton() {
    // Remove existing test button first
    const existingButton = document.getElementById("raterhub-test-button");
    if (existingButton) {
      existingButton.remove();
    }
    
    // Add test button if enabled
    addTestButton();
  }

  // Enhanced URL/page control
  function handleUrlRedirectAndPageControl() {
    const currentUrl = window.location.href;
    const mainUrl = "https://www.raterhub.com/evaluation/rater";
    const indexUrl = "https://www.raterhub.com/evaluation/rater/task/index";

    // Only perform redirects if the extension is enabled
    if (!currentSettings.enabled) {
      console.log("RaterHub Monitor: Extension disabled, no redirects performed");
      return;
    }

    // Check for 403 Forbidden error on task/show pages or task/index pages
    if ((currentUrl.includes("/task/show") && 
        (document.body.innerText.includes("Error 403 Forbidden") || 
         document.body.innerText.includes("This task has already been SUBMITTED"))) ||
        currentUrl === indexUrl) {
      console.log("RaterHub Monitor: Task already submitted or index page detected, redirecting to main page");
      console.log("RaterHub Monitor: Current URL:", currentUrl);
      console.log("RaterHub Monitor: Page content contains 'Error 403 Forbidden':", document.body.innerText.includes("Error 403 Forbidden"));
      console.log("RaterHub Monitor: Page content contains 'This task has already been SUBMITTED':", document.body.innerText.includes("This task has already been SUBMITTED"));
      console.log("RaterHub Monitor: Is index page:", currentUrl === indexUrl);
      console.log("RaterHub Monitor: Redirecting to:", mainUrl);
      window.location.href = mainUrl;
      return;
    }

    // Check for task/show pages with taskIds (normal task pages)
    if (currentUrl.includes("/task/show") && currentUrl.includes("taskIds=")) {
      console.log("RaterHub Monitor: On task/show page with taskIds, stopping monitoring");
      stopMonitoring();
      return;
    }

    // Check for index page or other forbidden pages
    if (currentUrl === indexUrl || 
        (document.body.innerText.toLowerCase().includes("forbidden") && !currentUrl.includes("/task/show"))) {
      console.log("RaterHub Monitor: On forbidden or index page, redirecting to main page");
      window.location.href = mainUrl;
      return;
    }

    // If not on the main page and not handled above, stop monitoring
    if (currentUrl !== mainUrl) {
      console.log("RaterHub Monitor: Not on main page, stopping monitoring");
      stopMonitoring();
      return;
    }

    // On main page, ensure monitoring is active if enabled
    if (currentSettings.enabled && !isMonitoring) {
      console.log("RaterHub Monitor: On main page and enabled, starting monitoring");
      startMonitoring();
    }
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "settingsUpdated") {
      loadSettings();
    } else if (request.action === "startMonitoring") {
      console.log("RaterHub Monitor: Received startMonitoring message from background script");
      if (currentSettings.enabled && !isMonitoring) {
        console.log("RaterHub Monitor: Starting monitoring due to background script request");
        startMonitoring();
      }
    }
  });

  function startMonitoring() {
    if (isMonitoring) {
      stopMonitoring();
    }

    console.log(`RaterHub Monitor: Starting monitoring with ${currentSettings.refreshInterval}s interval`);
    isMonitoring = true;
    incompleteTasksDetected = false;

    // Don't check immediately - wait for the first interval
    const intervalMs = Number(currentSettings.refreshInterval) * 1000;
    console.log(`RaterHub Monitor: Setting interval to ${intervalMs}ms (${currentSettings.refreshInterval}s)`);

    monitorInterval = setInterval(() => {
      console.log(`RaterHub Monitor: Interval check (every ${currentSettings.refreshInterval}s)`);
      checkForTasks();
    }, intervalMs);

    // Show a status message
    console.log(`RaterHub Monitor: Monitoring started. Will check every ${currentSettings.refreshInterval} seconds.`);
  }

  function stopMonitoring() {
    console.log("RaterHub Monitor: Stopping monitoring");
    isMonitoring = false;

    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
  }

  function checkForTasks() {
    if (!currentSettings.enabled || !isMonitoring) {
      console.log("RaterHub Monitor: Skipping check - monitoring disabled");
      return;
    }

    // Check for redirects on every monitoring cycle
    handleUrlRedirectAndPageControl();

    const currentTime = Date.now();
    const timeSinceLastRefresh = (currentTime - lastRefreshTime) / 1000;

    console.log(`RaterHub Monitor: Time since last refresh: ${timeSinceLastRefresh.toFixed(1)}s`);

    // Prevent refreshing too frequently (minimum 2 seconds between refreshes)
    if (timeSinceLastRefresh < 2) {
      console.log("RaterHub Monitor: Skipping check - too soon since last refresh");
      return;
    }

    // Check for incomplete tasks first
    if (checkForIncompleteTasks()) {
      return; // Stop further processing if incomplete tasks are detected
    }

    // Check for "No tasks are currently available" element
    const noTasksFullText = "No tasks are currently available. Please try again later.";
    const noTasksElement = document.querySelector("h2.ewok-rater-task-header.ewok-rater-no-tasks");
    let noTasksExists = false;
    if (noTasksElement) {
      const elementText = noTasksElement.textContent.trim();
      noTasksExists = elementText.includes(noTasksFullText);
    }
    // Fallback: search entire page text if specific element not present
    if (!noTasksExists && document.body) {
      noTasksExists = document.body.innerText.includes(noTasksFullText);
    }

    // Check for "Acquire if available" button
    const acquireButton = findAcquireButton();

    console.log("RaterHub Monitor: Page check results:", {
      noTasksElementFound: !!noTasksElement,
      noTasksFullTextMatch: noTasksExists,
      acquireButtonFound: !!acquireButton,
      noTasksElementText: noTasksElement ? noTasksElement.textContent.trim() : "not found",
      refreshInterval: currentSettings.refreshInterval,
      timeSinceLastRefresh: timeSinceLastRefresh.toFixed(1) + "s",
    });

    if (noTasksExists && !acquireButton) {
      // No tasks available, redirect to main page
      console.log("RaterHub Monitor: No tasks found, redirecting to main page.");

      // Record the refresh time
      lastRefreshTime = currentTime;

      // Stop monitoring before redirect to prevent duplicate intervals
      stopMonitoring();

      // Redirect to main page
      window.location.href = "https://www.raterhub.com/evaluation/rater";
    } else if (!noTasksExists && acquireButton) {
      // Tasks are available! Check if they match filter criteria
      console.log("RaterHub Monitor: Tasks available! Checking filter criteria...");
      console.log("RaterHub Monitor: Current mode:", currentSettings.mode);
      console.log("RaterHub Monitor: Acquire button found:", acquireButton);
      console.log("RaterHub Monitor: Button text:", acquireButton.textContent || acquireButton.value || "No text");
      console.log("RaterHub Monitor: Button tag:", acquireButton.tagName);
      console.log("RaterHub Monitor: Button href:", acquireButton.href || "No href");
      
      // Check if tasks match filter criteria
      const tasksMatchFilters = checkTaskFilters();
      
      if (tasksMatchFilters) {
        console.log("RaterHub Monitor: Tasks match filter criteria! Stopping monitoring and playing alarm...");
        stopMonitoring(); // Stop monitoring immediately

        if (currentSettings.mode === "alarm_and_click") {
          // Click the acquire button instantly first, then play alarm
          console.log("RaterHub Monitor: Auto-clicking acquire button instantly");
          
          // Small delay to ensure button is fully ready
          setTimeout(() => {
            try {
              // Try standard click first
              acquireButton.click();
              console.log("RaterHub Monitor: Button click executed successfully");
            } catch (error) {
              console.error("RaterHub Monitor: Error clicking button:", error);
              
              // Try alternative click methods
              try {
                if (acquireButton.tagName === 'A') {
                  // For links, try to navigate directly
                  console.log("RaterHub Monitor: Trying direct navigation for link");
                  window.location.href = acquireButton.href;
                } else {
                  // For buttons, try dispatching a click event
                  console.log("RaterHub Monitor: Trying dispatched click event");
                  const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                  });
                  acquireButton.dispatchEvent(clickEvent);
                }
                console.log("RaterHub Monitor: Alternative click method executed");
              } catch (altError) {
                console.error("RaterHub Monitor: Alternative click method also failed:", altError);
              }
            }
          }, 50); // 50ms delay to ensure button is ready
          
          // Play alarm after clicking the button
          setTimeout(() => {
            playAlarm();
          }, 100); // Small delay to ensure button click is processed first
        } else {
          // Alarm only mode - just play alarm
          console.log("RaterHub Monitor: Alarm only mode - not auto-clicking button");
          playAlarm();
        }
      } else {
        console.log("RaterHub Monitor: Tasks do not match filter criteria, continuing monitoring");
      }
    } else if (!noTasksExists && !acquireButton) {
      // Page might be in a different state - don't refresh, just wait for next interval
      console.log("RaterHub Monitor: Page state unclear - waiting for next interval");

      // Look for any task-related elements to understand page state
      const taskElements = document.querySelectorAll('[class*="task"], [class*="ewok"], [id*="task"]');
      if (taskElements.length > 0) {
        console.log("RaterHub Monitor: Found task-related elements:", taskElements.length);
      }
    }
  }

  function checkForIncompleteTasks() {
    // Look for "Incomplete tasks" text
    const incompleteTasksText = findTextOnPage("Incomplete tasks");
    const continueButton = findContinueButton();

    if (incompleteTasksText && continueButton && !incompleteTasksDetected) {
      console.log("RaterHub Monitor: Incomplete tasks detected with Continue button!");
      incompleteTasksDetected = true;

      // Stop monitoring immediately
      stopMonitoring();

      // Show popup asking user what to do
      showIncompleteTasksPopup(continueButton);
      
      // Show desktop notification for incomplete tasks if enabled
      if (currentSettings.enableDesktopNotifications) {
        showIncompleteTasksNotification();
      }

      return true; // Indicates incomplete tasks were found
    } else if (!incompleteTasksText || !continueButton) {
      // Reset the flag if incomplete tasks are no longer present
      incompleteTasksDetected = false;
    }

    return false;
  }

  function findTextOnPage(searchText) {
    // Search for text in the page
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.toLowerCase().includes(searchText.toLowerCase())) {
        console.log("RaterHub Monitor: Found text:", searchText, "in element:", node.parentElement);
        return node.parentElement;
      }
    }

    return null;
  }

  function findContinueButton() {
    // Look for button with text "Continue" (case insensitive)
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], a');
    for (let button of buttons) {
      const text = (button.textContent || button.value || "").trim().toLowerCase();
      if (text.includes("continue")) {
        console.log("RaterHub Monitor: Found continue button:", button);
        return button;
      }
    }

    return null;
  }

  function showIncompleteTasksPopup(continueButton) {
    // Remove any existing popup first
    const existingPopup = document.getElementById("raterhub-monitor-popup");
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create popup overlay
    const overlay = document.createElement("div");
    overlay.id = "raterhub-monitor-popup";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create popup content
    const popup = document.createElement("div");
    popup.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      text-align: center;
      position: relative;
    `;

    popup.innerHTML = `
      <div style="color: #f59e0b; font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <h2 style="color: #1f2937; margin-bottom: 12px; font-size: 20px; font-weight: 600;">
        Incomplete Tasks Detected
      </h2>
      <p style="color: #6b7280; margin-bottom: 24px; font-size: 14px; line-height: 1.5;">
        Do you want to continue working on the Incomplete tasks now?
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="raterhub-continue-yes" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        ">
          Yes, Continue
        </button>
        <button id="raterhub-continue-no" style="
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        ">
          No, Stop
        </button>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Add hover effects
    const yesBtn = popup.querySelector("#raterhub-continue-yes");
    const noBtn = popup.querySelector("#raterhub-continue-no");

    yesBtn.addEventListener("mouseover", () => (yesBtn.style.background = "#059669"));
    yesBtn.addEventListener("mouseout", () => (yesBtn.style.background = "#10b981"));
    noBtn.addEventListener("mouseover", () => (noBtn.style.background = "#dc2626"));
    noBtn.addEventListener("mouseout", () => (noBtn.style.background = "#ef4444"));

    // Handle button clicks
    yesBtn.addEventListener("click", () => {
      console.log("RaterHub Monitor: User chose to continue with incomplete tasks");
      document.body.removeChild(overlay);

      // Click the continue button
      continueButton.click();

      // Reset the flag and potentially restart monitoring after a delay
      setTimeout(() => {
        incompleteTasksDetected = false;
        if (currentSettings.enabled) {
          console.log("RaterHub Monitor: Restarting monitoring after continuing incomplete tasks");
          startMonitoring();
        }
      }, 2000);
    });

    noBtn.addEventListener("click", () => {
      console.log("RaterHub Monitor: User chose to stop monitoring due to incomplete tasks");
      document.body.removeChild(overlay);

      // Stop monitoring and disable extension
      stopMonitoring();
      chrome.storage.sync.set({ enabled: false });
      incompleteTasksDetected = false;
    });

    // Close popup when clicking outside (on overlay)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        // Default to stopping monitoring
        stopMonitoring();
        chrome.storage.sync.set({ enabled: false });
        incompleteTasksDetected = false;
      }
    });
  }

  function checkTaskFilters() {
    console.log("RaterHub Monitor: Checking task filters...");
    console.log("RaterHub Monitor: Current filter settings:", currentSettings);
    
    // For now, return true to indicate tasks match filter criteria
    // This will be implemented with actual task filtering logic
    return true;
  }

  function findAcquireButton() {
    console.log("RaterHub Monitor: Searching for acquire button...");
    
    // Look for <a> element with href containing 'task/new?acquireToken='
    const acquireLinks = document.querySelectorAll('a[href*="task/new?acquireToken="]');
    if (acquireLinks.length > 0) {
      console.log("RaterHub Monitor: Found acquire link with acquireToken:", acquireLinks[0]);
      console.log("RaterHub Monitor: Link href:", acquireLinks[0].href);
      console.log("RaterHub Monitor: Link text:", acquireLinks[0].textContent);
      return acquireLinks[0];
    }

    // Fallback: Look for button with text "Acquire if available" (case insensitive)
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], a');
    console.log("RaterHub Monitor: Found", buttons.length, "potential button elements");
    
    for (let button of buttons) {
      const text = (button.textContent || button.value || "").trim().toLowerCase();
      console.log("RaterHub Monitor: Checking button:", button.tagName, "Text:", text);
      if (text.includes("acquire") && text.includes("available")) {
        console.log("RaterHub Monitor: Found acquire button:", button);
        console.log("RaterHub Monitor: Button details:", {
          tagName: button.tagName,
          text: button.textContent || button.value,
          href: button.href || "No href",
          className: button.className,
          id: button.id
        });
        return button;
      }
    }

    // Also look for any button that contains just "acquire"
    for (let button of buttons) {
      const text = (button.textContent || button.value || "").trim().toLowerCase();
      if (text.includes("acquire")) {
        console.log("RaterHub Monitor: Found potential acquire button:", button, "Text:", text);
        console.log("RaterHub Monitor: Button details:", {
          tagName: button.tagName,
          text: button.textContent || button.value,
          href: button.href || "No href",
          className: button.className,
          id: button.id
        });
        return button;
      }
    }

    console.log("RaterHub Monitor: No acquire button found");
    return null;
  }

  async function playAlarm() {
    try {
      // Stop any existing alarm first
      stopAlarm();
      
      let audioUrl;
      
      if (currentSettings.alertSoundType === "file" && currentSettings.alertSoundData) {
        // Play custom file sound
        audioUrl = currentSettings.alertSoundData;
      } else if (currentSettings.alertSoundType === "url" && currentSettings.alertSoundData) {
        // Play URL sound
        audioUrl = currentSettings.alertSoundData;
      } else {
        // Play default alarm
        audioUrl = chrome.runtime.getURL("alarm.mp3");
      }
      
      // Create and play audio
      currentAudio = new Audio(audioUrl);
      currentAudio.volume = 1.0;
      currentAudio.loop = false;
      
      // Add event listeners for better error handling
      currentAudio.addEventListener('canplaythrough', () => {
        console.log("RaterHub Monitor: Audio can play through");
      });
      
      currentAudio.addEventListener('error', (e) => {
        console.error("RaterHub Monitor: Audio error:", e);
        // Fallback to default alarm if custom sound fails
        if (currentSettings.alertSoundType !== "default") {
          console.log("RaterHub Monitor: Falling back to default alarm");
          playDefaultAlarm();
        } else {
          fallbackBeep();
        }
      });
      
      // Play the audio and handle the promise
      try {
        await currentAudio.play();
        console.log("RaterHub Monitor: Alarm played successfully");
        
        // Show desktop notification if enabled
        if (currentSettings.enableDesktopNotifications) {
          showDesktopNotification();
        }
      } catch (playError) {
        console.error("RaterHub Monitor: Failed to play alarm:", playError);
        // Fallback to default alarm if custom sound fails
        if (currentSettings.alertSoundType !== "default") {
          console.log("RaterHub Monitor: Falling back to default alarm");
          playDefaultAlarm();
        } else {
          fallbackBeep();
        }
      }
    } catch (error) {
      console.error("RaterHub Monitor: Error in playAlarm:", error);
      playDefaultAlarm();
    }
  }

  async function playDefaultAlarm() {
    try {
      stopAlarm();
      
      currentAudio = new Audio(chrome.runtime.getURL("alarm.mp3"));
      currentAudio.volume = 1.0;
      currentAudio.loop = false;
      
      currentAudio.addEventListener('error', (e) => {
        console.error("RaterHub Monitor: Default audio error:", e);
        fallbackBeep();
      });
      
      try {
        await currentAudio.play();
        console.log("RaterHub Monitor: Default alarm played successfully");
      } catch (playError) {
        console.error("RaterHub Monitor: Failed to play default alarm:", playError);
        fallbackBeep();
      }
    } catch (error) {
      console.error("RaterHub Monitor: Error creating default audio:", error);
      fallbackBeep();
    }
  }

  function fallbackBeep() {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);

      console.log("RaterHub Monitor: Fallback beep played");
    } catch (error) {
      console.error("RaterHub Monitor: Fallback beep failed:", error);
    }
  }

  function showDesktopNotification() {
    // Check if browser notifications are supported
    if (!("Notification" in window)) {
      console.log("RaterHub Monitor: Browser notifications not supported");
      return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      // Create and show notification
      const notification = new Notification("RaterHub Task Monitor", {
        body: "🎉 Tasks are available! Click to return to RaterHub.",
        icon: chrome.runtime.getURL("icon.png"),
        tag: "raterhub-task-alert"
      });

      // Add click handler to focus the RaterHub tab
      notification.onclick = function() {
        window.focus();
        this.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      console.log("RaterHub Monitor: Desktop notification shown");
    } else if (Notification.permission !== "denied") {
      // Request permission from user
      Notification.requestPermission().then(function(permission) {
        if (permission === "granted") {
          // Create notification after permission is granted
          const notification = new Notification("RaterHub Task Monitor", {
            body: "🎉 Tasks are available! Click to return to RaterHub.",
            icon: chrome.runtime.getURL("icon.png"),
            tag: "raterhub-task-alert"
          });

          notification.onclick = function() {
            window.focus();
            this.close();
          };

          setTimeout(() => {
            notification.close();
          }, 10000);

          console.log("RaterHub Monitor: Desktop notification shown after permission granted");
        }
      });
    }
  }

  function showIncompleteTasksNotification() {
    // Check if browser notifications are supported
    if (!("Notification" in window)) {
      console.log("RaterHub Monitor: Browser notifications not supported");
      return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      // Create and show notification for incomplete tasks
      const notification = new Notification("RaterHub Task Monitor", {
        body: "⚠️ Incomplete tasks detected! Click to continue working.",
        icon: chrome.runtime.getURL("icon.png"),
        tag: "raterhub-incomplete-tasks-alert"
      });

      // Add click handler to focus the RaterHub tab
      notification.onclick = function() {
        window.focus();
        this.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      console.log("RaterHub Monitor: Incomplete tasks desktop notification shown");
    } else if (Notification.permission !== "denied") {
      // Request permission from user
      Notification.requestPermission().then(function(permission) {
        if (permission === "granted") {
          // Create notification after permission is granted
          const notification = new Notification("RaterHub Task Monitor", {
            body: "⚠️ Incomplete tasks detected! Click to continue working.",
            icon: chrome.runtime.getURL("icon.png"),
            tag: "raterhub-incomplete-tasks-alert"
          });

          notification.onclick = function() {
            window.focus();
            this.close();
          };

          setTimeout(() => {
            notification.close();
          }, 10000);

          console.log("RaterHub Monitor: Incomplete tasks desktop notification shown after permission granted");
        }
      });
    }
  }

  function addTestButton() {
    // Only show test button if explicitly enabled in settings
    if (!currentSettings.showTestButton) {
      return;
    }
    
    // Remove any existing test button first
    const existingButton = document.getElementById("raterhub-test-button");
    if (existingButton) {
      existingButton.remove();
    }

    // Create test button
    const testButton = document.createElement("div");
    testButton.id = "raterhub-test-button";
    testButton.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        user-select: none;
      ">
        🧪 Test: Simulate Acquire Button
      </div>
    `;

    // Add hover effects
    const buttonElement = testButton.querySelector("div");
    buttonElement.addEventListener("mouseover", () => {
      buttonElement.style.background = "#2563eb";
      buttonElement.style.transform = "translateY(-2px)";
      buttonElement.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
    });

    buttonElement.addEventListener("mouseout", () => {
      buttonElement.style.background = "#3b82f6";
      buttonElement.style.transform = "translateY(0)";
      buttonElement.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });

    // Add click functionality
    buttonElement.addEventListener("click", () => {
      console.log("RaterHub Monitor: Test button clicked - simulating acquire button detection");
      simulateAcquireButtonFound();
    });

    // Add to page
    document.body.appendChild(testButton);
  }

  function simulateAcquireButtonFound() {
    // Check if monitoring is active
    if (!currentSettings.enabled || !isMonitoring) {
      console.log("RaterHub Monitor: Test failed - monitoring not active");
      alert("❌ Test failed: Extension must be enabled and monitoring active to test acquire button detection");
      return;
    }

    console.log("RaterHub Monitor: Simulating acquire button found - stopping monitoring and playing alarm");
    
    // Stop monitoring immediately (simulating task found)
    stopMonitoring();
    
    if (currentSettings.mode === "alarm_and_click") {
      // Simulate auto-click behavior first, then play alarm
      console.log("RaterHub Monitor: Test mode is 'alarm_and_click' - simulating auto-click behavior first");
      
      // Play alarm after simulating the click behavior
      setTimeout(() => {
        playAlarm();
      }, 100); // Small delay to simulate the new behavior
    } else {
      // Alarm only mode - just play alarm
      playAlarm();
    }
    
    // Show success message
    showTestSuccessMessage();
  }

  function showTestSuccessMessage() {
    // Remove any existing test message
    const existingMessage = document.getElementById("raterhub-test-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create success message
    const message = document.createElement("div");
    message.id = "raterhub-test-message";
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 80px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease;
      ">
        ✅ Test successful! Acquire button simulated
      </div>
    `;

    // Add CSS animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(message);

    // Remove message after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }

  function addMouseMovementDetection() {
    let mouseMoveTimeout;
    
    document.addEventListener('mousemove', () => {
      // Clear existing timeout
      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }
      
      // Stop alarm immediately on mouse movement
      if (currentAudio) {
        console.log("RaterHub Monitor: Mouse movement detected, stopping alarm");
        stopAlarm();
      }
      
      // Set a small delay to prevent constant stopping if mouse keeps moving
      mouseMoveTimeout = setTimeout(() => {
        // Reset after 100ms of no movement
      }, 100);
    });
  }

  function stopAlarm() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        console.log("RaterHub Monitor: Alarm stopped due to mouse movement");
      } catch (error) {
        console.error("RaterHub Monitor: Error stopping alarm:", error);
        currentAudio = null;
      }
    }
  }

  // Handle page visibility changes
  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      currentSettings.enabled &&
      !isMonitoring &&
      !incompleteTasksDetected
    ) {
      // Restart monitoring when tab becomes visible (unless incomplete tasks are detected)
      console.log("RaterHub Monitor: Tab became visible, reinitializing...");
      setTimeout(() => {
        initialize();
      }, 1000);
    }
  });

  // Clean up when page is about to unload
  window.addEventListener("beforeunload", () => {
    stopMonitoring();

    // Clean up any existing popups
    const existingPopup = document.getElementById("raterhub-monitor-popup");
    if (existingPopup) {
      existingPopup.remove();
    }
  });

  // Listen for storage changes directly (in case background script messaging fails)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync") {
      console.log("RaterHub Monitor: Storage changed:", changes);
      loadSettings();
    }
  });

  // Store the last refresh time in session to persist across page reloads
  window.addEventListener("load", () => {
    // Try to get the last refresh time from sessionStorage equivalent
    const urlParams = new URLSearchParams(window.location.search);
    const lastRefreshParam = urlParams.get("raterhub_monitor_last_refresh");
    if (lastRefreshParam) {
      lastRefreshTime = parseInt(lastRefreshParam);
      console.log("RaterHub Monitor: Recovered last refresh time:", new Date(lastRefreshTime).toLocaleTimeString());
    }
  });

  // Before refreshing, add timestamp to URL to track refresh timing
  const originalReload = location.reload;
  location.reload = function () {
    const currentTime = Date.now();
    const url = new URL(window.location);
    url.searchParams.set("raterhub_monitor_last_refresh", currentTime.toString());
    window.location.href = url.toString();
  };
} // End of the multiple injection prevention block
