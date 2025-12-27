import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise | null;
  } | undefined;

  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      GEMINI_API_KEY: string;
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

export {};