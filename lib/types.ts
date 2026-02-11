export interface Partner {
  id: string;
  name: string;
  website: string;
  crawl_urls: string[];
  booking_email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  branches?: Branch[];
  specialties: string[];
  notes: string;
  services: Service[];
}

export interface Branch {
  id: string;
  city: string;
  district?: string;
  address: string;
}

export interface Service {
  id: string;
  name: string;
  specialty: string;
  description: string;
  price_range: string;
  duration: string;
  notes: string;
}

export interface Specialty {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export interface FormData {
  // Common fields
  hoTen: string;
  tuoi: string;
  gioiTinh: string;
  khuVuc: string;
  khuVucKhac?: string;
  trieuChungChinh: string;
  thoiGianKhoiPhat: string;
  thuocDaDung: string;
  // Nhi
  canNang?: string;
  cheDoDan?: string;
  tienSuTiemChung?: string;
  diNhaTre?: string;
  // Da lieu
  viTriTonThuong?: string;
  hinhThaiTonThuong?: string;
  tienSuDiUng?: string;
  dungKemBoi?: string;
  // Sinh san
  chuKyKinh?: string;
  tienSuSanPhuKhoa?: string;
  tinhTrangHonNhan?: string;
  mucTieuKham?: string;
  // STD/STI
  quanHeTinhDuc?: string;
  trieuChungCuThe?: string;
  xetNghiemGanNhat?: string;
  // Tieu hoa
  viTriDauBung?: string;
  tinhChatPhan?: string;
  cheDoDanUong?: string;
  tienSuTieuHoa?: string;
  // Dynamic fields from config
  [key: string]: string | undefined;
}

export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox-group';
  required: boolean;
  placeholder?: string;
  options?: string[];
  rows?: number;
  step?: string;
  gridCol?: number;
}

export interface SpecialtyFieldGroup {
  specialtyId: string;
  sectionTitle: string;
  fields: FieldConfig[];
}

export interface FormConfig {
  commonFields: FieldConfig[];
  specialtyFields: SpecialtyFieldGroup[];
}

export interface AnalysisResult {
  displayContent: string;
  recommendedSpecialties: string[];
  redFlags: string[];
  sessionId: string;
}

export interface BookingPayload {
  sessionId: string;
  patientName: string;
  phone: string;
  conditionSummary: string;
  serviceId: string;
  serviceName: string;
  partnerId: string;
  partnerName: string;
  branchId: string;
  branchAddress: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  consentVersion: string;
  consentTextHash: string;
  consentTokenId?: string;
}

export interface MaskedBooking {
  id: string;
  bookingNumber: string;
  serviceName: string;
  specialty: string;
  branchAddress: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  createdAt: string;
  confirmedAt?: string | null;
  completedAt?: string | null;
  partnerName?: string;
  bookedByStaffName?: string | null;
}

export interface RevealedPII {
  patientName: string;
  phone: string;
  conditionSummary: string;
  notes: string;
}
