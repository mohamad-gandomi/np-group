"use client";

import { RelationshipField, toast, useForm, useFormFields } from "@payloadcms/ui";
import type { RelationshipFieldClientProps } from "payload";
import { useEffect, useRef } from "react";

type AddressResponse = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  company?: string | null;
  country?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  state?: string | null;
  title?: string | null;
};

const relationID = (value: unknown): number | string | null => {
  if (typeof value === "number" || typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value) {
    const nested = value.value;
    if (typeof nested === "number" || typeof nested === "string") return nested;
  }
  return null;
};

export function OrderCustomerAddressField(props: RelationshipFieldClientProps) {
  const { dispatchFields } = useForm();
  const selectedValue = useFormFields(([fields]) => fields[props.path]?.value);
  const selectedID = relationID(selectedValue);
  const previousID = useRef(selectedID);

  useEffect(() => {
    if (selectedID === previousID.current) return;
    previousID.current = selectedID;
    if (!selectedID) return;

    const controller = new AbortController();
    const populateAddress = async () => {
      try {
        const response = await fetch(`/api/addresses/${encodeURIComponent(selectedID)}?depth=0`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Address request failed");

        const address = await response.json() as AddressResponse;
        const fullName = [address.firstName, address.lastName].filter(Boolean).join(" ");
        const values: Record<string, unknown> = {
          contactName: fullName,
          contactPhone: address.phone ?? "",
          "shippingAddress.title": address.title ?? "",
          "shippingAddress.firstName": address.firstName ?? "",
          "shippingAddress.lastName": address.lastName ?? "",
          "shippingAddress.company": address.company ?? "",
          "shippingAddress.addressLine1": address.addressLine1 ?? "",
          "shippingAddress.addressLine2": address.addressLine2 ?? "",
          "shippingAddress.city": address.city ?? "",
          "shippingAddress.state": address.state ?? "",
          "shippingAddress.postalCode": address.postalCode ?? "",
          "shippingAddress.country": address.country ?? "IR",
          "shippingAddress.phone": address.phone ?? "",
        };

        for (const [path, value] of Object.entries(values)) {
          dispatchFields({ path, type: "UPDATE", value });
        }
        toast.success("اطلاعات آدرس سفارش به‌روزرسانی شد.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("خواندن اطلاعات آدرس انتخاب‌شده انجام نشد.");
      }
    };

    void populateAddress();
    return () => controller.abort();
  }, [dispatchFields, selectedID]);

  return <RelationshipField {...props} />;
}
