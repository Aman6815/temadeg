export default async function HealthPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let message = "";
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key ?? "" },
      cache: "no-store",
    });
    message = res.ok
      ? "Connected to Supabase"
      : `Supabase answered with status ${res.status}`;
  } catch {
    message = "Could not reach Supabase (network or URL problem)";
  }

  return <pre className="p-8">{message}</pre>;
}