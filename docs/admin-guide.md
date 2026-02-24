# Huong dan su dung — Trang Quan tri (Admin Portal)

## Truy cap

1. Truy cap `/admin` tren trinh duyet
2. Nhap **Admin Secret** (cung cap boi quan tri he thong)
3. Sau khi xac thuc, ban se thay sidebar dieu huong ben trai

## Tong quan giao dien

Sidebar gom 9 muc:

| Muc | Duong dan | Mo ta |
|-----|-----------|-------|
| Tong quan | `/admin` | Dashboard thong ke tong hop |
| Dat lich | `/admin/bookings` | Quan ly tat ca dat lich |
| Doi tac | `/admin/partners` | Quan ly doi tac, hop dong, chi nhanh, dich vu |
| Hoa hong | `/admin/commissions` | Tong hop va theo doi hoa hong doi tac |
| Chap thuan | `/admin/consents` | Xem ban ghi chap thuan cua benh nhan |
| Xoa du lieu | `/admin/delete` | Xoa du lieu benh nhan (crypto-shredding) |
| Nhan vien | `/admin/staff` | Quan ly tai khoan nhan vien CS/Bac si |
| Nhat ky | `/admin/audit` | Nhat ky kiem tra moi hanh dong |
| Cau hinh bieu mau | `/admin/form-config` | Tuy chinh truong nhap lieu theo chuyen khoa |

---

## 1. Tong quan (Dashboard)

Hien thi 4 so lieu chinh:
- **Tong dat lich** — Tong so booking trong he thong
- **Cho xu ly** — So booking dang o trang thai `pending`
- **Da xac nhan** — So booking da duoc doi tac xac nhan
- **Da hoan thanh** — So booking da hoan tat

Phia duoi la danh sach **10 dat lich gan nhat** voi thong tin co ban.

---

## 2. Quan ly Dat lich

### Xem danh sach
- Loc theo trang thai: Tat ca / Cho xu ly / Da xac nhan / Da huy / Da hoan thanh
- Tim kiem theo ma dat lich (VD: `HHG-VIN-4567-A1`)
- Phan trang 20 ban ghi moi trang

### Cap nhat trang thai
- Chon trang thai moi tu dropdown trong cot "Trang thai"
- He thong se hien **hop thoai xac nhan** truoc khi thuc hien:
  - "Xac nhan dat lich {ma}?" (primary)
  - "Hoan thanh dat lich {ma}?" (primary)
  - "Huy dat lich {ma}?" (danger — mau do)
- Moi thay doi trang thai deu duoc ghi vao nhat ky kiem tra

### Xem thong tin benh nhan (PII)
- Nhan nut **"Xem"** trong cot Chi tiet
- **Lan dau trong phien:** He thong se hien modal **Cam ket bao mat du lieu y te**
  - Ban phai tick checkbox dong y 3 dieu kien:
    1. Chi su dung de quan ly dat lich
    2. Khong sao chep/chia se/chup man hinh du lieu benh nhan
    3. Bao cao ngay neu phat hien truy cap trai phep
  - Xac nhan se duoc ghi vao audit log
- **Cac lan sau trong cung phien:** Khong can xac nhan lai

### Cot hien thi
| Cot | Mo ta |
|-----|-------|
| Ma | Ma dat lich (VD: HHG-VIN-4567-A1) |
| Dich vu | Ten dich vu kham |
| Doi tac | Ten doi tac y te |
| Ngay | Ngay kham mong muon |
| Gio | Khung gio mong muon |
| Nguoi tao | Ten nhan vien tao booking |
| Trang thai | Trang thai hien tai + dropdown thay doi |
| Chi tiet | Nut xem thong tin benh nhan |

---

## 3. Quan ly Doi tac

### Danh sach doi tac
- Loc theo loai (benh vien, phong kham, xet nghiem, nha thuoc)
- Loc theo thanh pho, trang thai hop dong, trang thai hoat dong
- Tim kiem theo ten hoac ID doi tac
- Phan trang 20 doi tac moi trang

### Tao doi tac moi
1. Nhan **"+ Them doi tac"**
2. Nhap **ID** (duy nhat, khong trung, VD: `benh-vien-abc`)
3. Nhap **Ten**, chon **Loai**, nhap **Thanh pho** va **Quan/Huyen**
4. Nhan "Tao doi tac"

### Chi tiet doi tac (5 tab)

Nhan vao dong doi tac bat ky de mo panel chi tiet phia duoi bang.

