export const generateOrderNumber = (): string => {
  const prefix = '3DP';
  const year = new Date().getFullYear();
  // Generate a random 6 digit number for uniqueness
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${randomNumber}`;
};

export default generateOrderNumber;
