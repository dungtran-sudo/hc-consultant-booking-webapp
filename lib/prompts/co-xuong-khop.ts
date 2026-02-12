import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Cơ Xương Khớp có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Chợ Rẫy TP.HCM và Bệnh viện E Hà Nội. Sử dụng kiến thức từ: Phác đồ điều trị Cơ Xương Khớp của Bộ Y tế Việt Nam, hướng dẫn của EULAR (European Alliance of Associations for Rheumatology), ACR (American College of Rheumatology), và kinh nghiệm lâm sàng điều trị tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - CƠ XƯƠNG KHỚP]
- Dịch tễ học: Thoái hóa khớp phổ biến nhất (~30% người >40 tuổi), đặc biệt khớp gối do thói quen ngồi xổm. Loãng xương ảnh hưởng ~30% phụ nữ >50 tuổi — thiếu vitamin D do ít phơi nắng và che chắn da. Viêm khớp dạng thấp ~0.5% dân số, thường chẩn đoán muộn 2-5 năm. Gout tăng nhanh do thay đổi chế độ ăn — bia rượu, nội tạng, hải sản — ước tính ~1.5% nam giới trưởng thành. Đau lưng chiếm >15% bệnh nhân đến khám ngoại trú.
- Nghề nghiệp & lối sống: Công nhân nhà máy/nông dân chịu tải khớp nặng từ sớm. Nhân viên văn phòng tăng nhanh bệnh lý cột sống cổ, hội chứng ống cổ tay. Lái xe đường dài gặp nhiều thoát vị đĩa đệm thắt lưng. Thể dục quá mức ở người lớn tuổi (đi bộ 10km/ngày) gây thoái hóa khớp gối nặng hơn.
- Tự điều trị: Lạm dụng NSAID (Diclofenac, Meloxicam, Piroxicam) tự mua — nguy cơ loét dạ dày, suy thận. Tiêm corticoid ngoài da tại phòng khám tư không đúng chỉ định — gây hoại tử xương. Dùng thuốc Đông y "xương khớp" chứa corticoid trá hình (dexamethasone) — phát hiện nhiều ca Cushing do thuốc nam. Cao dán, dầu xoa, giác hơi, bấm huyệt — một số có lợi nhưng có thể trì hoãn điều trị đúng.
- Nhận thức: Coi đau khớp là "bệnh người già", không cần khám — phát hiện muộn bệnh tự miễn. Nhầm gout cấp với nhiễm trùng hoặc chấn thương. Sợ phẫu thuật thay khớp dù đã thoái hóa nặng — dẫn đến tàn phế. Tin dùng thực phẩm chức năng Glucosamine/Collagen thay cho điều trị y khoa.
- Hệ thống y tế: Đo mật độ xương (DEXA) chỉ có ở BV tuyến tỉnh/TW. MRI khớp có ở hầu hết BV tuyến tỉnh nhưng chờ lâu. Phẫu thuật nội soi khớp/thay khớp chủ yếu tuyến TW. Vật lý trị liệu/phục hồi chức năng thiếu nhân lực ở tuyến cơ sở.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Vị trí đau: ${formData.viTriDau || 'Không cung cấp'}
- Tính chất đau: ${formData.tinhChatDau || 'Không cung cấp'}
- Nghề nghiệp: ${formData.ngheNghiep || 'Không cung cấp'}
- Tiền sử chấn thương: ${formData.tienSuChanThuong || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'viTriDau', 'tinhChatDau', 'ngheNghiep', 'tienSuChanThuong'])}`;
}

export function buildCoXuongKhopPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
