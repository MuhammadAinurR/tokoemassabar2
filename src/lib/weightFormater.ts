export const formatWeight = (weight: number): string => {
  // Convert the number to a string with German locale formatting
  const formattedNumber = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(weight);

  return formattedNumber;
};