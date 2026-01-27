# Google Docs API Setup

## 1. Get API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google Docs API
   - Google Drive API
4. Create credentials:
   - API Key (for public access)
   - OAuth 2.0 Client ID (for user authentication)

## 2. Configure API

Replace in `google-docs-api.js`:
```javascript
client_id: 'YOUR_CLIENT_ID'  // Your OAuth client ID
apiKey: 'YOUR_API_KEY'       // Your API key
```

## 3. Domain Authorization

Add your domain to authorized origins:
- `http://localhost:8000` (for development)
- Your production domain

## 4. Test Integration

1. Open notes section
2. Click "Export to Docs" on any note
3. Sign in with Google when prompted
4. Note opens in Google Docs for editing

## Features Added

- **Export to Google Docs**: Convert any note to editable Google Doc
- **Edit in Docs**: Open linked Google Docs directly
- **Two-way sync**: Notes can be edited in Google Docs
- **Smart buttons**: Shows different options based on note status