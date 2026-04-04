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

## Before Generating Code

1. Identify correct layer
2. Follow dependency rules
3. Use services for business logic
4. Run: `npm run lint`