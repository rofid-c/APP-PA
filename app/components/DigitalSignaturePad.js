'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

export default function DigitalSignaturePad({ onChange, height = 180, label = 'Tanda Tangan Digital' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Sesuaikan ukuran canvas internal dengan ukuran pixel tampilan sebenarnya
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 360;
    const dpr = window.devicePixelRatio || 1;

    // Simpan gambar lama jika ada sebelum resize
    const prevImage = hasDrawn ? canvas.toDataURL() : null;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00291d';

    if (prevImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = prevImage;
    }
  }, [hasDrawn, height]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  function getCoords(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDrawing(e) {
    if (e.type === 'touchstart') {
      // Cegah scroll saat tanda tangan di layar sentuh
      e.preventDefault();
    }
    const { x, y } = getCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  }

  function draw(e) {
    if (!isDrawing) return;
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    const { x, y } = getCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && onChange) {
      onChange(canvas.toDataURL('image/png'));
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onChange) {
      onChange(null);
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#0f4d3a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✍️</span> {label} <span style={{ color: '#c53030' }}>*</span>
        </label>
        {hasDrawn && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: '#fde8e8',
              color: '#c53030',
              border: 'none',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>🗑️</span> Hapus / Ulangi
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          background: '#ffffff',
          borderRadius: 8,
          border: '1.5px dashed #97b5a8',
          overflow: 'hidden',
          touchAction: 'none',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
          }}
        />

        {!hasDrawn && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#9aa8a1',
              fontSize: 13,
              fontWeight: 500,
              pointerEvents: 'none',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>🖋️</div>
            Goreskan tanda tangan Anda di sini
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 20,
            right: 20,
            borderBottom: '1px dashed #e2e6e4',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: '#707974', marginTop: 4 }}>
        Gunakan jari pada smartphone atau mouse pada komputer untuk membubuhkan tanda tangan.
      </div>
    </div>
  );
}

