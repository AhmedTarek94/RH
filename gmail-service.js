// Enhanced Error Handling System
class GmailError extends Error {
  constructor(type, message, originalError = null, context = {}) {
    super(message);
    this.type = type;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.name = "GmailError";
  }
}

const ErrorTypes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

// Retry Manager with Exponential Backoff
class RetryManager {
  static async executeWithRetry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryableError(error) || attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Add jitter
        console.log(
          `GmailService: Retrying operation in ${delay}ms (attempt ${
            attempt + 1
          }/${maxRetries + 1})`
        );
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  static isRetryableError(error) {
    return (
      error.type === ErrorTypes.NETWORK_ERROR ||
      error.type === ErrorTypes.SERVICE_UNAVAILABLE ||
      error.type === ErrorTypes.RATE_LIMIT_ERROR
    );
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Token Manager for OAuth handling - now delegates to unified AuthService
class TokenManager {
  static async getValidToken() {
    try {
      console.log("GmailService: Getting valid token via AuthService");
      return await AuthService.getValidToken(false);
    } catch (error) {
      console.error("GmailService: Failed to get valid token:", error);

      // Convert AuthService errors to GmailError format
      if (error.type) {
        throw new GmailError(
          this.mapAuthServiceErrorType(error.type),
          error.userMessage || error.message,
          error
        );
      }

      throw new GmailError(
        ErrorTypes.AUTHENTICATION_ERROR,
        "No authentication token available. Please authenticate first.",
        error
      );
    }
  }

  static async refreshToken() {
    try {
      console.log("GmailService: Attempting token refresh via AuthService");
      return await AuthService.refreshToken();
    } catch (error) {
      console.error("GmailService: Token refresh failed:", error);

      throw new GmailError(
        ErrorTypes.TOKEN_EXPIRED,
        "Token has expired and refresh failed. Interactive authentication required.",
        error
      );
    }
  }

  static async promptUserAuthentication() {
    try {
      console.log(
        "GmailService: Prompting user for authentication via AuthService"
      );
      return await AuthService.authenticate(true);
    } catch (error) {
      console.error("GmailService: Interactive authentication failed:", error);

      if (error.type) {
        throw new GmailError(
          this.mapAuthServiceErrorType(error.type),
          error.userMessage || error.message,
          error
        );
      }

      throw new GmailError(
        ErrorTypes.AUTHENTICATION_ERROR,
        "Authentication cancelled or failed",
        error
      );
    }
  }

  static async getStoredToken() {
    try {
      console.log("GmailService: Getting stored token via AuthService");
      return await AuthService.getStoredToken();
    } catch (error) {
      console.error("GmailService: Failed to get stored token:", error);
      return null;
    }
  }

  static async storeToken(token) {
    try {
      console.log("GmailService: Storing token via AuthService");
      await AuthService.storeToken(token);
    } catch (error) {
      console.error("GmailService: Failed to store token:", error);
      throw new GmailError(
        ErrorTypes.UNKNOWN_ERROR,
        "Failed to store authentication token",
        error
      );
    }
  }

  static isTokenExpired(tokenData) {
    return AuthService.isTokenExpired(tokenData);
  }

  static async clearStoredToken() {
    try {
      console.log("GmailService: Clearing stored token via AuthService");
      await AuthService.clearAllAuthData();
    } catch (error) {
      console.error("GmailService: Failed to clear stored token:", error);
    }
  }

  // Helper method to map AuthService error types to GmailError types
  static mapAuthServiceErrorType(authServiceType) {
    const errorTypeMap = {
      [AuthService.ERROR_TYPES.ACCESS_DENIED]: ErrorTypes.PERMISSION_ERROR,
      [AuthService.ERROR_TYPES.INVALID_CLIENT]: ErrorTypes.AUTHENTICATION_ERROR,
      [AuthService.ERROR_TYPES.REDIRECT_URI_MISMATCH]:
        ErrorTypes.AUTHENTICATION_ERROR,
      [AuthService.ERROR_TYPES.INVALID_GRANT]: ErrorTypes.TOKEN_EXPIRED,
      [AuthService.ERROR_TYPES.NETWORK_ERROR]: ErrorTypes.NETWORK_ERROR,
      [AuthService.ERROR_TYPES.NO_TOKEN]: ErrorTypes.AUTHENTICATION_ERROR,
      [AuthService.ERROR_TYPES.TOKEN_EXPIRED]: ErrorTypes.TOKEN_EXPIRED,
      [AuthService.ERROR_TYPES.TOKEN_VERIFICATION_ERROR]:
        ErrorTypes.AUTHENTICATION_ERROR,
      [AuthService.ERROR_TYPES.UNKNOWN_ERROR]: ErrorTypes.UNKNOWN_ERROR,
    };

    return errorTypeMap[authServiceType] || ErrorTypes.UNKNOWN_ERROR;
  }
}

// Logger for comprehensive debugging
class GmailLogger {
  static log(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      context: context,
      extensionVersion: chrome.runtime.getManifest().version,
      userAgent: navigator.userAgent,
    };

    const logMessage = `[${level.toUpperCase()}] GmailService: ${message}`;

    switch (level) {
      case "error":
        console.error(logMessage, logEntry);
        this.storeErrorLog(logEntry);
        break;
      case "warn":
        console.warn(logMessage, logEntry);
        break;
      case "info":
        console.info(logMessage, logEntry);
        break;
      case "debug":
        console.debug(logMessage, logEntry);
        break;
      default:
        console.log(logMessage, logEntry);
    }
  }

  static async storeErrorLog(logEntry) {
    try {
      const existingLogs = await this.getStoredLogs();
      existingLogs.push(logEntry);

      // Keep only last 50 error logs to prevent storage bloat
      if (existingLogs.length > 50) {
        existingLogs.shift();
      }

      await new Promise((resolve) => {
        chrome.storage.local.set(
          {
            gmailErrorLogs: existingLogs,
          },
          resolve
        );
      });
    } catch (error) {
      console.error("GmailService: Failed to store error log:", error);
    }
  }

  static async getStoredLogs() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["gmailErrorLogs"], (data) => {
        resolve(data.gmailErrorLogs || []);
      });
    });
  }
}