#### Tab Thong tin
Chinh sua: ten, loai, website, email dat lich, dien thoai, thanh pho, quan/huyen, dia chi, chuyen khoa, ghi chu.
- Chinh sua truc tiep tren form
- Nhan **"Luu thong tin"** khi co thay doi

#### Tab Hop dong
Quan ly vong doi hop dong doi tac:
- **Trang thai hop dong**: Hoat dong / Het han / Ngung / Cho ky
- **Ngay bat dau / ket thuc**: He thong tu dong chuyen sang "Het han" khi qua ngay ket thuc (qua cron hang ngay)
- **Ty le hoa hong (%)**: VD: 10.0 = 10%
- **Ghi chu hop dong**

**Luu y:** Doi tac co trang thai hop dong khac "Hoat dong" se **khong hien thi** tren trang tim doi tac cong khai.

#### Tab Chi nhanh
- Xem danh sach chi nhanh hien tai
- **Them chi nhanh:** Nhan "+ Them", nhap thanh pho + dia chi (bat buoc), ten + quan/huyen + dien thoai (tuy chon)
- **Xoa chi nhanh:** Nhan "Xoa", xac nhan trong hop thoai

#### Tab Dich vu
- Xem danh sach dich vu hien tai
- **Them dich vu:** Nhan "+ Them", nhap ten + chuyen khoa (bat buoc), mo ta + gia + thoi gian (tuy chon)
- **Xoa dich vu:** Nhan "Xoa", xac nhan trong hop thoai

#### Tab Portal
Quan ly quyen truy cap portal cua doi tac:
- Hien thi trang thai: "Co" hoac "Chua thiet lap"
- **Thiet lap/Dat lai mat khau:** Nhap mat khau moi, nhan "Luu"
- **Xoa quyen truy cap:** Nhan "Xoa quyen truy cap portal" (xoa mat khau)

### Bat/tat trang thai hoat dong
- Nhan nut **On/Off** trong cot Active cua bang danh sach
- Doi tac bi tat (Off) se khong hien thi tren trang cong khai va khong the dang nhap portal

---

## 4. Hoa hong Doi tac

### Tong hop hoa hong hang thang
1. Nhan **"Tong hop thang"** o goc tren phai
2. Chon **Thang** va **Nam**
3. (Tuy chon) Nhap **ID doi tac** de chi tong hop cho 1 doi tac cu the
4. Nhan **"Tao bao cao"**

He thong se:
- Tim tat ca doi tac co ty le hoa hong > 0% va hop dong dang hoat dong
- Dem so booking hoan thanh (status = completed) trong thang do
- Tao bao cao hoa hong (CommissionStatement) o trang thai **Nhap**

### Quy trinh xu ly bao cao

| Buoc | Trang thai | Hanh dong |
|------|-----------|-----------|
| 1 | Nhap (Draft) | Nhap doanh thu → Nhan "Nhap DT", nhap so, nhan OK |
| 2 | Nhap (Draft) | Xac nhan → Nhan "Xac nhan", xac nhan trong hop thoai |
| 3 | Da xac nhan | Doi tac co the thay bao cao tren portal |
| 4 | Da xac nhan | Danh dau da thanh toan → Nhan "Da thanh toan" |
| 5 | Da thanh toan | Ket thuc — chi xem |

**Luu y:** So tien hoa hong = Doanh thu × Ty le hoa hong (%). Doanh thu phai duoc nhap thu cong vi gia dich vu la text (VD: "50,000 - 100,000 VND"), khong phai so.

### Loc bao cao
- Loc theo thang, nam, trang thai (Nhap / Da xac nhan / Da thanh toan)
- Loc theo ID doi tac
- Phan trang 20 bao cao moi trang

---

## 5. Quan ly Nhan vien

### Danh sach nhan vien
Hien thi tat ca tai khoan nhan vien voi:
- Ten dang nhap
- Vai tro (CS / Bac si / Admin)
- Trang thai (Hoat dong / Vo hieu hoa)
- Ngay tao

### Tao tai khoan moi
1. Nhap **Ten dang nhap** (duy nhat, khong trung)
2. Chon **Vai tro**: CS, Bac si, hoac Admin
3. Nhap **Mat khau** (toi thieu 6 ky tu)
4. Nhan "Tao nhan vien"

### Vo hieu hoa tai khoan
- Nhan nut **"Vo hieu hoa"** ben canh ten nhan vien
- Nhan vien bi vo hieu hoa se khong the dang nhap
- Co the kich hoat lai bat ky luc nao

### Dat lai mat khau
- Nhan nut **"Dat lai MK"**
- Nhap mat khau moi trong modal
- Nhan xac nhan

---

## 6. Ban ghi Chap thuan

