import { cardImage } from "../catalog/image.ts";
export const productPlaceholder =
  "/assets/images/brand/product-placeholder.svg";
/** A removed/resized CDN file must not prevent trying the original or the historical photo. */
export function productThumbnailSources(
  src: string | null,
  fallback?: string | null,
) {
  return [
    ...new Set(
      [
        src ? cardImage(src, 120) : null,
        src,
        fallback ? cardImage(fallback, 120) : null,
        fallback,
        productPlaceholder,
      ].filter((value): value is string => !!value),
    ),
  ];
}
