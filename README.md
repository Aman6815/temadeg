# Temadeg

Temadeg is a tutoring platform that connects families with verified tutors, from KG to Grade 12.
Families tell us what their child needs, tutors apply and are verified by the organization, and the
organization matches them, bills families monthly and pays tutors (80% tutor share, 20% commission).

This project is a graduation project that is also the foundation of a real business.

## What works today

**Tutors**
- Six-step application with draft saving: personal details, education, public profile and subjects,
  teaching preferences and weekly availability, private documents, and agreement
- Submission checks done by the database (required fields, documents, agreement)
- A dashboard showing application status, their students and what they have been paid

**Families**
- Add children (first name and grade only), send tutor requests, cancel open requests
- Browse verified tutors with filters, and read tutor profiles
- Monthly bills, and payment proof upload (Telebirr, bank transfer, cash receipts)

**Admin**
- Review applications, open private documents through short-lived links, approve, ask for more
  information or reject
- Match requests with suggested tutors (ranked by grade, subjects, lesson type, area, schedule, budget)
  and assign one
- Create monthly bills with the 80/20 split frozen at creation, confirm payments, record tutor payouts
- A billing summary where only confirmed payments count as money received
- An audit log of every admin action

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js (App Router) with TypeScript |
| Styling | Tailwind CSS, with self-hosted Figtree and Bricolage Grotesque fonts |
| Database, login, storage | Supabase (PostgreSQL, Auth, private Storage) |
| Access control | PostgreSQL Row Level Security plus server-side checks on every action |

## Security approach

- Every protected page and action checks the user's role on the server (`src/lib/auth.ts`).
- Row Level Security is enabled on every table, and users can only write the columns they should.
- Approving, rejecting, submitting, assigning, billing and paying go through database functions that
  check the caller's role and write the audit log.
- Documents and payment proofs live in private buckets. Uploads are checked by file content, type and
  size. Admins open files through links that expire after two minutes.
- Money is stored as exact decimals. The commission split is calculated once and frozen on each bill.
- Secrets are kept in `.env.local`, which is never committed. Only placeholders are in `.env.example`.
- Use fictional data for development and demos. Never commit real IDs or children's information.

## Getting started

1. Install Node.js and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and publishable key.
3. Run the SQL files in `database/` in order (01 to 06) in the Supabase SQL Editor.
4. Run `npm run dev` and open http://localhost:3000.

To create an admin: sign up normally, then in the SQL Editor run
`update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'your-email');`

Business details (contact information, commission rate) are set in `src/config/site.ts`.

## Project structure

```
database/           SQL files, run in order
src/app/            Pages: home, login, signup, tutor, parent, tutors, admin
src/components/     Shared interface pieces (header, footer, form controls)
src/config/site.ts  Business details shown on the site
src/lib/            Supabase helpers, role checks, labels, tutor matching
docs/               Deployment guide
```

## Roadmap

Complaints and tutor replacement requests, contact form, an optional Amharic language switch, password
reset by email, real online payments once a provider that supports Ethiopian businesses is chosen,
notifications, and a production security review before commercial launch.
