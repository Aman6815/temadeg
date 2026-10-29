# Final package: parent portal, matching, billing, admin tools

READ THIS BEFORE COPYING ANYTHING.

## 1. Run the new database file FIRST
Open database/06_families_requests_billing.sql, paste it into the Supabase SQL Editor and run it.
You should see "Success. No rows returned".

## 2. Keep these (this zip does not contain them)
.env.local, .git, node_modules, package.json, package-lock.json,
src/config/site.ts (your real contact details), and your database/ files 01 to 05.

## 3. Copy from this zip (replace existing files)
src/, public/, docs/, database/06_families_requests_billing.sql, next.config.ts, README.md

## 4. Run
Stop the dev server, run: npm run dev
