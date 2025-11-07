import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exampro';
const DB_NAME = process.env.MONGODB_DB_NAME || 'exampro';

// MongoDB client and database instances
let client: MongoClient | null = null;
let db: Db | null = null;

// Authorized user interface
export interface AuthorizedUser {
  _id?: string;
  email: string;
  name?: string;
  google_id?: string;
  created_at?: Date;
  updated_at?: Date;
  is_active: boolean;
}

/**
 * Initialize MongoDB connection
 * @returns Promise<Db> MongoDB database instance
 */
export const connectToDatabase = async (): Promise<Db> => {
  if (client && db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);

    // Create indexes for better performance
    const usersCollection = db.collection('authorized_users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ google_id: 1 });
    await usersCollection.createIndex({ is_active: 1 });

    console.log('Connected to MongoDB successfully');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }
};

/**
 * Get the authorized users collection
 * @returns Promise<Collection<AuthorizedUser>> MongoDB collection instance
 */
export const getUsersCollection = async (): Promise<Collection<AuthorizedUser>> => {
  if (!db) {
    await connectToDatabase();
  }
  return db!.collection('authorized_users');
};

/**
 * Close MongoDB connection
 */
export const closeDatabaseConnection = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
};

/**
 * Initialize default authorized users if collection is empty
 */
export const initializeDefaultUsers = async (): Promise<void> => {
  try {
    const collection = await getUsersCollection();
    const userCount = await collection.countDocuments({ is_active: true });

    if (userCount === 0) {
      const defaultUsers: Omit<AuthorizedUser, '_id'>[] = [
        {
          email: 'shad03152015@gmail.com',
          name: 'Shad User',
          google_id: 'default_shad_001',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await collection.insertMany(defaultUsers);
      console.log('Default authorized users initialized');
    }
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

/**
 * Validate email against authorized users
 */
export const validateEmail = async (email: string): Promise<boolean> => {
  try {
    await initializeDefaultUsers();
    const collection = await getUsersCollection();
    const user = await collection.findOne({
      email: email.toLowerCase(),
      is_active: true
    });
    return user !== null;
  } catch (error) {
    console.error('Email validation error:', error);
    return false;
  }
};

/**
 * Add a new authorized user
 */
export const addAuthorizedUser = async (email: string, name?: string): Promise<boolean> => {
  try {
    await initializeDefaultUsers();
    const collection = await getUsersCollection();
    const existingUser = await collection.findOne({ email: email.toLowerCase() });
    if (existingUser) return false;

    const newUser: Omit<AuthorizedUser, '_id'> = {
      email: email.toLowerCase(),
      name: name || 'New User',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await collection.insertOne(newUser);
    return result.acknowledged;
  } catch (error) {
    console.error('Error adding authorized user:', error);
    return false;
  }
};

/**
 * Remove an authorized user (soft delete)
 */
export const removeAuthorizedUser = async (email: string): Promise<boolean> => {
  try {
    await initializeDefaultUsers();
    const collection = await getUsersCollection();
    const result = await collection.updateOne(
      { email: email.toLowerCase() },
      { $set: { is_active: false, updated_at: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error removing authorized user:', error);
    return false;
  }
};

/**
 * Get all authorized users
 */
export const getAuthorizedUsers = async (): Promise<Array<{email: string, name: string}>> => {
  try {
    await initializeDefaultUsers();
    const collection = await getUsersCollection();
    const users = await collection.find(
      { is_active: true },
      {
        projection: { email: 1, name: 1, _id: 0 },
        sort: { email: 1 }
      }
    ).toArray();
    return users.map(user => ({
      email: user.email,
      name: user.name || 'Unknown User'
    }));
  } catch (error) {
    console.error('Error fetching authorized users:', error);
    return [];
  }
};