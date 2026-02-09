import React, { useState, useRef, useEffect } from 'react';

interface PatternLockProps {
  onChange: (sequence: string) => void;
  value: string;
}

export const PatternLock: React.FC<PatternLockProps> = ({ onChange, value }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [path, setPath] = useState<number[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // Parse initial value if present (e.g. "123")
  useEffect(() => {
    if (value) {
      const nums = value.split('').map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 9);
      // Remove duplicates for visualization safety
      const unique = Array.from(new Set(nums));
      setPath(unique);
    } else {
      setPath([]);
    }
  }, [value]);

  const getCoordinates = (index: number) => {
    // 1-based index to 0-based row/col
    const i = index - 1;
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cellSize = 60;
    const padding = 30;
    return {
      x: col * cellSize + padding,
      y: row * cellSize + padding
    };
  };

  const getNumberAtPosition = (x: number, y: number) => {
    const cellSize = 60;
    const padding = 30;
    const radius = 24; // Hit area

    for (let i = 1; i <= 9; i++) {
      const coords = getCoordinates(i);
      const dist = Math.sqrt(Math.pow(x - coords.x, 2) + Math.pow(y - coords.y, 2));
      if (dist < radius) return i;
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    
    // Capture pointer to track movement outside SVG bounds
    svgRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const num = getNumberAtPosition(x, y);
    if (num) {
      const newPath = [num];
      setPath(newPath);
      onChange(newPath.join(''));
    } else {
      setPath([]);
      onChange('');
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    e.preventDefault();

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const num = getNumberAtPosition(x, y);
    if (num && !path.includes(num)) {
      const newPath = [...path, num];
      setPath(newPath);
      onChange(newPath.join(''));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (svgRef.current) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-xl border border-slate-700 w-full max-w-[280px] shadow-sm">
      <svg
        ref={svgRef}
        width="180"
        height="180"
        className="touch-none select-none cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="5"
            markerHeight="5"
            refX="20" // Align with circle radius (20)
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 5 2.5, 0 5" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Layer 0: Base Circles */}
        {Array.from({ length: 9 }).map((_, i) => {
          const num = i + 1;
          const { x, y } = getCoordinates(num);
          const isActive = path.includes(num);
          return (
            <circle
              key={`base-${num}`}
              cx={x}
              cy={y}
              r="20"
              className={`transition-all duration-200 ${
                isActive 
                  ? 'fill-blue-600 stroke-blue-600' 
                  : 'fill-slate-900 stroke-slate-600 hover:stroke-blue-400'
              } stroke-2`}
            />
          );
        })}

        {/* Layer 1: Lines and Arrows (Middle) */}
        {path.map((num, i) => {
          if (i === path.length - 1) return null;
          const start = getCoordinates(num);
          const end = getCoordinates(path[i + 1]);
          return (
            <line
              key={`line-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#3b82f6"
              strokeWidth="4"
              markerEnd="url(#arrowhead)"
              className="pointer-events-none"
            />
          );
        })}

        {/* Layer 2: Numbers (Top) */}
        {Array.from({ length: 9 }).map((_, i) => {
          const num = i + 1;
          const { x, y } = getCoordinates(num);
          const isActive = path.includes(num);
          return (
            <text
              key={`text-${num}`}
              x={x}
              y={y}
              dy="0.35em"
              textAnchor="middle"
              className={`text-sm font-bold pointer-events-none select-none transition-colors duration-200 ${
                isActive ? 'fill-white' : 'fill-slate-500'
              }`}
            >
              {num}
            </text>
          );
        })}
      </svg>
      <div className="mt-4 text-xs font-medium text-slate-400 text-center bg-slate-900 px-3 py-1.5 rounded-full shadow-sm border border-slate-700">
        חבר את הנקודות ליצירת תבנית
      </div>
    </div>
  );
};