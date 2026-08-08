# ADR 0001 — Clean Architecture with DDD-style modules

**Status:** Accepted
**Date:** 2026-08-08

## Context

Open Knowledge needs a codebase that can evolve sustainably, keeps business rules independent from frameworks and storage technology, and is easy to test. We adopt a Clean Architecture approach organized around Domain-Driven Design bounded contexts.

## Decision

### Layers

1. **Domain layer** — business entities, value objects, list classes, and repository interfaces. No dependencies on other layers or external libraries.
2. **Application layer** — use cases that orchestrate domain objects. Depends only on the domain layer.
3. **Infrastructure layer** — concrete implementations of repository interfaces (database, HTTP, external services). May depend on domain and application layers.

The fundamental rule: **dependencies always point inward**.

### Modular organization

The codebase is structured into modules based on business contexts. Each module contains its own layers:

```
src/modules/
  {context}/
    application/
      useCase1.ts
      useCase2.ts
      factory.ts
    domain/
      Entity.ts
      EntityValueObject.ts
      EntityList.ts
      EntityRepository.ts
    infrastructure/
      SqliteEntityRepository.ts
      HttpEntityRepository.ts
    test/
      application/
        useCase1.test.ts
      infrastructure/
        SqliteEntityRepository.test.ts
      helpers/
        EntityMother.ts
        EntityRepositoryMother.ts
      fixtures/
        values.ts
```

Planned bounded contexts: `course`, `identity`, `study` (progress), `assessment` (exams), `certificate`, `notification`, `news`, `settings`.

### Value objects

Immutable, equality by value, self-validating. Standard API:

- `static create(...)` — creates a new instance, performing validation.
- `static fromPrimitive(data: XPrimitive)` — creates an instance from a plain value.
- `static ensureXIsValid(...)` — validates input parameters.
- `toPrimitive(): XPrimitive` — converts to a plain value for serialization.
- `equals(other: X): boolean` — compares with another instance.

Every value object and entity that exposes `fromPrimitive`/`toPrimitive` MUST declare a dedicated `XPrimitive` interface (or type alias for scalar VOs) in the same file, and type both methods with it.

```typescript
export class CourseTitle {
  private constructor(private readonly value: string) {}

  static create(title: string): CourseTitle {
    CourseTitle.ensureTitleIsValid(title);
    return new CourseTitle(title);
  }

  static fromPrimitive(title: string): CourseTitle {
    return CourseTitle.create(title);
  }

  static ensureTitleIsValid(title: string): void {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[CourseTitle] title cannot be empty');
    }
    if (title.length > 200) {
      throw new Error('[CourseTitle] title cannot exceed 200 characters');
    }
  }

  getValue(): string {
    return this.value;
  }

  toPrimitive(): string {
    return this.value;
  }

  equals(other: CourseTitle): boolean {
    return this.value === other.value;
  }
}
```

### Entities

Defined by identity, immutable (modifiers return new instances), compose value objects. Standard API: `static create(...)`, `static fromPrimitive(data: XPrimitive)`, `static ensureXIsValid(...)`, `getId()`, getters, `setX(...)` returning a new instance, `toPrimitive(): XPrimitive`, `equals(other)`.

```typescript
export interface CoursePrimitive {
  id: string | null;
  title: string;
  description: string;
}

export class Course {
  private constructor(
    private readonly id: string | null,
    private readonly title: CourseTitle,
    private readonly description: CourseDescription
  ) {}

  static create(id: string | null, title: string, description: string): Course {
    return new Course(id, CourseTitle.create(title), CourseDescription.create(description));
  }

  static fromPrimitive(data: CoursePrimitive): Course {
    if (!data) throw new Error('[Course] data must be provided');
    return Course.create(data.id, data.title, data.description);
  }

  getId(): string | null {
    return this.id;
  }

  setId(id: string): Course {
    return Course.create(id, this.title.toPrimitive(), this.description.toPrimitive());
  }

  toPrimitive(): CoursePrimitive {
    return {
      id: this.id,
      title: this.title.toPrimitive(),
      description: this.description.toPrimitive(),
    };
  }
}
```

### List classes

Collections of entities/value objects get dedicated immutable list classes (`CourseList`) with `create`, `fromPrimitive`, `toPrimitive`, accessors returning copies, and modifiers returning new lists.

### Repository interfaces

Defined in the domain layer; return domain objects, never DTOs or database rows. Every class that communicates with an external system (database, API, storage, message broker…) is named with the `Repository` suffix — no `Manager`, `Connector`, `Client`, or `Service` alternatives. The domain defines the generic contract (`CourseRepository`), and the infrastructure provides named implementations (`SqliteCourseRepository`, `HttpCourseRepository`).

```typescript
export interface CourseRepository {
  save(course: Course): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findAll(): Promise<CourseList>;
  delete(id: string): Promise<boolean>;
}
```

### Use cases

One business operation per file, implemented as a function that receives its dependencies (repositories, other use cases as ports) in a single props object:

```typescript
interface createCourseProps {
  title: string;
  description: string;
  courseRepository: CourseRepository;
}

export async function createCourse({
  title,
  description,
  courseRepository,
}: createCourseProps): Promise<Course> {
  const course = Course.create(null, title, description);
  return await courseRepository.save(course);
}
```

Errors thrown by use cases are prefixed with the use case name: `[createCourse] ...`.

### Factory

Each module exposes an `application/factory.ts` that is **wiring only**: it instantiates repositories and calls **one** use case per method.

A factory must NOT:

1. Declare interfaces/types — contracts belong to the use case or the domain.
2. Coordinate two or more use cases — a chain of use cases in the factory is a missing use case. Create one use case that owns the flow and inject the other use case as a port.

### Entrypoints

Route handlers, pages, and jobs are thin: run auth/basic guards, then delegate to ONE use case through the module factory. Embedding business workflow in an entrypoint is an architecture violation.

### Frontend

The same principles apply in the frontend: modules with `HttpXRepository` implementations that call the API, container/presenter component separation, and custom hooks that encapsulate use case interactions.

## Consequences

- Business logic is testable in isolation with mocked repository interfaces (see ADR 0002).
- Storage technology can change without touching use cases (see ADR 0004).
- Consistent structure reduces decision fatigue; new modules follow the template above.
