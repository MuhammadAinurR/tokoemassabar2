export const getToday = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};
