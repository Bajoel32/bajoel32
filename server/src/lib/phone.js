export function normalizePhone(input) {
  let p = String(input).replace(/[\s-]/g, '');
  if (p.startsWith('+62')) p = `0${p.slice(3)}`;
  else if (p.startsWith('62')) p = `0${p.slice(2)}`;
  return p;
}
