# MongoDB Integration Setup

This application now supports MongoDB integration for user management, replacing the in-memory user storage with a persistent database solution.

## Prerequisites

1. **MongoDB Server**: You need a running MongoDB instance
2. **MongoDB Database**: Create a database named `exampro`

## Setup Instructions

### 1. Install MongoDB

#### Option A: Local Installation
```bash
# On Ubuntu/Debian
sudo apt-get install mongodb

# On macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community

# On Windows
# Download and install from https://www.mongodb.com/try/download/community
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string

### 2. Start MongoDB Server

```bash
# For local installation
sudo systemctl start mongod

# Or use mongod directly
mongod --dbpath /path/to/your/database
```

### 3. Configure Environment Variables

Update your `.env` file:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here

# MongoDB Configuration
# For local MongoDB
VITE_MONGODB_URI=mongodb://localhost:27017/exampro
VITE_MONGODB_DB_NAME=exampro

# For MongoDB Atlas (replace with your connection string)
# VITE_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exampro?retryWrites=true&w=majority
# VITE_MONGODB_DB_NAME=exampro
```

### 4. Database Schema

The application uses the `authorized_users` collection with the following structure:

```javascript
{
  _id: ObjectId,
  email: "user@example.com",        // Unique email address
  name: "User Name",                // Display name
  google_id: "google-123456",       // Google OAuth ID (optional)
  is_active: true,                  // User status
  created_at: Date,                 // Creation timestamp
  updated_at: Date                  // Last update timestamp
}

{
  "_id": {
    "$oid": "690dc22b97622b71143efda5"
  },
  "email": "shad03152015@gmail.com",        
  "name": "Shad Shad",                
  "google_id": "google-123456",       
  "is_active": true,                  
  "created_at": {
    "$date": "2025-11-06T13:29:25.784Z"
  }, 
  "updated_at": {
    "$date": "2025-11-06T13:29:25.784Z"
  }, 
}
```

### 5. Database Indexes

The application automatically creates the following indexes for optimal performance:

- `email` - Unique index for fast email lookups
- `google_id` - Index for Google OAuth ID lookups
- `is_active` - Index for filtering active users

## API Functions

### User Management Functions

```typescript
// Add authorized user
export const addAuthorizedUser = async (email: string, name?: string): Promise<boolean> => {
    // Database call to insert new authorized user
    // Returns true if successful, false if user already exists
};

// Remove authorized user (soft delete)
export const removeAuthorizedUser = async (email: string): Promise<boolean> => {
    // Database call to deactivate user (sets is_active: false)
    // Returns true if successful, false if user not found
};

// List all authorized users
export const getAuthorizedUsers = async (): Promise<Array<{email: string, name: string}>> => {
    // Database call to fetch all active users
    // Returns array of users with email and name
};
```

### Email Validation

```typescript
// Validate email against database
export const validateEmail = async (email: string): Promise<boolean> => {
    // Checks if email exists in authorized_users collection with is_active: true
    // Includes fallback to hardcoded list for backward compatibility
};
```

## Default Users

The application automatically initializes the following default users when the database is empty:

- `student@google.com` - Student User
- `shad03152015@gmail.com` - Shad User
- `admin@barexam.com` - Admin User
- `reviewer@lawschool.edu` - Reviewer User

## Error Handling

### Fallback Behavior
If MongoDB connection fails, the application falls back to the hardcoded email list:
- `student@google.com`
- `shad03152015@gmail.com`
- `admin@barexam.com`
- `reviewer@lawschool.edu`

### Common Errors
1. **Connection Refused**: MongoDB server is not running
2. **Authentication Failed**: Invalid credentials in connection string
3. **Database Not Found**: Database doesn't exist (will be created automatically)

## Production Considerations

### Security
1. **Use Environment Variables**: Never commit connection strings to git
2. **Enable Authentication**: Use username/password authentication
3. **Use SSL/TLS**: Always use `mongodb+srv://` or `ssl=true` in production
4. **Network Security**: Configure firewall rules for database access

### Performance
1. **Connection Pooling**: MongoDB driver handles this automatically
2. **Indexing**: Automatic index creation for frequently queried fields
3. **Connection Limits**: Configure appropriate connection limits

### Backup Strategy
```bash
# Create backup
mongodump --db exampro --out /path/to/backup

# Restore backup
mongorestore --db exampro /path/to/backup/exampro
```

## Development vs Production

### Development Environment
```env
VITE_MONGODB_URI=mongodb://localhost:27017/exampro
VITE_MONGODB_DB_NAME=exampro
```

### Production Environment
```env
VITE_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exampro?retryWrites=true&w=majority
VITE_MONGODB_DB_NAME=exampro
```

## Browser Compatibility

**Important**: MongoDB is a Node.js library and doesn't work directly in browsers. In a production environment, you would need:

1. **Backend API**: Create a REST API or GraphQL endpoint for database operations
2. **CORS Configuration**: Configure cross-origin requests
3. **Authentication**: Secure your API endpoints

For this demo application, the MongoDB code will work in development with Vite's Node.js compatibility but would require a proper backend in production.

## Troubleshooting

### Connection Issues
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/exampro

# Check if MongoDB is running
sudo systemctl status mongod
```

### Database Issues
```bash
# View collections
mongosh exampro
show collections

# View authorized users
db.authorized_users.find().pretty()

# Create indexes manually
db.authorized_users.createIndex({ email: 1 }, { unique: true })
db.authorized_users.createIndex({ google_id: 1 })
db.authorized_users.createIndex({ is_active: 1 })
```

## Support

If you encounter issues:

1. Check MongoDB server status
2. Verify connection string and credentials
3. Ensure database exists or can be created
4. Check browser console for detailed error messages