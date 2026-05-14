export const toBanglaNumber = (num: string | number | undefined | null, language: string = 'bn'): string => {
  if (num === undefined || num === null) return '';
  if (language !== 'bn') return String(num);
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => banglaDigits[parseInt(digit)]);
};
