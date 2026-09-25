# Karsa — Design & Product Requirements Document

Career decision simulator · Homepage + Input Data (Simulasi) page

---

## 1. Ringkasan Produk

Karsa adalah simulator yang mengubah data gaji, pengeluaran, dan target tabungan pengguna menjadi gambaran kelayakan finansial sebuah pilihan karier. Karsa adalah **alat bantu pertimbangan, bukan penentu keputusan**.

**Target pengguna:** fresh graduate, orang yang mempertimbangkan pindah karier, orang yang membandingkan dua tawaran kerja.

---

## 2. Design System

### 2.1 Typography

| Peran | Font |
| --- | --- |
| Judul utama (H1) | **Archivo Black** |
| Judul section (H2) | **Archivo Narrow** |
| Subtitle | **Archivo Medium** |
| Body / deskripsi | **Space Grotesk Regular** |

**Icon library:** Iconify

### 2.1.1 Container Breakpoints

| Breakpoint | Lebar container |
| --- | --- |
| Desktop | 1120px |
| Tablet | 680px |
| Mobile | 358px |

### 2.2 Warna (diekstrak dari palet final)

| Token | Hex | Kegunaan |
| --- | --- | --- |
| `--tan-100` | `#A8875A` | Aksen ikon, tone sekunder |
| `--tan-200` | `#BDA583` | Latar alternatif |
| `--tan-300` | `#D3C1AB` | Latar section / kartu |
| `--cream` | `#E8DED2` | Latar utama (hero, dsb) |
| `--brown-mid` | `#866C4B` | Aksen dekoratif |
| `--brown-dark` | `#55423C` | Teks sekunder / footer bg |
| `--white` | `#FDFCFA` | Latar kartu / form |
| `--gray-light` | `#C6C5C1` | Border nonaktif, divider halus |
| `--red-orange` | `#D85A43` | **Primary CTA** (semua tombol aksi utama) |
| `--red-dark` | `#A74333` | Hover state primary CTA |
| `--ink` | `#211D1A` | Teks utama, **semua border & shadow neo-brutalism** |
| `--gray-dark` | `#595552` | Teks tersier |
| `--green-1` | `#4C7D5F` | Semantik positif (mis. badge "Aman" di hasil) |
| `--green-2` | `#42654F` | Hover/dark variant hijau |
| `--gold-1` | `#E5A93B` | Semantik peringatan/highlight (mis. badge "Waspada") |
| `--gold-2` | `#B48533` | Hover/dark variant gold |

> **Aturan warna CTA:** satu warna aksi utama di seluruh produk = `--red-orange`. Hijau dan gold **hanya** dipakai untuk makna semantik di halaman hasil (status "Aman" / "Perlu Dipertimbangkan"), tidak untuk tombol submit atau toggle netral.

### 2.3 Neo-Brutalism Component Rule

Berlaku untuk **semua elemen yang clickable, interaktif, atau bergerak** (tombol, kartu, input, toggle, dropdown):

```css
border: 3px solid #211D1A;
border-radius: 0; /* pointy edges, no rounding */
box-shadow: 4px 4px 0 0 #211D1A; /* hard shadow, no blur */
```

**States:**

- **Default:** seperti di atas
- **Hover:** geser elemen `translate(-2px, -2px)` + perbesar shadow ke `6px 6px 0 0 #211D1A` (kesan "terangkat")
- **Active/pressed:** `translate(2px, 2px)` + shadow `2px 2px 0 0 #211D1A` (kesan "ditekan masuk")
- **Disabled:** border tetap `#211D1A` tapi opacity elemen \~40%, shadow dihilangkan

Elemen statis (teks, latar section, ikon dekoratif) **tidak** perlu border/shadow ini.

### 2.4 Yang perlu diperbaiki dari mockup saat ini

- Dropdown "Jenis Pekerjaan" masih pakai gradient → ganti solid `--red-orange` dengan border/shadow standar di atas
- Tombol "Kalkulasi Sekarang" saat ini hijau → ganti ke `--red-orange` (konsistensi CTA)
- Toggle "Status Tinggal" / "Ada Tanggungan" saat ini hijau+kuning tanpa makna → ganti jadi satu warna aksen netral (`--ink` atau `--tan-100`) untuk state "on", `--gray-light` untuk "off"
- Icon box hijau solid di form field → samakan treatment dengan icon polos (tanpa box) seperti di section "Kenapa Memilih Kami", atau sebaliknya — pilih satu sistem
- Typo "Kakulasi" → "Kalkulasi"

