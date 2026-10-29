# Deployment guide (free demo hosting)

## Hosting choices and their limits
- Vercel Hobby (free) hosts the website. Its terms limit it to personal, non-commercial use. It is
  suitable for a graduation demo. Before charging real customers, move to a paid plan or a host that
  allows commercial use.
- Supabase free plan hosts the database, login and files. Free projects are paused after about a week
  without activity, so open the site (or the Supabase dashboard) shortly before any presentation.
- Vercel limits a request to about 4.5 MB, so the app accepts files up to 4 MB.

## Steps
1. Push the code to GitHub (`git add .`, `git commit`, `git push`).
2. On vercel.com sign in with GitHub, choose Add New, Project, and import the repository.
3. Under Environment Variables add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   with the same values as `.env.local`. Never add the secret or service_role key.
4. Click Deploy. Vercel gives you an address such as `your-project.vercel.app`.
5. In Supabase, open Authentication, URL Configuration. Set Site URL to the Vercel address and add it
   to Redirect URLs.
6. Test the live site: sign up, submit a tutor application, approve it as admin, send a request,
   assign a tutor, create a bill, upload a payment proof, confirm it, record a payout.

## Before real customers
- Turn email confirmation back on and set up a real email sender in Supabase.
- Choose a commercial hosting plan and buy a domain.
- Review the code, dependencies, database policies and Git history, and make the repository private.
