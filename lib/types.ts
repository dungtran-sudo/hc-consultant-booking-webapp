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
}
