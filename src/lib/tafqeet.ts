// تحويل الأرقام إلى كتابة عربية (تفقيط) للمبالغ بالريال السعودي والهللة
const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const onesFeminine = ["", "إحدى", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثمان", "تسع"];
const teens = [
  "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر",
  "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر",
];
const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const hundreds = [
  "", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة",
];

function threeDigits(n: number, feminine = false): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h > 0) parts.push(hundreds[h]);
  if (rem > 0) {
    if (rem < 10) {
      parts.push((feminine ? onesFeminine : ones)[rem]);
    } else if (rem < 20) {
      parts.push(teens[rem - 10]);
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (o > 0) {
        parts.push(`${(feminine ? onesFeminine : ones)[o]} و${tens[t]}`);
      } else {
        parts.push(tens[t]);
      }
    }
  }
  return parts.join(" و");
}

const scales = [
  { value: 1_000_000_000, singular: "مليار", dual: "ملياران", plural: "مليارات" },
  { value: 1_000_000, singular: "مليون", dual: "مليونان", plural: "ملايين" },
  { value: 1_000, singular: "ألف", dual: "ألفان", plural: "آلاف" },
];

function scaleWord(n: number, scale: { singular: string; dual: string; plural: string }): string {
  if (n === 1) return scale.singular;
  if (n === 2) return scale.dual;
  if (n >= 3 && n <= 10) return `${threeDigits(n, true)} ${scale.plural}`;
  return `${threeDigits(n)} ${scale.singular}`;
}

function integerToArabic(num: number): string {
  if (num === 0) return "صفر";
  let n = Math.floor(num);
  const parts: string[] = [];
  for (const scale of scales) {
    const count = Math.floor(n / scale.value);
    if (count > 0) {
      parts.push(scaleWord(count, scale));
      n -= count * scale.value;
    }
  }
  if (n > 0) parts.push(threeDigits(n));
  return parts.join(" و");
}

/** يحوّل مبلغاً بالريال السعودي إلى نص عربي مكتوب (تفقيط) */
export function tafqeetSAR(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const riyals = Math.floor(rounded);
  const halalas = Math.round((rounded - riyals) * 100);

  let text = "";
  if (riyals === 0 && halalas === 0) return "لا شيء";
  if (riyals > 0) {
    const riyalWord = riyals === 1 ? "ريال سعودي واحد" : riyals === 2 ? "ريالان سعوديان" : `${integerToArabic(riyals)} ريالاً سعودياً`;
    text += riyalWord;
  }
  if (halalas > 0) {
    if (text) text += " و";
    const halalaWord =
      halalas === 1 ? "هللة واحدة" : halalas === 2 ? "هللتان" : `${integerToArabic(halalas)} هللة`;
    text += halalaWord;
  }
  return `فقط ${text} لا غير`;
}
