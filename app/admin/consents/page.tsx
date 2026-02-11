'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../context';

interface ConsentRecord {
  id: string;
  phoneHashPrefix: string;
  version: string;
  createdAt: string;
}

interface ConsentTokenRecord {
  id: string;
  staffName: string;
  partnerName: string;
  serviceName: string;
  status: string;
  patientIp: string | null;
  deviceFingerprint: string | null;
  createdAt: string;
  acceptedAt: string | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Đã đồng ý', cls: 'bg-green-100 text-green-800' },
  expired: { label: 'Hết hạn', cls: 'bg-gray-100 text-gray-600' },
};

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function parseFingerprint(fp: string | null): string {
  if (!fp) return '—';
  try {
    const data = JSON.parse(fp);
    return `${data.screen || '?'} · ${data.platform || '?'} · ${data.timezone || '?'}`;
  } catch {
    return fp.substring(0, 30) + '...';
  }
}

export default function AdminConsentsPage() {
  const { secret } = useAdminAuth();
  const [tab, setTab] = useState<'tokens' | 'classic'>('tokens');

  // QR consent tokens
  const [tokens, setTokens] = useState<ConsentTokenRecord[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokensTotal, setTokensTotal] = useState(0);
  const [tokensPage, setTokensPage] = useState(1);
  const [tokensTotalPages, setTokensTotalPages] = useState(1);

  // Classic consents
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(true);
  const [consentsTotal, setConsentsTotal] = useState(0);
  const [consentsPage, setConsentsPage] = useState(1);
  const [consentsTotalPages, setConsentsTotalPages] = useState(1);

  const fetchTokens = useCallback(async () => {
    if (!secret) return;
    setTokensLoading(true);
    try {
      const res = await fetch(`/api/admin/consents?type=tokens&page=${tokensPage}&limit=20`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setTokens(data.tokens || []);
      setTokensTotal(data.total || 0);
      setTokensTotalPages(data.totalPages || 1);
    } catch {
      setTokens([]);
    } finally {
      setTokensLoading(false);
    }
  }, [secret, tokensPage]);

  const fetchConsents = useCallback(async () => {
    if (!secret) return;
    setConsentsLoading(true);
    try {
      const res = await fetch(`/api/admin/consents?type=classic&page=${consentsPage}&limit=20`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setConsents(data.consents || []);
      setConsentsTotal(data.total || 0);
      setConsentsTotalPages(data.totalPages || 1);
    } catch {
      setConsents([]);
    } finally {
      setConsentsLoading(false);
    }
  }, [secret, consentsPage]);

  useEffect(() => {
    if (tab === 'tokens') fetchTokens();
    else fetchConsents();
  }, [tab, fetchTokens, fetchConsents]);

  const tabCls = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Bản ghi chấp thuận</h2>
        <span className="text-sm text-gray-500">
          {tab === 'tokens' ? tokensTotal : consentsTotal} bản ghi
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={tabCls('tokens')} onClick={() => setTab('tokens')}>
          QR Consent ({tokensTotal})
        </button>
        <button className={tabCls('classic')} onClick={() => setTab('classic')}>
          Consent cổ điển ({consentsTotal})
        </button>
      </div>

      {/* QR Consent Tokens Tab */}
      {tab === 'tokens' && (
        <>
          {tokensLoading ? (
            <div className="text-center py-12 text-gray-500">Đang tải...</div>
          ) : tokens.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Nhân viên</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Đối tác</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Dịch vụ</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">IP bệnh nhân</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Thiết bị</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Tạo lúc</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Đồng ý lúc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tokens.map((t) => {
                      const st = STATUS_LABELS[t.status] || { label: t.status, cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.id}</td>
                          <td className="px-4 py-3 text-gray-900">{t.staffName}</td>
                          <td className="px-4 py-3 text-gray-700">{t.partnerName}</td>
                          <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{t.serviceName}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.patientIp || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={t.deviceFingerprint || ''}>
                            {parseFingerprint(t.deviceFingerprint)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {t.acceptedAt ? formatDate(t.acceptedAt) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tokensTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setTokensPage((p) => Math.max(1, p - 1))}
                disabled={tokensPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">
                Trang {tokensPage} / {tokensTotalPages}
              </span>
              <button
                onClick={() => setTokensPage((p) => Math.min(tokensTotalPages, p + 1))}
                disabled={tokensPage === tokensTotalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Classic Consents Tab */}
      {tab === 'classic' && (
        <>
          {consentsLoading ? (
            <div className="text-center py-12 text-gray-500">Đang tải...</div>
          ) : consents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Phone Hash</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Phiên bản</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {consents.map((c, i) => (
                      <tr key={`${c.id}-${i}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.id}...</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {c.phoneHashPrefix === 'ANONYMIZED' ? (
                            <span className="text-gray-400">ANONYMIZED</span>
                          ) : (
                            <span className="text-gray-600">{c.phoneHashPrefix}...</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {c.version}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {consentsTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setConsentsPage((p) => Math.max(1, p - 1))}
                disabled={consentsPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">
                Trang {consentsPage} / {consentsTotalPages}
              </span>
              <button
                onClick={() => setConsentsPage((p) => Math.min(consentsTotalPages, p + 1))}
                disabled={consentsPage === consentsTotalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
