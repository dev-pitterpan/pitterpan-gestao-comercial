"use client";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import HeaderFilterGroup from "./HeaderFilterGroup";
const filterKeys = [
  "category",
  "vendor",
  "stock",
  "delivery",
  "status",
  "fulfillment",
  "kind",
];
export default function FilterDisclosure({
  children,
}: {
  children: ReactNode;
}) {
  const params = useSearchParams();
  const count = [...params].filter(
    ([key, value]) => filterKeys.includes(key) && value && value !== "all",
  ).length;
  return (
    <HeaderFilterGroup label="Filtros" activeCount={count} width={540}>
      {children}
    </HeaderFilterGroup>
  );
}
