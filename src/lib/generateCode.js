export function generateCode() {
  const number = Math.floor(100 + Math.random() * 900); // 3 digit number
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random uppercase letter
  return number.toString() + letter;
}
