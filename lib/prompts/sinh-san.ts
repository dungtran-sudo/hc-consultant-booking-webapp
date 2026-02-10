import { FormData } from '../types';
import { layer4 } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Sản Phụ khoa và Hỗ trợ sinh sản có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Từ Dũ TP.HCM và Bệnh viện Phụ sản Trung ương Hà Nội. Sử dụng kiến thức từ: Phác đồ điều trị Sản Phụ khoa của Bộ Y tế Việt Nam, hướng dẫn của WHO và FIGO về sức khỏe sinh sản, Williams Obstetrics, và kinh nghiệm điều trị hiếm muộn vô sinh tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - SINH SẢN & PHỤ KHOA]
- Dịch tễ học: Tỷ lệ viêm nhiễm phụ khoa (viêm âm đạo do Trichomonas, Candida, BV) cao do điều kiện vệ sinh và khí hậu ẩm. U xơ tử cung và lạc nội mạc tử cung ngày càng tăng ở phụ nữ trẻ đô thị. Tỷ lệ mang thai ngoài tử cung liên quan đến STD/STI không điều trị.
- Thói quen tự điều trị: Tự mua thuốc đặt âm đạo không kê đơn. Thụt rửa âm đạo quá mức. Dùng thảo dược (ngải cứu, lá trầu) điều trị nhiễm khuẩn. Trì hoãn điều trị viêm nhiễm do tâm lý ngại.
- Vô sinh hiếm muộn: Tỷ lệ vô sinh khoảng 7.7% cặp vợ chồng. Buồng trứng đa nang (PCOS) phổ biến. Yếu tố ống dẫn trứng do viêm nhiễm (Chlamydia, lậu). Chi phí IVF còn cao so với thu nhập trung bình.
- Thai kỳ: Thiếu máu thiếu sắt và thiếu acid folic phổ biến. Đái tháo đường thai kỳ tăng do thay đổi lối sống. Tiền sản giật/sản giật là một trong các nguyên nhân tử vong mẹ hàng đầu.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${formData.khuVuc}
- Chu kỳ kinh nguyệt: ${formData.chuKyKinh || 'Không cung cấp'}
- Tiền sử Sản Phụ khoa: ${formData.tienSuSanPhuKhoa || 'Không cung cấp'}
- Tình trạng hôn nhân: ${formData.tinhTrangHonNhan || 'Không cung cấp'}
- Mục tiêu khám: ${formData.mucTieuKham || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}`;
}

export function buildSinhSanPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
