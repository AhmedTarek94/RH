# Manual Implementation Steps for Gmail API Integration

## Phase 1: Project Setup and Authentication

### Step 1.1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Chrome Extension" as application type
   - Enter your Chrome Extension ID (from manifest.json)
   - Add authorized redirect URIs if needed

### Step 1.2: Update manifest.json
Add these permissions to your `manifest.json`:
```json
{
  "permissions": [
    "identity",
    "https://www.googleapis.com/*"
  ],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID_HERE",
    "scopes": [
      "https://www.googleapis.com/auth/gmail.send"
    ]
  }
}
```

### Step 1.3: Create Authentication Service
Create `auth-service.js`:
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

  static async refreshToken() {
    // Implementation for token refresh
  }
}
```

## Phase 2: Core Gmail Integration

### Step 2.1: Create Gmail Service Module
Create `gmail-service.js`:
```javascript
class GmailService {
  static async sendEmail(to, subject, body) {
    const token = await AuthService.getAuthToken();

    const email = this.createEmail(to, subject, body);
    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    return response.json();
  }

  static createEmail(to, subject, body) {
    // Implementation for creating RFC 2822 email format
  }
}
```

### Step 2.2: Create Email Templates
Create `email-templates.js`:
```javascript
const EmailTemplates = {
  taskDetected: (taskData) => ({
    subject: 'RaterHub Task Monitor: New Task Available!',
    body: `
      <h2>New Task Detected!</h2>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Task URL:</strong> ${taskData.url}</p>
      <p><strong>Status:</strong> Task is available for acquisition</p>
      <hr>
      <p>This email was sent by RaterHub Task Monitor extension.</p>
    `
  })
};
```

### Step 2.3: Update Background Script
Modify `background.js` to integrate Gmail service:
```javascript
// Add this to the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ... existing code ...

  if (message.action === 'taskDetected') {
    handleTaskDetected(message.taskData);
  }
});

async function handleTaskDetected(taskData) {
  // Check if Gmail notifications are enabled
  chrome.storage.sync.get(['gmailNotificationsEnabled'], async (settings) => {
    if (settings.gmailNotificationsEnabled) {
      try {
        const emailTemplate = EmailTemplates.taskDetected(taskData);
        await GmailService.sendEmail(
          settings.notificationEmail,
          emailTemplate.subject,
          emailTemplate.body
        );
        console.log('Task notification email sent successfully');
      } catch (error) {
        console.error('Failed to send task notification email:', error);
      }
    }
  });
}
```

## Phase 3: User Interface and Settings

### Step 3.1: Update Options Page
Add Gmail settings section to `options.html`:
```html
<div class="settings-section">
  <h3>Gmail Notifications</h3>
  <div class="setting-item">
    <label for="gmail-notifications">
      <input type="checkbox" id="gmail-notifications">
      Enable Gmail notifications
    </label>
  </div>
  <div class="setting-item">
    <label for="notification-email">Notification Email:</label>
    <input type="email" id="notification-email" placeholder="your-email@example.com">
  </div>
  <div class="setting-item">
    <button id="connect-gmail">Connect Gmail Account</button>
    <span id="gmail-status">Not connected</span>
  </div>
</div>
```

### Step 3.2: Update Options JavaScript
Add Gmail settings handling to `options.js`:
```javascript
// Load Gmail settings
function loadGmailSettings() {
  chrome.storage.sync.get([
    'gmailNotificationsEnabled',
    'notificationEmail'
  ], (settings) => {
    document.getElementById('gmail-notifications').checked =
      settings.gmailNotificationsEnabled || false;
    document.getElementById('notification-email').value =
      settings.notificationEmail || '';
  });
}

// Save Gmail settings
function saveGmailSettings() {
  const settings = {
    gmailNotificationsEnabled: document.getElementById('gmail-notifications').checked,
    notificationEmail: document.getElementById('notification-email').value
  };

  chrome.storage.sync.set(settings, () => {
    console.log('Gmail settings saved');
  });
}

