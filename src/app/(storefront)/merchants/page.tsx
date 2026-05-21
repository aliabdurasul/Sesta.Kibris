import { redirect } from "next/navigation";

/** Legacy route — marketplace home is now `/`. */
export default function MerchantsRedirectPage() {
  redirect("/#browse-markets");
}
