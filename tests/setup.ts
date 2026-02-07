/**
 * Jest Setup File
 *
 * This file runs before all tests and sets up the testing environment.
 */

// Must run before any module imports env (e.g. logger, config)
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-at-least-32-chars-long';
process.env.GMAIL_USER = process.env.GMAIL_USER || 'test@example.com';
process.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'test-app-password';

// Suppress console logs during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
