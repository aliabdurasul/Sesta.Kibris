import { redirect } from "next/navigation";

/**
 * Root page — redirects to public merchant listing.
 * Auth users will be redirected by proxy.ts to their dashboard.
 */
export default function HomePage() {
  redirect("/merchants");
}
