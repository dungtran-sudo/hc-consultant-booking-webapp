# Healthcare Consultant Web App — Claude Code Task Specification

## How to Use This Document
Feed each **TASK** section to Claude Code in sequence. Complete Task 1 before Task 2, and so on.
Each task is self-contained with all context needed to execute autonomously.

---

## Project Context

An internal Vietnamese-language web app for healthcare consultants.
Consultants fill a specialty-specific form → get AI clinical analysis (SOAP format) → see partner clinic recommendations → submit booking.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · OpenAI API · Google Sheets API · Nodemailer
**Hosting:** Vercel (free tier)
**No auth, no database.** Internal tool only.

---

## Environment Variables Required

Create `.env.local` at project root with these keys (values to be filled by user):

```
OPENAI_API_KEY=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

---

## TASK 1 — Project Scaffold

**Goal:** Create a working Next.js project with the exact folder structure below. No logic yet — just the scaffold, config files, and empty files with correct exports.

### Commands to run:
```bash
npx create-next-app@latest healthcare-consultant --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint
cd healthcare-consultant
npm install openai googleapis nodemailer
npm install --save-dev @types/nodemailer
```

### Create this exact folder/file structure:
```
/app
  page.tsx                          # Specialty selector homepage
  layout.tsx                        # Root layout (Vietnamese lang, metadata)
  /consult
    /[specialty]
      page.tsx                      # Dynamic form + result page
  /api
    /analyze
      route.ts                      # POST: calls OpenAI
    /booking
      route.ts                      # POST: writes to Google Sheet + sends email

/components
  SpecialtyCard.tsx
  ConsultForm.tsx
  AnalysisResult.tsx
  PartnerCard.tsx
  BookingModal.tsx
  LoadingSpinner.tsx

/lib
  openai.ts                         # OpenAI client singleton
  sheets.ts                         # Google Sheets client + append function
  mailer.ts                         # Nodemailer setup + send function
  partners.ts                       # Load + filter partners from JSON
  types.ts                          # All shared TypeScript types
  /prompts
    index.ts                        # Prompt router
    nhi.ts
    da-lieu.ts
    sinh-san.ts
    std-sti.ts
    tieu-hoa.ts

/data
  partners.json                     # COPY the provided partners.json here
  specialties.json                  # Specialty metadata

/scripts
  crawl-partners.ts                 # One-time crawl script
```

### `data/specialties.json` content:
```json
[
  {
    "id": "nhi",
    "label": "Nhi khoa",
    "icon": "🧒",
    "description": "Khám và tư vấn sức khỏe trẻ em từ sơ sinh đến 15 tuổi",
    "color": "blue"
  },
  {
    "id": "da-lieu",
    "label": "Da liễu",
    "icon": "🌿",
    "description": "Các bệnh lý về da, tóc, móng và thẩm mỹ da",
    "color": "green"
  },
  {
    "id": "sinh-san",
    "label": "Sinh sản",
    "icon": "🌸",
    "description": "Sản phụ khoa, hỗ trợ sinh sản, IVF, vô sinh hiếm muộn",
    "color": "pink"
  },
  {
    "id": "std-sti",
    "label": "STD/STI",
    "icon": "🔬",
    "description": "Các bệnh lây truyền qua đường tình dục, xét nghiệm và điều trị",
    "color": "purple"
  },
  {
    "id": "tieu-hoa",
    "label": "Tiêu hoá",
    "icon": "🫁",
    "description": "Các bệnh lý đường tiêu hóa, gan mật, đại tràng",
    "color": "orange"
  }
]
```

### `lib/types.ts` — define these interfaces:
```typescript
export interface Partner {
  id: string;
  name: string;
  website: string;
  crawl_urls: string[];
  booking_email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  branches?: Branch[];
  specialties: string[];
  notes: string;
  services: Service[];
}

export interface Branch {
  id: string;
  city: string;
  district?: string;
  address: string;
}

export interface Service {
  id: string;
  name: string;
  specialty: string;
  description: string;
  price_range: string;
  duration: string;
  notes: string;
}

