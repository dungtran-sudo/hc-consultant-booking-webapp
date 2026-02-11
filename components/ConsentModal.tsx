'use client';

import { useState } from 'react';

interface ConsentModalProps {
  consentText: string;
  onAccept: (version: string, hash: string) => void;
  onCancel: () => void;
  version: string;
  hash: string;
}

export default function ConsentModal({
  consentText,
  onAccept,
  onCancel,
  version,
  hash,
}: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Điều khoản sử dụng dữ liệu
        </h2>

        <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line border border-gray-200">
          {consentText}
        </div>

        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Tôi đã đọc và đồng ý với các điều khoản trên
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={() => onAccept(version, hash)}
            disabled={!agreed}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