Xem danh sach tat ca ban ghi consent da duoc ghi nhan:
- **Ma** — ID cua ban ghi
- **Phone Hash** — Hash cua so dien thoai (khong hien so that)
- **Phien ban** — Phien ban dieu khoan consent
- **Ngay tao** — Thoi diem benh nhan dong y

---

## 7. Nhat ky Kiem tra (Audit Logs)

Ghi lai **moi hanh dong** trong he thong:

| Cot | Mo ta |
|-----|-------|
| Thoi gian | Timestamp cua hanh dong |
| Tac nhan | Ai thuc hien (ten nhan vien, partner, hoac system) |
| Hanh dong | Loai hanh dong (VD: consent_given, booking_status_changed, pii_revealed) |
| Ma dat lich | Booking lien quan (neu co) |
| Du lieu | Metadata bo sung (JSON) |
| IP | Dia chi IP cua nguoi thuc hien |

### Loc
- Loc theo **hanh dong** (dropdown)
- Loc theo **tac nhan** (text search)
- Phan trang 50 ban ghi moi trang

### Cac hanh dong duoc ghi nhan
- `consent_given` — Benh nhan dong y chia se du lieu
- `patient_consent_accepted` — Benh nhan dong y qua QR code
- `pii_revealed` — Xem thong tin benh nhan
- `pii_consent_acknowledged` — Dong y cam ket bao mat PII
- `pii_deletion_completed` — Hoan tat xoa du lieu benh nhan
- `booking_status_changed` — Thay doi trang thai dat lich
- `staff_login` — Nhan vien dang nhap
- `partner_login` — Doi tac dang nhap
- `patient_data_deleted` — Xoa du lieu benh nhan
- `partner_created` — Tao doi tac moi
- `partner_updated` — Cap nhat thong tin doi tac
- `partner_password_reset` — Dat lai mat khau portal doi tac
- `commission_consolidated` — Tong hop hoa hong hang thang
- `commission_updated` — Cap nhat bao cao hoa hong

---

## 8. Cau hinh Bieu mau

Tuy chinh cac truong nhap lieu cua form tu van theo tung chuyen khoa.

### Cac tab chuyen khoa
- Chung (common fields)
- Nhi khoa
- Da lieu
- Sinh san
- STD/STI
- Tieu hoa
- Tim mach
- Co Xuong Khop
- Tai Mui Hong
- Mat
- Nam khoa
- Tiem chung
- Xet nghiem

### Chinh sua truong
Moi truong co cac thuoc tinh:
- **Label** — Nhan hien thi
- **Type** — Loai truong (text, number, select, textarea, checkbox-group)
- **Required** — Bat buoc hay khong
- **Options** — Cac lua chon (cho select va checkbox-group)
- **Placeholder** — Van ban goi y

### Luu cau hinh
- Nhan **"Luu cau hinh"** sau khi chinh sua
- Thay doi se ap dung ngay cho form tu van

---

## 9. Xoa Du lieu Benh nhan

Thuc hien yeu cau xoa du lieu (tuong tu GDPR right to erasure):

1. Nhap **so dien thoai** cua benh nhan can xoa
2. He thong se:
   - Tim tat ca booking lien quan (theo phone hash)
   - Xoa encryption key (crypto-shredding)
   - Danh dau booking la `isDeleted`
   - Tao ban ghi DeletionRequest
   - Ghi audit log

**Luu y:** Sau khi xoa, du lieu benh nhan **khong the khoi phuc** vi encryption key da bi huy.

---

## 10. Theo doi Chi phi AI (LLM Budget)

He thong tu dong theo doi chi phi su dung AI (OpenAI GPT-4o) cho chuc nang phan tich tu van.

### Cau hinh ngan sach
- Ngan sach hang thang duoc cau hinh qua bien moi truong `LLM_MONTHLY_BUDGET_USD`
- Gia tri mac dinh: **$200/thang**

### Nguong canh bao
- **Soft cap 80%**: Khi chi phi dat 80% ngan sach, he thong hien thi **canh bao** tren giao dien quan tri de thong bao sap dat gioi han
- **Hard cap 95%**: Khi chi phi dat 95% ngan sach, he thong **tam ngung chuc nang phan tich AI** de tranh vuot ngan sach

### Tu dong reset
- Budget duoc tu dong reset ve 0 vao **dau moi thang** (ngay 1 hang thang)

### Xem thong ke su dung
- Truy cap trang **Tong quan** (Dashboard) de xem usage stats hien tai
- Thong tin hien thi bao gom: chi phi da su dung, phan tram ngan sach, so luot goi API trong thang
