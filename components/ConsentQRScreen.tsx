'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

interface ConsentQRScreenProps {
  consentUrl: string;
  token: string;
  onAccepted: () => void;
  onCancel: () => void;
}

export default function ConsentQRScreen({
  consentUrl,
  token,
  onAccepted,
  onCancel,
}: ConsentQRScreenProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [status, setStatus] = useState<'pending' | 'accepted' | 'expired'>('pending');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate QR code
  useEffect(() => {
    QRCode.toDataURL(consentUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, [consentUrl]);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/consent-token/${token}/status`);
      const data = await res.json();
      if (data.status === 'accepted') {
        setStatus('accepted');
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(onAccepted, 1500);
      } else if (data.status === 'expired') {
        setStatus('expired');
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch {
      // Silently retry on next poll
    }
  }, [token, onAccepted]);

  // Poll for status
  useEffect(() => {
    pollRef.current = setInterval(checkStatus, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkStatus]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setStatus('expired');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(consentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  if (status === 'accepted') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-green-700 mb-2">Bệnh nhân đã đồng ý!</h3>
        <p className="text-sm text-gray-600">Đang tiếp tục tạo đặt lịch...</p>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red-700 mb-2">Liên kết đã hết hạn</h3>
        <p className="text-sm text-gray-600 mb-4">Vui lòng tạo lại yêu cầu chấp thuận.</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Chờ bệnh nhân xác nhận</h3>
      <p className="text-sm text-gray-600 mb-4">
        Cho bệnh nhân quét mã QR hoặc gửi liên kết bên dưới
      </p>

      {qrDataUrl && (
        <div className="inline-block bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-4">
          <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
        </div>
      )}

      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 mb-4">
        <input
          type="text"
          readOnly
          value={consentUrl}
          className="flex-1 bg-transparent text-xs text-gray-600 outline-none truncate"
        />
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 shrink-0"
        >
          {copied ? 'Copied!' : 'Sao chép'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        <span className="text-sm text-gray-500">
          Đang chờ... Còn lại {formatTime(timeLeft)}
        </span>
      </div>

      <button
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Hủy
      </button>
    </div>
  );
}
