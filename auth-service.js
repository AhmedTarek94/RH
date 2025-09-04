/**
 * Authentication Service for Gmail API Integration
 * Handles OAuth 2.0 authentication flow using Chrome Identity API
 */

class AuthService {
  /**
   * Get authentication token from Chrome Identity API
   * @returns {Promise<string>} Authentication token
   */
  static async getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error("Auth error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log("Auth token obtained successfully");
          resolve(token);
        }
      });
    });
  }

  /**
   * Refresh the authentication token
   * @returns {Promise<string>} New authentication token
   */
  static async refreshToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError) {
          // Token might be expired, try interactive flow
          this.getAuthToken().then(resolve).catch(reject);
        } else {
          resolve(token);
        }
      });
    });
  }

  /**
   * Remove cached authentication token
   * @returns {Promise<void>}
   */
  static async removeToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              console.log("Auth token removed from cache");
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  static async isAuthenticated() {
    try {
      await this.getAuthToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user profile information
   * @returns {Promise<Object>} User profile data
   */
  static async getUserProfile() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get user profile:", error);
      throw error;
    }
  }

  /**
   * Handle authentication errors and attempt recovery
   * @param {Error} error - The authentication error
   * @returns {Promise<string>} New token after recovery
   */
  static async handleAuthError(error) {
    console.log("Handling auth error:", error.message);

    // Try to refresh token first
    try {
      return await this.refreshToken();
    } catch (refreshError) {
      console.log("Token refresh failed, removing cached token");

      // If refresh fails, remove cached token and try fresh auth
      await this.removeToken();
      return await this.getAuthToken();
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AuthService;
}
