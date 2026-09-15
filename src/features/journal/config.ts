export const journalCategories = [
  { id: "planning", label: "راهنمای انتخاب" },
  { id: "materials", label: "بافت و متریال" },
  { id: "lighting", label: "نور و فضا" },
  { id: "living", label: "هنر زندگی" },
] as const;

export const journalAuthor = {
  name: "تحریریه ان‌پی",
  description: "یادداشت‌های گروه ان‌پی درباره انتخاب مبلمان، شناخت متریال و ساختن فضاهایی برای زندگی روزمره. پیشنهادهای هر مطلب، نقطه شروع انتخاب‌اند؛ شرایط خانه و مشخصات هر محصول را جداگانه بررسی کنید.",
  url: "/about",
};

export function categoryLabel(category: string) {
  return journalCategories.find((item) => item.id === category)?.label ?? "مجله ان‌پی";
}
