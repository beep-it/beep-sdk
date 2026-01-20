// eslint-disable-next-line max-params
export const useFormatCurrency = (value: string | number, minDigits = 2, maxDigits = 6): string => {
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
