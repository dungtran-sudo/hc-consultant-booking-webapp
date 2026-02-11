import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Da liễu - Hoa liễu và Bệnh Lây truyền qua đường tình dục có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Da liễu Trung ương và Bệnh viện Bệnh Nhiệt đới. Sử dụng kiến thức từ: Hướng dẫn điều trị STI của Bộ Y tế Việt Nam, hướng dẫn của CDC và WHO về STD, và kinh nghiệm điều trị tại Việt Nam. Lưu ý: Đây là chủ đề nhạy cảm, hãy tiếp cận không phán xét, bảo mật và tôn trọng người bệnh.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - STD/STI]
- Dịch tễ học: Lậu cầu khuẩn (Neisseria gonorrhoeae) kháng kháng sinh đang tăng. Giang mai đang có xu hướng gia tăng tại các đô thị lớn. Chlamydia là STI phổ biến nhất nhưng thường không triệu chứng. HIV/AIDS: Việt Nam kiểm soát tốt hơn nhưng vẫn lưu hành trong nhóm nguy cơ cao. HPV và ung thư cổ tử cung vẫn là gánh nặng lớn.
- Rào cản tiếp cận: Kỳ thị xã hội cao, người bệnh thường trì hoãn đến khám. Tự điều trị bằng kháng sinh mua tự do gây kháng thuốc. Thiếu hiểu biết về PrEP (dự phòng trước phơi nhiễm HIV) và PEP (sau phơi nhiễm).
- Xét nghiệm: Xét nghiệm HIV tại nhà (Self-test) ngày càng phổ biến. Dịch vụ xét nghiệm STI ẩn danh có sẵn tại các trung tâm y tế lớn. Thời gian cửa sổ (window period) cần giải thích rõ cho người bệnh.
- Đặc biệt lưu ý bảo mật: Không tiết lộ thông tin, đề xuất đối tác cùng xét nghiệm, tư vấn thông báo cho bạn tình một cách khéo léo.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Quan hệ tình dục gần đây: ${formData.quanHeTinhDuc || 'Không cung cấp'}
- Triệu chứng cụ thể: ${formData.trieuChungCuThe || 'Không cung cấp'}
- Xét nghiệm STI gần nhất: ${formData.xetNghiemGanNhat || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'quanHeTinhDuc', 'trieuChungCuThe', 'xetNghiemGanNhat'])}`;
}

export function buildStdStiPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
