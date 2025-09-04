# TODO: Gmail API Integration Guide

## Overview

This guide provides step-by-step instructions to integrate Gmail notifications with Google Cloud for the RHAT extension.

## Phase 1: Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select existing project
3. Note your Project ID for later use

### Step 2: Enable Gmail API

1. In the left sidebar, go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" from results
4. Click "Enable" button

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Chrome Extension" as application type
4. Enter your Chrome Extension ID (from manifest.json, e.g., "abcdefghijklmnop1234567890")
5. Click "Create"
6. Copy the Client ID - you'll need this for manifest.json

## Phase 2: Extension Configuration

### Step 4: Update manifest.json

Add these permissions and OAuth configuration:

```json
{
  "permissions": ["identity", "https://www.googleapis.com/*"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/gmail.send"]
  }
}
```

### Step 5: Create Authentication Service

Create `auth-service.js` with OAuth token management:

```javascript
class AuthService {
  static async getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }

  static async removeCachedAuthToken() {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({}, resolve);
    });
  }
}
```

### Step 6: Create Gmail Service

Create `gmail-service.js` for sending emails:

```javascript
class GmailService {
  static async sendEmail(to, subject, body) {
    try {
      const token = await AuthService.getAuthToken();
      const email = this.createEmail(to, subject, body);
      const encodedEmail = btoa(email).replace(/\+/g, "-").replace(/\//g, "_");

      const response = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: encodedEmail,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  static createEmail(to, subject, body) {
    const email = [
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      body,
    ].join("\r\n");

    return email;
  }
}
```

### Step 7: Create Email Templates

Create `email-templates.js`:

