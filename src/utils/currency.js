export function formatCurrency(value) {
  const numericValue = Number(String(value).replace(/[^\d.-]/g, ""));

  if (Number.isNaN(numericValue)) {
    return "₹ 0";
  }

  return `₹ ${numericValue.toLocaleString("en-IN")}`;
}