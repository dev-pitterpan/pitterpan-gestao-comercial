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
  variant = "radial",
}: {
  received: string;
  refunded: string;
  net: string;
  currency: string;
  href: string;
  variant?: "bar" | "radial";
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
  if (variant === "bar") {
    const percent = new Intl.NumberFormat("pt-BR", {
      style: "percent",
      maximumFractionDigits: 1,
    });
    const proportions = valid && parts.state === "balanced" ? parts : null;
    return (
      <section
        className="bento-tile bento-composition overview-composition"
        aria-label="Composição financeira do recebido"
      >
        <header>
          <h2>Composição do recebido</h2>
          <Link href={href} aria-label="Abrir composição no financeiro">
            <ArrowUpRight size={17} />
          </Link>
        </header>
        {proportions && (
          <div className="overview-composition-bar" aria-hidden="true">
            <i style={{ flex: proportions.netShare }} />
            <i style={{ flex: proportions.refundShare }} />
          </div>
        )}
        <dl>
          <div>
            <dt>Recebido</dt>
            <dd>
              {money(Number.isFinite(parts.received) ? parts.received : null)}
            </dd>
          </div>
          <div>
            <dt>
              Reembolsado
              {proportions && (
                <small>{percent.format(proportions.refundShare)}</small>
              )}
            </dt>
            <dd>
              {money(Number.isFinite(parts.refunded) ? parts.refunded : null)}
            </dd>
          </div>
          <div>
            <dt>
              Líquido
              {proportions && (
                <small>{percent.format(proportions.netShare)}</small>
              )}
            </dt>
            <dd>
              {money(
                net.trim() && Number.isFinite(Number(net)) ? Number(net) : null,
              )}
            </dd>
          </div>
        </dl>
        <p>O líquido considera reembolsos e não deduz custos.</p>
      </section>
    );
  }

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
        variant="segments"
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
