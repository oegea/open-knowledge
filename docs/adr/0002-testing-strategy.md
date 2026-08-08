# ADR 0002 — Testing strategy

**Status:** Accepted
**Date:** 2026-08-08

## Context

Open Knowledge must be validated empirically: every deliverable is verified through automated tests (unit, integration, end-to-end) plus running the real application. We need consistent frameworks and patterns aligned with the Clean Architecture described in ADR 0001.

## Decision

### Frameworks

| Scope | Tooling |
|---|---|
| Backend use cases and domain (Node/TS) | Jest (via `next/jest`, node environment) |
| Frontend components | Jest + React Testing Library + jsdom |
| Infrastructure adapters (SQLite) | Jest against a real database file/in-memory instance |
| End-to-end | Playwright (mobile 360px-class, tablet 768px, desktop 1440px projects) |

### Test types and obligations

| Type | What it tests | Mandatory |
|---|---|---|
| Unit | Use case business logic, domain validation | ✅ Yes |
| Integration | Infrastructure adapter (DB mapping, queries) | ⚠️ Optional — when mapping/queries are non-trivial |
| E2E | Real user flows in the running app, per viewport | ✅ For main flows |

Unit tests for use cases mock the repository interface — no database, no network. Integration tests run the real adapter — never mock the repository there.

### File organization

Backend module tests live inside the module: `src/modules/{context}/test/{application|infrastructure|helpers|fixtures}`. Frontend component tests live in `__tests__/`. E2E specs live in `e2e/`.

### Object Mother pattern

All test data is created through Object Mothers implemented as **functions** (not static classes), in `helpers/`, named `{Entity}Mother.ts`, with sensible defaults and partial overrides:

```typescript
import { Course, CoursePrimitive } from '../../domain/Course';

export function create(overrides: Partial<CoursePrimitive> = {}): Course {
  return Course.create(
    overrides.id ?? 'some-id',
    overrides.title ?? 'Introduction to Astronomy',
    overrides.description ?? 'A course about the night sky'
  );
}
```

`@faker-js/faker` may be used for randomized but realistic values.

### RepositoryMother

Repositories are mocked in use case tests through a `{Entity}RepositoryMother` — a factory returning `jest.fn()` mocks implementing the repository interface:

```typescript
import { CourseRepository } from '../../domain/CourseRepository';

export function create(overrides?: Partial<CourseRepository>): CourseRepository {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}
```

Forbidden legacy patterns: stateful `MockyXxxRepository` classes, `toggleFailX(...)` switches, and mocking the DB driver inside use case tests. Control behavior per test with `mockResolvedValue` / `mockRejectedValue`.

When a use case calls another use case, mock the inner use case (it has its own tests).

### Test structure

AAA (Arrange–Act–Assert). Suites organized as:

```typescript
describe('Element', () => {
  describe('Basic Behaviour', () => {});
  describe('Edge Cases', () => {});
  describe('Error Scenarios', () => {});
});
```

`jest.clearAllMocks()` in `beforeEach`. Descriptive, behavior-oriented test names.

### Frontend rules

- Test complex, user-facing components (flows), not atoms like `Button` or `Input`.
- NEVER assert CSS styles or classes. Use semantic queries (`getByRole`, `getByLabelText`, `getByText`) and ARIA attributes (`aria-selected`, `aria-expanded`, `aria-current`) for state.
- Always `import '@testing-library/jest-dom'` (configured globally in `jest.setup.ts`).
- Use relative imports inside tests.
- Use real translations through the i18n test helper rather than mocking translation output.

### Naming

- Backend: `{useCase}.test.ts`, `{Entity}.test.ts`
- Frontend: `{Component}.test.tsx`
- E2E: `{feature}.spec.ts`
- Mothers excluded from coverage via `testPathIgnorePatterns`.

### Coverage

- Backend use cases: 75%+.
- Critical frontend functionality: 80%+.
- Domain validation: 100%.

## Consequences

- Fast, deterministic unit suites; infrastructure verified separately.
- Tests double as living documentation of expected behavior.
- E2E across three viewports enforces the mobile-first requirement (ADR 0009) continuously.
