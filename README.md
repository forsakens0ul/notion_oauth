# Notion OAuth Integration with Vercel

A serverless application for integrating with Notion via OAuth, with optional NetEase Cloud Music data fetching.

## Project Structure

\`\`\`
/my-vercel-project
├── api/
│   ├── notion/
│   │   ├── callback.js     ← Handle Notion OAuth callback
│   │   └── upload.js       ← Upload data to Notion database
│   └── netease/
│       └── data.js         ← Fetch data from NetEase Cloud Music
├── .env                   ← Environment variables
├── vercel.json            ← Vercel configuration
├── index.html             ← Frontend interface
└── README.md              ← This file
\`\`\`

## Setup Instructions

### 1. Create a Notion Integration

1. Go to [Notion Developers](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Fill in the basic information
4. Set the integration type to "Public"
5. Add capabilities: "Read user information including email addresses"
6. Set redirect URI: `https://your-app.vercel.app/api/notion/callback`
7. Save and copy the Client ID and Client Secret

### 2. Configure Environment Variables

Create a `.env` file in your project root:

\`\`\`env
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=https://your-app.vercel.app/api/notion/callback
CLIENT_URL=https://your-app.vercel.app
\`\`\`

### 3. Deploy to Vercel

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or use CLI: vercel env add
\`\`\`

### 4. Update Client ID in HTML

Edit `index.html` and replace `your_notion_client_id` with your actual Notion Client ID.

## API Endpoints

### `/api/notion/callback`
- **Method**: GET
- **Purpose**: Handle OAuth callback from Notion
- **Parameters**: `code`, `state` (from Notion)

### `/api/notion/upload`
- **Method**: POST
- **Purpose**: Upload data to Notion database
- **Body**:
  \`\`\`json
  {
    "access_token": "notion_access_token",
    "database_id": "notion_database_id",
    "data": {
      "title": "Entry title",
      "description": "Entry description",
      "tags": ["tag1", "tag2"],
      "date": "2023-12-01"
    }
  }
  \`\`\`

### `/api/netease/data`
- **Method**: GET
- **Purpose**: Fetch data from NetEase Cloud Music
- **Parameters**: `type` (playlist/song/album), `id`

## Usage Flow

1. User clicks "Connect with Notion" button
2. Redirected to Notion OAuth page
3. User authorizes the application
4. Notion redirects back to `/api/notion/callback`
5. Callback handler exchanges code for access token
6. User can now upload data to Notion databases

## Security Notes

- Store access tokens securely (consider using a database)
- Validate all input data before sending to Notion
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Consider implementing user sessions for better UX

## Customization

- Modify `formatDataForNotion()` in `upload.js` to match your database schema
- Add more NetEase API endpoints in `data.js`
- Customize the frontend interface in `index.html`
- Add authentication middleware for protected routes
