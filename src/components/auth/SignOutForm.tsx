import { signOutAction } from "@/app/auth/signout/actions";

interface Props {
  className?: string;
  buttonClassName?: string;
  children?: React.ReactNode;
}

/** Logout form — always uses the shared signOutAction server action. */
export function SignOutForm({
  className,
  buttonClassName,
  children = "Çıkış Yap",
}: Props) {
  return (
    <form action={signOutAction} className={className} method="post">
      <button type="submit" className={buttonClassName}>
        {children}
      </button>
    </form>
  );
}
