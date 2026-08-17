/**
 * Formats a date string or Date object to YYYY-MM-DD
 * @param date - The date to format
 * @returns Formatted date string or "N/A" if invalid
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "N/A";

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};