class GmailService {
  static async sendEmail(to, subject, body) {
    GmailLogger.log("info", "Starting email send process", {
      to,
      subjectLength: subject?.length,
    });

    // Input validation
    this.validateEmailInputs(to, subject, body);

    return await RetryManager.executeWithRetry(async () => {
      try {
        const token = await TokenManager.getValidToken();
        const emailContent = this.createEmailContent(to, subject, body);

        GmailLogger.log("info", "Making API request to Gmail", {
          emailLength: emailContent.length,
          hasToken: !!token,
        });

        const response = await this.makeApiRequest(token, emailContent);
        const result = await this.processApiResponse(response);

        GmailLogger.log("info", "Email sent successfully", {
          emailId: result.id,
        });
        return result;
      } catch (error) {
        GmailLogger.log("error", "Email send failed", {
          errorType: error.type,
          errorMessage: error.message,
          originalError: error.originalError?.message,
        });
        throw error;
      }
    });
  }

  // Input validation methods
  static validateEmailInputs(to, subject, body) {
    if (!to || typeof to !== "string") {
      throw new GmailError(
        ErrorTypes.INVALID_INPUT,
        "Recipient email address is required"
      );
    }

    if (!this.isValidEmail(to)) {
      throw new GmailError(
        ErrorTypes.INVALID_INPUT,
        "Invalid recipient email address format"
      );
    }

    if (
      !subject ||
      typeof subject !== "string" ||
      subject.trim().length === 0
    ) {
      throw new GmailError(
        ErrorTypes.INVALID_INPUT,
        "Email subject is required and cannot be empty"
      );
    }

    if (!body || typeof body !== "string" || body.trim().length === 0) {
      throw new GmailError(
        ErrorTypes.INVALID_INPUT,
        "Email body is required and cannot be empty"
      );
    }

    // Check for excessively long content
    if (subject.length > 998) {
      // RFC 2822 limit for subject
      throw new GmailError(
        ErrorTypes.INVALID_INPUT,
        "Email subject is too long (maximum 998 characters)"
      );
    }

    if (body.length > 50000) {
      // Reasonable limit for email body
      throw new GmailError(
        ErrorTypes.INVALID_INPUT,
        "Email body is too long (maximum 50,000 characters)"
      );
    }
  }

