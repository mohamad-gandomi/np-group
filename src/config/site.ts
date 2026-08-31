const phoneNumber = "+985138438583";
const coordinates = { latitude: 36.3208475, longitude: 59.5238668 };

export const siteConfig = {
  nameFa: "ان‌پی",
  nameEn: "NP Group",
  description: "مبلمان، روشنایی و جزئیات انتخاب‌شده برای خانه‌ها و پروژه‌های ماندگار.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hello@npgroup.ir",
  phoneNumber,
  phoneHref: `tel:${phoneNumber}`,
  phoneLabel: "۰۵۱ ۳۸۴۳ ۸۵۸۳",
  storeName: "مبلمان نیلپر خانگی مشهد",
  addressLabel: "مشهد، بلوار وکیل‌آباد، بین وکیل‌آباد ۱۱ و ۱۳",
  streetAddress: "بلوار وکیل‌آباد، بین وکیل‌آباد ۱۱ و ۱۳",
  city: "مشهد",
  region: "خراسان رضوی",
  hoursLabel: "همه‌روزه · ۱۰ تا ۲۲",
  hoursNote: "ساعات تعطیلات ممکن است متفاوت باشد؛ پیش از مراجعه در روزهای تعطیل تماس بگیرید.",
  openingHours: { opens: "10:00", closes: "22:00" },
  coordinates,
  mapsUrl: "https://maps.app.goo.gl/rR9ZSDjpx6hmsNjv8",
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude}%2C${coordinates.longitude}`,
  // Official embed from the user-supplied Google Maps listing (2026-08-31).
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3013.7322862538444!2d59.523866799999986!3d36.3208475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f6cf300230349d7%3A0xe136e28e49633373!2z2YXYqNmE2YXYp9mGINmG24zZhNm-2LEg2K7Yp9mG2q_bjCDZhdi02YfYrw!5e1!3m2!1sfa!2sfa!4v1788172650005!5m2!1sfa!2sfa",
} as const;
