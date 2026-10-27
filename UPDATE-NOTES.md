# Update 1: English-only design, admin review

READ THIS BEFORE COPYING ANYTHING.

## 1. Keep these (do NOT overwrite or delete)
- `.env.local`  (your Supabase URL and key)
- `.git/`       (your history)
- `node_modules/`
- `package.json`, `package-lock.json`
- `src/app/favicon.ico`
- the `database/` folder

## 2. Copy from this zip (replace existing files)
- `src/`          (all of it)
- `public/fonts/` (two font files)
- `next.config.ts`
- `README.md`

## 3. Delete
- `src/app/health/` (the old connection test page)

## 4. Replace the placeholders in `src/config/site.ts`
- `contact.email`, `contact.phone`, `contact.address`, `contact.hours`, `contact.telegram`
- Check `commissionRate` (0.2 means 20%)

## 5. Check your Tailwind setup
Open `src/app/globals.css` BEFORE replacing it. If the first line is `@import "tailwindcss";`
the new file is compatible. If it is different, stop and tell Claude what it says.

## 6. Run
Stop the dev server, run `npm run dev`, and test.
