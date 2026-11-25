"use client";
import { useId } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";
import { financialComposition } from "../../lib/admin/financial-composition";
import "../../styles/admin/financial-patterns.css";
export default function FinancialFlowChart({
  received,
  refunded,
  net,
  currency,
  receiptsHref,
  netHref,
  refundsHref,
}: {
  received: string;
  refunded: string;
  net: string;
  currency: string;
  receiptsHref: string;
  netHref: string;
  refundsHref: string;
}) {
  const id = useId();
  const composition = financialComposition(received, refunded);
  const money = (value: string) =>
    value.trim() && Number.isFinite(Number(value))
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
          Number(value),
        )
      : "—";
  const percent = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value);
  const partition =
    composition.state === "balanced" &&
    net.trim() !== "" &&
    Number.isFinite(Number(net)) &&
    Math.abs(Number(net) - composition.net) < 0.005;
  const netShare = composition.netShare ?? 0;
  const refundShare = composition.refundShare ?? 0;
  const circumference = 2 * Math.PI * 88;
  return (
    <section
      className="financial-flow"
      aria-label="Composição do recebido e líquido"
    >
      <header>
        <div>
          <span>LEITURA FINANCEIRA · {currency}</span>
          <h2>Do recebido ao líquido</h2>
        </div>
        <span className="financial-flow-badge">
          <Wallet size={14} />
          Shopify
        </span>
      </header>
      <div className="financial-flow-canvas">
        <svg
          className="financial-flow-streams"
          viewBox="0 0 900 240"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${id}-blue`}>
              <stop stopColor="#023661" />
              <stop offset="1" stopColor="#6999bd" />
            </linearGradient>
          </defs>
          {partition && (
            <>
              {netShare > 0 && (
                <g
                  fill="none"
                  stroke={`url(#${id}-blue)`}
                  strokeLinecap="round"
                >
                  {Array.from({ length: 9 }, (_, index) => (
                    <path
                      key={index}
                      d={`M170 ${53 + index * 4} C330 ${20 + index * 8},390 ${205 - index * 10},650 ${85 + index * 5}`}
                      strokeWidth={1 + netShare * 1.2}
                      opacity={0.25 + index * 0.07}
                    />
                  ))}
                </g>
              )}
              {refundShare > 0 && (
                <path
                  d="M430 105 C365 110,340 192,175 190"
                  fill="none"
                  stroke="#c4473d"
                  strokeWidth={2 + refundShare * 12}
                  strokeLinecap="round"
                />
              )}
            </>
          )}
        </svg>
        <div className="financial-flow-inputs">
          <Link href={receiptsHref} className="financial-flow-source">
            <span>
              <ArrowUpRight size={15} />
              Recebido confirmado
            </span>
            <strong>{money(received)}</strong>
            <small>Valores informados pela Shopify</small>
          </Link>
          <Link
            href={refundsHref}
            className="financial-flow-source financial-flow-source--refund"
          >
            <span>
              <ArrowDownLeft size={15} />
              Menos reembolsos
            </span>
            <strong>{money(refunded)}</strong>
            <small>
              {partition
                ? `${percent(refundShare)} do valor recebido`
                : "Acumulado dos pedidos selecionados"}
            </small>
          </Link>
        </div>
        <div className="financial-flow-result">
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle
              cx="110"
              cy="110"
              r="101"
              className="financial-ring-orbit"
            />
            <circle cx="110" cy="110" r="88" className="financial-ring-track" />
            {partition && (
              <g transform="rotate(-90 110 110)">
                {netShare > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r="88"
                    className="financial-ring-net"
                    strokeDasharray={`${circumference * netShare} ${circumference}`}
                  />
                )}
                {refundShare > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r="88"
                    className="financial-ring-refund"
                    strokeDasharray={`${circumference * refundShare} ${circumference}`}
                    strokeDashoffset={-circumference * netShare}
                  />
                )}
              </g>
            )}
          </svg>
          <Link href={netHref}>
            <span>Líquido após reembolsos</span>
            <strong>{money(net)}</strong>
            <small>
              {partition
                ? `${percent(netShare)} do recebido`
                : composition.state === "empty"
                  ? "Sem recebimentos na seleção"
                  : composition.state === "excess"
                    ? "Reembolsos superam o recebido"
                    : "Composição indisponível"}
            </small>
          </Link>
        </div>
      </div>
      <footer>
        <span>
          <i />
          Líquido
        </span>
        <span>
          <i />
          Reembolsado
        </span>
        <p>
          Composição dos pedidos selecionados. Líquido não representa lucro.
        </p>
      </footer>
    </section>
  );
}
