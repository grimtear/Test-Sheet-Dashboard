# Testing Guide

## Overview

This project uses Jest and React Testing Library for unit and integration testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located next to the components they test or in `__tests__` directories:

- Component tests: `component-name.test.tsx`
- Hook tests: `hooks/__tests__/hook-name.test.ts`
- Utility tests: `lib/__tests__/util-name.test.ts`

## Writing Tests

### Testing Components

```tsx
import { render, screen } from '@/tests/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Testing with React Query

Use the `renderWithProviders` helper from `@/tests/utils/test-utils`:

```tsx
import { renderWithProviders } from '@/tests/utils/test-utils';

test('component with queries', () => {
  renderWithProviders(<ComponentWithQuery />);
  // Your assertions
});
```

### Mocking API Calls

```tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ data: 'mocked' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what users see and interact with
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Async operations**: Use `waitFor`, `findBy` queries for async updates
4. **Clean up**: Tests should be independent and clean up after themselves
5. **Coverage**: Aim for meaningful coverage, not just high numbers

## Coverage Goals

- **Functions**: 50%+
- **Branches**: 50%+
- **Lines**: 50%+
- **Statements**: 50%+

## Common Patterns

### Testing Forms

```tsx
it('submits form with valid data', async () => {
  const user = userEvent.setup();
  const handleSubmit = jest.fn();
  
  render(<MyForm onSubmit={handleSubmit} />);
  
  await user.type(screen.getByLabelText(/name/i), 'John Doe');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(handleSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com',
  });
});
```

### Testing Error States

```tsx
it('displays error message on failure', async () => {
  server.use(
    rest.get('/api/data', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );
  
  render(<MyComponent />);
  
  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

## Debugging Tests

```tsx
import { screen } from '@testing-library/react';

// Print the DOM
screen.debug();

// Print a specific element
screen.debug(screen.getByRole('button'));

// Log queries that would match
screen.logTestingPlaygroundURL();
```

## Future Enhancements

- [ ] Add MSW (Mock Service Worker) for API mocking
- [ ] Add E2E tests with Playwright or Cypress
- [ ] Add visual regression testing
- [ ] Add performance testing
- [ ] Increase coverage thresholds gradually
