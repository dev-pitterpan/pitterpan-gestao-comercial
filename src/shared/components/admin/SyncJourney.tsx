import type { CSSProperties } from "react";

export default function SyncJourney({
  position,
  finished,
}: {
  position: number;
  finished: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`sync-journey${finished ? " is-finished" : ""}`}
      style={{ "--sync-position": `${position}%` } as CSSProperties}
    >
      <div className="sync-journey-path">
        <div className="sync-journey-fill" />
        <div className="sync-journey-walker">
          <svg viewBox="0 0 48 64" fill="none">
            <g strokeLinecap="round" strokeLinejoin="round">
              <path
                className="sync-step-back"
                d="M24 39l-5 11 4 9h5"
                stroke="#526983"
                strokeWidth="4"
              />
              <path
                className="sync-arm-back"
                d="M24 25l-6 9 6 5"
                stroke="#b46d45"
                strokeWidth="3"
              />
              <path d="M17 25c0-4 14-5 14 0l-2 15H19z" fill="#eb4149" />
              <path
                className="sync-step-front"
                d="M25 39l6 10-2 10h6"
                stroke="#25476a"
                strokeWidth="4"
              />
              <path
                className="sync-arm-front"
                d="M26 25l5 8 7-2"
                stroke="#efab78"
                strokeWidth="3.5"
              />
              <circle cx="25" cy="15" r="8" fill="#efab78" />
              <path d="M17 16v-4a8 8 0 0 1 16 0H23l-3 4z" fill="#253b58" />
              <path d="M18 11a7 7 0 0 1 14-1l5 1v2H18z" fill="#ffc741" />
              <circle cx="29" cy="16" r="1" fill="#253b58" />
            </g>
          </svg>
        </div>
      </div>
      <svg className="sync-journey-shop" viewBox="0 0 100 88" fill="none">
        <path
          d="M9 82h82"
          stroke="#c1d4e9"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect
          x="14"
          y="30"
          width="72"
          height="50"
          rx="4"
          fill="#fff"
          stroke="#a9c4e2"
          strokeWidth="2"
        />
        <rect x="18" y="10" width="64" height="25" rx="5" fill="#245b98" />
        <text
          x="50"
          y="26"
          fill="white"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
        >
          PITTER PAN
        </text>
        <path d="M15 34h70l7 13H8z" fill="#f14952" />
        <path d="M29 34h14l-2 13H24zm28 0h14l5 13H59z" fill="#ffc741" />
        <path
          d="M8 47h84"
          stroke="#b73747"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="21" y="55" width="15" height="14" rx="2" fill="#cce9ff" />
        <rect x="64" y="55" width="15" height="14" rx="2" fill="#cce9ff" />
        <path d="M39 80V59a11 11 0 0 1 22 0v21z" fill="#233d59" />
        <path
          className="sync-journey-door"
          d="M40 80V59a10 10 0 0 1 20 0v21z"
          fill="#79a9d7"
        />
      </svg>
      {finished && <span className="sync-journey-total">100%</span>}
    </div>
  );
}
