"use client";
import ProductThumbnail from "./ProductThumbnail";
import type { OrderProductPreview as Preview } from "../../server/sales/order-previews";
export default function OrderProductPreview({
  products,
  itemCount,
  units,
}: {
  products: Preview[];
  itemCount: string;
  units: string;
}) {
  if (!products.length)
    return (
      <span className="order-product-empty">Itens ainda não importados</span>
    );
  const first = products[0],
    remaining = Math.max(0, Number(itemCount) - products.length);
  return (
    <div className="order-product-preview">
      <div
        className="order-product-photos"
        aria-label={`Fotos de ${Math.min(products.length, 3)} ${products.length === 1 ? "produto" : "produtos"} do pedido`}
      >
        {products.slice(0, 3).map((product) => (
          <span
            key={product.id}
            title={`${product.title} · ${product.quantity} un.`}
          >
            <ProductThumbnail
              src={product.image_url}
              fallbackSrc={product.fallback_image_url}
            />
            <span className="admin-sr-only">{product.title}</span>
          </span>
        ))}
        {remaining > 0 && (
          <span
            className="order-product-more"
            title={`${remaining} outros itens no pedido`}
          >
            +{remaining}
          </span>
        )}
      </div>
      <span
        className="order-product-title"
        title={products.map((product) => product.title).join(" · ")}
      >
        {first.title}
      </span>
      <small>
        {Number(itemCount).toLocaleString("pt-BR")}{" "}
        {Number(itemCount) === 1 ? "item" : "itens"} ·{" "}
        {Number(units).toLocaleString("pt-BR")}{" "}
        {Number(units) === 1 ? "unidade" : "unidades"}
      </small>
    </div>
  );
}
