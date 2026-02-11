'use client';

import { useState, useEffect, use } from 'react';

interface ConsentInfo {
  partnerName: string;
  serviceName: string;
  dataDescription: string;
  status: string;
}

function collectDeviceFingerprint() {
  return {
    screen: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    touchPoints: navigator.maxTouchPoints,
  };
}

export default function PatientConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [info, setInfo] = useState<ConsentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);

  useEffect(() => {
    fetch(`/api/consent-token/${token}/info`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInfo(data);
          if (data.status === 'accepted') setAccepted(true);
        }
      })
      .catch(() => setError('Không thể tải thông tin'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const fingerprint = collectDeviceFingerprint();
      const res = await fetch(`/api/consent-token/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint: fingerprint }),
      });

      const data = await res.json();
      if (data.success) {
        setAccepted(true);
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        {/* Print styles */}
        <style>{`
          @media print {
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
          }
        `}</style>
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Cảm ơn bạn!
            </h1>
            <p className="text-gray-600">
              Thông tin đã được chia sẻ thành công với {info?.partnerName}. Nhân viên tư vấn sẽ hoàn tất đặt lịch cho bạn.
            </p>
          </div>

          {/* Print receipt details */}
          <div className="mt-6 border-t border-gray-200 pt-4 space-y-2 text-sm">
            <h2 className="font-semibold text-gray-900 hidden print-only" style={{ display: 'none' }}>
              BIÊN NHẬN ĐỒNG Ý CHIA SẺ THÔNG TIN
            </h2>
            <div className="flex justify-between">
              <span className="text-gray-500">Đối tác:</span>
              <span className="text-gray-900 font-medium">{info?.partnerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dịch vụ:</span>
              <span className="text-gray-900 font-medium">{info?.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thông tin chia sẻ:</span>
              <span className="text-gray-900 text-right max-w-[200px]">{info?.dataDescription}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thời gian:</span>
              <span className="text-gray-900">{new Date().toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mã xác nhận:</span>
              <span className="text-gray-900 font-mono text-xs">{token.substring(0, 12)}...</span>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="no-print mt-6 w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            In biên nhận
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-lg font-bold">Chia sẻ thông tin khám bệnh</h1>
          <p className="text-sm text-blue-100 mt-1">Hello Bác Sĩ</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Service info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Dịch vụ</p>
            <p className="font-medium text-gray-900">{info?.serviceName}</p>
            <p className="text-sm text-gray-600 mt-2">Đối tác</p>
            <p className="font-medium text-gray-900">{info?.partnerName}</p>
          </div>

          {/* Data description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Thông tin sẽ được chia sẻ:
            </h3>
            <p className="text-sm text-gray-600">{info?.dataDescription}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowPartnerInfo(!showPartnerInfo)}
              className="w-full px-4 py-3 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              {showPartnerInfo ? 'Ẩn thông tin đối tác' : 'Xem thông tin đối tác'}
            </button>

            {showPartnerInfo && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <p><span className="text-gray-500">Tên:</span> {info?.partnerName}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Đối tác y tế được xác minh bởi Hello Bác Sĩ
                </p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={submitting}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : 'Đồng ý & Chia sẻ thông tin'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Bằng cách nhấn nút trên, bạn đồng ý chia sẻ thông tin y tế với đối tác được chỉ định.
          </p>
        </div>
      </div>
    </div>
  );
}
