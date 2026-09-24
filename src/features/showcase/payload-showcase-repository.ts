import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPayload } from "payload";

import config from "../../../payload.config";
import type { Brand, Media, Post, Project as PayloadProject } from "@/payload-types";
import { getCatalogProducts } from "@/features/catalog/payload-catalog-repository";
import type { Product } from "@/features/catalog/catalog-types";
import type { BrandProfile, Project, ShowcaseImage } from "./data";

const SHOWCASE_REVALIDATE_SECONDS = 300;
const getShowcasePayload = cache(() => getPayload({ config }));

export type PayloadBrandProfile = BrandProfile & { products: readonly Product[] };
export type PayloadProjectProfile = Project & { products: readonly Product[] };

function mediaRecord(value: number | Media | null | undefined) {
  return value && typeof value === "object" ? value : null;
}

function mediaPath(value: number | Media | null | undefined) {
  const media = mediaRecord(value);
  if (!media) return null;
  if (media.filename) return `/api/media/file/${encodeURIComponent(media.filename)}`;
  if (!media.url) return null;
  try {
    return new URL(media.url).pathname;
  } catch {
    return media.url;
  }
}

function imageFromMedia(
  value: number | Media | null | undefined,
  alt: string | null | undefined,
  caption: string | null | undefined,
): ShowcaseImage {
  const media = mediaRecord(value);
  return {
    src: mediaPath(value) ?? "",
    alt: alt || media?.alt || "",
    caption: caption || media?.captionFa || "",
  };
}

function relationshipID(value: number | { id: number }) {
  return typeof value === "number" ? value : value.id;
}

function relationshipSlug(value: number | Post | null | undefined) {
  return value && typeof value === "object" ? value.slug : "";
}

function mapBrand(brand: Brand, products: readonly Product[]): PayloadBrandProfile {
  const brandProducts = products.filter((product) => product.brandSlug === brand.slug);
  return {
    slug: brand.slug,
    name: brand.title,
    title: brand.taglineFa || brand.title,
    description: brand.descriptionFa || "مجموعه‌ای از محصولات منتخب برای خانه و پروژه.",
    story: brand.storyFa || brand.descriptionFa || "اطلاعات کامل این مجموعه به‌زودی تکمیل می‌شود.",
    image: imageFromMedia(brand.heroMedia || brand.logo, brand.heroAlt, brand.heroCaption),
    publication: { status: "published", updatedAt: brand.updatedAt, verification: { approvedAt: brand.updatedAt, evidence: "Payload CMS" } },
    products: brandProducts,
  };
}

function mapProject(project: PayloadProject, products: readonly Product[]): PayloadProjectProfile {
  const productIDs = new Set((project.products ?? []).map(relationshipID));
  const relatedProducts = products.filter((product) => product.payloadProductId && productIDs.has(product.payloadProductId));
  return {
    slug: project.slug,
    title: project.title,
    sector: project.sector,
    description: project.descriptionFa,
    brief: project.briefFa,
    image: imageFromMedia(project.heroMedia, project.heroAlt, project.heroCaption),
    approach: (project.approach ?? []).map((item) => ({ title: item.title, text: item.text })),
    palette: (project.palette ?? []).map((item) => ({ name: item.name, color: item.color })),
    gallery: (project.gallery ?? []).map((item) =>
      imageFromMedia(item.image, item.alt, item.caption)),
    articleSlug: relationshipSlug(project.article),
    publication: { status: "published", updatedAt: project.updatedAt, verification: { approvedAt: project.updatedAt, evidence: "Payload CMS" } },
    products: relatedProducts,
  };
}

async function findShowcaseContent() {
  const [payload, products] = await Promise.all([getShowcasePayload(), getCatalogProducts()]);
  const [brands, projects] = await Promise.all([
    payload.find({
      collection: "brands",
      depth: 2,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: ["sortOrder", "title"],
      where: { published: { equals: true } },
    }),
    payload.find({
      collection: "projects",
      depth: 2,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: ["-featured", "sortOrder", "-updatedAt"],
      where: { published: { equals: true } },
    }),
  ]);
  return {
    brands: brands.docs.map((brand) => mapBrand(brand, products)),
    projects: projects.docs.map((project) => mapProject(project, products)),
  };
}

const getCachedShowcaseContent = unstable_cache(
  findShowcaseContent,
  ["nilper-payload-showcase"],
  { revalidate: SHOWCASE_REVALIDATE_SECONDS, tags: ["payload-showcase", "payload-catalog"] },
);

export const getShowcaseContent = cache(() => getCachedShowcaseContent());
export const getShowcaseBrands = cache(async () => (await getShowcaseContent()).brands);
export const getShowcaseProjects = cache(async () => (await getShowcaseContent()).projects);
export const getShowcaseBrand = cache(async (slug: string) =>
  (await getShowcaseBrands()).find((brand) => brand.slug === slug) ?? null,
);
export const getShowcaseProject = cache(async (slug: string) =>
  (await getShowcaseProjects()).find((project) => project.slug === slug) ?? null,
);
