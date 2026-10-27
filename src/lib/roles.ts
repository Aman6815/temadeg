export function roleHome(role: string | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "tutor") return "/tutor";
  if (role === "parent") return "/parent";
  return "/login";
}
