import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPayload } from "payload";

import config from "../../../payload.config";

export type SalesContact = {
  id: number;
  name: string;
  title: string;
  description: string;
  phone: string;
  whatsappPhone?: string;
  email?: string;
};

async function findSalesContacts(): Promise<SalesContact[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "users",
    depth: 0,
    limit: 20,
    overrideAccess: true,
    pagination: false,
    sort: "fullName",
    where: {
      and: [
        { role: { equals: "seller" } },
        { active: { equals: true } },
        { phone: { exists: true } },
      ],
    },
  });

  return result.docs
    .filter((user) => Boolean(user.phone))
    .map((user) => ({
      id: user.id,
      name: user.fullName,
      title: user.contactTitle || "مشاور فروش",
      description: user.contactDescription || "برای انتخاب محصول، رنگ، پارچه و شرایط سفارش با شما گفت‌وگو می‌کنم.",
      phone: user.phone!,
      ...(user.whatsappPhone ? { whatsappPhone: user.whatsappPhone } : {}),
      ...(user.email ? { email: user.email } : {}),
    }));
}

const getCachedSalesContacts = unstable_cache(
  findSalesContacts,
  ["nilper-sales-contacts"],
  { revalidate: 300, tags: ["payload-sales-contacts"] },
);

export const getSalesContacts = cache(() => getCachedSalesContacts());