  static isValidEmail(email) {
    // RFC 5322 compliant email regex
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
  }

  // Email content creation
  static createEmailContent(to, subject, body) {
    try {
      const email = [
        "Content-Type: text/html; charset=utf-8",
        "MIME-Version: 1.0",
        `To: ${to}`,
        `Subject: ${subject}`,
        "",
        body,
      ].join("\r\n");

      // Base64 encode with URL-safe characters
      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      GmailLogger.log("debug", "Email content created successfully", {
        originalLength: email.length,
        encodedLength: encodedEmail.length,
      });

      return encodedEmail;
    } catch (error) {
      GmailLogger.log("error", "Failed to create email content", {
        error: error.message,
      });
      throw new GmailError(
        ErrorTypes.UNKNOWN_ERROR,
        "Failed to encode email content",
        error
      );
    }
  }

  // Network request handling with timeout and error classification
  static async makeApiRequest(token, emailContent) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      GmailLogger.log("warn", "API request timeout");
    }, 30000); // 30 second timeout

    try {
      GmailLogger.log("debug", "Initiating Gmail API request");

      const response = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ raw: emailContent }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      GmailLogger.log("debug", "Gmail API response received", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new GmailError(
          ErrorTypes.NETWORK_ERROR,
          "Request timeout - Gmail API took too long to respond"
        );
      }

      if (!navigator.onLine) {
        throw new GmailError(
          ErrorTypes.NETWORK_ERROR,
          "No internet connection available"
        );
      }

      // Classify network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new GmailError(
          ErrorTypes.NETWORK_ERROR,
          "Network error: Unable to connect to Gmail API. Check your internet connection.",
          error
        );
      }

      throw new GmailError(
        ErrorTypes.UNKNOWN_ERROR,
        `Unexpected network error: ${error.message}`,
        error
      );
    }
  }

  // Response processing with detailed error classification
  static async processApiResponse(response) {
    try {
      if (response.ok) {
        const result = await response.json();
        GmailLogger.log("debug", "API response processed successfully", {
          emailId: result.id,
          threadId: result.threadId,
        });
        return result;
      }

      // Handle HTTP error responses
      let errorData = null;
      let errorMessage = `Gmail API error: ${response.status} ${response.statusText}`;

      try {
        errorData = await response.json();
        GmailLogger.log("debug", "Parsed error response from API", errorData);
      } catch (parseError) {
        GmailLogger.log("warn", "Could not parse error response from API", {
          parseError: parseError.message,
        });
      }

      // Classify errors based on status code
      switch (response.status) {
        case 400:
          throw new GmailError(
            ErrorTypes.INVALID_INPUT,
            errorData?.error?.message || "Invalid request data"
          );

        case 401:
          throw new GmailError(
            ErrorTypes.AUTHENTICATION_ERROR,
            "Authentication failed. Token may be expired or invalid.",
            null,
            { statusCode: 401, errorData }
          );

        case 403:
          if (errorData?.error?.message?.includes("quota")) {
            throw new GmailError(
              ErrorTypes.RATE_LIMIT_ERROR,
              "Gmail API quota exceeded. Please try again later.",
              null,
              { statusCode: 403, errorData }
            );
          } else {
            throw new GmailError(
              ErrorTypes.PERMISSION_ERROR,
              "Insufficient permissions to send emails.",
              null,
              { statusCode: 403, errorData }
            );
          }

        case 404:
          throw new GmailError(
            ErrorTypes.UNKNOWN_ERROR,
            "Gmail API endpoint not found.",
            null,
            { statusCode: 404, errorData }
          );

        case 429:
          throw new GmailError(
            ErrorTypes.RATE_LIMIT_ERROR,
            "Too many requests. Please wait before trying again.",
            null,
            { statusCode: 429, errorData }
          );

        case 500:
        case 502:
        case 503:
        case 504:
          throw new GmailError(
            ErrorTypes.SERVICE_UNAVAILABLE,
            "Gmail service is temporarily unavailable. Please try again later.",
            null,
            { statusCode: response.status, errorData }
          );

        default:
          throw new GmailError(
            ErrorTypes.UNKNOWN_ERROR,
            errorData?.error?.message || errorMessage,
            null,
            { statusCode: response.status, errorData }
          );
      }
    } catch (error) {
      // Re-throw GmailErrors as-is
      if (error instanceof GmailError) {
        throw error;
      }

      // Handle JSON parsing errors
      GmailLogger.log("error", "Failed to process API response", {
        error: error.message,
        responseStatus: response.status,
      });

      throw new GmailError(
        ErrorTypes.UNKNOWN_ERROR,
        "Failed to process Gmail API response",
        error
      );
    }
  }

  // Public API methods
  static async sendTaskNotification(taskData, toEmail) {
    GmailLogger.log("info", "Sending task notification email", {
      hasTaskData: !!taskData,
      toEmail: toEmail,
    });

    try {
      const template = EmailTemplates.taskDetected(taskData);
      const result = await this.sendEmail(
        toEmail,
        template.subject,
        template.body
      );

      GmailLogger.log("info", "Task notification sent successfully", {
        emailId: result.id,
        taskType: taskData?.type,
      });

      return result;
    } catch (error) {
      GmailLogger.log("error", "Task notification failed", {
        errorType: error.type,
        toEmail: toEmail,
        taskData: taskData,
      });
      throw error;
    }
  }

  static async sendTestEmail(toEmail) {
    GmailLogger.log("info", "Sending test email", { toEmail });

    try {
      const template = EmailTemplates.testEmail();
      const result = await this.sendEmail(
        toEmail,
        template.subject,
        template.body
      );

      GmailLogger.log("info", "Test email sent successfully", {
        emailId: result.id,
        toEmail: toEmail,
      });

      return result;
    } catch (error) {
      GmailLogger.log("error", "Test email failed", {
        errorType: error.type,
        toEmail: toEmail,
      });
      throw error;
    }
  }

  // Utility methods for external use
  static async clearAuthentication() {
    GmailLogger.log("info", "Clearing Gmail authentication");
    await TokenManager.clearStoredToken();
  }

  static async getAuthenticationStatus() {
    try {
      const tokenData = await TokenManager.getStoredToken();

      if (!tokenData) {
        return {
          authenticated: false,
          status: "not_authenticated",
          message: "Not authenticated with Gmail",
        };
      }

      const isExpired = TokenManager.isTokenExpired(tokenData);

      return {
        authenticated: !isExpired,
        status: isExpired ? "token_expired" : "authenticated",
        message: isExpired
          ? "Authentication token has expired"
          : "Authenticated with Gmail",
        expiresAt: tokenData.expiresAt,
        timestamp: tokenData.timestamp,
      };
    } catch (error) {
      GmailLogger.log("error", "Failed to get authentication status", {
        error: error.message,
      });
      return {
        authenticated: false,
        status: "error",
        message: "Failed to check authentication status",
        error: error.message,
      };
    }
  }

  // Legacy method for backward compatibility
  static async getStoredAuthToken() {
    const tokenData = await TokenManager.getStoredToken();
    return tokenData ? tokenData.token : null;
  }
}
