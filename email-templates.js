/**
 * Email Templates for RaterHub Task Monitor
 * Provides customizable email templates for different notification types
 */

const EmailTemplates = {
  /**
   * Task detected notification template
   * @param {Object} taskData - Task detection data
   * @returns {Object} Email template with subject and body
   */
  taskDetected: (taskData) => {
    const timestamp = new Date().toLocaleString();
    const taskUrl = taskData.url || "https://www.raterhub.com/evaluation/rater";

    return {
      subject: "🚨 RaterHub Task Monitor: New Task Available!",
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Available Notification</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
            }
            .content {
              padding: 30px 20px;
            }
            .task-card {
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #28a745;
            }
            .task-info {
              margin: 10px 0;
            }
            .task-info strong {
              display: inline-block;
              width: 120px;
              color: #495057;
            }
            .urgent {
              color: #dc3545;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 14px;
            }
            .action-button {
              display: inline-block;
              background: #28a745;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
              transition: background-color 0.3s;
            }
            .action-button:hover {
              background: #218838;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              margin: 5px 0;
            }
            .icon {
              font-size: 20px;
              margin-right: 8px;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
                border-radius: 0;
              }
              .header, .content {
                padding: 20px 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="icon">🚨</span>Task Available!</h1>
              <p>RaterHub Task Monitor has detected a new task ready for acquisition</p>
            </div>

            <div class="content">
              <div class="task-card">
                <h3 style="margin-top: 0; color: #28a745;">
                  <span class="icon">✅</span>Task Details
                </h3>
                <div class="task-info">
                  <strong>Detection Time:</strong> ${timestamp}
                </div>
                <div class="task-info">
                  <strong>Task URL:</strong>
                  <a href="${taskUrl}" style="color: #007bff; text-decoration: none;">${taskUrl}</a>
                </div>
                <div class="task-info">
                  <strong>Status:</strong> <span class="urgent">Available for acquisition</span>
                </div>
                <div class="task-info">
                  <strong>Method:</strong> ${
                    taskData.detectionMethod || "Automatic monitoring"
                  }
                </div>
                ${
                  taskData.title
                    ? `<div class="task-info"><strong>Page Title:</strong> ${taskData.title}</div>`
                    : ""
                }
              </div>

              <div style="text-align: center;">
                <a href="${taskUrl}" class="action-button">
                  <span class="icon">🚀</span>Acquire Task Now
                </a>
              </div>

              <p style="text-align: center; color: #6c757d; font-size: 14px; margin-top: 20px;">
                This action will open RaterHub in a new tab where you can acquire the task.
              </p>
            </div>

            <div class="footer">
              <p><strong>RaterHub Task Monitor Extension</strong></p>
              <p>This notification was automatically generated when a task became available</p>
              <p>To manage your notification settings, visit the extension options</p>
            </div>
          </div>
        </body>
        </html>
      `,
      plainText: `
🚨 RaterHub Task Monitor: New Task Available!

Task Details:
- Detection Time: ${timestamp}
- Task URL: ${taskUrl}
- Status: Available for acquisition
- Detection Method: ${taskData.detectionMethod || "Automatic monitoring"}
${taskData.title ? `- Page Title: ${taskData.title}` : ""}

Please visit the task URL above to acquire the task.

---
RaterHub Task Monitor Extension
This notification was automatically generated when a task became available.
      `.trim(),
    };
  },

  /**
   * Test email template
   * @returns {Object} Test email template
   */
  testEmail: () => {
    const timestamp = new Date().toLocaleString();

    return {
      subject: "🧪 RaterHub Task Monitor: Test Email",
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #17a2b8; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Test Email</h1>
              <p>RaterHub Task Monitor Integration Test</p>
            </div>

            <div class="content">
              <h3>Integration Test Successful!</h3>
              <p>This is a test email to verify that the Gmail integration is working correctly.</p>
              <p><strong>Test sent at:</strong> ${timestamp}</p>
              <p><strong>Extension ID:</strong> ${chrome.runtime.id}</p>
            </div>

            <div class="footer">
              <p>RaterHub Task Monitor Extension</p>
              <p>If you received this email, the Gmail integration is working properly!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      plainText: `
🧪 RaterHub Task Monitor: Test Email

Integration Test Successful!

This is a test email to verify that the Gmail integration is working correctly.

Test Details:
- Sent at: ${timestamp}
- Extension ID: ${chrome.runtime.id}

If you received this email, the Gmail integration is working properly!

---
RaterHub Task Monitor Extension
      `.trim(),
    };
  },

  /**
   * Error notification template
   * @param {Object} errorData - Error information
   * @returns {Object} Error notification template
   */
  errorNotification: (errorData) => {
    const timestamp = new Date().toLocaleString();

    return {
      subject: "⚠️ RaterHub Task Monitor: Error Notification",
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .error-details { background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0; }
            .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Error Notification</h1>
              <p>RaterHub Task Monitor encountered an issue</p>
            </div>

            <div class="content">
              <h3>System Error</h3>
              <p>An error occurred while monitoring tasks. Please check the extension status.</p>

              <div class="error-details">
                <p><strong>Time:</strong> ${timestamp}</p>
                <p><strong>Error:</strong> ${
                  errorData.message || "Unknown error"
                }</p>
                <p><strong>Component:</strong> ${
                  errorData.component || "Unknown"
                }</p>
                ${
                  errorData.details
                    ? `<p><strong>Details:</strong> ${errorData.details}</p>`
                    : ""
                }
              </div>
            </div>

            <div class="footer">
              <p>RaterHub Task Monitor Extension</p>
              <p>Please check the extension options for more information</p>
            </div>
          </div>
        </body>
        </html>
      `,
      plainText: `
⚠️ RaterHub Task Monitor: Error Notification

System Error

An error occurred while monitoring tasks. Please check the extension status.

Error Details:
- Time: ${timestamp}
- Error: ${errorData.message || "Unknown error"}
- Component: ${errorData.component || "Unknown"}
${errorData.details ? `- Details: ${errorData.details}` : ""}

Please check the extension options for more information.

---
RaterHub Task Monitor Extension
      `.trim(),
    };
  },

  /**
   * Custom template builder
   * @param {Object} config - Template configuration
   * @returns {Object} Custom email template
   */
  custom: (config) => {
    const {
      title = "Notification",
      message = "You have a new notification",
      actionText = "View Details",
      actionUrl = "#",
      priority = "normal", // 'low', 'normal', 'high', 'urgent'
    } = config;

    const colors = {
      low: "#6c757d",
      normal: "#007bff",
      high: "#fd7e14",
      urgent: "#dc3545",
    };

    const color = colors[priority] || colors.normal;
    const timestamp = new Date().toLocaleString();

    return {
      subject: `${priority === "urgent" ? "🚨" : "📧"} ${title}`,
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .action-button { display: inline-block; background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>

            <div class="content">
              <p>${message}</p>
              <p><strong>Time:</strong> ${timestamp}</p>

              <div style="text-align: center;">
                <a href="${actionUrl}" class="action-button">${actionText}</a>
              </div>
            </div>

            <div class="footer">
              <p>RaterHub Task Monitor Extension</p>
            </div>
          </div>
        </body>
        </html>
      `,
      plainText: `
${title}

${message}

Time: ${timestamp}

Action: ${actionText} - ${actionUrl}

---
RaterHub Task Monitor Extension
      `.trim(),
    };
  },
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = EmailTemplates;
}
