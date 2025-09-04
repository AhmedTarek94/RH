# TODO: Fix Gmail Authentication Client ID

## Issue Description

The OAuth client_id in manifest.json is invalid: "56474782729-1qlknalo78ofi9unqra2m00cc5lon5pd.apps.googleusercontent.com"

Error: "OAuth2 request failed: Service responded with error: 'bad client id: ...'"

## Solution Required

- Obtain a valid OAuth 2.0 Client ID from Google Cloud Console
- Update manifest.json with the correct client_id
- Ensure Gmail API is enabled in the Google Cloud project
- Set up OAuth consent screen

## Steps to Get Valid Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API in APIs & Services > Library
4. Go to APIs & Services > Credentials
5. Create OAuth 2.0 Client ID for Chrome Extension
6. Add authorized redirect URIs if needed
7. Copy the Client ID

## Files to Update

- [ ] manifest.json: Update the "client_id" in the "oauth2" section

## Testing Steps (After Fix)

- [ ] Enable the extension in chrome://extensions
- [ ] Open options page and go to Gmail Notifications tab
- [ ] Click "Authenticate" button
- [ ] Grant permission in OAuth screen
- [ ] Verify authentication status becomes "Authenticated"
- [ ] Send test email and confirm receipt
- [ ] Test token refresh and error handling

## Status

❌ **CLIENT ID INVALID** - The provided client_id is the same invalid one
⚠️ **REQUIRES VALID CLIENT ID** - User needs to create a new OAuth client ID in Google Cloud Console
✅ **CODE IS CORRECT** - Authentication implementation is properly coded
