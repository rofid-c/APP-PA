'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CetakQRContent() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      ids.map((id) =>
        fetch(`/api/documents/${id}?mode=meta`)
          .then((r) => r.json())
          .then((res) => res.data)
      )
    ).then((results) => {
      setItems(results.filter(Boolean));
      setLoading(false);
    });
  }, [ids.join(',')]);

  if (loading) return <div style={{ padding: 24 }}>Memuat...</div>;

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <style>{`
        @media print {
          .no-print { display: none; }
          .qr-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
      <div className="no-print" style={{ marginBottom: 20 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '10px 20px', background: '#0f4d3a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          🖨️ Cetak Sekarang
        </button>
        <span style={{ marginLeft: 12, color: '#667' }}>{items.length} QR code siap dicetak</span>
      </div>

      <div
        className="qr-grid"
        style={{ display: 'grid', gap: 20 }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px dashed #999',
              borderRadius: 8,
              padding: 12,
              textAlign: 'center',
              breakInside: 'avoid',
            }}
          >
            <img
              src={`/api/documents/${item.id}/qrcode`}
              alt={item.nomorPerkara}
              style={{ width: '100%', maxWidth: 160 }}
            />
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, wordBreak: 'break-word' }}>
              {item.nomorPerkara}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CetakQRPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat...</div>}>
      <CetakQRContent />
    </Suspense>
  );
}
