# A&S Decorations - Agent Memory

## Project Structure
- Next.js 16.2.6 (App Router) with `@base-ui/react` (not Radix) for UI primitives
- shadcn v4 components at `src/components/ui/` use Base UI under the hood
- Prisma 7.8, generated client at `src/generated/prisma` (run `npx prisma generate` after schema changes)
- Server actions in `src/lib/actions/` with `"use server"` directive

## Key Conventions
- **searchParams/params are Promises** in Next.js 16 server components; must `await` them
- **Base UI Select**: `onValueChange` signature is `(value: T | null, eventDetails) => void` -- cannot pass `setState` directly; wrap with null guard: `(v) => { if (v) setState(v); }`
- **Prisma Decimal**: `rentalPrice` is `Decimal(18,2)`; cast with `Number()` before formatting
- **Currency**: `new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`
- **Status badges**: AVAILABLE=default(green), DAMAGED=destructive(red), RETIRED=secondary(gray)
- **Button as Link**: Use `render` prop pattern: `<Button render={<Link href="..." />}>text</Button>`
- **Dialog**: Uses `DialogTrigger` with `render` prop for custom trigger elements
- **Implicit any**: When Prisma client is not generated, TypeScript can't infer `.map()` callback types. Add explicit type annotations using `Awaited<ReturnType<typeof actionFn>>[number]` pattern.
- **Tabs**: Base UI tabs use `value`/`onValueChange` on `<Tabs>`, `value` on `<TabsTrigger>`, `value` on `<TabsContent>`

## File Layout Pattern (Dashboard Pages)
- Server components for pages by default; `"use client"` only for interactive components
- Page header with title + description + action button
- Separate client components in `src/components/{module}/`
- Use `date-fns` for date formatting
