import React, { useEffect, useState } from 'react';

/** QR ως SVG (η βιβλιοθήκη φορτώνει μόνο όταν χρειαστεί). */
export const QrCode: React.FC<{ text: string; size?: number; label: string }> = ({ text, size = 220, label }) => {
  const [cells, setCells] = useState<{ n: number; path: string } | null>(null);
  useEffect(() => {
    let alive = true;
    void import('qrcode-generator').then(({ default: qrcode }) => {
      const qr = qrcode(0, 'M');
      qr.addData(text, 'Byte');
      qr.make();
      const n = qr.getModuleCount();
      let path = '';
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`;
      }
      if (alive) setCells({ n, path });
    });
    return () => {
      alive = false;
    };
  }, [text]);
  if (!cells) return <div style={{ width: size, height: size }} className="bg-white rounded-xl" aria-hidden="true" />;
  const dim = cells.n + 8;
  return (
    <svg
      role="img"
      aria-label={label}
      data-testid="qr-code"
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      shapeRendering="crispEdges"
      className="bg-white rounded-xl"
    >
      <rect width={dim} height={dim} fill="#fff" />
      <path d={cells.path} fill="#000" />
    </svg>
  );
};

export default QrCode;
