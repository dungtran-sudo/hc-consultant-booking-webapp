# Huong dan su dung — Nhan vien Tu van (CS/Bac si)

## Tong quan

Nhan vien tu van (CS) va bac si su dung he thong de:
1. Nhap thong tin benh nhan
2. Nhan phan tich AI theo chuyen khoa
3. Tao dat lich voi doi tac y te
4. Lay chap thuan benh nhan qua ma QR

**Dia chi he thong:** https://hhg-booking.vercel.app

---

## Dang nhap

1. Truy cap `/staff/login`
2. Nhap **ten dang nhap** va **mat khau** (do admin cung cap)
3. Nhan "Dang nhap"

Sau khi dang nhap, ban se thay **badge ten nhan vien** o goc tren cua trang tu van.

> Tai khoan nhan vien duoc quan ly boi admin tai `/admin/staff`.

---

## Bao mat Phien dang nhap

- Phien dang nhap co hieu luc **24 gio**
- Sau 24 gio, ban se phai dang nhap lai
- He thong tu dong chuyen ve trang dang nhap khi phien het han

---

## Quy trinh Tu van

### Buoc 1: Chon chuyen khoa

Tai trang chu (`/`), chon 1 trong 12 chuyen khoa:

| Chuyen khoa | Mo ta |
|-------------|-------|
| Nhi khoa | Suc khoe tre em tu so sinh den 15 tuoi |
| Da lieu | Benh ly ve da, toc, mong |
| Sinh san | San phu khoa, ho tro sinh san, IVF |
| STD/STI | Benh lay truyen qua duong tinh duc |
| Tieu hoa | Benh ly duong tieu hoa, gan mat |
| Tim mach | Benh ly tim mach, tang huyet ap, mach vanh |
| Co Xuong Khop | Thoai hoa khop, gout, loang xuong, dau lung |
| Tai Mui Hong | Viem mui xoang, viem amidan, u tai |
| Mat | Can thi, duc thuy tinh the, glaucoma |
| Nam khoa | Tiet nieu nam, roi loan cuong, tien liet tuyen |
| Tiem chung | Tu van lich tiem chung, vaccine bo sung, tiem phong du lich |
| Xet nghiem | Tu van xet nghiem tam soat, goi kham suc khoe, doc ket qua |

### Buoc 2: Dien phieu thong tin

Form gom 2 phan:

**Thong tin chung (tat ca chuyen khoa):**
- Ho ten benh nhan
- Tuoi
- Gioi tinh
- Khu vuc sinh song
- Trieu chung chinh (mo ta chi tiet)
- Thoi gian khoi phat
- Thuoc da dung (neu co)

**Thong tin chuyen khoa** (khac nhau tuy chuyen khoa):
- Nhi: Can nang, che do dan, tien su tiem chung, di nha tre
- Da lieu: Vi tri ton thuong, hinh thai, tien su di ung, kem boi da dung
- Sinh san: Chu ky kinh, tien su san phu khoa, muc tieu kham
- STD/STI: Quan he tinh duc, trieu chung cu the, xet nghiem gan nhat
- Tieu hoa: Vi tri dau, tinh chat phan, che do an, tien su tieu hoa
- Tim mach: Huyet ap, tien su tim mach, yeu to nguy co, tien su gia dinh
- Co Xuong Khop: Vi tri dau, tinh chat dau, nghe nghiep, tien su chan thuong
- Tai Mui Hong: Vung bi anh huong, tien su di ung, hut thuoc la, tiep xuc tieng on
- Mat: Mat bi anh huong, deo kinh, tien su benh mat, benh nen
- Nam khoa: Nhom trieu chung, tien su nam khoa, thuoc la/ruou bia, benh nen
- Tiem chung: Doi tuong tiem, tuoi thang, muc dich tiem, tien su tiem chung, di ung vaccine, dang mang thai
- Xet nghiem: Muc dich xet nghiem, nhom xet nghiem, tien su benh ly, dang dung thuoc, da an sang