export interface Specialty {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export interface FormData {
  // Common fields
  hoTen: string;
  tuoi: string;
  gioiTinh: string;
  khuVuc: string;
  trieuChungChinh: string;
  thoiGianKhoiPhat: string;
  thuocDaDung: string;
  // Nhi
  canNang?: string;
  cheDoDan?: string;
  tienSuTiemChung?: string;
  diNhaTre?: string;
  // Da lieu
  viTriTonThuong?: string;
  hinhThaiTonThuong?: string;
  tienSuDiUng?: string;
  dungKemBoi?: string;
  // Sinh san
  chuKyKinh?: string;
  tienSuSanPhuKhoa?: string;
  tinhTrangHonNhan?: string;
  mucTieuKham?: string;
  // STD/STI
  quanHeTinhDuc?: string;
  trieuChungCuThe?: string;
  xetNghiemGanNhat?: string;
  // Tieu hoa
  viTriDauBung?: string;
  tinhChatPhan?: string;
  cheDoDanUong?: string;
  tienSuTieuHoa?: string;
}

export interface AnalysisResult {
  displayContent: string;
  recommendedSpecialties: string[];
  redFlags: string[];
  sessionId: string;
}

export interface BookingPayload {
  sessionId: string;
  patientName: string;
  phone: string;
  conditionSummary: string;
  serviceId: string;
  serviceName: string;
  partnerId: string;
  partnerName: string;
  branchId: string;
  branchAddress: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
}
```

**Deliverable:** Running `npm run dev` should start the dev server with no errors.

---

## TASK 2 — Partner Crawl Script

**Goal:** Build and run `scripts/crawl-partners.ts` to populate `services` arrays in `data/partners.json`.

### Script behavior:
1. Read `data/partners.json`
2. For each partner where `crawl_urls` is not empty:
   - Fetch each URL in `crawl_urls` using Node.js `fetch`
   - Extract text content (strip HTML tags, keep meaningful text, max 8000 chars per page)
   - Combine all page texts for that partner
   - Send to OpenAI API with this system prompt:

```
You are a medical service data extraction specialist. Extract structured service/package data from Vietnamese healthcare provider website content.

Return ONLY valid JSON with this exact structure, no other text:
{
  "services": [
    {
      "id": "slug-of-service-name",
      "name": "Tên dịch vụ đầy đủ",
      "specialty": "one of: nhi|da-lieu|sinh-san|std-sti|tieu-hoa",
      "description": "Mô tả ngắn gọn dịch vụ",
      "price_range": "VD: 300,000 - 500,000 VND hoặc Liên hệ",
      "duration": "VD: 30-45 phút hoặc để trống nếu không rõ",
      "notes": "Ghi chú đặc biệt nếu có"
    }
  ],
  "confidence": "high|medium|low",
  "reason": "brief explanation if confidence is not high"
}

Rules:
- Only extract services relevant to these 5 specialties: nhi (pediatrics), da-lieu (dermatology), sinh-san (reproductive/obstetrics), std-sti (sexually transmitted infections), tieu-hoa (gastroenterology/digestive)
- Only include services that are clearly offered by this provider
- Do not invent services not mentioned in the content
- Maximum 15 services per partner
- Use Vietnamese for all text fields
```

3. Merge returned services into the partner object
4. Log: partner name, number of services found, confidence level
5. Flag partners with confidence=low for manual review
6. Write updated data back to `data/partners.json`
7. Write a summary report to `scripts/crawl-report.txt`

### Run command:
```bash
npx ts-node --project tsconfig.json scripts/crawl-partners.ts
```

**Note for Claude Code:** Many partner websites may block automated requests or return empty pages. Handle these gracefully — log the failure, skip the partner, and continue. Partners with no website or empty `crawl_urls` should be skipped silently.

**Deliverable:** Updated `data/partners.json` with services populated where possible, plus `crawl-report.txt` listing results per partner.

---

## TASK 3 — Prompt Templates

**Goal:** Build all 5 prompt templates in `/lib/prompts/`. Each template is a function that takes `FormData` and returns a complete string prompt.

### Required structure for EVERY prompt:

The final prompt string must have 4 layers:

**Layer 1 — Role + Knowledge Sources** (hardcoded per specialty)
**Layer 2 — Vietnam-specific epidemiology context** (hardcoded per specialty)
**Layer 3 — Patient data** (dynamic, from FormData)
**Layer 4 — SOAP output instructions** (hardcoded, same for all)

### Layer 4 (identical for all specialties) — SOAP Output Instructions:
```
[YÊU CẦU PHÂN TÍCH VÀ ĐỊNH DẠNG ĐẦU RA]

Hãy phân tích và trả lời CHÍNH XÁC theo cấu trúc dưới đây. Sử dụng đúng các tiêu đề như được chỉ định.

## S — Triệu chứng chủ quan (Subjective)
[Tóm tắt triệu chứng theo lời bệnh nhân/người nhà mô tả]

## O — Quan sát lâm sàng (Objective)
[Các dấu hiệu lâm sàng suy luận được từ dữ liệu cung cấp. Nếu thiếu thông tin khám trực tiếp, ghi rõ điều đó.]

## A — Đánh giá (Assessment)
[Liệt kê các khả năng chẩn đoán theo thứ tự xác suất từ cao đến thấp. Bao gồm cả bệnh lý nhiệt đới nếu phù hợp với khu vực địa lý. Ví dụ: 1. [Chẩn đoán A] - Khả năng cao vì... 2. [Chẩn đoán B] - Cần loại trừ vì...]

## P — Kế hoạch xử trí (Plan)
[Xét nghiệm cần làm, chuyên khoa cần gặp, hướng điều trị ban đầu, theo dõi tại nhà]

## ⚠️ Dấu hiệu đỏ — Cần đến cấp cứu ngay
[Liệt kê bullet point các dấu hiệu nguy hiểm cần nhập viện cấp cứu ngay]

## 💊 Lưu ý thuốc
[Đánh giá các thuốc bệnh nhân đã tự dùng. Cảnh báo nếu có dấu hiệu lạm dụng kháng sinh, corticoid, hay thuốc không phù hợp]

## 🏥 Chuyên khoa đề xuất đặt lịch
[Ghi rõ chuyên khoa ưu tiên khám theo mã: nhi / da-lieu / sinh-san / std-sti / tieu-hoa]

---
DISCLAIMER: Đây là thông tin tham khảo từ AI, không thay thế cho việc khám và chẩn đoán trực tiếp từ bác sĩ. Vui lòng ưu tiên thăm khám trực tiếp tại cơ sở y tế phù hợp.

---
%%JSON_METADATA_START%%
{"recommended_specialties": ["<mã chuyên khoa 1>", "<mã chuyên khoa 2>"], "red_flags_present": <true|false>, "urgency": "<routine|soon|urgent>"}
%%JSON_METADATA_END%%
```

### Per-specialty Layer 1 + Layer 2 content:

#### `lib/prompts/nhi.ts`

**Layer 1:**
```
Hãy đóng vai bác sĩ chuyên khoa Nhi có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Nhi Trung ương Hà Nội và Bệnh viện Nhi Đồng 1/2 TP.HCM. Sử dụng kiến thức từ: Phác đồ điều trị Nhi khoa của Bộ Y tế Việt Nam, hướng dẫn của WHO về chăm sóc sức khỏe trẻ em, tài liệu từ Nelson Textbook of Pediatrics, và kinh nghiệm lâm sàng điều trị tại Việt Nam.
```

**Layer 2:**
```
[YẾU TỐ ĐẶC THÙ VIỆT NAM - NHI KHOA]
- Dịch tễ học: Tay Chân Miệng (EV71, Coxsackievirus A16) phổ biến tháng 3-5 và 9-11. Sốt xuất huyết Dengue lưu hành quanh năm, đỉnh mùa mưa. Viêm đường hô hấp do RSV, cúm A/B, Adenovirus thường gặp chuyển mùa. Tiêu chảy do Rotavirus phổ biến ở trẻ < 2 tuổi.
- Thói quen tự điều trị: Phụ huynh thường tự mua kháng sinh (Amoxicillin, Azithromycin) khi trẻ sốt. Lạm dụng sirô ho có Codein. Dùng hạ sốt quá liều hoặc không đúng cách. Đắp lá cây, xông hơi không đúng cách.
- Dinh dưỡng: Tình trạng suy dinh dưỡng và thấp còi ở trẻ em nông thôn. Thói quen ép ăn gây rối loạn ăn uống. Thiếu vitamin D do ít ra nắng (đặc biệt trẻ ở thành phố).
- Tiêm chủng: Chương trình TCMR quốc gia. Lưu ý vaccine viêm não Nhật Bản, viêm gan A, thủy đậu, HPV thường bị bỏ sót vì không trong TCMR bắt buộc.
```

#### `lib/prompts/da-lieu.ts`

**Layer 1:**
```
Hãy đóng vai bác sĩ chuyên khoa Da liễu có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Da liễu Trung ương Hà Nội và Bệnh viện Da liễu TP.HCM. Sử dụng kiến thức từ: Hướng dẫn điều trị của Bộ Y tế Việt Nam về Da liễu, phác đồ từ Bệnh viện Da liễu Trung ương, Fitzpatrick's Dermatology, Journal of the American Academy of Dermatology, và kinh nghiệm điều trị bệnh da nhiệt đới tại Việt Nam.
```

**Layer 2:**
```
[YẾU TỐ ĐẶC THÙ VIỆT NAM - DA LIỄU]
- Khí hậu: Nóng ẩm nhiệt đới, độ ẩm cao 70-85% tạo điều kiện thuận lợi cho nấm da (Tinea versicolor, Tinea pedis, Candida). Ô nhiễm bụi mịn PM2.5 tại Hà Nội và TP.HCM làm trầm trọng viêm da cơ địa và mụn trứng cá.
- Tác nhân đặc thù: Kiến ba khoang (Paederus) gây viêm da tiếp xúc kích ứng nghiêm trọng, phổ biến mùa mưa. Sứa, rong biển gây viêm da tiếp xúc ở vùng ven biển. Côn trùng đốt (muỗi, bọ chét) gây sẩn ngứa.
- Lạm dụng thuốc: "Kem trộn" chứa Corticoid (Betamethasone, Clobetasol) không nhãn hiệu mua online hoặc ở chợ gây teo da, giãn mạch, nám thứ phát. Tự bôi thuốc kháng nấm kéo dài. Lạm dụng retinoid không kê đơn.
- Bệnh phổ biến: Viêm da cơ địa (Atopic dermatitis) tỷ lệ cao ở trẻ em đô thị. Trứng cá (Acne) phổ biến ở thanh thiếu niên với yếu tố thức ăn nhiều dầu mỡ, cay nóng. Nấm da tỷ lệ cao do khí hậu ẩm.
```

#### `lib/prompts/sinh-san.ts`

**Layer 1:**
```
Hãy đóng vai bác sĩ chuyên khoa Sản Phụ khoa và Hỗ trợ sinh sản có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Từ Dũ TP.HCM và Bệnh viện Phụ sản Trung ương Hà Nội. Sử dụng kiến thức từ: Phác đồ điều trị Sản Phụ khoa của Bộ Y tế Việt Nam, hướng dẫn của WHO và FIGO về sức khỏe sinh sản, Williams Obstetrics, và kinh nghiệm điều trị hiếm muộn vô sinh tại Việt Nam.
```

**Layer 2:**
```
[YẾU TỐ ĐẶC THÙ VIỆT NAM - SINH SẢN & PHỤ KHOA]
- Dịch tễ học: Tỷ lệ viêm nhiễm phụ khoa (viêm âm đạo do Trichomonas, Candida, BV) cao do điều kiện vệ sinh và khí hậu ẩm. U xơ tử cung và lạc nội mạc tử cung ngày càng tăng ở phụ nữ trẻ đô thị. Tỷ lệ mang thai ngoài tử cung liên quan đến STD/STI không điều trị.
- Thói quen tự điều trị: Tự mua thuốc đặt âm đạo không kê đơn. Thụt rửa âm đạo quá mức. Dùng thảo dược (ngải cứu, lá trầu) điều trị nhiễm khuẩn. Trì hoãn điều trị viêm nhiễm do tâm lý ngại.
- Vô sinh hiếm muộn: Tỷ lệ vô sinh khoảng 7.7% cặp vợ chồng. Buồng trứng đa nang (PCOS) phổ biến. Yếu tố ống dẫn trứng do viêm nhiễm (Chlamydia, lậu). Chi phí IVF còn cao so với thu nhập trung bình.
- Thai kỳ: Thiếu máu thiếu sắt và thiếu acid folic phổ biến. Đái tháo đường thai kỳ tăng do thay đổi lối sống. Tiền sản giật/sản giật là một trong các nguyên nhân tử vong mẹ hàng đầu.
```

#### `lib/prompts/std-sti.ts`

**Layer 1:**
```
Hãy đóng vai bác sĩ chuyên khoa Da liễu - Hoa liễu và Bệnh Lây truyền qua đường tình dục có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Da liễu Trung ương và Bệnh viện Bệnh Nhiệt đới. Sử dụng kiến thức từ: Hướng dẫn điều trị STI của Bộ Y tế Việt Nam, hướng dẫn của CDC và WHO về STD, và kinh nghiệm điều trị tại Việt Nam. Lưu ý: Đây là chủ đề nhạy cảm, hãy tiếp cận không phán xét, bảo mật và tôn trọng người bệnh.
```

**Layer 2:**
```
[YẾU TỐ ĐẶC THÙ VIỆT NAM - STD/STI]
- Dịch tễ học: Lậu cầu khuẩn (Neisseria gonorrhoeae) kháng kháng sinh đang tăng. Giang mai đang có xu hướng gia tăng tại các đô thị lớn. Chlamydia là STI phổ biến nhất nhưng thường không triệu chứng. HIV/AIDS: Việt Nam kiểm soát tốt hơn nhưng vẫn lưu hành trong nhóm nguy cơ cao. HPV và ung thư cổ tử cung vẫn là gánh nặng lớn.
- Rào cản tiếp cận: Kỳ thị xã hội cao, người bệnh thường trì hoãn đến khám. Tự điều trị bằng kháng sinh mua tự do gây kháng thuốc. Thiếu hiểu biết về PrEP (dự phòng trước phơi nhiễm HIV) và PEP (sau phơi nhiễm).
- Xét nghiệm: Xét nghiệm HIV tại nhà (Self-test) ngày càng phổ biến. Dịch vụ xét nghiệm STI ẩn danh có sẵn tại các trung tâm y tế lớn. Thời gian cửa sổ (window period) cần giải thích rõ cho người bệnh.
- Đặc biệt lưu ý bảo mật: Không tiết lộ thông tin, đề xuất đối tác cùng xét nghiệm, tư vấn thông báo cho bạn tình một cách khéo léo.
```

#### `lib/prompts/tieu-hoa.ts`

**Layer 1:**
```
Hãy đóng vai bác sĩ chuyên khoa Tiêu hóa có 20 năm kinh nghiệm tại Việt Nam, từng công tác tại Bệnh viện Đại học Y Dược TP.HCM và Bệnh viện Bạch Mai Hà Nội. Sử dụng kiến thức từ: Phác đồ điều trị Tiêu hóa của Bộ Y tế Việt Nam, hướng dẫn của ACG (American College of Gastroenterology), BSG (British Society of Gastroenterology), và kinh nghiệm điều trị bệnh tiêu hóa tại Việt Nam.
```

**Layer 2:**
```
[YẾU TỐ ĐẶC THÙ VIỆT NAM - TIÊU HÓA]
- Dịch tễ học: Helicobacter pylori nhiễm ở khoảng 70% người Việt Nam. Ung thư dạ dày và ung thư gan (do HBV) có tỷ lệ cao. Viêm gan B mạn tính phổ biến. Nhiễm ký sinh trùng đường tiêu hóa (Giardia, Entamoeba) vẫn gặp ở vùng nông thôn và người có thói quen ăn uống kém vệ sinh.
- Chế độ ăn: Thực phẩm đường phố (vỉa hè) nguy cơ nhiễm khuẩn (Salmonella, E.coli). Tiêu thụ nhiều rau sống, gỏi, đồ tái sống (thịt, cá). Rượu bia tiêu thụ cao trong nam giới Việt Nam gây viêm gan, xơ gan. Gia vị cay nóng (ớt) liên quan đến GERD và IBS.
- Tự điều trị: Tự mua thuốc dạ dày (Omeprazole, Maalox) uống dài hạn không có chỉ định. Dùng thuốc cầm tiêu chảy sớm (Loperamide) kể cả khi tiêu chảy nhiễm khuẩn. Lạm dụng kháng sinh đường ruột.
- Bệnh phổ biến: Viêm loét dạ dày tá tràng liên quan H.pylori. Hội chứng ruột kích thích (IBS) tăng mạnh do stress đô thị. Trĩ phổ biến do chế độ ăn ít chất xơ và ngồi nhiều.
```

### Prompt router `lib/prompts/index.ts`:
```typescript
import { FormData } from '../types';
import { buildNhiPrompt } from './nhi';
import { buildDaLieuPrompt } from './da-lieu';
import { buildSinhSanPrompt } from './sinh-san';
import { buildStdStiPrompt } from './std-sti';
import { buildTieuHoaPrompt } from './tieu-hoa';

export function buildPrompt(specialty: string, formData: FormData): string {
  switch (specialty) {
    case 'nhi': return buildNhiPrompt(formData);
    case 'da-lieu': return buildDaLieuPrompt(formData);
    case 'sinh-san': return buildSinhSanPrompt(formData);
    case 'std-sti': return buildStdStiPrompt(formData);
    case 'tieu-hoa': return buildTieuHoaPrompt(formData);
    default: throw new Error(`Unknown specialty: ${specialty}`);
  }
}
```

Each prompt file (`nhi.ts`, etc.) exports a function `buildXxxPrompt(formData: FormData): string` that assembles Layer 1 + Layer 2 + patient data from formData (Layer 3) + Layer 4 into a single string.

**Deliverable:** All prompt files compile with `tsc --noEmit`. `buildPrompt('nhi', sampleData)` returns a non-empty string.

---

## TASK 4 — Homepage (Specialty Selector)

**Goal:** Build the specialty selector at `app/page.tsx`.

### Requirements:
- Vietnamese language throughout
- Title: "Hệ thống Tư vấn Y tế" with subtitle "Chọn chuyên khoa để bắt đầu tư vấn"
- 5 `SpecialtyCard` components laid out in a responsive grid (2 columns mobile, 3 columns desktop)
- Each card shows: icon (large, emoji), specialty label, description, and an arrow indicator
- Clicking a card navigates to `/consult/[specialty-id]`
- Clean, professional design. Use Tailwind utility classes. White background, subtle card shadows, colored accents per specialty (use the `color` field from `specialties.json`)
- Footer: "Dành cho nhân viên nội bộ. Thông tin tư vấn chỉ mang tính tham khảo."

**Deliverable:** Homepage renders correctly at `http://localhost:3000`

---

## TASK 5 — Consult Form

**Goal:** Build the form at `app/consult/[specialty]/page.tsx` using `components/ConsultForm.tsx`.

### Page structure:
1. Breadcrumb: Trang chủ > [Specialty Label]
2. Page title: "[Specialty Label] — Phiếu Thông Tin Bệnh Nhân"
3. The form
4. Submit button: "Phân tích & Tư vấn"
5. After submission: show `AnalysisResult` and `PartnerCard` list below the form

### Form fields — Common (show for ALL specialties):

| Vietnamese Label | Field ID | Type | Required | Options |
|---|---|---|---|---|
| Họ tên bệnh nhân | hoTen | text | yes | |
| Tuổi | tuoi | number | yes | |
| Giới tính | gioiTinh | select | yes | Nam / Nữ / Khác |
| Khu vực sinh sống | khuVuc | select | yes | Hà Nội / TP.HCM / Đà Nẵng / Cần Thơ / Tỉnh khác |
| Triệu chứng chính | trieuChungChinh | textarea | yes | placeholder: "Mô tả chi tiết triệu chứng..." |
| Thời gian khởi phát | thoiGianKhoiPhat | select | yes | Hôm nay / 2-3 ngày / 1 tuần / 2-4 tuần / Hơn 1 tháng |
| Thuốc đã dùng | thuocDaDung | textarea | no | placeholder: "Liệt kê thuốc đã tự dùng (nếu có)..." |

### Specialty-specific fields (add AFTER common fields based on specialty):

**Nhi khoa:**

| Label | Field | Type | Required | Notes |
|---|---|---|---|---|
| Cân nặng của trẻ (kg) | canNang | number | yes | |
| Chế độ ăn | cheDoDan | select | yes | Bú mẹ hoàn toàn / Bú mẹ + ăn dặm / Ăn dặm / Ăn cơm bình thường |
| Tiền sử tiêm chủng | tienSuTiemChung | textarea | no | placeholder: "Đã tiêm đủ theo lịch TCMR? Còn thiếu mũi nào?" |
| Có đi nhà trẻ/mẫu giáo không? | diNhaTre | select | no | Có / Không |

**Da liễu:**

| Label | Field | Type | Required | Notes |
|---|---|---|---|---|
| Vị trí tổn thương trên cơ thể | viTriTonThuong | text | yes | placeholder: "Ví dụ: mặt, cánh tay, lưng..." |
| Hình thái tổn thương | hinhThaiTonThuong | checkbox-group | yes | Options: Mẩn đỏ / Mụn nước / Vảy / Ngứa / Đau rát / Loét / Thay đổi màu da / Khác |
| Tiền sử dị ứng | tienSuDiUng | textarea | no | placeholder: "Dị ứng thuốc, thức ăn, hóa mỹ phẩm..." |
| Đã dùng kem bôi nào chưa? | dungKemBoi | textarea | no | placeholder: "Tên kem bôi, thời gian dùng..." |

**Sinh sản:**

| Label | Field | Type | Required | Notes |
|---|---|---|---|---|
| Chu kỳ kinh nguyệt | chuKyKinh | select | no | Đều (28-30 ngày) / Không đều / Vô kinh / Không áp dụng (nam/chưa dậy thì) |
| Tiền sử Sản Phụ khoa | tienSuSanPhuKhoa | textarea | no | placeholder: "Số lần sinh, sảy thai, phẫu thuật phụ khoa..." |
| Tình trạng hôn nhân | tinhTrangHonNhan | select | no | Độc thân / Đã kết hôn / Đang tìm kiếm hỗ trợ sinh sản |
| Mục tiêu khám | mucTieuKham | select | yes | Thai sản / Khám phụ khoa định kỳ / Điều trị vô sinh - hiếm muộn / Tư vấn kế hoạch hóa gia đình / Khác |

**STD/STI:**

| Label | Field | Type | Required | Notes |
|---|---|---|---|---|
| Đã có quan hệ tình dục gần đây? | quanHeTinhDuc | select | yes | Có / Không / Không muốn cung cấp |
| Triệu chứng cụ thể | trieuChungCuThe | checkbox-group | yes | Options: Tiết dịch bất thường / Đau/rát khi tiểu / Loét/mụn bộ phận sinh dục / Ngứa / Phát ban / Hạch bẹn sưng / Không có triệu chứng (tầm soát) / Khác |
| Xét nghiệm STI gần nhất | xetNghiemGanNhat | textarea | no | placeholder: "Đã xét nghiệm gì? Khi nào? Kết quả?" |

**Tiêu hoá:**

| Label | Field | Type | Required | Notes |
|---|---|---|---|---|
| Vị trí đau/khó chịu | viTriDauBung | select | yes | Thượng vị (vùng dạ dày) / Quanh rốn / Hạ vị (dưới rốn) / Hố chậu phải / Hố chậu trái / Lan toả toàn bụng / Không đau bụng |
| Tính chất phân | tinhChatPhan | checkbox-group | no | Options: Phân bình thường / Tiêu chảy / Táo bón / Phân có máu / Phân đen / Phân nhầy / Phân màu bất thường |
| Chế độ ăn uống | cheDoDanUong | textarea | no | placeholder: "Thói quen ăn uống, thực phẩm gần đây..." |
| Tiền sử bệnh tiêu hóa | tienSuTieuHoa | textarea | no | placeholder: "Đau dạ dày, viêm đại tràng, phẫu thuật bụng..." |

### Form validation:
- Required fields must be filled before submit
- Show inline error messages in Vietnamese
- Disable submit button while loading

### On form submit:
1. Show `LoadingSpinner` with message "Đang phân tích dữ liệu lâm sàng..."
2. POST to `/api/analyze` with `{ specialty, formData }`
3. On success: render `AnalysisResult` then scroll to it
4. On error: show Vietnamese error message "Có lỗi xảy ra. Vui lòng thử lại."

**Deliverable:** All 5 specialty forms render and validate correctly.

---

## TASK 6 — API Route: Analyze

**Goal:** Build `app/api/analyze/route.ts`.

### Request:
```typescript
POST /api/analyze
Body: { specialty: string, formData: FormData }
```

### Logic:
1. Validate specialty is one of the 5 valid values
2. Call `buildPrompt(specialty, formData)` from `lib/prompts/index.ts`
3. Call OpenAI API:
   ```typescript
   model: 'gpt-4o'
   messages: [{ role: 'user', content: prompt }]
   max_tokens: 2000
   temperature: 0.3
   ```
4. Parse the response:
   - Split on `%%JSON_METADATA_START%%` to separate display content from metadata JSON
   - Parse the JSON metadata block
   - Generate a `sessionId` (UUID or timestamp-based)
5. Return:
   ```typescript
   {
     displayContent: string,       // Everything before the metadata block
     recommendedSpecialties: string[],  // From parsed JSON
     redFlags: boolean,            // From parsed JSON
     urgency: string,              // From parsed JSON
     sessionId: string
   }
   ```

### Build `components/AnalysisResult.tsx`:
- Receives `AnalysisResult` as props
- Renders the `displayContent` as formatted markdown-like HTML
- Parse section headers (`## S —`, `## O —`, etc.) and render as styled `<h3>` tags
- Red flags section: render with red background/border
- Medication warnings: render with amber background/border
- Recommended specialty section: render with blue/teal highlight
- Show a "⚠️ Lưu ý" disclaimer box at the bottom

**Deliverable:** Submitting the Nhi form returns a formatted analysis result on screen.

---

## TASK 7 — Partner Cards

**Goal:** Build `lib/partners.ts` and `components/PartnerCard.tsx`.

### `lib/partners.ts`:
```typescript
// loadPartners(): load data/partners.json
// filterPartners(specialties: string[], city: string): Partner[]
//   - Match partners where partner.specialties overlaps with input specialties
//   - If city matches partner.city or partner branches include city, prioritize those
//   - Partners with empty specialties array are excluded
//   - Return sorted: city-matched first, then others
```

### `components/PartnerCard.tsx`:
Each card shows:
- Partner name (bold, large)
- City and address
- Phone number (clickable `tel:` link)
- Website link (external, new tab)
- List of services relevant to the recommended specialty (if any in `services` array)
- If `services` is empty: show "Liên hệ trực tiếp để biết dịch vụ và gói khám"
- "Đặt lịch ngay →" button (teal/green) that opens `BookingModal`

### On the consult page, after analysis result:
- Show section header: "🏥 Đối tác đề xuất"
- Render filtered `PartnerCard` list (max 5 cards)
- If no matching partners: show "Hiện chưa có đối tác trong khu vực này. Vui lòng liên hệ trực tiếp."

**Deliverable:** After a successful analysis, relevant partner cards appear below the result.

---

## TASK 8 — Booking Flow

**Goal:** Build `components/BookingModal.tsx` and `app/api/booking/route.ts`.

### `components/BookingModal.tsx`:

A modal overlay with a form:

| Label | Field | Type | Pre-filled from | Required |
|---|---|---|---|---|
| Họ tên bệnh nhân | patientName | text | formData.hoTen | yes |
| Số điện thoại | phone | tel | — | yes |
| Tóm tắt tình trạng | conditionSummary | textarea | formData.trieuChungChinh | yes |
| Dịch vụ / Gói khám | serviceName | text | selected service name | yes |
| Đơn vị đối tác | partnerName | text (readonly) | partner.name | yes |
| Chi nhánh / Địa điểm | branchId | select | partner branches | yes |
| Ngày mong muốn | preferredDate | date | — | yes |
| Giờ mong muốn | preferredTime | select | — | yes (7:00-11:30 / 13:00-16:30 / 17:00-19:00) |
| Ghi chú thêm | notes | textarea | — | no |

On submit:
1. POST to `/api/booking`
2. Show success message: "✅ Đặt lịch thành công! Đối tác sẽ liên hệ xác nhận trong vòng 24 giờ."
3. Close modal after 3 seconds

### `app/api/booking/route.ts`:

**Step 1 — Write to Google Sheet:**
```typescript
// Using googleapis library
// Append a row to the sheet with these columns (in order):
// Timestamp | Session ID | Patient Name | Phone | Condition Summary
// Service Name | Partner Name | Branch/Address | Preferred Date
// Preferred Time | Notes
```

**Step 2 — Send email to partner:**
```typescript
// Using nodemailer with Gmail SMTP
// To: partner.booking_email (if empty, log warning and skip email)
// Subject: `[Đặt lịch mới] ${serviceName} - ${patientName} - ${preferredDate}`
// Body: formatted HTML email in Vietnamese with all booking details
```

### `lib/sheets.ts`:
```typescript
// Initialize Google Sheets client using service account credentials from env vars
// export async function appendBookingRow(payload: BookingPayload): Promise<void>
```

### `lib/mailer.ts`:
```typescript
// Initialize nodemailer transporter using Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD)
// export async function sendBookingEmail(partnerEmail: string, payload: BookingPayload): Promise<void>
```

**Deliverable:** Submitting a booking writes a row to Google Sheets AND sends an email to the configured partner email.

---

## TASK 9 — Integration Test

**Goal:** End-to-end test of the complete flow using Nhi khoa specialty.

### Test case:
1. Navigate to `http://localhost:3000`
2. Click "Nhi khoa"
3. Fill form: Tuổi=13 tháng, Cân nặng=8kg, Giới tính=Nam, Khu vực=TP.HCM, Triệu chứng=Phân màu vàng xanh nhão 3 ngày, Chế độ ăn=Ăn dặm, Tiêm chủng=Thiếu viêm gan A
4. Submit
5. Verify: AI analysis appears with SOAP sections, red flags, medication warnings
6. Verify: Partner cards appear (should show pediatric partners in TP.HCM)
7. Click "Đặt lịch ngay" on one partner
8. Fill booking form with test phone number
9. Submit
10. Verify: Success message appears

### Fix any integration bugs found during this test.

**Also test error cases:**
- Submit form with missing required fields → inline validation errors appear
- OpenAI API timeout → graceful error message in Vietnamese
- Google Sheets write failure → booking endpoint returns 500 with Vietnamese error

**Deliverable:** Complete flow works end-to-end with no console errors.

---

## TASK 10 — Vercel Deployment

**Goal:** Deploy to Vercel and verify production works.

### Steps:
```bash
# 1. Initialize git
git init
git add .
git commit -m "Initial commit: Healthcare consultant app"

# 2. Install Vercel CLI
npm install -g vercel

# 3. Deploy
vercel

# Follow prompts:
# - Link to Vercel account
# - Project name: healthcare-consultant
# - Framework: Next.js (auto-detected)
# - Build command: next build (default)
# - Output directory: .next (default)
```

### Environment variables to set in Vercel dashboard:
Set all 6 env vars from `.env.local` in Vercel project settings → Environment Variables.

### Post-deployment checks:
1. Homepage loads at the Vercel URL
2. All 5 specialty cards are clickable
3. Submit one test form and verify AI response appears
4. Verify the Vercel URL works (not localhost)
5. Check Vercel build logs for any warnings

### `README.md` to create:
```markdown
# Healthcare Consultant Web App

Internal tool for healthcare consultants to generate AI-powered clinical analysis and book partner clinic appointments.

## Setup

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in values
3. `npm install`
4. `npm run dev`

## Updating Partner Data

Run the crawl script to refresh service data from partner websites:
\`\`\`
npx ts-node scripts/crawl-partners.ts
\`\`\`
Review `scripts/crawl-report.txt` after running.

## Environment Variables

| Variable | Description |
|---|---|
| OPENAI_API_KEY | OpenAI API key (required) |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | Google service account email |
| GOOGLE_PRIVATE_KEY | Google service account private key |
| GOOGLE_SHEET_ID | Google Sheet ID for bookings |
| GMAIL_USER | Gmail address for sending booking emails |
| GMAIL_APP_PASSWORD | Gmail App Password (not regular password) |

## Specialties

- Nhi khoa (Pediatrics)
- Da liễu (Dermatology)
- Sinh sản (Reproductive health)
- STD/STI
- Tiêu hoá (Gastroenterology)
```

**Deliverable:** App is live on Vercel URL, all features work in production.

---

## Notes for Claude Code

### Do not:
- Add authentication/login screens
- Add a database — use Google Sheets only
- Use streaming for OpenAI responses — wait for full response
- Add extra specialty pages beyond the 5 listed
- Use any paid third-party services

### Do:
- Keep all UI text in Vietnamese
- Handle all errors gracefully with Vietnamese error messages
- Make the app mobile-responsive (consultants may use tablets)
- Use `async/await` throughout, not `.then()` chains
- Keep the `data/partners.json` file as the single source of truth for partner data

### Google Sheets setup instructions (for user, not for Claude Code to do):
1. Create a new Google Sheet
2. Name the first sheet "Bookings"
3. Add headers in row 1: Timestamp | Session ID | Tên bệnh nhân | SĐT | Tóm tắt tình trạng | Dịch vụ | Đối tác | Chi nhánh | Ngày mong muốn | Giờ mong muốn | Ghi chú
4. Go to Google Cloud Console → Create Service Account → Download JSON key
5. Share the Google Sheet with the service account email (Editor role)
6. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY from the JSON key
7. Set GOOGLE_SHEET_ID from the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
