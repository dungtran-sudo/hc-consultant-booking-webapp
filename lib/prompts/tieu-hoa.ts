import { FormData } from '../types';
import { layer4 } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Tiêu hóa có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Đại học Y Dược TP.HCM và Bệnh viện Bạch Mai Hà Nội. Sử dụng kiến thức từ: Phác đồ điều trị Tiêu hóa của Bộ Y tế Việt Nam, hướng dẫn của ACG (American College of Gastroenterology), BSG (British Society of Gastroenterology), và kinh nghiệm điều trị bệnh tiêu hóa tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - TIÊU HÓA]
- Dịch tễ học: Helicobacter pylori nhiễm ở khoảng 70% người Việt Nam. Ung thư dạ dày và ung thư gan (do HBV) có tỷ lệ cao. Viêm gan B mạn tính phổ biến. Nhiễm ký sinh trùng đường tiêu hóa (Giardia, Entamoeba) vẫn gặp ở vùng nông thôn và người có thói quen ăn uống kém vệ sinh.
- Chế độ ăn: Thực phẩm đường phố (vỉa hè) nguy cơ nhiễm khuẩn (Salmonella, E.coli). Tiêu thụ nhiều rau sống, gỏi, đồ tái sống (thịt, cá). Rượu bia tiêu thụ cao trong nam giới Việt Nam gây viêm gan, xơ gan. Gia vị cay nóng (ớt) liên quan đến GERD và IBS.
- Tự điều trị: Tự mua thuốc dạ dày (Omeprazole, Maalox) uống dài hạn không có chỉ định. Dùng thuốc cầm tiêu chảy sớm (Loperamide) kể cả khi tiêu chảy nhiễm khuẩn. Lạm dụng kháng sinh đường ruột.
- Bệnh phổ biến: Viêm loét dạ dày tá tràng liên quan H.pylori. Hội chứng ruột kích thích (IBS) tăng mạnh do stress đô thị. Trĩ phổ biến do chế độ ăn ít chất xơ và ngồi nhiều.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${formData.khuVuc}
- Vị trí đau/khó chịu: ${formData.viTriDauBung || 'Không cung cấp'}
- Tính chất phân: ${formData.tinhChatPhan || 'Không cung cấp'}
- Chế độ ăn uống: ${formData.cheDoDanUong || 'Không cung cấp'}
- Tiền sử bệnh tiêu hóa: ${formData.tienSuTieuHoa || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}`;
}

export function buildTieuHoaPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
