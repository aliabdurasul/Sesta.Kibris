import { redirect } from "next/navigation";

/**
 * Root page — redirects to public merchant listing.
 * Auth users are redirected by middleware to their dashboard.
 */
export default function HomePage() {
  redirect("/merchants");
}
