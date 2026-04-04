const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export function validateABN(abn: string): boolean {
  const digits = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(digits)) return false;

  const sum = digits.split('').reduce((acc, digit, i) => {
    const d = i === 0 ? parseInt(digit) - 1 : parseInt(digit);
    return acc + d * ABN_WEIGHTS[i];
  }, 0);

  return sum % 89 === 0;
}
