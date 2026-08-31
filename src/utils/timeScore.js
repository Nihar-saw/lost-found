export const calculateTimeScore = (lost, found) => {
  const lostDate = new Date(lost.date);
  const foundDate = new Date(found.date);

  const difference =
    Math.abs(foundDate.getTime() - lostDate.getTime()) /
    (1000 * 60 * 60);

  if (difference <= 1) return 100;
  if (difference <= 3) return 90;
  if (difference <= 6) return 75;
  if (difference <= 12) return 60;
  if (difference <= 24) return 40;
  if (difference <= 72) return 20;

  return 5;
};