import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Nam khoa có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Bình Dân TP.HCM và Bệnh viện Việt Đức Hà Nội. Sử dụng kiến thức từ: Phác đồ điều trị Nam khoa/Tiết niệu của Bộ Y tế Việt Nam, hướng dẫn của EAU (European Association of Urology), AUA (American Urological Association), và kinh nghiệm lâm sàng điều trị tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - NAM KHOA]
- Dịch tễ học: Rối loạn cương dương (ED) ~30% nam giới >40 tuổi nhưng <10% đi khám — kỳ thị xã hội rất lớn. Phì đại tiền liệt tuyến (BPH) ~50% nam >50 tuổi, ~80% nam >70 tuổi. Ung thư tiền liệt tuyến đang tăng nhanh nhưng tầm soát PSA chưa phổ biến. Viêm tiền liệt tuyến mạn tính phổ biến ở nam 25-45 tuổi. Sỏi tiết niệu phổ biến (~5-10% dân số), liên quan khí hậu nóng và uống ít nước. Giãn tĩnh mạch thừng tinh ~15% nam giới — nguyên nhân vô sinh nam hàng đầu.
- Tâm lý & văn hóa: Văn hóa "nam tính" khiến nam giới VN rất ngại đi khám bệnh nam khoa — thường đến rất muộn. Áp lực sinh con trai trong gia đình truyền thống — vô sinh nam gây stress tâm lý lớn. Xấu hổ khi nói về vấn đề tình dục — bệnh nhân thường nói giảm hoặc phủ nhận triệu chứng. Nhiều bệnh nhân tìm kiếm "phòng khám nam khoa" quảng cáo trên mạng — nguy cơ gặp cơ sở kém chất lượng, bị "mổ cắt bao quy đầu" không cần thiết hoặc điều trị quá mức.
- Tự điều trị: Tự mua Sildenafil/Tadalafil (Viagra, Cialis) trực tuyến — nguy cơ thuốc giả, tương tác nguy hiểm với nitrate (bệnh nhân tim mạch). Dùng thuốc Đông y "tráng dương", sản phẩm "bổ thận" không rõ thành phần — nhiều sản phẩm chứa Sildenafil trá hình. Tự mua kháng sinh điều trị viêm đường tiết niệu gây kháng thuốc. Tin quảng cáo "chữa yếu sinh lý" trên mạng xã hội và YouTube.
- Yếu tố nguy cơ đặc thù: Hút thuốc lá 45% nam giới — liên quan trực tiếp ED và ung thư bàng quang. Bia rượu tiêu thụ cao ảnh hưởng testosterone và chức năng tình dục. Ngồi lâu (lái xe, văn phòng) — viêm tiền liệt tuyến, giãn tĩnh mạch thừng tinh. Uống ít nước trong khí hậu nóng — tăng nguy cơ sỏi tiết niệu.
- Hệ thống y tế: Khám nam khoa chuyên sâu chủ yếu ở BV tuyến tỉnh/TW (BV Bình Dân TPHCM, BV Việt Đức Hà Nội). Siêu âm tiết niệu có ở hầu hết BV tuyến huyện. Xét nghiệm PSA, tinh dịch đồ ở tuyến tỉnh trở lên. Sinh thiết tiền liệt tuyến, tán sỏi nội soi chủ yếu tuyến tỉnh/TW. Hỗ trợ sinh sản nam (TESE, micro-TESE) chỉ ở một số trung tâm lớn.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Nhóm triệu chứng: ${formData.nhomTrieuChung || 'Không cung cấp'}
- Tiền sử tiết niệu/nam khoa: ${formData.tienSuNamKhoa || 'Không cung cấp'}
- Hút thuốc lá/rượu bia: ${formData.hutThuocRuouBia || 'Không cung cấp'}
- Bệnh nền (ĐTĐ, tim mạch, tăng HA): ${formData.benhNenNamKhoa || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'nhomTrieuChung', 'tienSuNamKhoa', 'hutThuocRuouBia', 'benhNenNamKhoa'])}`;
}

export function buildNamKhoaPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
