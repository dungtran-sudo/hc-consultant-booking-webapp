'use client';

import { useState } from 'react';

interface PIIConsentGateProps {
  onAccept: () => void;
  onCancel: () => void;
  authHeader?: string;
}

export default function PIIConsentGate({ onAccept, onCancel, authHeader }: PIIConsentGateProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {};
      if (authHeader) headers.Authorization = authHeader;
      await fetch('/api/partner/pii-consent-ack', { method: 'POST', headers });
    } catch {
      // non-critical, continue even if audit log fails
    }
    sessionStorage.setItem('pii_consent_ack', 'true');
    setSubmitting(false);
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Cam kết bảo mật dữ liệu y tế
        </h3>

        <div className="text-sm text-gray-600 space-y-3 mb-6">
          <p>
            Dữ liệu bệnh nhân được bảo vệ theo quy định bảo mật thông tin y tế.
            Trước khi xem thông tin cá nhân, bạn cần cam kết:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Chỉ sử dụng thông tin cho mục đích quản lý đặt lịch</li>
            <li>Không sao chép, chụp ảnh, hoặc chia sẻ dữ liệu bệnh nhân</li>
            <li>Báo cáo ngay khi phát hiện truy cập trái phép</li>
            <li>Mọi truy cập đều được ghi nhận vào nhật ký kiểm tra</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Tôi đã đọc và cam kết tuân thủ các quy định bảo mật dữ liệu y tế trên
          </span>
        </label>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleAccept}
            disabled={!agreed || submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Đang xử lý...' : 'Đồng ý và tiếp tục'}
          </button>
        </div>
      </div>
    </div>
  );
}
