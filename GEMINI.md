# A&S Decorations Management System

An event decoration management system designed for A&S Decorations. It provides tools for inventory tracking, event planning, customer management, and quote generation.

## Project Overview

- **Purpose:** Centralized platform for managing event-related operations.
- **Main Technologies:**
  - **Framework:** Next.js 16 (React 19) with App Router. **Note:** This is a cutting-edge version with potential breaking changes from older versions. Refer to internal Next.js documentation if available.
  - **Language:** TypeScript.
  - **Database:** PostgreSQL with Prisma ORM.
  - **Authentication:** NextAuth.js v5 (Beta) with Credentials provider.
  - **Styling:** Tailwind CSS 4 and shadcn/ui.
  - **PDF Generation:** `@react-pdf/renderer`.
- **Architecture:** 
  - Uses Server Actions (`src/lib/actions`) for most data operations.
  - Middleware-protected dashboard routes.
  - Client-side state management using standard React hooks and `sonner` for notifications.

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Set up environment variables (.env file)
# DATABASE_URL="postgresql://user:password@localhost:5432/as-deco"
# AUTH_SECRET="your-secret"

# Generate Prisma client
npx prisma generate

# Sync database schema
npx prisma db push

# Run development server
npm run dev
```

### Production
```bash
# Build the project
npm run build

# Start production server
npm run start
```

## Project Structure

- `src/app/`: Next.js pages, layouts, and API routes.
  - `(auth)/`: Authentication pages (Login).
  - `(dashboard)/`: Core application pages protected by authentication.
  - `api/auth/[...nextauth]/`: NextAuth API handlers.
- `src/components/`: Reusable React components.
  - `ui/`: shadcn/ui primitive components.
  - `customers/`, `events/`, `inventory/`: Domain-specific components.
- `src/lib/`: Core logic and utilities.
  - `actions/`: Server Actions grouped by domain.
  - `auth.ts`: NextAuth configuration.
  - `db.ts`: Prisma client initialization.
- `prisma/`: Database schema definitions and migration files.

## Development Conventions

- **Server Actions:** Use Server Actions for all data mutations and many queries to leverage React's `useActionState` (or similar) and automatic revalidation.
- **Authentication:** All routes except `/login` and static assets are protected by `middleware.ts`. User roles (`ADMIN`, `STAFF`) are stored in the JWT and session.
- **Database:** Use Prisma for all database interactions. The client is generated in `src/generated/prisma`.
- **UI/UX:**
  - Use `shadcn/ui` components located in `src/components/ui`.
  - Prefer `sonner` for toast notifications.
  - Follow the established layout in `src/app/(dashboard)/dashboard-shell.tsx`.
- **Types:** Maintain strict TypeScript typing. Shared types should be placed in `src/lib/auth-types.ts` or similar domain files.
- **Linting:** Run `npm run lint` to ensure code quality.

## Documentation References

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js v5 Guide](https://authjs.dev/reference/nextjs)
- [shadcn/ui Components](https://ui.shadcn.com/)
