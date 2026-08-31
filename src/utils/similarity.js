export const textSimilarity = (text1 = "", text2 = "") => {
  const a = text1.toLowerCase().split(/\s+/).filter(Boolean);
  const b = text2.toLowerCase().split(/\s+/).filter(Boolean);

  if (!a.length || !b.length) return 0;

  const setA = new Set(a);
  const setB = new Set(b);

  const intersection = [...setA].filter((word) => setB.has(word));

  const union = new Set([...setA, ...setB]);

  return (intersection.length / union.size) * 100;
};

export const stringSimilarity = (a = "", b = "") => {
  if (!a || !b) return 0;

  if (a.toLowerCase() === b.toLowerCase()) {
    return 100;
  }

  return textSimilarity(a, b);
};