/**
 * Jest Setup File
 * 
 * This file runs before all tests and sets up the testing environment.
 */

// Mock environment variables if needed
process.env.NODE_ENV = 'test';

// Suppress console logs during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
