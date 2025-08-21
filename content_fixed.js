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
    enableDesktopNotifications: true // New setting for desktop notifications
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
    chrome.storage.sync.get(["enabled", "mode", "refreshInterval", "alertSoundType", "alertSoundData", "showTestButton", "enableDesktopNotifications"], (data) => {
      let interval = data.refreshInterval;
      if (typeof interval === "string") interval = parseFloat(interval);
      
      currentSettings = {
        enabled: data.enabled || false,
        mode: data.mode || "alarm_only",
        refreshInterval: interval || 5,
        alertSoundType: data.alertSoundType || "default",
        alertSoundData: data.alertSoundData || "",
        showTestButton: data.showTestButton || false, // Load showTestButton setting
        enableDesktopNotifications: data.enableDesktopNotifications !== undefined ? data.enableDesktopNotifications : true // Default to true if not set
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

    // Check for 403 Forbidden error on task/show pages
    if (currentUrl.includes("/task/show") && 
        (document.body.innerText.includes("Error 403 Forbidden") || 
         document.body.innerText.includes("This task has already been SUBMITTED"))) {
      console.log("RaterHub Monitor: Task already submitted detected on task/show page, redirecting to main page");
      console.log("RaterHub Monitor: Current URL:", currentUrl);
      console.log("RaterHub Monitor: Page content contains 'Error 403 Forbidden':", document.body.innerText.includes("Error 403 Forbidden"));
      console.log("RaterHub Monitor: Page content contains 'This task has already been SUBMITTED':", document.body.innerText.includes("This task has already been SUBMITTED"));
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
      // Tasks are available!
      console.log("RaterHub Monitor: Tasks available! Stopping monitoring and playing alarm...");
      console.log("RaterHub Monitor: Current mode:", currentSettings.mode);
      console.log("RaterHub Monitor: Acquire button found:", acquireButton);
      console.log("RaterHub Monitor: Button text:", acquireButton.textContent || acquireButton.value || "No text");
      console.log("RaterHub Monitor: Button tag:", acquireButton.tagName);
      console.log("RaterHub Monitor: Button href:", acquireButton.href || "No href");
      
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
        console.log("RaterHub Monitor: Found text:", search
