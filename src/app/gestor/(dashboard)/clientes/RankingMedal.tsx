const finishes = [
  {
    light: "#fff8ca",
    mid: "#e9bd53",
    dark: "#956019",
    ink: "#5c350e",
    ribbon: "#203d63",
  },
  {
    light: "#f9fcff",
    mid: "#c7d1de",
    dark: "#677d97",
    ink: "#33485e",
    ribbon: "#45617f",
  },
  {
    light: "#ffe4c5",
    mid: "#d99562",
    dark: "#90502f",
    ink: "#59301e",
    ribbon: "#643d4e",
  },
] as const;

export default function RankingMedal({ rank }: { rank: number }) {
  const finish = finishes[rank - 1];
  if (!finish) return <span aria-hidden="true">{rank}º</span>;

  const metal = `customer-medal-metal-${rank}`;
  const face = `customer-medal-face-${rank}`;
  return (
    <svg
      className="customer-ranking-medal"
      viewBox="0 0 48 52"
      width={44}
      height={48}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={metal} x2="1" y2="1">
          <stop stopColor={finish.light} />
          <stop offset=".38" stopColor={finish.mid} />
          <stop offset=".64" stopColor={finish.dark} />
          <stop offset="1" stopColor={finish.mid} />
        </linearGradient>
        <linearGradient id={face} x2=".55" y2="1">
          <stop stopColor={finish.light} />
          <stop offset="1" stopColor={finish.mid} />
        </linearGradient>
      </defs>
      <path d="M11 3h10l7 15-7 4zM27 3h10l-10 19-7-4z" fill={finish.ribbon} />
      <path
        d="m14 3 8 16m12-16-8 16"
        stroke="#fff"
        strokeOpacity=".32"
        strokeWidth="1.1"
      />
      <circle
        cx="24"
        cy="34"
        r="15.5"
        fill={`url(#${metal})`}
        stroke={finish.dark}
      />
      <circle
        cx="24"
        cy="34"
        r="12.3"
        fill={`url(#${face})`}
        stroke={finish.light}
        strokeWidth=".8"
      />
      <circle
        cx="24"
        cy="34"
        r="10.4"
        fill="none"
        stroke={finish.dark}
        strokeOpacity=".36"
        strokeWidth=".8"
      />
      <text
        x="24"
        y="39"
        fill={finish.ink}
        fontFamily="inherit"
        fontSize="15"
        fontWeight="800"
        textAnchor="middle"
      >
        {rank}
      </text>
    </svg>
  );
}
