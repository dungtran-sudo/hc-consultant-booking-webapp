import { FormData } from '../types';
import { layer4, getEffectiveKhuVuc, buildExtraFields } from './shared';

const LAYER_1 = `Hãy đóng vai bác sĩ chuyên khoa Xét nghiệm / Y học Xét nghiệm có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Bạch Mai Hà Nội, hệ thống Medlatec, và trung tâm xét nghiệm Diag. Sử dụng kiến thức từ: Hướng dẫn tầm soát của Bộ Y tế Việt Nam, khuyến cáo của WHO về xét nghiệm sàng lọc, USPSTF (US Preventive Services Task Force), và kinh nghiệm tư vấn xét nghiệm tại Việt Nam.`;

const LAYER_2 = `[YẾU TỐ ĐẶC THÙ VIỆT NAM - XÉT NGHIỆM]
- Tầm soát viêm gan B: VN thuộc vùng dịch tễ cao — 10% dân số mang HBsAg, nhiều người không biết mình nhiễm. Người mang HBV/HCV mạn CẦN tầm soát ung thư gan: AFP + siêu âm bụng mỗi 6 tháng. Xét nghiệm HBsAg, anti-HBs nên làm cho mọi người chưa biết tình trạng.
- Tầm soát ung thư cổ tử cung: Pap smear/HPV testing chỉ đạt 10-15% bao phủ — rất thấp so với khuyến cáo WHO. Phụ nữ 25-65 tuổi nên tầm soát định kỳ nhưng đa số không biết hoặc ngại khám phụ khoa.
- Đái tháo đường: ~7% dân số nhưng >50% chưa được chẩn đoán. HbA1c hoặc đường huyết lúc đói nên tầm soát từ 40 tuổi hoặc sớm hơn nếu có yếu tố nguy cơ (béo phì, gia đình có ĐTĐ). Nhiều người phát hiện muộn khi đã có biến chứng (thận, mắt, thần kinh).
- Mỡ máu: Rối loạn lipid máu tăng nhanh theo đô thị hóa — nhiều người chỉ phát hiện sau biến cố tim mạch (nhồi máu cơ tim, đột quỵ). Bilan lipid (cholesterol toàn phần, LDL, HDL, triglyceride) nên làm từ 20 tuổi mỗi 5 năm.
- Tự đặt xét nghiệm: Bệnh nhân VN hay đến thẳng Medlatec/Diag/trung tâm xét nghiệm tư nhân đặt xét nghiệm không qua bác sĩ — nguy cơ đọc kết quả sai, lo lắng không cần thiết, hoặc bỏ sót xét nghiệm quan trọng.
- "Gói khám tổng quát": Rất phổ biến (gói 1-5 triệu VNĐ) nhưng thường bao gồm xét nghiệm không cần thiết (tumor markers CEA, CA125 cho người không có triệu chứng — giá trị tầm soát thấp, dương tính giả cao) và bỏ sót xét nghiệm thực sự cần (HbA1c, HPV, HBsAg).
- Nhịn ăn sai cách: Nhiều bệnh nhân uống cà phê sữa, trà đường trước khi lấy máu — ảnh hưởng kết quả đường huyết, triglyceride. Cần nhịn ăn 8-12 giờ cho xét nghiệm chính xác. Nước lọc được phép.
- Tầm soát STI: Kỳ thị xã hội khiến nhiều người tránh xét nghiệm HIV, giang mai, viêm gan B qua đường tình dục. Xét nghiệm ẩn danh có ở CDC, Pasteur, một số VCT.
- Tuyến giáp: Nhân giáp rất phổ biến (~30% phát hiện trên siêu âm), đa số lành tính nhưng gây lo lắng lớn. FNA (chọc hút tế bào) chỉ cần khi nhân >1cm hoặc có đặc điểm nghi ngờ ác tính trên siêu âm (TIRADS 4-5).
- Hệ thống xét nghiệm: BV công lập có đầy đủ xét nghiệm cơ bản. Trung tâm tư nhân (Medlatec, Diag, Hòa Hảo) nhanh hơn, trả kết quả online. BHYT chi trả xét nghiệm khi có chỉ định bác sĩ — không chi trả xét nghiệm tầm soát tự yêu cầu.`;

function buildLayer3(formData: FormData): string {
  return `[THÔNG TIN BỆNH NHÂN]
- Họ tên: ${formData.hoTen}
- Tuổi: ${formData.tuoi}
- Giới tính: ${formData.gioiTinh}
- Khu vực: ${getEffectiveKhuVuc(formData)}
- Mục đích xét nghiệm: ${formData.mucDichXetNghiem || 'Không cung cấp'}
- Nhóm xét nghiệm quan tâm: ${formData.nhomXetNghiem || 'Không cung cấp'}
- Tiền sử bệnh lý: ${formData.tienSuBenhLy || 'Không cung cấp'}
- Đang dùng thuốc gì: ${formData.dangDungThuoc || 'Không cung cấp'}
- Đã ăn sáng chưa: ${formData.daAnSang || 'Không cung cấp'}
- Triệu chứng chính: ${formData.trieuChungChinh}
- Thời gian khởi phát: ${formData.thoiGianKhoiPhat}
- Thuốc đã dùng: ${formData.thuocDaDung || 'Không có'}${buildExtraFields(formData, ['hoTen', 'tuoi', 'gioiTinh', 'khuVuc', 'khuVucKhac', 'trieuChungChinh', 'thoiGianKhoiPhat', 'thuocDaDung', 'mucDichXetNghiem', 'nhomXetNghiem', 'tienSuBenhLy', 'dangDungThuoc', 'daAnSang'])}`;
}

export function buildXetNghiemPrompt(formData: FormData): string {
  return `${LAYER_1}\n\n${LAYER_2}\n\n${buildLayer3(formData)}\n\n${layer4()}`;
}
