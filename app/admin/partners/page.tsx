'use client';

import { useState } from 'react';
import { useAdminAuth } from '../context';
import { useAdminPartners } from '@/lib/hooks/use-admin-partners';
import { useAdminPartnerDetail } from '@/lib/hooks/use-admin-partner-detail';
import ConfirmDialog from '@/components/ConfirmDialog';

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'hospital', label: 'Bệnh viện' },
  { value: 'clinic', label: 'Phòng khám' },
  { value: 'lab', label: 'Xét nghiệm' },
  { value: 'pharmacy', label: 'Nhà thuốc' },
];

const CONTRACT_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả HĐ' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'inactive', label: 'Ngưng' },
  { value: 'pending', label: 'Chờ ký' },
];

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-800',
};

const TABS = [
  { id: 'info', label: 'Thông tin' },
  { id: 'contract', label: 'Hợp đồng' },
  { id: 'branches', label: 'Chi nhánh' },
  { id: 'services', label: 'Dịch vụ' },
  { id: 'portal', label: 'Portal' },
];

export default function AdminPartnersPage() {
  const { secret } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { partners, total, totalPages, isLoading, mutate } = useAdminPartners(secret, {
    page, search, type: typeFilter, city: cityFilter,
    contractStatus: contractFilter, isActive: activeFilter,
  });

  const { partner: detail, mutate: mutateDetail } = useAdminPartnerDetail(secret, selectedId);

  // Create form state
  const [createForm, setCreateForm] = useState({ id: '', name: '', type: 'hospital', city: '', district: '' });

  // Inline edit states
  const [editInfo, setEditInfo] = useState<Record<string, string | string[]>>({});
  const [editContract, setEditContract] = useState<Record<string, string | number>>({});

  // Branch/service forms
  const [branchForm, setBranchForm] = useState({ name: '', city: '', district: '', address: '', phone: '' });
  const [serviceForm, setServiceForm] = useState({ name: '', specialty: '', description: '', priceRange: '', duration: '' });
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);

  // Password state
  const [passwordInput, setPasswordInput] = useState('');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'branch' | 'service'; id: string; name: string } | null>(null);

  const apiCall = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Lỗi server');
    }
    return res.json();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.id.trim() || !createForm.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiCall('/api/admin/partners', 'POST', createForm);
      setCreateForm({ id: '', name: '', type: 'hospital', city: '', district: '' });
      setShowCreate(false);
      mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPartner = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      setActiveTab('info');
      setEditInfo({});
      setEditContract({});
    }
  };

  const handleSaveInfo = async () => {
    if (!selectedId || Object.keys(editInfo).length === 0) return;
    setSaving(true);
    setError('');
    try {
      await apiCall(`/api/admin/partners/${selectedId}`, 'PATCH', editInfo);
      setEditInfo({});
      mutateDetail();
      mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContract = async () => {
    if (!selectedId || Object.keys(editContract).length === 0) return;
    setSaving(true);
    setError('');
    try {
      await apiCall(`/api/admin/partners/${selectedId}`, 'PATCH', editContract);
      setEditContract({});
      mutateDetail();
      mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiCall(`/api/admin/partners/${id}`, 'PATCH', { isActive: !isActive });
      mutate();
      if (selectedId === id) mutateDetail();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !branchForm.city || !branchForm.address) return;
    setSaving(true);
    try {
      await apiCall(`/api/admin/partners/${selectedId}/branches`, 'POST', branchForm);
      setBranchForm({ name: '', city: '', district: '', address: '', phone: '' });
      setShowBranchForm(false);
      mutateDetail();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!selectedId) return;
    try {
      await apiCall(`/api/admin/partners/${selectedId}/branches/${branchId}`, 'DELETE');
      mutateDetail();
    } catch (err) {
      setError((err as Error).message);
    }
    setDeleteConfirm(null);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !serviceForm.name || !serviceForm.specialty) return;
    setSaving(true);
    try {
      await apiCall(`/api/admin/partners/${selectedId}/services`, 'POST', serviceForm);
      setServiceForm({ name: '', specialty: '', description: '', priceRange: '', duration: '' });
      setShowServiceForm(false);
      mutateDetail();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!selectedId) return;
    try {
      await apiCall(`/api/admin/partners/${selectedId}/services/${serviceId}`, 'DELETE');
      mutateDetail();
    } catch (err) {
      setError((err as Error).message);
    }
    setDeleteConfirm(null);
  };

  const handleSetPassword = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await apiCall(`/api/admin/partners/${selectedId}/reset-password`, 'POST', { password: passwordInput || null });
      setPasswordInput('');
      mutateDetail();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Quản lý đối tác</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showCreate ? 'Đóng' : '+ Thêm đối tác'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tạo đối tác mới</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.id}
                  onChange={(e) => setCreateForm({ ...createForm, id: e.target.value })}
                  placeholder="vd: benh-vien-abc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                >
                  {TYPE_OPTIONS.filter(o => o.value).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.city}
                  onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.district}
                  onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !createForm.id.trim() || !createForm.name.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang tạo...' : 'Tạo đối tác'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên hoặc ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Loại</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Thành phố</label>
            <input
              type="text"
              placeholder="TP..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Hợp đồng</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={contractFilter}
              onChange={(e) => { setContractFilter(e.target.value); setPage(1); }}
            >
              {CONTRACT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="min-w-[110px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả</option>
              <option value="true">Hoạt động</option>
              <option value="false">Ngưng</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Lọc
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{total} đối tác</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Không tìm thấy đối tác
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tên</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Loại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Thành phố</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hợp đồng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">HH %</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Active</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partners.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedId === p.id ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleSelectPartner(p.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.id}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell capitalize">{p.type}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[p.contractStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {CONTRACT_STATUS_OPTIONS.find(o => o.value === p.contractStatus)?.label || p.contractStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.commissionRate}%</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(p.id, p.isActive); }}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.isActive ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectPartner(p.id); }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        {selectedId === p.id ? 'Đóng' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            Sau
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selectedId && detail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detail.name}</h3>
                <p className="text-xs text-gray-400">{detail.id}</p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto px-6">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-6 max-h-[65vh] overflow-y-auto">
              {/* Info tab */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'name', label: 'Tên', type: 'text' },
                      { key: 'type', label: 'Loại', type: 'select', options: TYPE_OPTIONS.filter(o => o.value) },
                      { key: 'website', label: 'Website', type: 'text' },
                      { key: 'bookingEmail', label: 'Email đặt lịch', type: 'text' },
                      { key: 'phone', label: 'Điện thoại', type: 'text' },
                      { key: 'city', label: 'Thành phố', type: 'text' },
                      { key: 'district', label: 'Quận/Huyện', type: 'text' },
                      { key: 'address', label: 'Địa chỉ', type: 'text' },
                    ].map(({ key, label, type, options }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        {type === 'select' && options ? (
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={(editInfo[key] as string) ?? (detail as unknown as Record<string, string>)[key] ?? ''}
                            onChange={(e) => setEditInfo({ ...editInfo, [key]: e.target.value })}
                          >
                            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={(editInfo[key] as string) ?? (detail as unknown as Record<string, string>)[key] ?? ''}
                            onChange={(e) => setEditInfo({ ...editInfo, [key]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên khoa (phân cách bằng dấu phẩy)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editInfo.specialties !== undefined ? (editInfo.specialties as string[]).join(', ') : detail.specialties.join(', ')}
                        onChange={(e) => setEditInfo({ ...editInfo, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={3}
                        value={(editInfo.notes as string) ?? detail.notes}
                        onChange={(e) => setEditInfo({ ...editInfo, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  {Object.keys(editInfo).length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveInfo}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                      </button>
                      <button
                        onClick={() => setEditInfo({})}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Contract tab */}
              {activeTab === 'contract' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái HĐ</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={(editContract.contractStatus as string) ?? detail.contractStatus}
                        onChange={(e) => setEditContract({ ...editContract, contractStatus: e.target.value })}
                      >
                        {CONTRACT_STATUS_OPTIONS.filter(o => o.value).map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ lệ hoa hồng (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={(editContract.commissionRate as number) ?? detail.commissionRate}
                        onChange={(e) => setEditContract({ ...editContract, commissionRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={(editContract.contractStartDate as string) ?? (detail.contractStartDate ? detail.contractStartDate.slice(0, 10) : '')}
                        onChange={(e) => setEditContract({ ...editContract, contractStartDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={(editContract.contractEndDate as string) ?? (detail.contractEndDate ? detail.contractEndDate.slice(0, 10) : '')}
                        onChange={(e) => setEditContract({ ...editContract, contractEndDate: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú HĐ</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={3}
                        value={(editContract.contractNotes as string) ?? detail.contractNotes}
                        onChange={(e) => setEditContract({ ...editContract, contractNotes: e.target.value })}
                      />
                    </div>
                  </div>
                  {Object.keys(editContract).length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveContract}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Đang lưu...' : 'Lưu hợp đồng'}
                      </button>
                      <button
                        onClick={() => setEditContract({})}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Branches tab */}
              {activeTab === 'branches' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Chi nhánh ({detail.branches.length})</h4>
                    <button
                      onClick={() => setShowBranchForm(!showBranchForm)}
                      className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {showBranchForm ? 'Đóng' : '+ Thêm'}
                    </button>
                  </div>

                  {showBranchForm && (
                    <form onSubmit={handleCreateBranch} className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" placeholder="Tên chi nhánh" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
                        <input type="text" placeholder="Thành phố *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} />
                        <input type="text" placeholder="Quận/Huyện" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={branchForm.district} onChange={(e) => setBranchForm({ ...branchForm, district: e.target.value })} />
                        <input type="text" placeholder="Địa chỉ *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} />
                        <input type="text" placeholder="Điện thoại" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} />
                      </div>
                      <button type="submit" disabled={saving || !branchForm.city || !branchForm.address} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                        {saving ? 'Đang tạo...' : 'Tạo chi nhánh'}
                      </button>
                    </form>
                  )}

                  {detail.branches.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có chi nhánh</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 text-left font-medium text-gray-600">Tên</th>
                          <th className="py-2 text-left font-medium text-gray-600">Thành phố</th>
                          <th className="py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Địa chỉ</th>
                          <th className="py-2 text-left font-medium text-gray-600">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detail.branches.map((b) => (
                          <tr key={b.id}>
                            <td className="py-2 text-gray-900">{b.name || '—'}</td>
                            <td className="py-2 text-gray-600">{b.city}</td>
                            <td className="py-2 text-gray-600 hidden sm:table-cell">{b.address}</td>
                            <td className="py-2">
                              <button
                                onClick={() => setDeleteConfirm({ type: 'branch', id: b.id, name: b.name || b.address })}
                                className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Services tab */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Dịch vụ ({detail.services.length})</h4>
                    <button
                      onClick={() => setShowServiceForm(!showServiceForm)}
                      className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {showServiceForm ? 'Đóng' : '+ Thêm'}
                    </button>
                  </div>

                  {showServiceForm && (
                    <form onSubmit={handleCreateService} className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" placeholder="Tên dịch vụ *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
                        <input type="text" placeholder="Chuyên khoa *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={serviceForm.specialty} onChange={(e) => setServiceForm({ ...serviceForm, specialty: e.target.value })} />
                        <input type="text" placeholder="Mô tả" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
                        <input type="text" placeholder="Khoảng giá" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={serviceForm.priceRange} onChange={(e) => setServiceForm({ ...serviceForm, priceRange: e.target.value })} />
                        <input type="text" placeholder="Thời gian" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} />
                      </div>
                      <button type="submit" disabled={saving || !serviceForm.name || !serviceForm.specialty} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                        {saving ? 'Đang tạo...' : 'Tạo dịch vụ'}
                      </button>
                    </form>
                  )}

                  {detail.services.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có dịch vụ</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 text-left font-medium text-gray-600">Tên</th>
                          <th className="py-2 text-left font-medium text-gray-600">Chuyên khoa</th>
                          <th className="py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Giá</th>
                          <th className="py-2 text-left font-medium text-gray-600">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detail.services.map((s) => (
                          <tr key={s.id}>
                            <td className="py-2 text-gray-900">{s.name}</td>
                            <td className="py-2 text-gray-600">{s.specialty}</td>
                            <td className="py-2 text-gray-600 hidden sm:table-cell">{s.priceRange || '—'}</td>
                            <td className="py-2">
                              <button
                                onClick={() => setDeleteConfirm({ type: 'service', id: s.id, name: s.name })}
                                className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Portal tab */}
              {activeTab === 'portal' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Portal access:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detail.hasPortalAccess ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {detail.hasPortalAccess ? 'Có' : 'Chưa thiết lập'}
                    </span>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {detail.hasPortalAccess ? 'Đặt lại mật khẩu' : 'Thiết lập mật khẩu'}
                      </label>
                      <input
                        type="password"
                        placeholder="Mật khẩu mới"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleSetPassword}
                      disabled={saving || !passwordInput}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? '...' : 'Lưu'}
                    </button>
                  </div>
                  {detail.hasPortalAccess && (
                    <button
                      onClick={() => { setPasswordInput(''); handleSetPassword(); }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Xóa quyền truy cập portal
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title={`Xóa ${deleteConfirm.type === 'branch' ? 'chi nhánh' : 'dịch vụ'}`}
          message={`Bạn có chắc muốn xóa "${deleteConfirm.name}"? Hành động này không thể hoàn tác.`}
          variant="danger"
          confirmLabel="Xóa"
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm.type === 'branch') handleDeleteBranch(deleteConfirm.id);
            else handleDeleteService(deleteConfirm.id);
          }}
        />
      )}
    </div>
  );
}