```javascript
const EmailTemplates = {
  taskDetected: (taskData) => ({
    subject: "RHAT - New Task Available!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🎉 New Task Detected!</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Page:</strong> ${
            taskData.url || "RaterHub Evaluation Page"
          }</p>
          <p><strong>Status:</strong> Task is available for acquisition</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          This notification was sent by RHAT - RaterHub Automated Tasks extension.
        </p>
      </div>
    `,
  }),

  testEmail: () => ({
    subject: "RHAT - Test Email",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">✅ Test Email Successful!</h2>
        <p>Your Gmail integration is working correctly.</p>
        <p style="color: #666; font-size: 14px;">
          Sent by RHAT extension at ${new Date().toLocaleString()}
        </p>
      </div>
    `,
  }),
};
```

## Phase 3: Background Script Integration

### Step 8: Update background.js

Add Gmail handling to the message listener:

```javascript
// Add to existing message listener
if (message.action === "taskDetected") {
  console.log("Background: Received task detection notification");
  handleTaskDetected(message.taskData);
  return true;
}

if (message.action === "gmailAuthenticate") {
  console.log("Background: Received Gmail authentication request");
  handleGmailAuthentication(sendResponse);
  return true;
}

if (message.action === "sendTestEmail") {
  console.log("Background: Received test email request");
  handleTestEmail(sendResponse);
  return true;
}
```

Add the handler functions:

```javascript
async function handleTaskDetected(taskData) {
  try {
    console.log("Background: Handling task detection for Gmail notifications");

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

    // Handle authentication errors
    if (
      error.message.includes("invalid_grant") ||
      error.message.includes("401")
    ) {
      console.log("Background: Gmail authentication error detected");
      chrome.storage.sync.set({ gmailAuthStatus: "authentication_required" });
    }
  }
}

async function handleGmailAuthentication(sendResponse) {
  try {
    console.log("Background: Starting Gmail authentication");

    const authResult = await AuthService.authenticate();

    if (authResult) {
      console.log("Background: Gmail authentication successful");
      chrome.storage.sync.set({
        gmailAuthStatus: "authenticated",
        gmailAuthToken: authResult.access_token,
      });
      sendResponse({
        success: true,
        message: "Gmail authentication successful",
      });
    } else {
      console.log("Background: Gmail authentication failed");
      chrome.storage.sync.set({ gmailAuthStatus: "authentication_failed" });
      sendResponse({ success: false, message: "Gmail authentication failed" });
    }
  } catch (error) {
    console.error("Background: Gmail authentication error:", error);
    chrome.storage.sync.set({ gmailAuthStatus: "authentication_error" });
    sendResponse({ success: false, message: error.message });
  }
}

async function handleTestEmail(sendResponse) {
  try {
    // Get the notification email from storage
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(["notificationEmail"], resolve);
    });

    if (!settings.notificationEmail) {
      sendResponse({
        success: false,
        message: "No notification email configured",
      });
      return;
    }

    console.log(
      "Background: Sending test email to:",
      settings.notificationEmail
    );

    const result = await GmailService.sendTestEmail(settings.notificationEmail);

    console.log("Background: Test email sent successfully:", result.id);
    sendResponse({ success: true, message: "Test email sent successfully" });
  } catch (error) {
    console.error("Background: Failed to send test email:", error);
    sendResponse({ success: false, message: error.message });
  }
}
```

## Phase 4: Options Page Updates

### Step 9: Update options.html

Add Gmail notifications section:

```html
<!-- Add this inside the notifications tab content -->
<section class="settings-section">
  <div class="section-header">
    <h2 class="section-title">Gmail Notifications</h2>
    <p class="section-description">
      Configure email notifications for task detection events
    </p>
  </div>

  <div class="settings-grid">
    <div class="setting-card">
      <div class="setting-header">
        <h3 class="setting-title">Enable Gmail Notifications</h3>
        <label class="toggle-switch">
          <input type="checkbox" id="gmailNotificationsToggle" />
          <span class="slider"></span>
        </label>
      </div>
      <p class="setting-description">
        Send email notifications when tasks become available
      </p>
    </div>

    <div class="setting-card">
      <div class="setting-header">
        <h3 class="setting-title">Notification Email</h3>
        <div class="input-group">
          <input
            type="email"
            id="notificationEmailInput"
            class="styled-input"
            placeholder="your.email@example.com"
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
          />
        </div>
      </div>
      <p class="setting-description">
        Email address where notifications will be sent
      </p>
    </div>

    <div class="setting-card">
      <div class="setting-header">
        <h3 class="setting-title">Gmail Authentication</h3>
        <div class="auth-status-container">
          <div class="status-indicator">
            <div class="status-dot" id="gmailAuthStatusDot"></div>
            <span id="gmailAuthStatusText">Not Authenticated</span>
          </div>
          <button id="gmailAuthBtn" class="btn btn-primary">
            Authenticate
          </button>
        </div>
      </div>
      <p class="setting-description">
        Connect your Gmail account to send notifications
      </p>
    </div>

    <div class="setting-card">
      <div class="setting-header">
        <h3 class="setting-title">Test Email</h3>
        <button id="testEmailBtn" class="btn btn-secondary">
          Send Test Email
        </button>
      </div>
      <p class="setting-description">
        Send a test email to verify your Gmail setup
      </p>
      <div
        id="testEmailStatus"
        class="status-message"
        style="display: none"
      ></div>
    </div>
  </div>
</section>
```

### Step 10: Update options.js

Add Gmail settings handling:

```javascript
// Add to loadSettings function
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
    // Add Gmail settings
    "enableGmailNotifications",
    "notificationEmail",
    "gmailAuthStatus",
  ],
  (data) => {
    // ... existing code ...

    // Update Gmail settings
    gmailNotificationsToggle.checked =
      data.enableGmailNotifications !== undefined
        ? data.enableGmailNotifications
        : false;
    notificationEmailInput.value = data.notificationEmail || "";
    updateAuthStatusUI(data.gmailAuthStatus || "unauthenticated");
  }
);

// Add Gmail event listeners
gmailNotificationsToggle.addEventListener("change", () => {
  chrome.storage.sync.set({
    enableGmailNotifications: gmailNotificationsToggle.checked,
  });
});

notificationEmailInput.addEventListener("input", () => {
  chrome.storage.sync.set({ notificationEmail: notificationEmailInput.value });
});

gmailAuthBtn.addEventListener("click", () => {
  // Trigger Gmail authentication flow
  chrome.runtime.sendMessage({ action: "gmailAuthenticate" }, (response) => {
    if (response && response.status) {
      updateAuthStatusUI(response.status);
    }
  });
});

testEmailBtn.addEventListener("click", () => {
  testEmailStatus.style.display = "none";
  chrome.runtime.sendMessage({ action: "sendTestEmail" }, (response) => {
    if (response && response.success) {
      testEmailStatus.textContent = "Test email sent successfully.";
      testEmailStatus.style.color = "green";
    } else {
      testEmailStatus.textContent = "Failed to send test email.";
      testEmailStatus.style.color = "red";
    }
    testEmailStatus.style.display = "block";
  });
});

// Add updateAuthStatusUI function
function updateAuthStatusUI(status) {
  if (status === "authenticated") {
    gmailAuthStatusDot.classList.add("active");
    gmailAuthStatusText.textContent = "Authenticated";
    gmailAuthBtn.disabled = true;
  } else {
    gmailAuthStatusDot.classList.remove("active");
    gmailAuthStatusText.textContent = "Not Authenticated";
    gmailAuthBtn.disabled = false;
  }
}
```

## Phase 5: Content Script Updates

### Step 11: Update content.js

Add task detection message sending:

```javascript
// Add to existing task detection logic
function notifyTaskDetected() {
  const taskData = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    title: document.title,
    detectionMethod: "button_found",
  };

  chrome.runtime.sendMessage({
    action: "taskDetected",
    taskData: taskData,
  });
}
```

## Phase 6: Testing

### Step 12: Test the Integration

1. Load the extension in Chrome
2. Go to options page
3. Enable Gmail notifications
4. Enter your email address
5. Click "Authenticate" and complete OAuth flow
6. Click "Send Test Email" to verify
7. Test with actual task detection

## Troubleshooting

### Common Issues:

1. **OAuth fails**: Check Client ID in manifest.json matches Google Cloud Console
2. **Emails not sending**: Verify Gmail API is enabled and OAuth scopes are correct
3. **Authentication errors**: Clear cached tokens and re-authenticate
4. **Extension not loading**: Check manifest.json syntax and required files

### Debug Steps:

1. Open Chrome DevTools for extension background page
2. Check console for error messages
3. Verify network requests to Gmail API
4. Test OAuth token validity

## Security Notes

- OAuth tokens are managed by Chrome's identity API
- No sensitive data is stored in extension storage
- All communication uses HTTPS
- User must explicitly authenticate and grant permissions
