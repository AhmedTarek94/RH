/**
 * Gmail Service for sending emails via Gmail API
 * Handles email composition, sending, and error handling
 */

class GmailService {
  /**
   * Send an email using Gmail API
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} body - Email body (HTML or plain text)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Gmail API response
   */
  static async sendEmail(to, subject, body, options = {}) {
    try {
      const token = await AuthService.getAuthToken();
      const email = this.createEmail(to, subject, body, options);
      const encodedEmail = btoa(email).replace(/\+/g, "-").replace(/\//g, "_");

      console.log("Sending email to:", to);

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
        const errorData = await response.json();
        throw new Error(
          `Gmail API error: ${response.status} - ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const result = await response.json();
      console.log("Email sent successfully:", result.id);
      return result;
    } catch (error) {
      console.error("Failed to send email:", error);

      // Handle authentication errors
      if (
        error.message.includes("invalid_grant") ||
        error.message.includes("401")
      ) {
        console.log("Authentication error detected, attempting recovery");
        try {
          await AuthService.handleAuthError(error);
          // Retry sending email with new token
          return await this.sendEmail(to, subject, body, options);
        } catch (retryError) {
          throw new Error(
            "Authentication recovery failed: " + retryError.message
          );
        }
      }

      throw error;
    }
  }

  /**
   * Create RFC 2822 formatted email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {Object} options - Additional options
   * @returns {string} RFC 2822 formatted email
   */
  static createEmail(to, subject, body, options = {}) {
    const from = options.from || "me";
    const date = new Date().toUTCString();
    const messageId = `<${Date.now()}@${chrome.runtime.id}>`;

    // Determine if body is HTML
    const isHtml = body.includes("<") && body.includes(">");
    const contentType = isHtml
      ? "text/html; charset=utf-8"
      : "text/plain; charset=utf-8";

    // Create email headers
    let email = [
      `To: ${to}`,
      `From: ${from}`,
      `Subject: ${subject}`,
      `Date: ${date}`,
      `Message-ID: ${messageId}`,
      `Content-Type: ${contentType}`,
      "",
      body,
    ].join("\r\n");

    return email;
  }

  /**
   * Send task notification email
   * @param {Object} taskData - Task detection data
   * @param {string} recipientEmail - Recipient email address
   * @returns {Promise<Object>} Gmail API response
   */
  static async sendTaskNotification(taskData, recipientEmail) {
    const subject = "🚨 RaterHub Task Monitor: New Task Available!";
    const body = this.createTaskNotificationBody(taskData);

    return await this.sendEmail(recipientEmail, subject, body, {
      from: "RaterHub Task Monitor <noreply@raterhub.com>",
    });
  }

  /**
   * Create HTML body for task notification email
   * @param {Object} taskData - Task detection data
   * @returns {string} HTML email body
   */
  static createTaskNotificationBody(taskData) {
    const timestamp = new Date().toLocaleString();
    const taskUrl = taskData.url || "https://www.raterhub.com/evaluation/rater";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; border-radius: 5px; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .task-info { background: white; padding: 15px; border-left: 4px solid #28a745; margin: 10px 0; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
          .urgent { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Task Available!</h1>
            <p>RaterHub Task Monitor has detected a new task</p>
          </div>

          <div class="content">
            <div class="task-info">
              <h3 class="urgent">Action Required</h3>
              <p><strong>Detection Time:</strong> ${timestamp}</p>
              <p><strong>Task URL:</strong> <a href="${taskUrl}" target="_blank">${taskUrl}</a></p>
              <p><strong>Status:</strong> <span class="urgent">Task is available for acquisition</span></p>
              <p><strong>Detection Method:</strong> ${
                taskData.detectionMethod || "Automatic monitoring"
              }</p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${taskUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                🚀 Acquire Task Now
              </a>
            </div>
          </div>

          <div class="footer">
            <p>This notification was sent by RaterHub Task Monitor extension</p>
            <p>To manage your notification settings, visit the extension options</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Check Gmail API quota status
   * @returns {Promise<Object>} Quota information
   */
  static async checkQuota() {
    try {
      const token = await AuthService.getAuthToken();
      const response = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check quota");
      }

      // Note: Gmail API doesn't provide direct quota info via this endpoint
      // This is a basic connectivity check
      return { status: "ok", message: "Gmail API accessible" };
    } catch (error) {
      console.error("Quota check failed:", error);
      throw error;
    }
  }

  /**
   * Test email functionality
   * @param {string} testEmail - Email address to send test to
   * @returns {Promise<Object>} Test result
   */
  static async sendTestEmail(testEmail) {
    const subject = "🧪 RaterHub Task Monitor: Test Email";
    const body = `
      <h2>Test Email</h2>
      <p>This is a test email from RaterHub Task Monitor.</p>
      <p>If you received this email, the Gmail integration is working correctly!</p>
      <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <p>RaterHub Task Monitor Extension</p>
    `;

    return await this.sendEmail(testEmail, subject, body);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GmailService;
}
