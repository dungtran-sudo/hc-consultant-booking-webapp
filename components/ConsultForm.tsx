'use client';

import { useState } from 'react';
import { FormData } from '@/lib/types';
import LoadingSpinner from './LoadingSpinner';

interface ConsultFormProps {
  specialty: string;
  onResult: (data: {
    displayContent: string;
    recommendedSpecialties: string[];
    redFlags: string[];
    sessionId: string;
  }) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

const GIOI_TINH_OPTIONS = ['Nam', 'Nữ', 'Khác'];
const KHU_VUC_OPTIONS = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Tỉnh khác'];
const THOI_GIAN_OPTIONS = ['Hôm nay', '2-3 ngày', '1 tuần', '2-4 tuần', 'Hơn 1 tháng'];

const CHE_DO_AN_OPTIONS = ['Bú mẹ hoàn toàn', 'Bú mẹ + ăn dặm', 'Ăn dặm', 'Ăn cơm bình thường'];
const DI_NHA_TRE_OPTIONS = ['Có', 'Không'];

const HINH_THAI_OPTIONS = ['Mẩn đỏ', 'Mụn nước', 'Vảy', 'Ngứa', 'Đau rát', 'Loét', 'Thay đổi màu da', 'Khác'];

const CHU_KY_OPTIONS = ['Đều (28-30 ngày)', 'Không đều', 'Vô kinh', 'Không áp dụng (nam/chưa dậy thì)'];
const HON_NHAN_OPTIONS = ['Độc thân', 'Đã kết hôn', 'Đang tìm kiếm hỗ trợ sinh sản'];
const MUC_TIEU_OPTIONS = ['Thai sản', 'Khám phụ khoa định kỳ', 'Điều trị vô sinh - hiếm muộn', 'Tư vấn kế hoạch hóa gia đình', 'Khác'];

const QUAN_HE_OPTIONS = ['Có', 'Không', 'Không muốn cung cấp'];
const TRIEU_CHUNG_STD_OPTIONS = ['Tiết dịch bất thường', 'Đau/rát khi tiểu', 'Loét/mụn bộ phận sinh dục', 'Ngứa', 'Phát ban', 'Hạch bẹn sưng', 'Không có triệu chứng (tầm soát)', 'Khác'];

const VI_TRI_DAU_OPTIONS = ['Thượng vị (vùng dạ dày)', 'Quanh rốn', 'Hạ vị (dưới rốn)', 'Hố chậu phải', 'Hố chậu trái', 'Lan toả toàn bụng', 'Không đau bụng'];
const TINH_CHAT_PHAN_OPTIONS = ['Phân bình thường', 'Tiêu chảy', 'Táo bón', 'Phân có máu', 'Phân đen', 'Phân nhầy', 'Phân màu bất thường'];

const emptyFormData: FormData = {
  hoTen: '', tuoi: '', gioiTinh: '', khuVuc: '',
  trieuChungChinh: '', thoiGianKhoiPhat: '', thuocDaDung: '',
};

export default function ConsultForm({ specialty, onResult, formData, setFormData }: ConsultFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleCheckbox = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const current = (prev[field] as string) || '';
      const values = current ? current.split(', ') : [];
      const idx = values.indexOf(value);
      if (idx > -1) {
        values.splice(idx, 1);
      } else {
        values.push(value);
      }
      return { ...prev, [field]: values.join(', ') };
    });
  };

  const isChecked = (field: keyof FormData, value: string): boolean => {
    const current = (formData[field] as string) || '';
    return current.split(', ').includes(value);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.hoTen.trim()) newErrors.hoTen = 'Vui lòng nhập họ tên';
    if (!formData.tuoi.trim()) newErrors.tuoi = 'Vui lòng nhập tuổi';
    if (!formData.gioiTinh) newErrors.gioiTinh = 'Vui lòng chọn giới tính';
    if (!formData.khuVuc) newErrors.khuVuc = 'Vui lòng chọn khu vực';
    if (!formData.trieuChungChinh.trim()) newErrors.trieuChungChinh = 'Vui lòng mô tả triệu chứng';
    if (!formData.thoiGianKhoiPhat) newErrors.thoiGianKhoiPhat = 'Vui lòng chọn thời gian khởi phát';

    if (specialty === 'nhi') {
      if (!formData.canNang?.trim()) newErrors.canNang = 'Vui lòng nhập cân nặng';
      if (!formData.cheDoDan) newErrors.cheDoDan = 'Vui lòng chọn chế độ ăn';
    }
    if (specialty === 'da-lieu') {
      if (!formData.viTriTonThuong?.trim()) newErrors.viTriTonThuong = 'Vui lòng nhập vị trí tổn thương';
      if (!formData.hinhThaiTonThuong?.trim()) newErrors.hinhThaiTonThuong = 'Vui lòng chọn hình thái tổn thương';
    }
    if (specialty === 'sinh-san') {
      if (!formData.mucTieuKham) newErrors.mucTieuKham = 'Vui lòng chọn mục tiêu khám';
    }
    if (specialty === 'std-sti') {
      if (!formData.quanHeTinhDuc) newErrors.quanHeTinhDuc = 'Vui lòng chọn';
      if (!formData.trieuChungCuThe?.trim()) newErrors.trieuChungCuThe = 'Vui lòng chọn triệu chứng cụ thể';
    }
    if (specialty === 'tieu-hoa') {
      if (!formData.viTriDauBung) newErrors.viTriDauBung = 'Vui lòng chọn vị trí đau';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialty, formData }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      onResult(data);
    } catch {
      setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`;

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Common Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Họ tên bệnh nhân *</label>
          <input type="text" className={inputClass('hoTen')} value={formData.hoTen} onChange={(e) => updateField('hoTen', e.target.value)} />
          {errors.hoTen && <p className="text-red-500 text-xs mt-1">{errors.hoTen}</p>}
        </div>
        <div>
          <label className={labelClass}>Tuổi *</label>
          <input type="number" className={inputClass('tuoi')} value={formData.tuoi} onChange={(e) => updateField('tuoi', e.target.value)} />
          {errors.tuoi && <p className="text-red-500 text-xs mt-1">{errors.tuoi}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Giới tính *</label>
          <select className={inputClass('gioiTinh')} value={formData.gioiTinh} onChange={(e) => updateField('gioiTinh', e.target.value)}>
            <option value="">-- Chọn --</option>
            {GIOI_TINH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {errors.gioiTinh && <p className="text-red-500 text-xs mt-1">{errors.gioiTinh}</p>}
        </div>
        <div>
          <label className={labelClass}>Khu vực sinh sống *</label>
          <select className={inputClass('khuVuc')} value={formData.khuVuc} onChange={(e) => updateField('khuVuc', e.target.value)}>
            <option value="">-- Chọn --</option>
            {KHU_VUC_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {errors.khuVuc && <p className="text-red-500 text-xs mt-1">{errors.khuVuc}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Triệu chứng chính *</label>
        <textarea className={inputClass('trieuChungChinh')} rows={3} placeholder="Mô tả chi tiết triệu chứng..." value={formData.trieuChungChinh} onChange={(e) => updateField('trieuChungChinh', e.target.value)} />
        {errors.trieuChungChinh && <p className="text-red-500 text-xs mt-1">{errors.trieuChungChinh}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Thời gian khởi phát *</label>
          <select className={inputClass('thoiGianKhoiPhat')} value={formData.thoiGianKhoiPhat} onChange={(e) => updateField('thoiGianKhoiPhat', e.target.value)}>
            <option value="">-- Chọn --</option>
            {THOI_GIAN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {errors.thoiGianKhoiPhat && <p className="text-red-500 text-xs mt-1">{errors.thoiGianKhoiPhat}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Thuốc đã dùng</label>
        <textarea className={inputClass('thuocDaDung')} rows={2} placeholder="Liệt kê thuốc đã tự dùng (nếu có)..." value={formData.thuocDaDung} onChange={(e) => updateField('thuocDaDung', e.target.value)} />
      </div>

      {/* NHI KHOA */}
      {specialty === 'nhi' && (
        <div className="border-t pt-5 space-y-4">
          <h3 className="font-semibold text-blue-700">Thông tin Nhi khoa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cân nặng của trẻ (kg) *</label>
              <input type="number" step="0.1" className={inputClass('canNang')} value={formData.canNang || ''} onChange={(e) => updateField('canNang', e.target.value)} />
              {errors.canNang && <p className="text-red-500 text-xs mt-1">{errors.canNang}</p>}
            </div>
            <div>
              <label className={labelClass}>Chế độ ăn *</label>
              <select className={inputClass('cheDoDan')} value={formData.cheDoDan || ''} onChange={(e) => updateField('cheDoDan', e.target.value)}>
                <option value="">-- Chọn --</option>
                {CHE_DO_AN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.cheDoDan && <p className="text-red-500 text-xs mt-1">{errors.cheDoDan}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Tiền sử tiêm chủng</label>
            <textarea className={inputClass('tienSuTiemChung')} rows={2} placeholder="Đã tiêm đủ theo lịch TCMR? Còn thiếu mũi nào?" value={formData.tienSuTiemChung || ''} onChange={(e) => updateField('tienSuTiemChung', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Có đi nhà trẻ/mẫu giáo không?</label>
            <select className={inputClass('diNhaTre')} value={formData.diNhaTre || ''} onChange={(e) => updateField('diNhaTre', e.target.value)}>
              <option value="">-- Chọn --</option>
              {DI_NHA_TRE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* DA LIỄU */}
      {specialty === 'da-lieu' && (
        <div className="border-t pt-5 space-y-4">
          <h3 className="font-semibold text-green-700">Thông tin Da liễu</h3>
          <div>
            <label className={labelClass}>Vị trí tổn thương trên cơ thể *</label>
            <input type="text" className={inputClass('viTriTonThuong')} placeholder="Ví dụ: mặt, cánh tay, lưng..." value={formData.viTriTonThuong || ''} onChange={(e) => updateField('viTriTonThuong', e.target.value)} />
            {errors.viTriTonThuong && <p className="text-red-500 text-xs mt-1">{errors.viTriTonThuong}</p>}
          </div>
          <div>
            <label className={labelClass}>Hình thái tổn thương *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              {HINH_THAI_OPTIONS.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={isChecked('hinhThaiTonThuong', o)} onChange={() => toggleCheckbox('hinhThaiTonThuong', o)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  {o}
                </label>
              ))}
            </div>
            {errors.hinhThaiTonThuong && <p className="text-red-500 text-xs mt-1">{errors.hinhThaiTonThuong}</p>}
          </div>
          <div>
            <label className={labelClass}>Tiền sử dị ứng</label>
            <textarea className={inputClass('tienSuDiUng')} rows={2} placeholder="Dị ứng thuốc, thức ăn, hóa mỹ phẩm..." value={formData.tienSuDiUng || ''} onChange={(e) => updateField('tienSuDiUng', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Đã dùng kem bôi nào chưa?</label>
            <textarea className={inputClass('dungKemBoi')} rows={2} placeholder="Tên kem bôi, thời gian dùng..." value={formData.dungKemBoi || ''} onChange={(e) => updateField('dungKemBoi', e.target.value)} />
          </div>
        </div>
      )}

      {/* SINH SẢN */}
      {specialty === 'sinh-san' && (
        <div className="border-t pt-5 space-y-4">
          <h3 className="font-semibold text-pink-700">Thông tin Sinh sản</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Chu kỳ kinh nguyệt</label>
              <select className={inputClass('chuKyKinh')} value={formData.chuKyKinh || ''} onChange={(e) => updateField('chuKyKinh', e.target.value)}>
                <option value="">-- Chọn --</option>
                {CHU_KY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tình trạng hôn nhân</label>
              <select className={inputClass('tinhTrangHonNhan')} value={formData.tinhTrangHonNhan || ''} onChange={(e) => updateField('tinhTrangHonNhan', e.target.value)}>
                <option value="">-- Chọn --</option>
                {HON_NHAN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Tiền sử Sản Phụ khoa</label>
            <textarea className={inputClass('tienSuSanPhuKhoa')} rows={2} placeholder="Số lần sinh, sảy thai, phẫu thuật phụ khoa..." value={formData.tienSuSanPhuKhoa || ''} onChange={(e) => updateField('tienSuSanPhuKhoa', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Mục tiêu khám *</label>
            <select className={inputClass('mucTieuKham')} value={formData.mucTieuKham || ''} onChange={(e) => updateField('mucTieuKham', e.target.value)}>
              <option value="">-- Chọn --</option>
              {MUC_TIEU_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.mucTieuKham && <p className="text-red-500 text-xs mt-1">{errors.mucTieuKham}</p>}
          </div>
        </div>
      )}

      {/* STD/STI */}
      {specialty === 'std-sti' && (
        <div className="border-t pt-5 space-y-4">
          <h3 className="font-semibold text-purple-700">Thông tin STD/STI</h3>
          <div>
            <label className={labelClass}>Đã có quan hệ tình dục gần đây? *</label>
            <select className={inputClass('quanHeTinhDuc')} value={formData.quanHeTinhDuc || ''} onChange={(e) => updateField('quanHeTinhDuc', e.target.value)}>
              <option value="">-- Chọn --</option>
              {QUAN_HE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.quanHeTinhDuc && <p className="text-red-500 text-xs mt-1">{errors.quanHeTinhDuc}</p>}
          </div>
          <div>
            <label className={labelClass}>Triệu chứng cụ thể *</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {TRIEU_CHUNG_STD_OPTIONS.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={isChecked('trieuChungCuThe', o)} onChange={() => toggleCheckbox('trieuChungCuThe', o)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  {o}
                </label>
              ))}
            </div>
            {errors.trieuChungCuThe && <p className="text-red-500 text-xs mt-1">{errors.trieuChungCuThe}</p>}
          </div>
          <div>
            <label className={labelClass}>Xét nghiệm STI gần nhất</label>
            <textarea className={inputClass('xetNghiemGanNhat')} rows={2} placeholder="Đã xét nghiệm gì? Khi nào? Kết quả?" value={formData.xetNghiemGanNhat || ''} onChange={(e) => updateField('xetNghiemGanNhat', e.target.value)} />
          </div>
        </div>
      )}

      {/* TIÊU HÓA */}
      {specialty === 'tieu-hoa' && (
        <div className="border-t pt-5 space-y-4">
          <h3 className="font-semibold text-orange-700">Thông tin Tiêu hoá</h3>
          <div>
            <label className={labelClass}>Vị trí đau/khó chịu *</label>
            <select className={inputClass('viTriDauBung')} value={formData.viTriDauBung || ''} onChange={(e) => updateField('viTriDauBung', e.target.value)}>
              <option value="">-- Chọn --</option>
              {VI_TRI_DAU_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.viTriDauBung && <p className="text-red-500 text-xs mt-1">{errors.viTriDauBung}</p>}
          </div>
          <div>
            <label className={labelClass}>Tính chất phân</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {TINH_CHAT_PHAN_OPTIONS.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={isChecked('tinhChatPhan', o)} onChange={() => toggleCheckbox('tinhChatPhan', o)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  {o}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Chế độ ăn uống</label>
            <textarea className={inputClass('cheDoDanUong')} rows={2} placeholder="Thói quen ăn uống, thực phẩm gần đây..." value={formData.cheDoDanUong || ''} onChange={(e) => updateField('cheDoDanUong', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Tiền sử bệnh tiêu hóa</label>
            <textarea className={inputClass('tienSuTieuHoa')} rows={2} placeholder="Đau dạ dày, viêm đại tràng, phẫu thuật bụng..." value={formData.tienSuTieuHoa || ''} onChange={(e) => updateField('tienSuTieuHoa', e.target.value)} />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Đang phân tích dữ liệu lâm sàng..." />
      ) : (
        <button
          type="submit"
          className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
        >
          Phân tích &amp; Tư vấn
        </button>
      )}
    </form>
  );
}