### Buoc 3: Phan tich AI

Nhan **"Phan tich & Tu van"** de gui du lieu.

He thong se tra ve ket qua phan tich theo format SOAP:
- **S (Subjective)** — Trieu chung chu quan
- **O (Objective)** — Quan sat lam sang
- **A (Assessment)** — Danh gia chan doan
- **P (Plan)** — Ke hoach xu tri
- **Dau hieu do** — Tinh huong can cap cuu
- **Luu y thuoc** — Danh gia thuoc da dung
- **Chuyen khoa de xuat** — Chuyen khoa nen kham

### Buoc 4: Chon doi tac

Phia duoi ket qua phan tich, he thong goi y cac **doi tac y te phu hop**:
- Uu tien doi tac cung khu vuc voi benh nhan
- Hien thi dich vu, dia chi, so dien thoai
- Nhan **"Dat lich ngay"** de mo form dat lich

---

## Tao Dat lich voi QR Consent

### Buoc 1: Dien form dat lich

| Truong | Mo ta |
|--------|-------|
| Ho ten benh nhan | Tu dong dien tu form tu van |
| So dien thoai | Nhap so dien thoai benh nhan |
| Tom tat tinh trang | Tu dong dien tu trieu chung chinh |
| Dich vu / Goi kham | Ten dich vu can dat |
| Don vi doi tac | Tu dong dien tu doi tac da chon |
| Chi nhanh | Chon chi nhanh/dia diem kham |
| Ngay mong muon | Chon ngay kham |
| Gio mong muon | Chon khung gio (7:00-11:30 / 13:00-16:30 / 17:00-19:00) |
| Ghi chu | Thong tin bo sung (tuy chon) |

> **Luu y ve so dien thoai:** So dien thoai phai dung dinh dang Viet Nam (10 chu so, bat dau bang 0). VD: 0901234567

### Buoc 2: Gui va cho benh nhan xac nhan

Nhan **"Xac nhan dat lich"** — he thong se:

1. Tao **ma QR consent** (lien ket duy nhat, het han sau 30 phut)
2. Hien thi man hinh QR voi:
   - **Ma QR** — Cho benh nhan quet bang dien thoai
   - **Lien ket** — Co the sao chep de gui qua SMS/Zalo
   - **Bo dem thoi gian** — Con lai bao nhieu phut
   - **Trang thai** — Tu dong cap nhat khi benh nhan dong y

### Buoc 3: Benh nhan quet QR

Benh nhan quet ma QR hoac mo lien ket tren dien thoai cua ho. Trang consent hien thi:
- Ten doi tac y te
- Dich vu dat lich
- Mo ta du lieu se duoc chia se
- Nut **"Dong y & Chia se thong tin"**

### Buoc 4: Tu dong tao dat lich

Khi benh nhan nhan **"Dong y"**:
- Man hinh CS **tu dong cap nhat** (tich xanh)
- He thong **tu dong tao dat lich** voi bang chung consent:
  - IP cua benh nhan
  - User-Agent trinh duyet
  - Device fingerprint (kich thuoc man hinh, ngon ngu, timezone...)
  - Thoi diem dong y

> **Luu y:** Neu QR het han (30 phut), se phai tao lai.

### Truong hop fallback

Neu ban **chua dang nhap staff** khi tao booking, he thong se su dung **modal consent cu** (benh nhan ky truc tiep tren man hinh CS) thay vi QR.

---

## Nhung dieu can luu y

1. **Luon dang nhap truoc khi tu van** — He thong ghi lai ten nhan vien tao moi booking
2. **Cho benh nhan tu quet QR** — Khong quet ho benh nhan, vi IP va device fingerprint la bang chung consent
3. **Kiem tra ket qua AI** — AI chi mang tinh tham khao, khong thay the chan doan truc tiep
4. **Dau hieu do** — Neu ket qua AI co canh bao dau hieu do, huong dan benh nhan den cap cuu ngay
5. **Bao mat** — Khong chia se tai khoan dang nhap voi nguoi khac
