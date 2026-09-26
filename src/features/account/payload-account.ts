import { getPayload } from "payload";

import config from "../../../payload.config";
import type { AuthUser } from "@/features/auth/session";
import type { Address } from "@/payload-types";

export type AccountAddress = {
  id: string;
  title: string;
  recipient: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
};

const mapAddress = (address: Address, user: AuthUser): AccountAddress => ({
  id: String(address.id),
  title: address.title?.trim() || "آدرس",
  recipient: [address.firstName, address.lastName].filter(Boolean).join(" ") || user.name || "مشتری گروه ان‌پی",
  phone: address.phone || user.phone,
  city: address.city || "",
  address: [address.addressLine1, address.addressLine2].filter(Boolean).join("، "),
  postalCode: address.postalCode || "",
  isDefault: address.isDefault === true,
});

export async function getPayloadAccountAddresses(user: AuthUser): Promise<AccountAddress[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "addresses",
    depth: 0,
    overrideAccess: true,
    pagination: false,
    sort: "-updatedAt",
    where: { customer: { equals: user.id } },
  });
  return result.docs
    .map((address) => mapAddress(address, user))
    .sort((left, right) => Number(right.isDefault) - Number(left.isDefault));
}

export async function updatePayloadCustomerProfile(user: AuthUser, fullName: string) {
  const payload = await getPayload({ config });
  return payload.update({
    collection: "customers",
    id: user.id,
    data: { fullName },
    depth: 0,
    overrideAccess: true,
  });
}

export type NewAccountAddress = {
  title: string;
  recipient: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
};

export async function createPayloadAccountAddress(user: AuthUser, input: NewAccountAddress) {
  const payload = await getPayload({ config });
  const existing = await payload.count({
    collection: "addresses",
    overrideAccess: true,
    where: { customer: { equals: user.id } },
  });
  return payload.create({
    collection: "addresses",
    data: {
      customer: user.id,
      title: input.title,
      firstName: input.recipient,
      addressLine1: input.address,
      city: input.city,
      state: input.province,
      postalCode: input.postalCode,
      country: "IR",
      phone: input.phone,
      isDefault: existing.totalDocs === 0,
    },
    depth: 0,
    overrideAccess: true,
  });
}
