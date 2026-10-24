import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/petracement_db';

export async function testDbConnection(): Promise<void> {
  try {
    await mongoose.connect(mongoUri);
    console.log(`[Database] Successfully connected to MongoDB database at ${mongoUri}`);
  } catch (error) {
    console.error('[Database] MongoDB Connection Error:', error);
    console.warn('[Database] Please ensure MongoDB service is running and MONGO_URI in backend/.env is correct.');
  }
}

export default mongoose;
