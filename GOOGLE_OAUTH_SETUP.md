# Google OAuth Setup Instructions

This application now supports real Google OAuth authentication instead of mock login.

## Prerequisites

1. **Google Cloud Console Account**: You need a Google Cloud account to create OAuth credentials.

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** and **Google OAuth2 API** from the API Library

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Configure the consent screen if prompted:
   - Application type: **External**
   - Fill in required app information
4. Create the OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Name**: Exam Practice App
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (development)
     - `https://your-production-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173` (for popup flow)

### 3. Configure Environment Variables

1. Copy your **Client ID** from the Google Cloud Console
2. Update the `.env` file in the project root:

```env
# Replace with your actual Google Client ID
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
```

### 4. Start the Application

```bash
npm install
npm run dev
```

## How It Works

### Authentication Flow

1. **Script Loading**: The Google OAuth script is loaded automatically when the login component mounts
2. **Token Request**: When user clicks "Sign in with Google", a popup opens for Google authentication
3. **Token Validation**: The received ID token is validated on the client side (in production, this should be server-side)
4. **Email Authorization**: The user's email is checked against the authorized users list
5. **Session Creation**: If authorized, a session is created and user is logged in

### Security Features

- **Token Validation**: Basic JWT token validation (expiration, audience, issuer verification)
- **Session Management**: Prevents multiple concurrent sessions for the same user
- **Error Handling**: Comprehensive error messages for various OAuth failure scenarios

## Authorized Users

The application maintains a list of authorized users. By default, these users are authorized:

- `student@google.com`
- `shad03152015@gmail.com`
- `admin@barexam.com`
- `reviewer@lawschool.edu`

### User Management Functions

The `backendService.ts` provides functions for user management:

```typescript
// Add new authorized user
await addAuthorizedUser('newuser@example.com', 'New User Name');

// Remove authorized user
await removeAuthorizedUser('olduser@example.com');

// List all authorized users
const users = await getAuthorizedUsers();
```

## Testing

### Test with Authorized Account

1. Use one of the pre-authorized Google accounts
2. Click "Sign in with Google"
3. Complete Google authentication in the popup
4. Verify successful login and redirect to main app

### Test with Unauthorized Account

1. Use a Google account not in the authorized list
2. Complete Google authentication
3. Verify error message: "This account is not authorized to use the application"

### Error Scenarios

- **Network Issues**: "Google authentication unavailable. Please refresh the page and try again."
- **Popup Blocked**: Ensure browser allows popups for localhost
- **Invalid Client ID**: "Google OAuth is not properly configured. Please contact the administrator."
- **Token Expired**: "Authentication failed. Please try again."

## Production Considerations

### Security Improvements

1. **Server-side Token Validation**: Move token validation to a secure backend service
2. **HTTPS Only**: Always use HTTPS in production
3. **Secure Storage**: Consider more secure session storage mechanisms
4. **Rate Limiting**: Implement rate limiting for authentication attempts

### Database Integration

Replace the in-memory user storage with a proper database:

```sql
CREATE TABLE authorized_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    google_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
```

## Troubleshooting

### Common Issues

1. **"Google OAuth is not properly configured"**
   - Check that `VITE_GOOGLE_CLIENT_ID` is set correctly in `.env`
   - Verify the Client ID matches your Google Cloud Console

2. **"Invalid token audience"**
   - Ensure the Client ID in `.env` matches the OAuth client exactly

3. **"Access denied" or "popup_closed_by_user"**
   - User cancelled the authentication flow
   - Popup may have been blocked by browser

4. **Script Loading Issues**
   - Check network connectivity
   - Verify no ad blockers are blocking Google's OAuth script

### Debug Mode

Enable debug logging in browser console:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify Google Cloud Console configuration
3. Ensure environment variables are correctly set
4. Test with the pre-authorized accounts first