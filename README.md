# Temadeg

Temadeg is a tutoring platform that connects families with verified tutors, from KG to Grade 12.
Families tell us what their child needs, tutors apply and are verified by the organization, and the
organization matches them, bills families monthly and pays tutors (80% tutor share, 20% commission).

This project is a graduation project that is also the foundation of a real business.

## What works today

- Accounts for three roles: parent, tutor and admin (admin is assigned manually in the database)
- Tutor application in six steps with draft saving: personal details, education, public profile and
  subjects, teaching preferences and weekly availability, private document upload, and agreement
- Submission checks done by the database (required fields, documents, agreement)
- Admin review: list by status, full application view, secure short-lived links to private
  documents, approve, request more information or reject, with an audit log
- Approved tutors get a public profile that contains no private information

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js (App Router) with TypeScript |
| Styling | Tailwind CSS, with self-hosted Figtree and Bricolage Grotesque fonts |
| Database, login, storage | Supabase (PostgreSQL, Auth, private Storage) |
| Access control | PostgreSQL Row Level Security plus server-side checks on every action |

## Security approach

- Every protected page and action checks the user's role on the server (`src/lib/auth.ts`).
- Row Level Security is enabled on every table, and tutors can only write the columns they should.
- Approving, rejecting and submitting go through database functions that also write the audit log.
- Documents live in a private bucket. Uploads are checked by file content, type and size (5 MB).
  Admins open them through links that expire after two minutes.
- Secrets are kept in `.env.local`, which is never committed. Only placeholders are in `.env.example`.
- Use fictional data for development and demos. Never commit real IDs or children's information.

## Getting started

1. Install Node.js and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and publishable key.
3. Run the SQL files in `database/` in order (01 to 05) in the Supabase SQL Editor.
4. Run `npm run dev` and open http://localhost:3000.

To create an admin: sign up normally, then in the SQL Editor run
`update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'your-email');`

## Project structure

```
database/           SQL files, run in order
src/app/            Pages: home, login, signup, tutor, parent, admin
src/components/     Shared interface pieces (header, footer, form controls)
src/config/site.ts  Business details shown on the site (contact info, commission rate)
src/lib/            Supabase helpers, role checks, labels
```

## Roadmap

Parent requests and tutor browsing, tutor assignments, monthly invoices with payment proof and the
80/20 split, tutor payout records, contact form, an optional Amharic language switch, password reset,
and a production security review before commercial launch.
