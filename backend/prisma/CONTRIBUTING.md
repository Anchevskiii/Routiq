# Prisma Migrations

## Naming Convention

```
YYYYMMDDHHMMSS_short_description
```

- Timestamp must match the migration creation time
- Use snake_case for the description
- Keep descriptions under 60 characters

Good: `20260529232200_sync_schema`
Good: `20260605200000_add_notifications`

## Workflow

```bash
npx prisma migrate dev --name short_description
npx prisma migrate deploy   # Production
```

## Important

Soft-delete is handled by Prisma extensions in `prisma.service.ts`, not by middleware.
Do NOT add `deletedAt` filters manually in queries — the extension does it automatically
for all models listed in `SOFT_DELETE_MODELS`.
