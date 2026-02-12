import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Mắt có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Mắt Trung ương Hà Nội và Bệnh viện Mắt TP.HCM. Sử dụng kiến thức từ: Phác đồ điều trị Nhãn khoa của Bộ Y tế Việt Nam, hướng dẫn của AAO (American Academy of Ophthalmology), ICO (International Council of Ophthalmology), và kinh nghiệm lâm sàng điều trị tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - MẮT]
- Dịch tễ học: Cận thị ở trẻ em đô thị tăng mạnh — 52.7% tại TPHCM, 35-40% tại Hà Nội, có xu hướng tăng do sử dụng thiết bị điện tử từ sớm. Đục thủy tinh thể là nguyên nhân mù lòa số 1 (~65% ca mù), nhiều ca phát hiện muộn ở nông thôn. Glaucoma (tăng nhãn áp) ~3% người >40 tuổi, >90% không biết mình bị — "kẻ cắp thị lực thầm lặng". Bệnh võng mạc đái tháo đường tăng theo dịch tễ ĐTĐ type 2. Mộng thịt phổ biến ở người làm việc ngoài trời (nông dân, ngư dân, công nhân) do tiếp xúc UV.
- Môi trường & lối sống: Trẻ em dùng smartphone/tablet từ 2-3 tuổi, thời gian ngoài trời giảm — thúc đẩy cận thị. Ô nhiễm không khí gây viêm kết mạc, khô mắt mạn tính ở thành phố lớn. Tia UV cao quanh năm (vĩ độ nhiệt đới) — nguy cơ mộng thịt, đục thủy tinh thể sớm. Hàn xì/công nghiệp không đeo kính bảo hộ gây tổn thương giác mạc.
- Tự điều trị: Tự mua thuốc nhỏ mắt có corticoid (Dexamethasone) kéo dài gây glaucoma do thuốc và đục thủy tinh thể — rất phổ biến và nguy hiểm. Rửa mắt bằng nước muối tự pha, lá trầu, nước chè. Dùng kính tiếp xúc (contact lens) không vệ sinh đúng cách — nhiễm Acanthamoeba. Mua kính cận ở tiệm kính không khám mắt đúng cách, đeo kính sai số. Tin dùng thực phẩm chức năng "bổ mắt" (Lutein, Bilberry) thay cho khám định kỳ.
- Đặc thù trẻ em: Nhược thị (amblyopia) cần phát hiện trước 7 tuổi — nhiều ca bỏ lỡ vì không khám mắt cho trẻ. Lé (lác) phổ biến nhưng cha mẹ thường chờ tự hết. Viêm kết mạc sơ sinh do lây từ đường sinh. Tắc lệ đạo bẩm sinh ở trẻ sơ sinh.
- Hệ thống y tế: Đo khúc xạ, đo nhãn áp có ở hầu hết BV tuyến huyện. OCT (chụp cắt lớp võng mạc), chụp mạch huỳnh quang chỉ ở tuyến tỉnh/TW. Phẫu thuật Phaco đục thủy tinh thể có ở nhiều BV tuyến tỉnh. Phẫu thuật LASIK chủ yếu ở BV chuyên khoa mắt lớn. Điều trị tiêm nội nhãn (anti-VEGF) cho bệnh võng mạc ĐTĐ chỉ ở tuyến TW.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Mắt bị ảnh hưởng: ${formData.matBiAnhHuong || 'Không cung cấp'}
- Đeo kính/kính áp tròng: ${formData.deoKinh || 'Không cung cấp'}
- Tiền sử bệnh mắt: ${formData.tienSuBenhMat || 'Không cung cấp'}
- Bệnh nền (ĐTĐ, tăng HA): ${formData.benhNen || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'matBiAnhHuong', 'deoKinh', 'tienSuBenhMat', 'benhNen'])}`;
}

export function buildMatPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
