"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { init, use, type EChartsType } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

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

export default function FinancialTrend({
  points,
  previous,
  currency,
}: {
  points: Point[];
  previous?: Point[];
  currency: string;
}) {
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
    const prior = palette.getPropertyValue("--brand-series-prior").trim();
    const grid = palette.getPropertyValue("--brand-line").trim();
    const muted = palette.getPropertyValue("--brand-muted").trim();
    const ink = palette.getPropertyValue("--brand-ink").trim();

    chart.current.setOption(
      {
        animation: false,
        textStyle: { fontFamily: palette.fontFamily, color: ink },
        grid: { top: 19, right: 15, bottom: 32, left: 52 },
        xAxis: {
          type: "category",
          boundaryGap: true,
          data: points.map((point) => point.label),
          axisLabel: { color: muted, hideOverlap: true, fontSize: 11 },
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
          splitLine: { lineStyle: { color: grid, type: "dashed" } },
        },
        tooltip: {
          trigger: "axis",
          renderMode: "richText",
          confine: true,
          axisPointer: { type: "line", lineStyle: { color: prior } },
          valueFormatter: (value: unknown) =>
            typeof value === "number" ? format.format(value) : "Sem dados",
          textStyle: { color: ink, fontSize: 12 },
        },
        series: [
          {
            name: "Período selecionado",
            type: "line",
            data: points.map((point) => point.value),
            itemStyle: { color: current },
            lineStyle: { color: current, width: 3 },
            areaStyle: { color: current, opacity: 0.07, origin: 0 },
            showSymbol: hasIsolatedPoints(points),
            symbolSize: 7,
          },
          ...(comparison
            ? [
                {
                  name: "Período anterior",
                  type: "line",
                  data: comparison.map((point) => point.value),
                  itemStyle: { color: prior },
                  lineStyle: { color: prior, width: 2, type: "dashed" },
                  showSymbol: hasIsolatedPoints(comparison),
                  symbolSize: 5,
                },
              ]
            : []),
        ],
      },
      { notMerge: true },
    );
  }, [points, comparison, format]);

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
    <div className="financial-trend">
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
        aria-label="Valores ao longo do período. Use as setas esquerda e direita para consultar."
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
