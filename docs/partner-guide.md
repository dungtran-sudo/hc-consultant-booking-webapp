# Huong dan su dung — Portal Doi tac (Partner Portal)

## Tong quan

Portal doi tac cho phep cac doi tac y te (phong kham, benh vien) quan ly dat lich kham benh tu he thong Hello Bac Si.

**Dia chi:** `/partner/login`

---

## Dang nhap

Moi doi tac co **duong dan dang nhap rieng** (VD: `/partner/login/diag`, `/partner/login/vinmec`).

Duong dan nay duoc gui qua email thong bao booking.

Cung co the dang nhap tai `/partner/login` (nhap ten doi tac thu cong).

**Cach dang nhap:**
1. Truy cap duong dan dang nhap rieng cua doi tac (hoac `/partner/login`)
2. Nhap **mat khau** do quan tri cung cap
3. Nhan "Dang nhap"

Sau khi dang nhap, ban se duoc chuyen den dashboard quan ly dat lich.

**Dang xuat:** Nhan nut "Dang xuat" o goc tren ben phai.

---

## Bao mat Phien dang nhap

- Phien dang nhap co hieu luc **7 ngay** ke tu khi dang nhap
- Sau 7 ngay, ban se phai dang nhap lai
- Phien duoc luu trong cookie an toan (httpOnly)
- **Khong chia se duong dan dang nhap** voi nguoi ngoai to chuc

---

## Gioi han Truy cap (Rate Limiting)

He thong gioi han so luong truy cap de bao ve bao mat:

| Hanh dong | Gioi han |
|-----------|----------|
| Danh sach dat lich | 60 yeu cau/phut |
| Xem thong tin benh nhan | 30 yeu cau/phut |
| Cap nhat trang thai | 30 yeu cau/phut |

Neu vuot qua gioi han, ban se nhan thong bao loi tam thoi.

---

## Dashboard

### Loc theo trang thai

Phia tren dashboard co cac tab loc:

| Tab | Mo ta |
|-----|-------|
| Tat ca | Hien thi tat ca dat lich |
| Cho xu ly | Dat lich moi, chua duoc xu ly |
| Da xac nhan | Dat lich da duoc doi tac xac nhan |
| Da huy | Dat lich da bi huy |
| Da hoan thanh | Dat lich da hoan tat |

### Tim kiem

Nhap ma dat lich (VD: `HHG-VIN-4567`) vao o tim kiem de loc nhanh.

---

## Quan ly Dat lich

Moi the dat lich hien thi:

| Thong tin | Mo ta |
|-----------|-------|
| Ma dat lich | VD: HHG-VIN-4567-A1 |
| Dich vu | Ten dich vu / goi kham |
| Dia chi chi nhanh | Dia diem kham |
| Ngay & gio | Ngay va khung gio mong muon |
| Trang thai | Trang thai hien tai |
| Nguoi tao | Ten nhan vien CS/Bac si da tao booking |

### Cap nhat trang thai

Tuy theo trang thai hien tai, ban se thay cac nut hanh dong:

| Trang thai hien tai | Hanh dong kha dung |
|---------------------|-------------------|
| Cho xu ly | **Xac nhan** (xanh) / **Huy** (do) |
| Da xac nhan | **Hoan thanh** (xanh) / **Huy** (do) |
| Da huy | Khong co hanh dong |
| Da hoan thanh | Khong co hanh dong |

**Xac nhan truoc khi thuc hien:**
- Moi hanh dong deu hien hop thoai xac nhan
- Hanh dong "Huy" hien thi voi giao dien mau do (canh bao)
- Phai nhan "Xac nhan" trong hop thoai de thuc hien

**Xu ly loi:**
- Khi cap nhat trang thai, neu co loi he thong se hien thong bao cu the
- Khi xem chi tiet benh nhan, neu phien het han he thong se tu dong chuyen ve trang dang nhap

---

## Xem Thong tin Benh nhan (PII)

Du lieu benh nhan duoc ma hoa trong co so du lieu. De xem thong tin:

### Buoc 1: Cam ket bao mat (lan dau trong phien)

Lan dau nhan **"Xem chi tiet"**, he thong se hien modal:

**"Cam ket bao mat du lieu y te"**

Ban phai dong y voi 3 dieu kien:
1. Chi su dung thong tin de phuc vu quan ly dat lich
2. Khong sao chep, chia se, hoac chup man hinh du lieu benh nhan
3. Bao cao ngay cho quan tri vien neu phat hien truy cap trai phep

Tick checkbox va nhan **"Toi dong y va cam ket"**.

> Cam ket nay duoc ghi vao nhat ky kiem tra (audit log) voi IP, thoi gian, va ten doi tac.

### Buoc 2: Xem thong tin

Sau khi cam ket, thong tin benh nhan duoc hien thi:
- **Ho ten** benh nhan
- **So dien thoai**
- **Tom tat tinh trang** suc khoe
- **Ghi chu** bo sung

### Luu y
- Trong cung mot phien lam viec (tab trinh duyet), ban chi can cam ket **1 lan**
- Neu dong tab va mo lai, se phai cam ket lai
- Moi lan xem thong tin benh nhan deu duoc ghi vao audit log

---

## Thong bao Email

Khi co dat lich moi, doi tac se nhan email tu he thong voi:
- Ma dat lich
- Ten dich vu
- Ngay va gio mong muon
- Dia chi chi nhanh

Email thong bao bao gom **lien ket truc tiep** den portal doi tac. Doi tac co the nhan vao lien ket trong email de dang nhap nhanh.

Email duoc gui tu dia chi Gmail cua he thong.

---

## Hoa hong

Neu doi tac co thiet lap ty le hoa hong, muc **"Hoa hong"** se hien thi phia duoi bang dat lich tren dashboard.

### Thong tin hien thi

| Cot | Mo ta |
|-----|-------|
| Thang/Nam | Thang va nam cua bao cao |
| So booking | So luong booking hoan thanh trong thang |
| Doanh thu | Tong doanh thu (do admin nhap) |
| Hoa hong | So tien hoa hong = Doanh thu × Ty le % |
| Trang thai | Da xac nhan / Da thanh toan |

### Luu y
- Chi hien thi bao cao da duoc admin **xac nhan** hoac **da thanh toan**
- Bao cao o trang thai **Nhap** se khong hien thi cho doi tac
- Day la bang **chi doc** — doi tac khong the chinh sua bao cao
- Neu co thac mac ve so lieu, vui long lien he quan tri vien

---

## Cac luu y quan trong

1. **Bao mat:** Khong chia se tai khoan dang nhap voi nguoi khac
2. **Du lieu benh nhan:** Chi truy cap khi can thiet cho viec quan ly dat lich
3. **Trang thai:** Cap nhat trang thai kip thoi de benh nhan va nhan vien theo doi
4. **Audit trail:** Moi hanh dong cua ban deu duoc ghi lai de phuc vu kiem tra
