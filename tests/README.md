# Testing Documentation

This directory contains unit tests for the museumCall backend project.

## Test Structure

```
tests/
├── setup.ts              # Jest setup file
├── utils/
│   └── mocks.ts          # Common mocks and utilities
├── unit/
│   ├── controllers/      # Controller unit tests
│   ├── middlewares/      # Middleware unit tests
│   └── utils/            # Utility unit tests
└── README.md             # This file
```

## Running Tests

### Run all tests
```bash
npm test
# or
pnpm test
```

### Run tests in watch mode
```bash
npm run test:watch
# or
pnpm test:watch
```

### Run tests with coverage
```bash
npm test -- --coverage
# or
pnpm test -- --coverage
```

### Run a specific test file
```bash
npm test -- tests/unit/utils/errors.test.ts
```

## Test Coverage

The project uses Jest for testing with the following coverage goals:
- **Statements**: > 80%
- **Branches**: > 80%
- **Functions**: > 80%
- **Lines**: > 80%

Coverage reports are generated in the `coverage/` directory.

## Writing Tests

### Test File Naming
- Test files should be named `*.test.ts` or `*.spec.ts`
- Place test files next to the source files or in the `tests/` directory

### Test Structure
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup code
  });

  describe('methodName', () => {
    it('should do something', () => {
      // Test implementation
    });
  });
});
```

### Using Mocks
Common mocks are available in `tests/utils/mocks.ts`:
- `createMockRequest()` - Creates a mock Express Request
- `createMockResponse()` - Creates a mock Express Response
- `createMockNext()` - Creates a mock NextFunction
- `createMockSession()` - Creates a mock session with user data

### Example Test
```typescript
import { createMockRequest, createMockResponse, createMockNext } from '../utils/mocks';

describe('MyMiddleware', () => {
  it('should handle request correctly', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    
    // Test implementation
  });
});
```

## Current Test Coverage

### Unit Tests
- ✅ Error classes (`src/utils/errors.ts`)
- ✅ Auth middleware (`src/middlewares/auth.ts`)
- ✅ Validation middleware (`src/middlewares/validation.ts`)
- ✅ Auth controller (`src/controllers/auth.controller.ts`)

### Future Tests
- Integration tests for routes
- Service layer tests
- Database operation tests

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies (database, APIs, etc.)
3. **Clear Names**: Use descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
5. **Coverage**: Aim for high coverage but focus on testing critical paths

## Troubleshooting

### Jest dependency errors
If you encounter errors like "Cannot find module '@jest/test-sequencer'", try:
```bash
pnpm install
# or
npm install
```

### Tests fail with module resolution errors
- Ensure `tsconfig.json` includes the test files
- Check that `jest.config.js` has correct `moduleNameMapper` settings

### Mock not working
- Ensure mocks are imported before the module being tested
- Check that `jest.mock()` is called at the top level of the test file

### Type errors in tests
- Ensure `@types/jest` is installed
- Check that `tsconfig.json` includes `"jest"` in the `types` array
