// Global type declarations for the native bridge available in the container app

export {}; // ensure this file is a module

declare global {
  interface Window {
    nativebridge?: {
      // Returns a JWT token string or an object with a `token` field
      requestMicroAppToken?: () => Promise<string | { token: string }>;
      requestUserId?: () => Promise<string>;
      [key: string]: any;
    };
  }
}
