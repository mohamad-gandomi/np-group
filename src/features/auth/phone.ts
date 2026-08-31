const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    return String(persianIndex >= 0 ? persianIndex : arabicDigits.indexOf(digit));
  });
}

export function normalizeIranianPhone(value: string) {
  const compact = toEnglishDigits(value).replace(/[\s\-()]/g, "");
  const normalized = compact.startsWith("0098")
    ? `+98${compact.slice(4)}`
    : compact.startsWith("98")
      ? `+${compact}`
      : compact.startsWith("09")
        ? `+98${compact.slice(1)}`
        : compact;

  return /^\+989\d{9}$/.test(normalized) ? normalized : null;
}

export function maskPhone(phone: string) {
  return `0${phone.slice(3, 6)} ••• ••${phone.slice(-2)}`.replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}