---

## 3. Informasi Arsitektur — Homepage

Urutan section final:

1. **Hero** — judul, tagline, 2 CTA ("Cek Panduan" / "Mulai Simulasi"), disclaimer 1 baris
2. **Funfact strip** — statistik pengangguran sebagai hook
3. **Apa itu Karsa** — penjelasan produk 2 kolom (teks + ilustrasi)
4. **Kenapa Memilih Kami** — 3 kartu alasan
5. **Panduan Karsa** — 3 langkah bernomor (di-skip dari PRD ini, sudah dalam proses desain terpisah)
6. **Testimonial** — carousel, 3 kutipan siap pakai
7. **FAQ** — accordion, 5 pertanyaan siap pakai
8. **Footer** — nav, sosial media, copyright

### 3.1 Copy Final (siap implementasi)

**Hero**

```
K̶ARSA
Website yang Menggambarkan Keputusan Karirmu
[Cek Panduan]  [Mulai Simulasi]
Alat bantu pertimbangan, bukan penentu keputusan!
```

**Funfact**

```
Apakah kamu tau?
4,74% atau 7,35 juta orang Indonesia menganggur (BPS, Nov 2025)
Dan yang paling banyak menganggur? Bukan yang putus sekolah
tapi lulusan SMA (28%) dan S1 ke atas (13,9%).
Makanya, sebelum ambil keputusan karier, ada baiknya kamu tahu dulu gambarannya.
```

**Apa itu Karsa**

```
Simulator yang mengubah data gaji, pengeluaran, dan target tabunganmu jadi
gambaran kelayakan sebuah karir. Bukan penentu keputusan, tapi alat bantu
pertimbangan.
```

**Kenapa Memilih Kami** (eyebrow: "Alasan Kami")

```
Bukan Cuma Feeling
Keputusan karier itu berat, jangan cuma modal insting. Karsa hitungin
semuanya pakai data yang kamu masukkan sendiri.

Nggak Ribet
Nggak perlu bikin akun atau isi form panjang. Tinggal masukkan angka,
hasilnya keluar dalam hitungan menit.

Lihat Masa Depannya
Gaji segitu, cukup nggak buat nabung 5 tahun lagi? Karsa kasih gambaran
sebelum kamu beneran ambil keputusan.
```

**Testimonial** (eyebrow: "Cerita Pengguna")

```
"Awalnya galau milih kerja di startup atau lanjut S2. Setelah coba Karsa,
aku jadi punya gambaran jelas — ternyata gajinya belum cukup buat nutup
rencana nabungku. Sekarang aku tau harus negosiasi apa."
— Wong Ashley

"Karsa bantu aku ngitung apa pindah karier ke bidang baru itu worth it
secara finansial atau enggak. Nggak nyangka simulasinya sedetail ini,
padahal cuma butuh beberapa menit buat isi datanya."
— Dewi Anggraini

"Pas dapat dua tawaran kerja bareng, bingung banget mana yang lebih worth
it. Karsa bantu bandingin proyeksi keduanya dalam hitungan menit, jadi
keputusan lebih tenang."
— Farhan Maulana
```

**FAQ** (eyebrow: "Masih Bingung?")

```
Apakah Karsa gratis digunakan?
Ya, Karsa bisa dipakai gratis tanpa perlu bikin akun atau berlangganan apa pun.

Apakah data yang saya masukkan disimpan?
Data yang kamu masukkan cuma dipakai untuk menghitung hasil simulasi saat
itu juga, dan nggak dibagikan ke pihak lain.

Seberapa akurat hasil simulasinya?
Karsa kasih proyeksi berdasarkan data yang kamu masukkan sendiri, jadi
hasilnya seakurat data yang kamu isi. Ini alat bantu pertimbangan, bukan
jaminan atau penentu keputusan akhir.

Apakah Karsa bisa menggantikan konsultasi karier profesional?
Enggak. Karsa dirancang buat bantu kamu lihat gambaran awal secara
finansial, bukan pengganti nasihat dari konsultan karier atau perencana
keuangan profesional.

Berapa lama waktu yang dibutuhkan untuk simulasi?
Rata-rata cuma sekitar 2-3 menit, tergantung berapa banyak data tambahan
yang kamu isi.
```

