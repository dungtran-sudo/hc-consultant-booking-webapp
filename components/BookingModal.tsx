'use client';

import { useState } from 'react';
import { Partner, Service, BookingPayload } from '@/lib/types';
import { CURRENT_CONSENT } from '@/lib/consent';
import ConsentModal from './ConsentModal';
import ConsentQRScreen from './ConsentQRScreen';

interface BookingModalProps {
  partner: Partner;
  service?: Service;
  sessionId: string;
  patientName: string;
  conditionSummary: string;
  onClose: () => void;
}

const TIME_OPTIONS = ['7:00-11:30', '13:00-16:30', '17:00-19:00'];

export default function BookingModal({
  partner,
  service,
  sessionId,
  patientName: initialName,
  conditionSummary: initialCondition,
  onClose,
}: BookingModalProps) {
  const [form, setForm] = useState({
    patientName: initialName,
    phone: '',
    conditionSummary: initialCondition,
    serviceName: service?.name || '',
    branchId: partner.branches?.[0]?.id || partner.id,
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [consent, setConsent] = useState<{ version: string; hash: string } | null>(null);
  const [qrConsent, setQrConsent] = useState<{ url: string; token: string; tokenId: string } | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);

  const branches = partner.branches || [
    { id: partner.id, name: '', city: partner.city, address: partner.address },
  ];

  const selectedBranch = branches.find((b) => b.id === form.branchId) || branches[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.patientName || !form.phone || !form.conditionSummary || !form.serviceName || !form.preferredDate || !form.preferredTime) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    // Create consent token for QR flow
    setCreatingToken(true);
    setError('');
    try {
      const res = await fetch('/api/consent-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          partnerId: partner.id,
          partnerName: partner.name,
          serviceName: form.serviceName,
        }),
      });

      if (!res.ok) {
        // Staff not logged in — fall back to old consent modal
        setShowConsent(true);
        setCreatingToken(false);
        return;
      }

      const data = await res.json();
      setQrConsent({ url: data.url, token: data.token, tokenId: data.tokenId });
    } catch {
      // Fallback to old consent modal
      setShowConsent(true);
    } finally {
      setCreatingToken(false);
    }
  };

  const handleQRAccepted = async () => {
    // Patient accepted via QR — now submit booking with QR consent proof
    await submitBooking(CURRENT_CONSENT.version, CURRENT_CONSENT.hash, qrConsent?.tokenId);
  };

  const handleConsentAccept = async (version: string, hash: string) => {
    setConsent({ version, hash });
    setShowConsent(false);
    await submitBooking(version, hash);
  };

  const submitBooking = async (consentVersion: string, consentTextHash: string, consentTokenId?: string) => {
    setLoading(true);
    setError('');

    const payload: BookingPayload = {
      sessionId,
      patientName: form.patientName,
      phone: form.phone,
      conditionSummary: form.conditionSummary,
      serviceId: service?.id || '',
      serviceName: form.serviceName,
      partnerId: partner.id,
      partnerName: partner.name,
      branchId: form.branchId,
      branchAddress: selectedBranch?.address || partner.address,
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      notes: form.notes,
      consentVersion,
      consentTextHash,
      consentTokenId,
    };

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Booking failed');
      }

      setSuccess(true);
      setTimeout(onClose, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Đặt lịch thành công!</h3>
          <p className="text-gray-600">Đối tác sẽ liên hệ xác nhận trong vòng 24 giờ.</p>
        </div>
      </div>
    );
  }

  // Show QR consent screen when token is created
  if (qrConsent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Đang tạo đặt lịch...</p>
            </div>
          ) : (
            <ConsentQRScreen
              consentUrl={qrConsent.url}
              token={qrConsent.token}
              onAccepted={handleQRAccepted}
              onCancel={() => setQrConsent(null)}
            />
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Đặt lịch khám</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Họ tên bệnh nhân *</label>
            <input type="text" className={inputClass} value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Số điện thoại *</label>
            <input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Tóm tắt tình trạng *</label>
            <textarea className={inputClass} rows={2} value={form.conditionSummary} onChange={(e) => setForm({ ...form, conditionSummary: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Dịch vụ / Gói khám *</label>
            <input type="text" className={inputClass} value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Đơn vị đối tác</label>
            <input type="text" className={`${inputClass} bg-gray-50`} value={partner.name} readOnly />
          </div>

          <div>
            <label className={labelClass}>Chi nhánh / Địa điểm *</label>
            <select className={inputClass} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name ? `${b.name} — ` : ''}{b.city} - {b.address}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ngày mong muốn *</label>
              <input type="date" className={inputClass} value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Giờ mong muốn *</label>
              <select className={inputClass} value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}>
                <option value="">-- Chọn --</option>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Ghi chú thêm</label>
            <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || creatingToken}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading || creatingToken ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
          </button>
        </form>
      </div>

      {showConsent && (
        <ConsentModal
          consentText={CURRENT_CONSENT.text}
          version={CURRENT_CONSENT.version}
          hash={CURRENT_CONSENT.hash}
          onAccept={handleConsentAccept}
          onCancel={() => setShowConsent(false)}
        />
      )}
    </div>
  );
}
