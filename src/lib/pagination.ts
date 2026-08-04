export type PageItem = number | 'ellipsis';

/**
 * Builds a page-number list with a constant total slot count once `total`
 * exceeds `totalSlots`, by absorbing a dropped edge ellipsis into one
 * extra real page number on the side that still has room. Prevents the
 * rendered list's length — and therefore the position of anything
 * anchored above/below it — from changing as `current` moves through a
 * large page range.
 */
export function buildFixedWindowPages(
  current: number,
  total: number,
  totalSlots = 9,
): PageItem[] {
  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const middleSlots = totalSlots - 2; // reserve first + last page
  const runLength = middleSlots - 2; // worst case: both ellipses shown

  let lo = current - Math.floor((runLength - 1) / 2);
  let hi = lo + runLength - 1;

  if (lo < 2) {
    hi += 2 - lo;
    lo = 2;
  }
  if (hi > total - 1) {
    lo -= hi - (total - 1);
    hi = total - 1;
  }
  lo = Math.max(lo, 2);
  hi = Math.min(hi, total - 1);

  const hadLeftEllipsis = lo > 2;
  const hadRightEllipsis = hi < total - 1;

  if (!hadLeftEllipsis && hi < total - 1) {
    hi = Math.min(hi + 1, total - 1);
  }
  if (!hadRightEllipsis && lo > 2) {
    lo = Math.max(lo - 1, 2);
  }

  const pages: PageItem[] = [1];
  if (lo > 2) pages.push('ellipsis');
  for (let i = lo; i <= hi; i++) pages.push(i);
  if (hi < total - 1) pages.push('ellipsis');
  pages.push(total);

  return pages;
}
