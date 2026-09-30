"use client";

import { useForm, useFormFields } from "@payloadcms/ui";
import type { UIFieldClientProps } from "payload";

const getPermissionPaths = (props: UIFieldClientProps) => {
  const configured = props.field.admin?.custom?.permissionPaths;
  return Array.isArray(configured)
    ? configured.filter((path): path is string => typeof path === "string")
    : [];
};

export function McpPermissionBulkActions(props: UIFieldClientProps) {
  const permissionPaths = getPermissionPaths(props);
  const { disabled, dispatchFields } = useForm();
  const selectedCount = useFormFields(([fields]) => (
    permissionPaths.filter((path) => fields[path]?.value === true).length
  ));
  const allSelected = permissionPaths.length > 0 && selectedCount === permissionPaths.length;

  const setAllPermissions = (value: boolean) => {
    for (const path of permissionPaths) {
      dispatchFields({ path, type: "UPDATE", value });
    }
  };

  return (
    <section className="nilper-mcp-permissions" dir="rtl" aria-label="مدیریت گروهی دسترسی‌های MCP">
      <div className="nilper-mcp-permissions__copy">
        <strong>دسترسی‌های عامل هوش مصنوعی</strong>
        <span>{selectedCount.toLocaleString("fa-IR")} از {permissionPaths.length.toLocaleString("fa-IR")} دسترسی انتخاب شده است.</span>
      </div>
      <div className="nilper-mcp-permissions__actions">
        <button
          className="nilper-mcp-permissions__button nilper-mcp-permissions__button--primary"
          disabled={disabled || allSelected}
          onClick={() => setAllPermissions(true)}
          type="button"
        >
          انتخاب همه
        </button>
        <button
          className="nilper-mcp-permissions__button"
          disabled={disabled || selectedCount === 0}
          onClick={() => setAllPermissions(false)}
          type="button"
        >
          پاک کردن همه
        </button>
      </div>
      <small>دسترسی حذف در این سامانه ارائه نمی‌شود.</small>
    </section>
  );
}
