export const calculateFinalScore = ({
  visualScore,
  descriptionScore,
  locationScore,
  timeScore,
  categoryScore,
}) => {
  const score =
    visualScore * 0.4 +
    descriptionScore * 0.25 +
    locationScore * 0.2 +
    timeScore * 0.1 +
    categoryScore * 0.05;

  return Math.round(score * 100) / 100;
};