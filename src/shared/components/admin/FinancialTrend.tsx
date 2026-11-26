"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  LineChart,
  type BarSeriesOption,
  type LineSeriesOption,
} from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { graphic, init, use, type EChartsType } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

use([BarChart, LineChart, GridComponent, TooltipComponent, SVGRenderer]);

const compact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type Point = { label: string; value: number | null };

function hasIsolatedPoints(points: Point[]) {
  return points.some(
    (point, index) =>
      point.value !== null &&
      points[index - 1]?.value == null &&
      points[index + 1]?.value == null,
  );
}

const currentLabel = "Período selecionado";
const previousLabel = "Período anterior";

function columns(
  points: Point[],
  name: string,
  style: BarSeriesOption["itemStyle"],
): BarSeriesOption {
  return {
    name,
    type: "bar",
    barMaxWidth: 25,
    barGap: "22%",
    itemStyle: { ...style, borderRadius: [5, 5, 0, 0] },
    emphasis: { focus: "none" },
    data: points.map(({ value }) =>
      value !== null && value < 0
        ? { value, itemStyle: { borderRadius: [0, 0, 5, 5] } }
        : value,
    ),
  };
}

export default function FinancialTrend({
  points,
  previous,
  currency,
  period,
}: {
  points: Point[];
  previous?: Point[];
  currency: string;
  period: "day" | "week";
}) {
  const weekly = period === "week";
  const plot = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsType | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [compare, setCompare] = useState(true);
  const hasData = points.some(({ value }) => value !== null);
  const comparison = compare ? previous : undefined;
  const format = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency }),
    [currency],
  );
  const selected = index === null ? undefined : points[index];
  const earlier = index === null ? undefined : comparison?.[index];

  useEffect(() => {
    if (!plot.current || !hasData) return;
    const instance = init(plot.current, undefined, { renderer: "svg" });
    chart.current = instance;
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(plot.current);
    return () => {
      observer.disconnect();
      instance.dispose();
      chart.current = null;
    };
  }, [hasData]);

  useEffect(() => {
    if (!chart.current || !plot.current) return;
    const palette = getComputedStyle(plot.current);
    const current = palette.getPropertyValue("--brand-series").trim();
    const priorFill = palette.getPropertyValue("--financial-prior-fill").trim();
    const series: (BarSeriesOption | LineSeriesOption)[] = weekly
      ? [
          {
            name: currentLabel,
            type: "line",
            data: points.map(({ value }) => value),
            smooth: 0.36,
            smoothMonotone: "x",
            connectNulls: false,
            itemStyle: {
              color: current,
              borderColor: "#fff",
              borderWidth: 1.5,
            },
            lineStyle: {
              color: current,
              width: 3,
              cap: "round",
              join: "round",
            },
            areaStyle: {
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#315bd72f" },
                { offset: 1, color: "#315bd703" },
              ]),
              origin: 0,
            },
            showSymbol: points.length <= 12 || hasIsolatedPoints(points),
            symbol: "circle",
            symbolSize: 8,
            emphasis: { scale: true },
          },
        ]
      : [
          columns(points, currentLabel, {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: current },
              { offset: 1, color: "#7894e7" },
            ]),
          }),
          ...(comparison
            ? [columns(comparison, previousLabel, { color: priorFill })]
            : []),
        ];
    const grid = palette.getPropertyValue("--brand-line").trim();
    const muted = palette.getPropertyValue("--brand-muted").trim();
    const ink = palette.getPropertyValue("--brand-ink").trim();

    chart.current.setOption(
      {
        animation: false,
        textStyle: { fontFamily: palette.fontFamily, color: ink },
        grid: { top: 18, right: 15, bottom: 25, left: 48 },
        xAxis: {
          type: "category",
          boundaryGap: true,
          data: points.map((point) => point.label),
          axisLabel: {
            color: muted,
            hideOverlap: true,
            fontSize: 11,
            margin: 11,
            formatter: (label: string) => label.split(" a ")[0],
          },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: grid } },
        },
        yAxis: {
          type: "value",
          scale: false,
          splitNumber: 4,
          axisLabel: {
            color: muted,
            formatter: (value: number) => compact.format(value),
          },
          splitLine: { lineStyle: { color: grid, opacity: 0.7 } },
        },
        tooltip: {
          trigger: "axis",
          renderMode: "richText",
          confine: true,
          backgroundColor: ink,
          borderWidth: 0,
          padding: [10, 13],
          textStyle: { color: "#fff", fontSize: 12, lineHeight: 20 },
          shadowBlur: 12,
          shadowColor: "#14233c2b",
          axisPointer: weekly
            ? {
                type: "line",
                lineStyle: { color: current, opacity: 0.5, type: "dashed" },
              }
            : { type: "shadow", shadowStyle: { color: "#315bd710" } },
          formatter: (
            parameters: { dataIndex: number } | { dataIndex: number }[],
          ) => {
            const position = Array.isArray(parameters)
              ? parameters[0]?.dataIndex
              : parameters.dataIndex;
            if (position === undefined || !points[position]) return "";
            const point = points[position];
            const priorPoint = comparison?.[position];
            const value = (entry: Point) =>
              entry.value === null ? "Sem dados" : format.format(entry.value);
            return [
              point.label,
              `Atual: ${value(point)}`,
              ...(priorPoint
                ? [`Anterior · ${priorPoint.label}: ${value(priorPoint)}`]
                : []),
            ].join("\n");
          },
        },
        series,
      },
      { notMerge: true },
    );
  }, [points, comparison, format, weekly]);

  function summarize(point: Point) {
    return `${point.label} · ${point.value === null ? "Sem dados" : format.format(point.value)}`;
  }

  if (!hasData)
    return (
      <p className="financial-trend-empty">
        Sem valores disponíveis para o período.
      </p>
    );

  return (
    <div className="financial-trend" data-period={period}>
      <div className="financial-trend-legend">
        <span>
          <i aria-hidden="true" /> Período selecionado
        </span>
        {previous && (
          <label>
            <input
              type="checkbox"
              checked={compare}
              onChange={(event) => setCompare(event.target.checked)}
            />
            <i aria-hidden="true" /> Comparar período anterior
          </label>
        )}
      </div>
      <div
        className="financial-trend-interactive"
        role="group"
        tabIndex={0}
        aria-label={`Valores por ${weekly ? "semana" : "dia"}. Use as setas esquerda e direita para consultar.`}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIndex(null);
            chart.current?.dispatchAction({ type: "hideTip" });
            return;
          }
          const direction =
            event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
          if (!direction && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          const last = points.length - 1;
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? last
                : Math.min(
                    last,
                    Math.max(
                      0,
                      (index ?? (direction > 0 ? -1 : points.length)) +
                        direction,
                    ),
                  );
          setIndex(next);
          chart.current?.dispatchAction({
            type: "showTip",
            seriesIndex: 0,
            dataIndex: next,
          });
        }}
        onBlur={() => {
          setIndex(null);
          chart.current?.dispatchAction({ type: "hideTip" });
        }}
      >
        <div ref={plot} className="financial-trend-plot" aria-hidden="true" />
      </div>
      <p className="financial-trend-reading" role="status">
        {selected
          ? `${summarize(selected)}${earlier ? ` / Anterior: ${summarize(earlier)}` : ""}`
          : points.some((point) => point.value === null)
            ? "Lacunas indicam datas sem dados disponíveis."
            : null}
      </p>
    </div>
  );
}
