# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `npm run dev` - Start the Next.js development server
- **Build**: `npm run build` - Build the application for production
- **Production**: `npm run start` - Start the production server
- **Lint**: `npm run lint` - Run ESLint for code quality checks

## Project Architecture

This is a **personal loan management system** built with Next.js 15.2.4, TypeScript, and Supabase. The application follows a modern full-stack architecture with server-side rendering and real-time database integration.

### Core Architecture Components

**Frontend Stack:**
- Next.js 15.2.4 with App Router
- TypeScript for type safety
- Tailwind CSS + Shadcn UI for styling
- React Hook Form with Zod validation
- Recharts for data visualization

**Backend & Database:**
- Supabase for authentication and database
- PostgreSQL with Row Level Security (RLS)
- Server-side API routes for business logic
- Supabase SSR for authentication management

**Key Domain Models:**
- `Deudor` (Debtor): Person information and contact details
- `Prestamo` (Loan): Core loan entity with terms and status
- `Cuota` (Installment): Individual payment installments with amortization
- `Pago` (Payment): Actual payments made against installments
- `Abono` (Capital Payment): Extra payments towards principal

### Directory Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - React components (business logic and UI components)
- `/lib` - Core business logic, utilities, and services
  - `/lib/services/prestamos.ts` - Main service for loan operations
  - `/lib/calculadora.ts` - Financial calculation engine
  - `/lib/supabase/` - Supabase client configurations
- `/hooks` - Custom React hooks
- `/docs` - Technical documentation and business requirements

### Financial Calculation System

The system implements **French amortization method** (fixed monthly payments):

- **Formula**: P × r × (1+r)^n / ((1+r)^n - 1)
- **Rounding**: Monthly payments rounded to nearest peso, final installment adjusts for rounding differences
- **Real vs. Theoretical**: Tracks both programmed installments and actual payments made
- **Capital Payments**: Supports extra principal payments with recalculation options (reduce installment amount or reduce term)

### Authentication & Authorization

- **Admin Users**: Full access to dashboard and all loan management features
- **Debtor Users**: Limited access to their own loan information (Phase 7 - partially implemented)
- **Super Admin**: Configured via `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` environment variable
- **Authentication**: Supabase Auth with email/password and email confirmation

### Data Layer Patterns

**Service Layer**: `lib/services/prestamos.ts` handles all loan operations:
- CRUD operations for loans, installments, and payments
- Financial recalculations after capital payments
- Complex queries joining loans, debtors, installments, and payments

**Type Safety**: Comprehensive TypeScript interfaces in `lib/types.ts` ensure type safety across the application.

**Database Consistency**: Uses unique constraints and RPC functions for transactional operations, especially for loan recalculations.

## Environment Configuration

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_publishable_key
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=admin_email@example.com
```

## Development Guidelines

### Working with Loan Calculations

- Use `lib/calculadora.ts` functions for all financial calculations
- Always validate loan parameters through Zod schemas in `lib/schemas/`
- When modifying amortization logic, ensure the final installment properly adjusts for rounding
- Test calculations with the example: 17,000,000 COP at 1.8% monthly for 12 months

### Database Operations

- Use the service layer in `lib/services/prestamos.ts` rather than direct Supabase calls
- For complex operations (like capital payments), use the existing RPC functions
- When adding new loan features, consider both theoretical and real payment tracking

### UI Components

- Follow the established pattern using Shadcn UI components
- Use the custom currency input component for monetary values
- Maintain responsive design patterns already established
- Forms should use React Hook Form with Zod validation

### Authentication

- Use `hooks/use-session.tsx` for session management
- Protect routes using the `AuthGuard` component
- Admin-only features should check the super admin email configuration
- Remember that debtor access is partially implemented (Phase 7)

## Key Business Rules

1. **Loan States**: `activo` (active), `pagado` (paid), `vencido` (overdue)
2. **Installment States**: `pendiente` (pending), `pagada` (paid), `vencida` (overdue)
3. **Payment Validation**: Payments cannot be less than the installment amount
4. **Capital Payments**: Excess payments over installment amount can be registered as capital payments
5. **Recalculation Options**: Capital payments can either reduce installment amount or reduce term
6. **Visibility Rules**: Debtors see payment obligations, admins see profitability metrics

## Testing & Quality

- The codebase uses TypeScript strict mode
- Zod schemas provide runtime validation
- Component props are strictly typed
- Financial calculations have been tested with real scenarios documented in `/docs`