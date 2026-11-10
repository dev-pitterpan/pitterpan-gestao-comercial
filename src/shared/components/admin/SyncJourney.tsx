import { useState, type CSSProperties } from "react";

export default function SyncJourney({
  position,
  finished,
  label,
}: {
  position: number;
  finished: boolean;
  label: string;
}) {
  const [speech, setSpeech] = useState({ current: label, previous: "" });
  if (speech.current !== label) {
    setSpeech({ current: label, previous: speech.current });
  }
  return (
    <div
      className={`sync-journey${finished ? " is-finished" : ""}`}
      style={{ "--sync-position": `${position}%` } as CSSProperties}
    >
      <div className="sync-journey-path">
        <div className="sync-journey-fill" />
        <span
          className="pitter-spinner sync-journey-wheel"
          aria-hidden="true"
        />
        <div className="sync-journey-carrier" aria-hidden="true">
          <svg className="sync-journey-mascot" viewBox="0 0 64 76" fill="none">
            <path
              d="M19 66h28"
              stroke="#1f3779"
              strokeOpacity=".16"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M27 48h10l1 14h-9z" fill="#233980" />
            <path d="M34 47h10l-1 15h-9z" fill="#354ba7" />
            <path
              d="M27 61h10l3 4c1 2-1 3-3 3H26c-2 0-3-2-2-4z"
              fill="#18265c"
            />
            <path
              d="M36 61h8l5 4c1 2 0 3-3 3H34c-2 0-2-2-1-4z"
              fill="#243575"
            />
            <path
              d="M34 67h13"
              stroke="#fff"
              strokeOpacity=".75"
              strokeLinecap="round"
            />
            <path d="M26 31c-4 3-7 9-6 15l7 2 5-13z" fill="#b51c32" />
            <path
              d="M26 32c3-4 12-5 18-1l2 16c-1 5-18 6-22 0z"
              fill="#f21f26"
            />
            <path
              d="M29 33l3 16m9-16-2 16"
              stroke="#ff7072"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M24 46c7 3 15 3 22 0v4c-6 3-15 3-22 0z" fill="#be1730" />
            <path
              d="M39 35c1-3 5-3 7 0l2 7 5-2 2 4-8 5c-2 1-4 0-5-2z"
              fill="#f2ab7e"
            />
            <path d="M38 34c2-4 7-4 9 0l1 5-8 2z" fill="#d41f32" />
            <path d="M31 27h9v7c-2 3-7 3-9 0z" fill="#e3976a" />
            <path
              d="M23 17c0-7 4-11 11-11 8 0 12 5 12 12l2 4c1 2-1 3-3 3-1 6-5 8-10 7-7-1-12-5-12-15z"
              fill="#f6b88a"
            />
            <path
              d="M24 23c-3-4-3-9-1-12 3-4 10-4 12 0l-1 7-5 2-1 5z"
              fill="#283263"
            />
            <circle cx="29" cy="22" r="3.2" fill="#f6b88a" />
            <circle cx="42" cy="20" r="1.35" fill="#222b53" />
            <path
              d="M21 15a12 12 0 0 1 24 0l7 1c2 1 1 3-1 3H24c-2 0-4-2-3-4z"
              fill="#ffd51a"
            />
            <path
              d="M25 13c2-5 7-7 12-6"
              stroke="#fff2a2"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M23 17h28"
              stroke="#d99f12"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M33 40c-2-2-4 0-3 2 1 2 4 2 5 0 1-2-1-4-2-2z"
              fill="#ffd51a"
            />
          </svg>
        </div>
        <div className="sync-journey-speech" role="status" aria-atomic="true">
          {speech.previous && (
            <span
              key={speech.previous}
              className="sync-speech-out"
              aria-hidden="true"
            >
              {speech.previous}
            </span>
          )}
          <span key={speech.current} className="sync-speech-in">
            {speech.current}
          </span>
        </div>
      </div>
      <svg
        aria-hidden="true"
        className="sync-journey-shop"
        viewBox="0 0 100 88"
        fill="none"
      >
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
    </div>
  );
}
