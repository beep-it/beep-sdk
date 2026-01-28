interface FormatCurrencyOptions {
  minDigits?: number;
  maxDigits?: number;
}

export const useFormatCurrency = (
  value: string | number,
  options: FormatCurrencyOptions = {},
): string => {
  const { minDigits = 2, maxDigits = 6 } = options;
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;

  if (isNaN(numValue)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(numValue);
};
