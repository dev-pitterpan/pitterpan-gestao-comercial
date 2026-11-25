"use client";
import { useState } from "react";
import {
  productPlaceholder,
  productThumbnailSources,
} from "../../lib/admin/product-thumbnail";
export default function ProductThumbnail({
  src,
  fallbackSrc,
}: {
  src: string | null;
  fallbackSrc?: string | null;
}) {
  const sources = productThumbnailSources(src, fallbackSrc);
  // Reset error state whenever a refresh supplies different image URLs.
  return <ThumbnailImage key={sources.join("|")} sources={sources} />;
}
function ThumbnailImage({ sources }: { sources: string[] }) {
  const [index, setIndex] = useState(0);
  const source = sources[index];
  return (
    <img
      src={source}
      alt=""
      title={source === productPlaceholder ? "Foto indisponível" : undefined}
      width={48}
      height={48}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (index < sources.length - 1) setIndex(index + 1);
      }}
    />
  );
}
