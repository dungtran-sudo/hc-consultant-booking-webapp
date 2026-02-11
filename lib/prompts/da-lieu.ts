import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Da liễu có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Da liễu Trung ương Hà Nội và Bệnh viện Da liễu TP.HCM. Sử dụng kiến thức từ: Hướng dẫn điều trị của Bộ Y tế Việt Nam về Da liễu, phác đồ từ Bệnh viện Da liễu Trung ương, Fitzpatrick's Dermatology, Journal of the American Academy of Dermatology, và kinh nghiệm điều trị bệnh da nhiệt đới tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - DA LIỄU]
- Khí hậu: Nóng ẩm nhiệt đới, độ ẩm cao 70-85% tạo điều kiện thuận lợi cho nấm da (Tinea versicolor, Tinea pedis, Candida). Ô nhiễm bụi mịn PM2.5 tại Hà Nội và TP.HCM làm trầm trọng viêm da cơ địa và mụn trứng cá.
- Tác nhân đặc thù: Kiến ba khoang (Paederus) gây viêm da tiếp xúc kích ứng nghiêm trọng, phổ biến mùa mưa. Sứa, rong biển gây viêm da tiếp xúc ở vùng ven biển. Côn trùng đốt (muỗi, bọ chét) gây sẩn ngứa.
- Lạm dụng thuốc: "Kem trộn" chứa Corticoid (Betamethasone, Clobetasol) không nhãn hiệu mua online hoặc ở chợ gây teo da, giãn mạch, nám thứ phát. Tự bôi thuốc kháng nấm kéo dài. Lạm dụng retinoid không kê đơn.
- Bệnh phổ biến: Viêm da cơ địa (Atopic dermatitis) tỷ lệ cao ở trẻ em đô thị. Trứng cá (Acne) phổ biến ở thanh thiếu niên với yếu tố thức ăn nhiều dầu mỡ, cay nóng. Nấm da tỷ lệ cao do khí hậu ẩm.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Vị trí tổn thương: ${formData.viTriTonThuong || 'Không cung cấp'}
- Hình thái tổn thương: ${formData.hinhThaiTonThuong || 'Không cung cấp'}
- Tiền sử dị ứng: ${formData.tienSuDiUng || 'Không cung cấp'}
- Đã dùng kem bôi: ${formData.dungKemBoi || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'viTriTonThuong', 'hinhThaiTonThuong', 'tienSuDiUng', 'dungKemBoi'])}`;
}

export function buildDaLieuPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
