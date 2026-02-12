import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Tiêu hóa có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Đại học Y Dược TP.HCM và Bệnh viện Bạch Mai Hà Nội. Sử dụng kiến thức từ: Phác đồ điều trị Tiêu hóa của Bộ Y tế Việt Nam, hướng dẫn của ACG (American College of Gastroenterology), BSG (British Society of Gastroenterology), và kinh nghiệm điều trị bệnh tiêu hóa tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - TIÊU HÓA]
- Dịch tễ học & ung thư: H. pylori nhiễm ~70% người VN, chủng CagA+ độc lực cao phổ biến hơn các nước phương Tây. Ung thư dạ dày: tỷ lệ cao nhất Đông Nam Á (16.3/100,000). Ung thư gan: VN thuộc nhóm cao nhất thế giới, do HBV (10% dân số mang HBsAg) — cần nhắc tầm soát AFP + siêu âm mỗi 6 tháng cho người mang HBV/HCV mạn.
- Ký sinh trùng: Sán lá gan (Clonorchis/Opisthorchis) từ cá nước ngọt ăn sống/gỏi — nguy cơ ung thư đường mật. Giun truyền qua đất (Ascaris, Trichuris, Hookworm) phổ biến vùng nông thôn. Hỏi thói quen ăn gỏi cá, tiết canh, rau sống không rửa kỹ.
- Chế độ ăn: Thực phẩm đường phố (vỉa hè) nguy cơ nhiễm khuẩn (Salmonella, E.coli). Tiêu thụ nhiều rau sống, gỏi, đồ tái sống. Rượu bia: VN tiêu thụ bia lớn nhất Đông Nam Á — viêm gan, xơ gan, viêm tụy do rượu. Gia vị cay nóng (ớt) liên quan đến GERD và IBS.
- Tự điều trị: Tự mua PPI (Omeprazole, Esomeprazole) uống dài hạn >8 tuần không có chỉ định — nguy cơ thiếu Mg, loãng xương, nhiễm Clostridium difficile. Dùng Loperamide cầm tiêu chảy ngay cả khi tiêu chảy nhiễm khuẩn (sốt, phân máu). Lạm dụng kháng sinh đường ruột (Berberine, Nifuroxazide). Dùng thuốc Đông y "bổ gan" song song với Tây y mà không báo bác sĩ.
- Bệnh phổ biến: Viêm loét dạ dày tá tràng liên quan H.pylori. IBS tăng mạnh do stress đô thị. Trĩ phổ biến do chế độ ăn ít chất xơ và ngồi nhiều. Gan nhiễm mỡ không do rượu (NAFLD) tăng nhanh theo xu hướng béo phì.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Vị trí đau/khó chịu: ${formData.viTriDauBung || 'Không cung cấp'}
- Tính chất phân: ${formData.tinhChatPhan || 'Không cung cấp'}
- Chế độ ăn uống: ${formData.cheDoDanUong || 'Không cung cấp'}
- Tiền sử bệnh tiêu hóa: ${formData.tienSuTieuHoa || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'viTriDauBung', 'tinhChatPhan', 'cheDoDanUong', 'tienSuTieuHoa'])}`;
}

export function buildTieuHoaPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
