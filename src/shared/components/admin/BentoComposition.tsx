"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
  const share = valid ? parts.netShare! : null;
  const money = (value: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
      Number(value),
    );
  const percent =
    share === null
      ? "—"
      : new Intl.NumberFormat("pt-BR", {
          style: "percent",
          maximumFractionDigits: 1,
        }).format(share);
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
      <div className="bento-gauge">
        <svg viewBox="0 0 220 180" aria-hidden="true">
          {Array.from({ length: 36 }, (_, index) => {
            const a = ((150 + (index * 240) / 35) * Math.PI) / 180;
            return (
              <line
                key={index}
                x1={110 + Math.cos(a) * 75}
                y1={105 + Math.sin(a) * 75}
                x2={110 + Math.cos(a) * 92}
                y2={105 + Math.sin(a) * 92}
                stroke={
                  !valid
                    ? "#dfe6ee"
                    : (index + 0.5) / 36 <= share!
                      ? "#023661"
                      : "#c4473d"
                }
                strokeWidth="5.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div>
          <strong>{percent}</strong>
          <span>
            {valid
              ? "do recebido permanece líquido"
              : parts.state === "excess"
                ? "Reembolsos superam o recebido"
                : parts.state === "empty"
                  ? "Sem recebimentos na seleção"
                  : "Proporção indisponível"}
          </span>
        </div>
      </div>
      <dl>
        <div>
          <dt>
            <i />
            Líquido
          </dt>
          <dd>{money(net)}</dd>
        </div>
        <div>
          <dt>
            <i />
            Reembolsado
          </dt>
          <dd>{money(refunded)}</dd>
        </div>
      </dl>
      <p>
        Recebido menos reembolsado.
        <br />
        Este indicador não representa lucro.
      </p>
    </section>
  );
}
