# Google Docs Import Setup Instructions

## To enable actual Google Docs import, you need to:

### 1. Install Required Dependencies
```bash
cd backend
npm install node-fetch
```

### 2. Update Backend Route
The backend route in `routes/notes.js` needs to be updated to handle CORS and authentication properly.

### 3. Google API Setup (Recommended)
For full functionality, set up Google Docs API:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Docs API
4. Create credentials (API Key or OAuth 2.0)
5. Add credentials to backend `.env` file

### 4. Alternative: Public Document Access
For public Google Docs, you can use the export URL format:
- HTML: `https://docs.google.com/document/d/{DOC_ID}/export?format=html`
- Plain text: `https://docs.google.com/document/d/{DOC_ID}/export?format=txt`

### 5. CORS Configuration
Make sure your backend allows requests from your frontend domain.

## Current Status
- ✅ Frontend import UI ready
- ✅ Backend route exists
- ❌ Google API credentials needed
- ❌ CORS configuration needed

## Quick Test
To test with public documents:
1. Make sure the Google Doc is set to "Anyone with the link can view"
2. Use the document URL in the import dialog
3. The backend will attempt to fetch the content

## Production Setup
For production, implement proper Google OAuth 2.0 flow to access private documents with user permission.