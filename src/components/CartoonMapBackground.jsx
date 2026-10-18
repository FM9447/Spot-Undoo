// Stylized Cartoon Vector Map Background for Trail & Explore Canvases
// Renders illustrated rivers, railways, highways, terrain zones, and navigation compass

export default function CartoonMapBackground({
  width = 360,
  height = 800,
  variant = 'full', // 'full' | 'river' | 'road' | 'pinboard'
  locationLabel = 'Kerala',
}) {
  const w = Math.max(width, 320);
  const h = Math.max(height, 600);

  // Generate responsive curved geometry across the height
  const riverMidX = w * 0.45;
  const riverPath = `M ${w * 0.15} 0 C ${w * 0.65} ${h * 0.22}, ${w * 0.1} ${h * 0.48}, ${riverMidX} ${h * 0.72} S ${w * 0.8} ${h * 0.92}, ${w * 0.55} ${h}`;
  
  // Railway track running diagonally across
  const railPath = `M ${w * 0.95} 0 C ${w * 0.75} ${h * 0.3}, ${w * 0.85} ${h * 0.65}, ${w * 0.25} ${h}`;

  // State Highway network
  const highwayPath = `M ${w * 0.05} ${h * 0.12} C ${w * 0.5} ${h * 0.28}, ${w * 0.85} ${h * 0.45}, ${w * 0.35} ${h * 0.82} S ${w * 0.9} ${h * 0.95}, ${w * 0.95} ${h}`;
  const localRoad1 = `M 0 ${h * 0.38} Q ${w * 0.35} ${h * 0.42}, ${w * 0.62} ${h * 0.36}`;
  const localRoad2 = `M ${w * 0.4} ${h * 0.68} Q ${w * 0.75} ${h * 0.72}, ${w} ${h * 0.62}`;

  return (
    <g className="cartoon-map-background select-none pointer-events-none">
      <defs>
        {/* Subtle Map Coordinates Dot Grid */}
        <pattern id="bgMapGrid" width="36" height="36" patternUnits="userSpaceOnUse">
          <circle cx="18" cy="18" r="0.75" fill="#94A3B8" opacity="0.45" />
          <path d="M 18 15 L 18 21 M 15 18 L 21 18" stroke="#CBD5E1" strokeWidth="0.5" opacity="0.3" />
        </pattern>

        {/* River Water Gradient */}
        <linearGradient id="bgRiverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="50%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Green Pasture Gradient */}
        <linearGradient id="bgPastureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DCFCE7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#BBF7D0" stopOpacity="0.35" />
        </linearGradient>

        {/* Railway Tie Pattern */}
        <pattern id="railTies" width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="5" y1="0" x2="5" y2="10" stroke="#475569" strokeWidth="2.5" />
        </pattern>
      </defs>

      {/* 1. Underlying Survey Coordinate Dot Grid */}
      <rect width="100%" height={h} fill="url(#bgMapGrid)" />

      {/* 2. Topographic Elevation Contour Lines */}
      {Array.from({ length: Math.ceil(h / 240) + 1 }).map((_, cIdx) => {
        const yBase = cIdx * 240 + 90;
        return (
          <g key={`contour-${cIdx}`} opacity="0.38">
            <path
              d={`M 0 ${yBase} Q ${w * 0.3} ${yBase - 40}, ${w * 0.6} ${yBase + 30} T ${w} ${yBase - 20}`}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />
            <text
              x={w - 38}
              y={yBase - 6}
              fill="#94A3B8"
              fontSize="7"
              fontWeight="800"
              fontFamily="monospace"
            >
              +{cIdx * 40 + 20}m
            </text>
            <path
              d={`M 0 ${yBase + 120} Q ${w * 0.4} ${yBase + 150}, ${w * 0.75} ${yBase + 90} T ${w} ${yBase + 130}`}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </g>
        );
      })}

      {/* 3. Illustrated Terrain / Nature Reserve Zones */}
      {/* Zone A: Top-Right Valley Forest */}
      <g opacity="0.75">
        <path
          d={`M ${w * 0.58} ${h * 0.05} Q ${w * 0.9} ${h * 0.03}, ${w * 0.98} ${h * 0.16} Q ${w * 0.85} ${h * 0.28}, ${w * 0.62} ${h * 0.22} Z`}
          fill="url(#bgPastureGrad)"
          stroke="#86EFAC"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x={w * 0.68}
          y={h * 0.14}
          fill="#15803D"
          fontSize="7"
          fontWeight="900"
          letterSpacing="0.08em"
          opacity="0.8"
        >
          🌿 NATURE COVE
        </text>
      </g>

      {/* Zone B: Mid-Left River Valley Pasture */}
      <g opacity="0.75">
        <path
          d={`M ${w * 0.02} ${h * 0.48} Q ${w * 0.32} ${h * 0.44}, ${w * 0.35} ${h * 0.62} Q ${w * 0.18} ${h * 0.72}, ${w * 0.02} ${h * 0.66} Z`}
          fill="url(#bgPastureGrad)"
          stroke="#86EFAC"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x={w * 0.06}
          y={h * 0.58}
          fill="#15803D"
          fontSize="7"
          fontWeight="900"
          letterSpacing="0.08em"
          opacity="0.8"
        >
          🌴 RIVER BASIN
        </text>
      </g>

      {/* Zone C: Bottom-Right Highlands Patch */}
      <g opacity="0.7">
        <path
          d={`M ${w * 0.52} ${h * 0.78} Q ${w * 0.92} ${h * 0.74}, ${w * 0.96} ${h * 0.92} Q ${w * 0.75} ${h * 0.98}, ${w * 0.55} ${h * 0.92} Z`}
          fill="#FEF3C7"
          fillOpacity="0.45"
          stroke="#FCD34D"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x={w * 0.64}
          y={h * 0.86}
          fill="#B45309"
          fontSize="7"
          fontWeight="900"
          letterSpacing="0.08em"
          opacity="0.8"
        >
          ⛰️ FOOTHILLS RIDGE
        </text>
      </g>

      {/* 4. Illustrated Kerala Backwaters / Bharathapuzha River */}
      {(variant === 'full' || variant === 'river') && (
        <g id="mapRiverSystem" opacity="0.85">
        {/* River Bed / Soft Shore Foam */}
        <path
          d={riverPath}
          fill="none"
          stroke="#E0F2FE"
          strokeWidth="32"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* River Water Surface */}
        <path
          d={riverPath}
          fill="none"
          stroke="url(#bgRiverGrad)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cartoon Water Ripples */}
        <path
          d={riverPath}
          fill="none"
          stroke="#0284C7"
          strokeWidth="2"
          strokeDasharray="14 18"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* River Label */}
        <text
          x={w * 0.28}
          y={h * 0.42}
          fill="#0369A1"
          fontSize="7"
          fontWeight="900"
          letterSpacing="0.12em"
          opacity="0.75"
        >
          ≈ BHARATHAPUZHA (NILA) RIVER ≈
        </text>
      </g>
      )}

      {/* 5. Railway Network (Iconic Kerala Shoranur/Palakkad/Kochi Railway) */}
      <g id="mapRailwayNetwork" opacity="0.6">
        {/* Ballast bed */}
        <path
          d={railPath}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Railway Ties / Cross-Sleepers */}
        <path
          d={railPath}
          fill="none"
          stroke="#334155"
          strokeWidth="8"
          strokeDasharray="2.5 5.5"
          strokeLinecap="butt"
        />
        {/* Dual Steel Rails */}
        <path
          d={railPath}
          fill="none"
          stroke="#1E293B"
          strokeWidth="1.2"
        />
        <path
          d={railPath}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeDasharray="2 12"
          opacity="0.4"
        />
        <text
          x={w * 0.48}
          y={h * 0.26}
          fill="#475569"
          fontSize="6.5"
          fontWeight="900"
          letterSpacing="0.08em"
        >
          🚂 SOUTHERN RAILWAY MAINLINE
        </text>
      </g>

      {/* 6. State Highway Network with Route Badges */}
      <g id="mapHighways" opacity="0.75">
        {/* Highway Asphalt */}
        <path
          d={highwayPath}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={highwayPath}
          fill="none"
          stroke="#F8FAFC"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Yellow Dashed Center Line */}
        <path
          d={highwayPath}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeDasharray="7 8"
          strokeLinecap="round"
        />

        {/* Local Connecting Village Lanes */}
        <path
          d={localRoad1}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={localRoad1}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d={localRoad2}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={localRoad2}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Highway Route Badge 1 */}
        <g transform={`translate(${w * 0.42}, ${h * 0.74})`}>
          <rect
            x="-16"
            y="-7"
            width="32"
            height="14"
            rx="4"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fill="#000000"
            fontSize="7.5"
            fontWeight="900"
            fontFamily="monospace"
          >
            SH 23
          </text>
        </g>

        {/* Highway Route Badge 2 */}
        <g transform={`translate(${w * 0.12}, ${h * 0.22})`}>
          <rect
            x="-16"
            y="-7"
            width="32"
            height="14"
            rx="4"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fill="#000000"
            fontSize="7.5"
            fontWeight="900"
            fontFamily="monospace"
          >
            NH 66
          </text>
        </g>
      </g>

      {/* 7. Cartoon Compass Rose in Top-Right Corner */}
      <g transform={`translate(${w - 36}, 36)`} opacity="0.8">
        <circle cx="0" cy="0" r="18" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
        <circle cx="0" cy="0" r="14" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        {/* 4-point Compass Star */}
        <polygon points="0,-14 3,-3 14,0 3,3 0,14 -3,3 -14,0 -3,-3" fill="#0F172A" />
        {/* Red North Needle */}
        <polygon points="0,-14 3,-3 0,0 -3,-3" fill="#EF4444" />
        <text x="0" y="-17" textAnchor="middle" fill="#EF4444" fontSize="8" fontWeight="900">
          N
        </text>
        <text x="18" y="3" textAnchor="start" fill="#64748B" fontSize="6.5" fontWeight="900">
          E
        </text>
        <text x="0" y="24" textAnchor="middle" fill="#64748B" fontSize="6.5" fontWeight="900">
          S
        </text>
        <text x="-24" y="3" textAnchor="start" fill="#64748B" fontSize="6.5" fontWeight="900">
          W
        </text>
      </g>

      {/* 8. Map Coordinates Watermarks & Survey Metadata along canvas edge */}
      <g opacity="0.45" fill="#64748B" fontSize="6.5" fontWeight="800" fontFamily="monospace">
        <text x="12" y="20">EXPEDITION MAP • {locationLabel.toUpperCase()}</text>
        <text x="12" y={h - 14}>GRID LAT 10°45′N • LON 76°16′E</text>
        <text x={w - 85} y={h - 14}>SECTOR 04 [TERRAIN]</text>
      </g>
    </g>
  );
}
