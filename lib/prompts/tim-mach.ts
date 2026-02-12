import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Tim mạch có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Viện Tim TP.HCM và Bệnh viện Bạch Mai Hà Nội. Sử dụng kiến thức từ: Phác đồ điều trị Tim mạch của Bộ Y tế Việt Nam, hướng dẫn của ESC (European Society of Cardiology), AHA/ACC (American Heart Association/American College of Cardiology), và kinh nghiệm lâm sàng điều trị bệnh tim mạch tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - TIM MẠCH]
- Dịch tễ học: Bệnh tim mạch là nguyên nhân tử vong số 1 tại VN (~31% tổng số ca tử vong). Tăng huyết áp ~25% người trưởng thành nhưng >50% không biết mình bị bệnh. Bệnh mạch vành tăng nhanh do thay đổi lối sống đô thị. Bệnh thấp tim/van tim hậu thấp vẫn phổ biến ở nông thôn — khác biệt lớn so với các nước phát triển. Suy tim chiếm ~1.6% dân số trưởng thành, thường phát hiện muộn giai đoạn III-IV.
- Yếu tố nguy cơ đặc thù: Hút thuốc lá nam giới ~45% — tỷ lệ cao nhất Đông Nam Á. Rượu bia tiêu thụ cao (trung bình 8.3 lít cồn nguyên chất/năm). Ô nhiễm không khí PM2.5 tại Hà Nội và TPHCM vượt chuẩn WHO 3-5 lần — yếu tố nguy cơ tim mạch mới. Đái tháo đường type 2 tăng nhanh (~7% dân số), nhiều người không biết mình bị. Ăn mặn: người VN tiêu thụ trung bình 9.4g muối/ngày (WHO khuyến cáo <5g).
- Tự điều trị & thuốc: Tự ngưng thuốc huyết áp khi cảm thấy "đỡ" — nguyên nhân hàng đầu đột quỵ. Tự mua Aspirin uống dự phòng không có chỉ định. Dùng thuốc Đông y "bổ tim", thuốc nam hạ mỡ máu song song Tây y mà không báo bác sĩ. Tự uống thuốc hạ mỡ (statin) theo lời truyền miệng. Không tuân thủ chế độ ăn giảm muối, giảm mỡ.
- Nhận thức & hành vi: Nhiều bệnh nhân nghĩ đau ngực do "đau dạ dày" hoặc "gió" mà bỏ qua triệu chứng mạch vành. Phụ nữ thường có triệu chứng không điển hình (mệt mỏi, khó thở, đau vai/hàm) nên bị chẩn đoán muộn. Chưa có thói quen đo huyết áp tại nhà định kỳ. Tâm lý "chưa có triệu chứng = chưa bệnh" rất phổ biến.
- Hệ thống y tế: Can thiệp mạch vành (PCI) và phẫu thuật bắc cầu chủ yếu tại BV tuyến trung ương/tỉnh lớn. "Golden hour" xử trí nhồi máu cơ tim thường bị trễ do khoảng cách vận chuyển và nhận thức chậm. Siêu âm tim và ECG có ở hầu hết BV tuyến huyện, nhưng CT mạch vành chỉ ở tuyến tỉnh trở lên.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Huyết áp đo gần nhất: ${formData.huyetAp || 'Không cung cấp'}
- Tiền sử tim mạch: ${formData.tienSuTimMach || 'Không cung cấp'}
- Yếu tố nguy cơ: ${formData.yeuToNguyCo || 'Không cung cấp'}
- Gia đình có người bệnh tim mạch: ${formData.tienSuGiaDinh || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'huyetAp', 'tienSuTimMach', 'yeuToNguyCo', 'tienSuGiaDinh'])}`;
}

export function buildTimMachPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
