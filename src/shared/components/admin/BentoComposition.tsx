"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import InfographicRadial from "./InfographicRadial";
import { financialComposition } from "../../lib/admin/financial-composition";
export default function BentoComposition({
  received,
  refunded,
  net,
  currency,
  href,
}: {
  received: string;
  refunded: string;
  net: string;
  currency: string;
  href: string;
}) {
  const parts = financialComposition(received, refunded);
  const valid =
    parts.state === "balanced" &&
    net.trim() !== "" &&
    Number.isFinite(Number(net)) &&
    Math.abs(Number(net) - parts.net) < 0.005;
  const money = (value: number | null) =>
    value === null
      ? "—"
      : new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
          value,
        );
  return (
    <section
      className="bento-tile bento-composition"
      aria-label="Composição financeira do recebido"
    >
      <header>
        <div>
          <span className="bento-eyebrow">COMPOSIÇÃO</span>
          <h2>Destino do recebido</h2>
        </div>
        <Link href={href} aria-label="Abrir composição no financeiro">
          <ArrowUpRight size={17} />
        </Link>
      </header>
      <InfographicRadial
        label="Composição do recebido"
        items={[
          { label: "Líquido", value: Number(net), color: "#6999bd" },
          { label: "Reembolsado", value: Number(refunded), color: "#c4473d" },
        ]}
        total={Number(received)}
        format={money}
        proportions={valid}
      />
      <p>
        Recebido menos reembolsado.
        <br />
        Este indicador não representa lucro.
      </p>
    </section>
  );
}
