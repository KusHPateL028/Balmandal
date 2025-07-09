export const isAnyEmpty = (obj) => {
  for (const key in obj) {
    if (!obj[key] || (typeof obj[key] == "string" && obj[key].trim() === "")) {
      return key;
    }
  }
  return null;
};