---

## 4. Halaman Simulasi (Input Data)

### 4.1 Rekomendasi struktur

- Ubah dari satu halaman panjang → **wizard 3 langkah** dengan progress indicator: *Pilih Persona → Isi Data Wajib → Data Tambahan (opsional)*
- Field wajib: Gaji Bulanan, Estimasi Biaya Hidup Bulanan, Target Tabungan Bulanan
- Field opsional (collapsible, default tertutup, label "Opsional"): Investasi Karir, Proyeksi Kenaikan Gaji/Tahun
- Kartu persona butuh **selected-state** yang jelas (border lebih tebal + warna beda, bukan hanya rely on klik)
- Placeholder field nominal: `Rp 5.000.000` (bukan "Masukan Input" generik), auto-format ribuan saat mengetik
- Dropdown "Jenis Pekerjaan": default collapsed, styling solid sesuai rule 2.3 (tanpa gradient)
- Toggle "Status Tinggal" / "Ada Tanggungan": warna sesuai rule di 2.4
- 1 baris trust copy dekat tombol submit: *"Data kamu nggak disimpan, cuma dipakai untuk hitung proyeksi ini."*
- Tombol submit: **Kalkulasi Sekarang**, warna `--red-orange`, style neo-brutalism standar

---

## 4.2 Alur Lengkap Simulasi (3 Step Wizard)

**Step 1 — Pilih Persona** **Step 2 — Input Data Wajib** (gaji bulanan, estimasi biaya hidup, target tabungan, investasi karir, proyeksi kenaikan gaji) **Step 3 — Input Data Tambahan** (status tinggal, ada tanggungan, jenis pekerjaan) → lanjut ke **Simulator What If** (slider eksplorasi) → **Dashboard Hasil**

### 4.2.1 Kartu Persona — perlu diselesaikan

Saat ini 3 kartu identik (placeholder "PERSONA1" + avatar kosong, teks judul diulang di atas dan bawah). Karena ini titik pertama user harus "milih dirinya sendiri", tiap kartu butuh identitas yang jelas berbeda:

- Nama persona + 1 kalimat deskripsi singkat (bukan label generik), mis. *"Si Fresh Graduate"*, *"Si Mau Pindah Karier"*, *"Si Bandingin Dua Tawaran"* — tiga arketipe ini juga bisa dipakai ulang di homepage sebagai section "Untuk Siapa Karsa Cocok?" (lihat rekomendasi section tambahan sebelumnya)
- Icon/ilustrasi berbeda per persona (via Iconify), bukan avatar placeholder yang sama
- Teks judul di bawah card dihapus (duplikat) — ganti dengan deskripsi singkat itu
- Selected-state wajib ada: border lebih tebal atau warna beda + checkmark, karena user harus yakin pilihannya kesimpen sebelum klik "Selanjutnya"

### 4.2.2 Input Data Tambahan — terlalu sedikit

Step 3 saat ini cuma 2 toggle + 1 dropdown, jauh lebih tipis dibanding Step 2 (5 field). Karena halaman "Tentang Kami" sudah menjanjikan model berbasis teori (Life-Cycle Hypothesis, 50/30/20 Rule), field tambahan berikut akan memperkuat akurasi & konsistensi dengan janji itu:

- **Usia** — relevan untuk Life-Cycle Hypothesis (pola konsumsi/tabungan berubah seiring usia)
- **Jumlah tanggungan** (angka, bukan cuma toggle on/off) — "Ada Tanggungan" saat ini nggak menangkap berapa banyak, padahal itu penting untuk hitungan
- **Kota/domisili** — biaya hidup regional berbeda-beda (selaras dengan sumber data BPS & Susenas yang disebut di Tentang Kami)
- **Cicilan/utang bulanan berjalan** — relevan untuk alokasi 50/30/20 yang muncul di Dashboard Hasil
- **Dana darurat yang sudah ada** — relevan untuk perhitungan "Waktu Balik Modal" / runway di Dashboard Hasil

### 4.2.3 Halaman "Tentang Kami" — fungsinya

