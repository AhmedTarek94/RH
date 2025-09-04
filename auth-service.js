class AuthService {
  // Configuration constants
  static TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiry
  static MAX_RETRY_ATTEMPTS = 3;
  static RETRY_BASE_DELAY = 1000; // 1 second

  // Storage keys for consistency
  static STORAGE_KEYS = {
    TOKEN: "gmailAuthToken",
    STATUS: "gmailAuthStatus",
    ERROR: "gmailAuthError",
    TIMESTAMP: "gmailAuthTimestamp",
    USER_INFO: "gmailAuthUserInfo",
    LAST_NOTIFICATION_TIME: "lastNotificationTime",
    LAST_NOTIFICATION_EMAIL: "lastNotificationEmail",
  };

  // Authentication status constants
  static STATUS = {
    NOT_AUTHENTICATED: "not_authenticated",
    AUTHENTICATING: "authenticating",
    AUTHENTICATED: "authenticated",
    AUTHENTICATION_FAILED: "authentication_failed",
    AUTHENTICATION_ERROR: "authentication_error",
    AUTHENTICATION_REQUIRED: "authentication_required",
    TOKEN_EXPIRED: "token_expired",
  };

  // Error types for consistent categorization
  static ERROR_TYPES = {
    ACCESS_DENIED: "ACCESS_DENIED",
    INVALID_CLIENT: "INVALID_CLIENT",
    REDIRECT_URI_MISMATCH: "REDIRECT_URI_MISMATCH",
    INVALID_GRANT: "INVALID_GRANT",
    NETWORK_ERROR: "NETWORK_ERROR",
    NO_TOKEN: "NO_TOKEN",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    TOKEN_VERIFICATION_ERROR: "TOKEN_VERIFICATION_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
  };

  /**
   * Get authentication token with automatic refresh
   * @param {boolean} interactive - Whether to show OAuth consent screen
   * @returns {Promise<string>} Valid authentication token
   */
  static async getValidToken(interactive = false) {
    try {
      console.log(
        "AuthService: Getting valid token, interactive:",
        interactive
      );

      const storedToken = await this.getStoredToken();

      // If no stored token, get new one
      if (!storedToken) {
        console.log("AuthService: No stored token, getting new token");
        return await this.authenticate(interactive);
      }

      // Check if token is expired or about to expire
      if (this.isTokenExpired(storedToken)) {
        console.log("AuthService: Token expired, attempting refresh");

        try {
          // Try silent refresh first
          return await this.refreshToken();
        } catch (refreshError) {
          console.log(
            "AuthService: Silent refresh failed, trying interactive auth"
          );
          if (interactive) {
            return await this.authenticate(true);
          }
          throw refreshError;
        }
      }

      console.log("AuthService: Using valid stored token");
      return storedToken.token;
    } catch (error) {
      console.error("AuthService: Failed to get valid token:", error);
      throw this.categorizeError(error);
    }
  }

  /**
   * Perform full authentication flow
   * @param {boolean} interactive - Whether to show OAuth consent screen
   * @returns {Promise<string>} Authentication token
   */
  static async authenticate(interactive = true) {
    try {
      console.log(
        "AuthService: Starting authentication, interactive:",
        interactive
      );

      // Update status to authenticating
      await this.updateAuthStatus(this.STATUS.AUTHENTICATING);

      // Clear any existing authentication data
      await this.clearAllAuthData();

      // Get token from Chrome Identity API
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive }, (token) => {
          if (chrome.runtime.lastError) {
            console.error(
              "AuthService: Chrome Identity error:",
              chrome.runtime.lastError
            );
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!token) {
            console.error(
              "AuthService: No token received from Chrome Identity"
            );
            reject(new Error("No authentication token received"));
          } else {
            console.log("AuthService: Token received from Chrome Identity");
            resolve(token);
          }
        });
      });

      // Store the token with metadata
      await this.storeToken(token);

      // Update status to authenticated
      await this.updateAuthStatus(this.STATUS.AUTHENTICATED);

      // Broadcast status change
      await this.broadcastAuthStatusChange();

      console.log("AuthService: Authentication successful");
      return token;
    } catch (error) {
      console.error("AuthService: Authentication failed:", error);

      const categorizedError = this.categorizeError(error);
      await this.updateAuthStatus(
        this.STATUS.AUTHENTICATION_ERROR,
        categorizedError
      );

      throw categorizedError;
    }
  }

  /**
   * Refresh existing token silently
   * @returns {Promise<string>} Refreshed token
   */
  static async refreshToken() {
    try {
      console.log("AuthService: Attempting token refresh");

      const newToken = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (chrome.runtime.lastError) {
            console.error(
              "AuthService: Refresh error:",
              chrome.runtime.lastError
            );
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!token) {
            console.error("AuthService: Refresh returned no token");
            reject(new Error("Token refresh failed - no token received"));
          } else {
            console.log("AuthService: Token refreshed successfully");
            resolve(token);
          }
        });
      });

      await this.storeToken(newToken);
      await this.broadcastAuthStatusChange();

      return newToken;
    } catch (error) {
      console.error("AuthService: Token refresh failed:", error);
      throw this.categorizeError(error);
    }
  }

  /**
   * Verify token validity by making a test API call
   * @returns {Promise<boolean>} Whether token is valid
   */
  static async verifyToken() {
    try {
      console.log("AuthService: Verifying token validity");

      const token = await this.getValidToken(false);

      // Make a simple API call to verify token
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + token
      );

      if (!response.ok) {
        console.log(
          "AuthService: Token verification failed - invalid response"
        );
        return false;
      }

      const tokenInfo = await response.json();

      // Check if token is still valid
      const now = Date.now() / 1000;
      const isValid = tokenInfo.expires_in > 300; // More than 5 minutes remaining

      console.log("AuthService: Token verification result:", isValid);
      return isValid;
    } catch (error) {
      console.error("AuthService: Token verification error:", error);
      return false;
    }
  }

  /**
   * Clear all authentication data
   */
  static async clearAllAuthData() {
    console.log("AuthService: Clearing all authentication data");

    const keysToRemove = Object.values(this.STORAGE_KEYS);

    await new Promise((resolve) => {
      chrome.storage.sync.remove(keysToRemove, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "AuthService: Error clearing auth data:",
            chrome.runtime.lastError
          );
        } else {
          console.log("AuthService: Authentication data cleared");
        }
        resolve();
      });
    });

    // Also clear any cached tokens in Chrome Identity
    try {
      await new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({}, resolve);
      });
      console.log("AuthService: Cached tokens cleared");
    } catch (error) {
      console.error("AuthService: Error clearing cached tokens:", error);
    }
  }

  /**
   * Store token with metadata
   * @param {string} token - Authentication token
   */
  static async storeToken(token) {
    const tokenData = {
      token: token,
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600 * 1000, // 1 hour expiry
      scope: "https://www.googleapis.com/auth/gmail.send",
    };

    await new Promise((resolve, reject) => {
      chrome.storage.sync.set(
        {
          [this.STORAGE_KEYS.TOKEN]: tokenData,
          [this.STORAGE_KEYS.STATUS]: this.STATUS.AUTHENTICATED,
          [this.STORAGE_KEYS.ERROR]: null,
          [this.STORAGE_KEYS.TIMESTAMP]: new Date().toISOString(),
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "AuthService: Error storing token:",
              chrome.runtime.lastError
            );
            reject(new Error("Failed to store authentication token"));
          } else {
            console.log("AuthService: Token stored successfully");
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get stored token data
   * @returns {Promise<Object|null>} Token data or null if not found
   */
  static async getStoredToken() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([this.STORAGE_KEYS.TOKEN], (data) => {
        const tokenData = data[this.STORAGE_KEYS.TOKEN];
        if (!tokenData || !tokenData.token) {
          console.log("AuthService: No stored token found");
          resolve(null);
        } else {
          console.log("AuthService: Retrieved stored token");
          resolve(tokenData);
        }
      });
    });
  }

  /**
   * Check if token is expired
   * @param {Object} tokenData - Token data object
   * @returns {boolean} Whether token is expired
   */
  static isTokenExpired(tokenData) {
    if (!tokenData || !tokenData.expiresAt) {
      return true;
    }

    return Date.now() >= tokenData.expiresAt - this.TOKEN_EXPIRY_BUFFER;
  }

  /**
   * Update authentication status
   * @param {string} status - New status
   * @param {Object} error - Error details (optional)
   */
  static async updateAuthStatus(status, error = null) {
    const updateData = {
      [this.STORAGE_KEYS.STATUS]: status,
      [this.STORAGE_KEYS.TIMESTAMP]: new Date().toISOString(),
    };

    if (error) {
      updateData[this.STORAGE_KEYS.ERROR] = {
        type: error.type,
        message: error.message,
        userMessage: error.userMessage || error.message,
        timestamp: new Date().toISOString(),
      };
    } else if (status !== this.STATUS.AUTHENTICATING) {
      updateData[this.STORAGE_KEYS.ERROR] = null;
    }

    await new Promise((resolve) => {
      chrome.storage.sync.set(updateData, () => {
        console.log("AuthService: Status updated to:", status);
        resolve();
      });
    });
  }

  /**
   * Get current authentication status
   * @returns {Promise<Object>} Authentication status object
   */
  static async getAuthStatus() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        [
          this.STORAGE_KEYS.STATUS,
          this.STORAGE_KEYS.ERROR,
          this.STORAGE_KEYS.TIMESTAMP,
          this.STORAGE_KEYS.TOKEN,
        ],
        (data) => {
          const status = {
            status:
              data[this.STORAGE_KEYS.STATUS] || this.STATUS.NOT_AUTHENTICATED,
            isAuthenticated:
              data[this.STORAGE_KEYS.STATUS] === this.STATUS.AUTHENTICATED,
            isAuthenticating:
              data[this.STORAGE_KEYS.STATUS] === this.STATUS.AUTHENTICATING,
            hasError: this.isErrorStatus(data[this.STORAGE_KEYS.STATUS]),
            error: data[this.STORAGE_KEYS.ERROR] || null,
            timestamp: data[this.STORAGE_KEYS.TIMESTAMP] || null,
            hasToken: !!(
              data[this.STORAGE_KEYS.TOKEN] &&
              data[this.STORAGE_KEYS.TOKEN].token
            ),
            message: this.getStatusMessage(
              data[this.STORAGE_KEYS.STATUS],
              data[this.STORAGE_KEYS.ERROR]
            ),
          };
          resolve(status);
        }
      );
    });
  }

  /**
   * Check if status indicates an error
   * @param {string} status - Status to check
   * @returns {boolean} Whether status is an error status
   */
  static isErrorStatus(status) {
    return [
      this.STATUS.AUTHENTICATION_ERROR,
      this.STATUS.AUTHENTICATION_FAILED,
      this.STATUS.TOKEN_EXPIRED,
    ].includes(status);
  }

  /**
   * Get human-readable status message
   * @param {string} status - Status code
   * @param {Object} error - Error details
   * @returns {string} Human-readable message
   */
  static getStatusMessage(status, error) {
    switch (status) {
      case this.STATUS.NOT_AUTHENTICATED:
        return "Not authenticated with Gmail";
      case this.STATUS.AUTHENTICATING:
        return "Authenticating with Gmail...";
      case this.STATUS.AUTHENTICATED:
        return "Successfully authenticated with Gmail";
      case this.STATUS.AUTHENTICATION_FAILED:
        return "Authentication failed - no token received";
      case this.STATUS.AUTHENTICATION_ERROR:
        return error?.userMessage || "Authentication error occurred";
      case this.STATUS.AUTHENTICATION_REQUIRED:
        return "Re-authentication required";
      case this.STATUS.TOKEN_EXPIRED:
        return "Authentication token has expired";
      default:
        return "Unknown authentication status";
    }
  }

  /**
   * Categorize error for consistent handling
   * @param {Error} error - Original error
   * @returns {Object} Categorized error object
   */
  static categorizeError(error) {
    const message = error.message || "Unknown error";

    let errorType = this.ERROR_TYPES.UNKNOWN_ERROR;
    let userMessage = "Authentication failed due to an unknown error";

    if (message.includes("access_denied")) {
      errorType = this.ERROR_TYPES.ACCESS_DENIED;
      userMessage = "Authentication was denied by the user";
    } else if (message.includes("invalid_client")) {
      errorType = this.ERROR_TYPES.INVALID_CLIENT;
      userMessage = "Invalid OAuth client configuration";
    } else if (message.includes("redirect_uri_mismatch")) {
      errorType = this.ERROR_TYPES.REDIRECT_URI_MISMATCH;
      userMessage = "OAuth redirect URI mismatch";
    } else if (message.includes("invalid_grant")) {
      errorType = this.ERROR_TYPES.INVALID_GRANT;
      userMessage = "Authentication token has expired or is invalid";
    } else if (message.includes("network") || message.includes("fetch")) {
      errorType = this.ERROR_TYPES.NETWORK_ERROR;
      userMessage = "Network error during authentication";
    } else if (message.includes("No authentication token received")) {
      errorType = this.ERROR_TYPES.NO_TOKEN;
      userMessage = "No authentication token received from Google";
    }

    return {
      type: errorType,
      message: message,
      userMessage: userMessage,
      originalError: error,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Broadcast authentication status change to all extension components
   */
  static async broadcastAuthStatusChange() {
    try {
      const authStatus = await this.getAuthStatus();

      const authMessage = {
        action: "authStatusChanged",
        authStatus: authStatus,
        source: "auth-service",
      };

      // Send to all extension pages
      chrome.runtime.sendMessage(authMessage).catch((error) => {
        console.log(
          "AuthService: No extension pages open to receive auth status change"
        );
      });

      // Send to content scripts
      chrome.tabs.query(
        { url: "https://www.raterhub.com/evaluation/rater*" },
        (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, authMessage).catch((error) => {
              console.log(
                `AuthService: Content script not ready in tab ${tab.id}`
              );
            });
          });
        }
      );

      console.log("AuthService: Authentication status broadcasted");
    } catch (error) {
      console.error("AuthService: Error broadcasting auth status:", error);
    }
  }

  /**
   * Perform health check on authentication system
   * @returns {Promise<Object>} Health check results
   */
  static async healthCheck() {
    try {
      const status = await this.getAuthStatus();
      const tokenValid = status.isAuthenticated
        ? await this.verifyToken()
        : false;

      return {
        healthy: status.isAuthenticated && tokenValid,
        status: status.status,
        tokenValid: tokenValid,
        lastChecked: new Date().toISOString(),
        issues: [],
      };
    } catch (error) {
      return {
        healthy: false,
        status: "error",
        tokenValid: false,
        lastChecked: new Date().toISOString(),
        issues: [error.message],
      };
    }
  }

  // Legacy methods for backward compatibility
  static async getAuthToken(interactive = false) {
    return this.getValidToken(interactive);
  }

  static async getAuthTokenForServiceWorker() {
    try {
      return await this.getValidToken(false);
    } catch (error) {
      return await this.getValidToken(true);
    }
  }

  static async removeCachedAuthToken() {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({}, resolve);
    });
  }
}
