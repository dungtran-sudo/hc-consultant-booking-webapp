import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Y học Dự phòng / Tiêm chủng có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Viện Vệ sinh Dịch tễ Trung ương (NIHE) Hà Nội và Viện Pasteur TP.HCM. Sử dụng kiến thức từ: Lịch tiêm chủng mở rộng (TCMR) của Bộ Y tế Việt Nam, hướng dẫn của WHO về tiêm chủng, lịch tiêm chủng CDC Hoa Kỳ, và kinh nghiệm tư vấn tiêm chủng tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - TIÊM CHỦNG]
- Chương trình TCMR quốc gia: Vaccine miễn phí trong TCMR gồm BCG, DPT-VGB-Hib (5 trong 1), OPV/IPV (bại liệt), sởi, viêm não Nhật Bản, rubella. Nhiều phụ huynh không biết vaccine dịch vụ (Rotavirus, phế cầu, thủy đậu, HPV, cúm, viêm gan A, não mô cầu) là tiêm riêng ngoài TCMR và phải trả phí. Lịch TCMR VN có một số khác biệt so với CDC (VD: viêm gan B liều sơ sinh trong 24h đầu).
- Vaccine hesitancy (do dự tiêm chủng): Tăng mạnh sau các sự kiện bất lợi được truyền thông đưa tin (sự cố Quinvaxem 2013-2015, một số ca tử vong sau tiêm). Nhóm anti-vax trên Facebook/Zalo lan truyền thông tin sai lệch. Phụ huynh lo ngại "tiêm nhiều mũi cùng lúc" gây quá tải hệ miễn dịch — cần giải thích khoa học. Một số từ chối vaccine do niềm tin tôn giáo hoặc y học cổ truyền.
- Tiêm chủng trẻ em: Trễ lịch tiêm phổ biến ở vùng nông thôn/miền núi (dân tộc thiểu số, khoảng cách đến trạm y tế). Tỷ lệ tiêm HPV chỉ ~15% ở nhóm tuổi mục tiêu (9-14 tuổi nữ) — nhiều phụ huynh chưa biết hoặc do dự. Vaccine Rotavirus nên tiêm trước 8 tháng tuổi nhưng nhiều trẻ bỏ lỡ. Sởi bùng phát cục bộ do tỷ lệ bao phủ chưa đạt 95% ở một số địa phương.
- Phòng dại: ~70 ca tử vong/năm do chó cắn — VN thuộc nhóm có số ca dại cao nhất Đông Nam Á. Tiêm phòng dại sau phơi nhiễm (PEP) thường bị trì hoãn ở nông thôn. Nhiều người nghĩ "chó nhà quen không sao" hoặc chỉ rửa vết thương bằng thuốc nam. Vaccine dại và huyết thanh kháng dại có ở CDC tỉnh và một số BV.
- Tiêm chủng người lớn: Hầu hết người lớn VN không biết cần tiêm nhắc uốn ván-bạch hầu (Td/Tdap), cúm hàng năm, phế cầu (>65 tuổi), zona (>50 tuổi). Phụ nữ mang thai cần tiêm cúm và uốn ván. Tiêm phòng trước khi đi du lịch (viêm gan A, thương hàn, viêm não Nhật Bản) ít được chú ý.
- COVID-19: Tỷ lệ tiêm cơ bản cao (~90% trưởng thành) nhưng mũi nhắc/booster giảm mạnh do "mệt mỏi vaccine". Nhiều người lo ngại tác dụng phụ lâu dài dù không có bằng chứng khoa học.
- Hệ thống tiêm chủng: Trạm y tế xã/phường tiêm TCMR miễn phí. Trung tâm tiêm chủng tư nhân (VNVC, Safpo) tiêm dịch vụ đầy đủ nhưng chi phí cao hơn. CDC tỉnh/thành phố tiêm dại, vaccine đặc biệt. Thiếu vaccine định kỳ xảy ra (VD: BCG, Pentaxim) gây gián đoạn lịch tiêm.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Đối tượng tiêm: ${formData.doiTuong || 'Không cung cấp'}
- Tuổi (tháng, nếu trẻ em): ${formData.tuoiThang || 'Không áp dụng'}
- Tiền sử tiêm chủng: ${formData.tienSuTiemChung || 'Không cung cấp'}
- Mục đích tiêm: ${formData.mucDichTiem || 'Không cung cấp'}
- Dị ứng vaccine trước đó: ${formData.tienSuDiUngVaccine || 'Không có'}
- Đang mang thai/cho con bú: ${formData.dangMangThai || 'Không'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'doiTuong', 'tuoiThang', 'tienSuTiemChung', 'mucDichTiem', 'tienSuDiUngVaccine', 'dangMangThai'])}`;
}

export function buildTiemChungPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
