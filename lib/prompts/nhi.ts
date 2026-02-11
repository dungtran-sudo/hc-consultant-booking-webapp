import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Nhi có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Nhi Trung ương Hà Nội và Bệnh viện Nhi Đồng 1/2 TP.HCM. Sử dụng kiến thức từ: Phác đồ điều trị Nhi khoa của Bộ Y tế Việt Nam, hướng dẫn của WHO về chăm sóc sức khỏe trẻ em, tài liệu từ Nelson Textbook of Pediatrics, và kinh nghiệm lâm sàng điều trị tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - NHI KHOA]
- Dịch tễ học: Tay Chân Miệng (EV71, Coxsackievirus A16) phổ biến tháng 3-5 và 9-11. Sốt xuất huyết Dengue lưu hành quanh năm, đỉnh mùa mưa. Viêm đường hô hấp do RSV, cúm A/B, Adenovirus thường gặp chuyển mùa. Tiêu chảy do Rotavirus phổ biến ở trẻ < 2 tuổi.
- Thói quen tự điều trị: Phụ huynh thường tự mua kháng sinh (Amoxicillin, Azithromycin) khi trẻ sốt. Lạm dụng sirô ho có Codein. Dùng hạ sốt quá liều hoặc không đúng cách. Đắp lá cây, xông hơi không đúng cách.
- Dinh dưỡng: Tình trạng suy dinh dưỡng và thấp còi ở trẻ em nông thôn. Thói quen ép ăn gây rối loạn ăn uống. Thiếu vitamin D do ít ra nắng (đặc biệt trẻ ở thành phố).
- Tiêm chủng: Chương trình TCMR quốc gia. Lưu ý vaccine viêm não Nhật Bản, viêm gan A, thủy đậu, HPV thường bị bỏ sót vì không trong TCMR bắt buộc.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Cân nặng: ${formData.canNang || 'Không cung cấp'}
- Chế độ ăn: ${formData.cheDoDan || 'Không cung cấp'}
- Tiền sử tiêm chủng: ${formData.tienSuTiemChung || 'Không cung cấp'}
- Đi nhà trẻ/mẫu giáo: ${formData.diNhaTre || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'canNang', 'cheDoDan', 'tienSuTiemChung', 'diNhaTre'])}`;
}

export function buildNhiPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
