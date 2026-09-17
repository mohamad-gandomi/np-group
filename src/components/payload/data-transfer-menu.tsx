"use client";

import {
  ExportListMenuItem,
  ImportListMenuItem,
} from "@payloadcms/plugin-import-export/rsc";
import { useAuth } from "@payloadcms/ui";

type AdminUser = {
  collection?: string;
  role?: string;
};

const canManageData = (user: AdminUser | null | undefined) =>
  user?.collection === "users" && user.role === "admin";

export function AdminOnlyImportListMenuItem(props: {
  collectionSlug: string;
  importCollectionSlug: string;
}) {
  const { user } = useAuth<AdminUser>();
  return canManageData(user) ? <ImportListMenuItem {...props} /> : null;
}

export function AdminOnlyExportListMenuItem(props: {
  collectionSlug: string;
  exportCollectionSlug: string;
}) {
  const { user } = useAuth<AdminUser>();
  return canManageData(user) ? <ExportListMenuItem {...props} /> : null;
}
