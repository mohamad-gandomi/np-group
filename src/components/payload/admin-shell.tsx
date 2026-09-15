import Image from "next/image";

import { AdminDateTime } from "./admin-date-time";
import { AdminPresentationLocalizer } from "./admin-localization";

type AdminShellProps = {
  user?: {
    email?: string | null;
    fullName?: string | null;
  } | null;
};

function getInitials(user: AdminShellProps["user"]) {
  const displayName = user?.fullName?.trim();
  if (!displayName) return "NP";

  const words = displayName.split(/\s+/);
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? words[words.length - 1]?.charAt(0) ?? "" : "";
  return `${first}${last}` || "NP";
}

export function AdminBrandIcon() {
  return (
    <span className="nilper-admin-brand" aria-hidden="true">
      <Image src="/admin/np-mark.webp" alt="" width={32} height={32} priority />
    </span>
  );
}

export function AdminHeaderAction() {
  return (
    <>
      <AdminPresentationLocalizer />
      <AdminDateTime />
    </>
  );
}

export function AdminAvatar({ user }: AdminShellProps) {
  return (
    <span className="nilper-admin-avatar" aria-hidden="true" title={user?.fullName ?? user?.email ?? undefined}>
      {getInitials(user)}
    </span>
  );
}
