# Architecture Guidelines

## Clean Architecture Layers

```
src/
├── presentation/    # UI, controllers
├── application/     # Use cases, services
├── domain/          # Entities, business rules
└── infrastructure/  # DB, external services
```

## Dependency Rules

- `presentation` → `application`, `domain`
- `application` → `domain`
- `domain` → NO external deps
- `infrastructure` → `domain`

## Naming Conventions

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- Entities: `*.entity.ts`

## Code Size Limits

- **Max 200 lines per file** (warn at 200, error at 300)
- **Max 30 lines per function** (warn at 30, error at 50)
- **Complexity ≤ 8** (warn), ≤ 10 (error)
- **Max nesting depth ≤ 4**
- **Max 3 parameters per function**

If code exceeds these limits, REFACTOR immediately using Extract Method, Extract Class, or other patterns.

## Before Generating Code

1. Identify correct layer
2. Follow dependency rules
3. Use services for business logic
4. Keep files under 200 lines, functions under 30 lines
5. Run: `npm run lint`