// Connect Gmail button handler
document.getElementById('connect-gmail').addEventListener('click', async () => {
  try {
    const token = await AuthService.getAuthToken();
    document.getElementById('gmail-status').textContent = 'Connected';
    document.getElementById('gmail-status').style.color = 'green';
  } catch (error) {
    document.getElementById('gmail-status').textContent = 'Connection failed';
    document.getElementById('gmail-status').style.color = 'red';
  }
});
```

## Phase 4: Integration with Task Detection

### Step 4.1: Update Content Script
Modify `content.js` to send detailed task data:
```javascript
// When task is detected, send detailed information
function notifyTaskDetected() {
  const taskData = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    title: document.title,
    detectionMethod: 'button_found'
  };

  chrome.runtime.sendMessage({
    action: 'taskDetected',
    taskData: taskData
  });
}
```

### Step 4.2: Add Email Trigger Logic
Update the task detection logic in `background.js`:
```javascript
function handleTaskDetected(taskData) {
  // Prevent duplicate emails within short time frame
  const now = Date.now();
  const lastEmailTime = localStorage.getItem('lastEmailTime') || 0;

  if (now - lastEmailTime < 30000) { // 30 seconds cooldown
    console.log('Email cooldown active, skipping notification');
    return;
  }

  chrome.storage.sync.get([
    'gmailNotificationsEnabled',
    'notificationEmail'
  ], async (settings) => {
    if (settings.gmailNotificationsEnabled && settings.notificationEmail) {
      try {
        await sendTaskNotificationEmail(taskData, settings.notificationEmail);
        localStorage.setItem('lastEmailTime', now);
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  });
}

async function sendTaskNotificationEmail(taskData, recipientEmail) {
  const token = await AuthService.getAuthToken();

  const emailContent = {
    to: recipientEmail,
    subject: 'RaterHub Task Monitor: New Task Available!',
    body: generateEmailBody(taskData)
  };

  // Send email using Gmail API
  // Implementation details...
}
```

## Phase 5: Testing and Validation

### Step 5.1: Test Authentication Flow
1. Load the extension in Chrome
2. Go to options page
3. Click "Connect Gmail Account"
4. Verify OAuth flow works correctly
5. Check that token is stored securely

### Step 5.2: Test Email Sending
1. Enable Gmail notifications in settings
2. Set a valid recipient email
3. Trigger task detection (manually or wait for real detection)
4. Verify email is received in recipient's inbox
5. Check email formatting and content

### Step 5.3: Test Error Handling
1. Try sending email without authentication
2. Test with invalid recipient email
3. Verify error messages are displayed to user
4. Check that extension continues working after errors

## Phase 6: Deployment Preparation

### Step 6.1: Update Version
Update `manifest.json`:
```json
{
  "version": "1.8.4",
  "version_name": "1.8.4 - Gmail Integration"
}
```

### Step 6.2: Package Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Pack extension"
4. Select the extension directory
5. Choose output location for .crx file

### Step 6.3: Test Installation
1. Install the packaged extension
2. Verify all features work correctly
3. Test Gmail integration end-to-end
4. Check for any console errors

## Troubleshooting Guide

### Common Issues and Solutions

1. **OAuth Authentication Fails**
   - Check that Client ID is correct in manifest.json
   - Verify Chrome Extension ID matches Google Cloud Console
   - Ensure Gmail API is enabled

2. **Emails Not Sending**
   - Verify Gmail account has granted permissions
   - Check Gmail API quota limits
   - Ensure recipient email is valid

3. **Extension Not Loading**
   - Check manifest.json for syntax errors
   - Verify all required files are present
   - Check browser console for errors

### Debug Steps
1. Open Chrome DevTools for extension background page
2. Check console for error messages
3. Verify network requests to Gmail API
4. Test OAuth token validity

## Security Checklist
- [ ] OAuth tokens stored securely
- [ ] No sensitive data logged to console
- [ ] HTTPS-only communication
- [ ] Proper error handling without exposing sensitive information
- [ ] User consent required for email sending

## Performance Considerations
- Implement email queuing to handle multiple detections
- Add rate limiting to prevent spam
- Cache authentication tokens appropriately
- Handle network failures gracefully

This manual provides step-by-step instructions for implementing the Gmail API integration. Follow each phase sequentially and test thoroughly at each step.
