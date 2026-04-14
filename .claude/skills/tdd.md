# TDD Rules

## Cycle: Red → Green → Refactor
1. Write failing test first
2. Implement minimum to pass
3. Refactor — tests must still pass

## Test Structure
```typescript
describe('useAuth', () => {
  describe('signIn', () => {
    it('returns user and role on success', async () => {
      // Arrange: mock Supabase
      // Act: call hook
      // Assert: check result
    });
  });
});
```

## What to Test
- **Hooks**: happy path + error path + loading state
- **Components (RNTL)**: user interactions, conditional render, error states
- **Edge Functions**: happy path + error + edge cases

## Mocking
- Supabase → `__mocks__/src/lib/supabase.ts` (see `workflows/testing.md`)
- expo-location → `jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }) }))`
- Reset mocks between tests: `beforeEach(() => jest.clearAllMocks())`

## Before Marking Task DONE
```bash
npx jest --passWithNoTests   # all pass
/test                         # coverage gate met
/check                        # 0 type errors
/e2e                          # Maestro flow passes
```

## Coverage Targets
- `src/hooks/` → >80% from Phase 1
- `src/lib/` → >80%
- `src/components/` → >60%

## Learned in Practice
<!-- /update-skill appends here -->
