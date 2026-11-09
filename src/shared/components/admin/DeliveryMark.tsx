import { Package, HelpCircle } from "lucide-react";
import { deliveryLabels, type DeliveryKind } from "../../lib/admin/delivery";
export default function DeliveryMark({
  kind,
  units,
  exactUnits,
  label = true,
}: {
  kind: DeliveryKind | string;
  units?: string | number;
  exactUnits?: string;
  label?: boolean;
}) {
  const safe = Object.prototype.hasOwnProperty.call(deliveryLabels, kind)
    ? (kind as DeliveryKind)
    : "UNKNOWN";
  return (
    <span
      className={`delivery-mark delivery-mark--${safe.toLowerCase()}`}
      title={
        exactUnits
          ? `${deliveryLabels[safe]}: ${exactUnits} unidades`
          : deliveryLabels[safe]
      }
    >
      {safe === "MOTOBOY" ? (
        <svg viewBox="0 0 64 44" fill="none" aria-hidden="true">
          <circle cx="13" cy="32" r="9" stroke="currentColor" strokeWidth="4" />
          <circle cx="51" cy="32" r="9" stroke="currentColor" strokeWidth="4" />
          <path
            d="M14 30L25 17H40L48 30M24 19L30 31H40M38 10H45L51 31M21 12H31M26 18V12"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="6"
            y="7"
            width="14"
            height="13"
            rx="3"
            fill="#ffd51a"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ) : safe === "SEDEX" || safe === "PAC" || safe === "JADLOG" ? (
        <svg viewBox="0 0 76 44" aria-hidden="true">
          <path
            d="M4 8H49V32H4Z"
            fill={safe === "JADLOG" ? "#dce8f5" : "#ffd51a"}
          />
          <path d="M49 17H61L71 27V33H49Z" fill="#354ba7" />
          <path d="M53 19H59L65 26H53Z" fill="#e7efff" />
          <circle cx="17" cy="34" r="7" fill="#263b77" />
          <circle cx="59" cy="34" r="7" fill="#263b77" />
          <text
            x="26"
            y="24"
            fill="#263b77"
            fontSize="10"
            fontWeight="800"
            textAnchor="middle"
          >
            {safe === "JADLOG" ? "J.LOG" : safe === "PAC" ? "PAC" : "SEDEX"}
          </text>
        </svg>
      ) : safe === "PICKUP" ? (
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <ellipse cx="32" cy="58" rx="25" ry="3" fill="#dce6f3" />
          <rect
            x="12"
            y="25"
            width="40"
            height="31"
            rx="4"
            fill="#eef5ff"
            stroke="#263b77"
            strokeWidth="3"
          />
          <path
            d="M18 12h28l9 14v5a6 6 0 0 1-12 0 5.5 5.5 0 0 1-11 0 5.5 5.5 0 0 1-11 0 6 6 0 0 1-12 0v-5l9-14Z"
            fill="#ffd75e"
            stroke="#263b77"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="m25 14-4 12v4a5.5 5.5 0 0 0 11 0V14h-7Zm14 0 4 12v4a6 6 0 0 0 12 0v-3l-8-13h-8Z"
            fill="#fff3c6"
          />
          <path d="M9 26h46" stroke="#263b77" strokeWidth="2" />
          <rect
            x="18"
            y="40"
            width="13"
            height="9"
            rx="2"
            fill="#a7cdf4"
            stroke="#263b77"
            strokeWidth="2"
          />
          <path
            d="M38 56V43a3 3 0 0 1 3-3h5v16"
            fill="#4c74b9"
            stroke="#263b77"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="41" cy="49" r="1.2" fill="#fff3c6" />
          <path
            d="M9 56h46"
            stroke="#263b77"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ) : ["MIXED", "LOCAL", "OTHER"].includes(safe) ? (
        <Package aria-hidden="true" />
      ) : (
        <HelpCircle aria-hidden="true" />
      )}
      {label && <span>{deliveryLabels[safe]}</span>}
      {units !== undefined && (
        <b>
          {units}
          <small> un.</small>
        </b>
      )}
      {!label && <span className="admin-sr-only">{deliveryLabels[safe]}</span>}
    </span>
  );
}
