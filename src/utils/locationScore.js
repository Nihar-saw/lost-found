export const calculateLocationScore = (lost, found) => {
  if (
    lost.latitude !== null &&
    lost.longitude !== null &&
    found.latitude !== null &&
    found.longitude !== null
  ) {
    const distance = calculateDistance(
      lost.latitude,
      lost.longitude,
      found.latitude,
      found.longitude
    );

    if (distance <= 0.1) return 100;
    if (distance <= 0.5) return 90;
    if (distance <= 1) return 75;
    if (distance <= 3) return 50;

    return 20;
  }

  const a = (lost.location || "").toLowerCase();
  const b = (found.location || "").toLowerCase();

  if (a === b) return 100;

  if (a.includes(b) || b.includes(a)) return 80;

  return 30;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};