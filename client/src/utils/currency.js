// Indian Rupees are used everywhere in ArthFlow.
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatCurrency = (amount) => inrFormatter.format(Number(amount) || 0);

// Used for chart axes where the ₹ symbol is added by the chart itself.
export const formatNumber = (amount) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(amount) || 0);