Isinya sekarang 100% berisi landasan teori, sumber data, dan disclaimer — nol cerita tim/perusahaan. Ini sebenarnya bukan "About Us" klasik, tapi **halaman metodologi/transparansi**: fungsinya meyakinkan user bahwa angka yang keluar di Dashboard Hasil (termasuk alokasi 50/30/20 yang persis sama dengan yang disebut di halaman ini) bukan asal hitung, tapi berbasis teori ekonomi & data resmi.

Karena isinya murni metodologi, dua opsi supaya fungsinya nggak ambigu:

- **Ganti nama nav** dari "Tentang" jadi **"Metodologi"** atau **"Cara Kerja"** — ekspektasi user langsung sesuai isi
- Atau tetap "Tentang Kami" tapi tambahkan 1-2 kalimat pembuka soal siapa/kenapa Karsa dibuat sebelum masuk ke bagian teori, supaya tetap terasa seperti "about" yang dilengkapi metodologi, bukan dokumen metodologi murni

Saya rekomendasikan opsi pertama (rename ke "Metodologi") karena lebih jujur ke isinya dan menghindari ekspektasi salah dari user yang klik nav mengharapkan cerita tim.

---

## 5. Integrasi dengan Codebase yang Sudah Ada

Struktur project existing (dari repo `careerpath`):

```
careerpath/
├── assets/
│   ├── css/style.css
│   ├── img/
│   └── js/
│       ├── animasi.js
│       ├── hasil.js
│       └── script.js
├── vendor/
│   ├── anime/
│   └── aos/
│       └── parallax/parallax.min.js
└── index.html
```

**Rekomendasi integrasi (tanpa merombak struktur yang sudah ada):**

1. **Design tokens** — tambahkan block `:root { }` di bagian paling atas `style.css` berisi semua CSS variable dari tabel 2.2 dan aturan neo-brutalism dari 2.3 sebagai utility class (`.btn`, `.card`, `.input-field`, `.toggle`) supaya teman kamu tinggal apply class, bukan tulis ulang border/shadow di tiap komponen.
2. **Fonts** — import Archivo, Archivo Narrow, Space Grotesk (Google Fonts) di `<head>` index.html, lalu definisikan `--font-heading`, `--font-subtitle`, `--font-body` sebagai variable supaya konsisten dipanggil dari CSS.
3. **Pembagian tanggung jawab JS yang sudah ada** (tidak perlu bikin file baru kalau tidak perlu):
   - `script.js` — interaksi umum (accordion FAQ, carousel testimonial, dropdown, toggle)
   - `animasi.js` — hook ke AOS (`vendor/aos`) untuk scroll-reveal tiap section, dan anime.js untuk micro-interaction hover/press pada tombol & kartu (translate + shadow shift dari rule 2.3)
   - `hasil.js` — logika kalkulasi simulasi (form input → hasil), termasuk validasi field wajib vs opsional
   - `vendor/` — jangan diubah, biarkan sebagai library pihak ketiga
4. **Parallax** — dekorasi bentuk-bentuk geometris (segitiga, kotak, berlian) di hero/section lain kelihatannya sudah pakai `parallax.min.js`; pastikan elemen dekoratif ini punya `data-depth` attribute yang konsisten supaya efeknya subtle, bukan mengganggu keterbacaan teks.
5. **Cara kerja sama dengan temanmu:** dokumen ini bisa jadi acuan bersama — bagikan section 2 (design system) sebagai "kontrak" tokens & komponen, section 3-4 sebagai konten & struktur final, section 5 sebagai peta di mana masing-masing bagian ditaruh di file yang sudah ada. Kalau kalian berdua kerja di file yang sama, disarankan pisahkan: satu orang pegang `style.css` (tokens + komponen), satu orang pegang `index.html` + `hasil.js` (struktur & logic), supaya nggak tabrakan.

---

## 6. Open Items

- Font weight spesifik (mis. Archivo Black vs Bold untuk H1) belum ditentukan
- Breakpoint responsive belum didefinisikan (disarankan: mobile \<640px, tablet 640-1024px, desktop >1024px)
- Ikon library belum final (mockup sejauh ini pakai Tabler Icons)
- Halaman hasil simulasi (output/rekomendasi) belum masuk PRD ini — perlu dokumen terpisah setelah wireframe-nya ada