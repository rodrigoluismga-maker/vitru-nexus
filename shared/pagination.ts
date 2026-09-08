export function totalPages(total: number, pageSize: number) {
  if (pageSize <= 0) throw new Error("pageSize deve ser maior que zero.");
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}
