"""Isi bab METODE PENELITIAN, REFERENSI, dan (opsional) HASIL DAN PEMBAHASAN ke dalam assets/template jurnal.docx."""

import argparse
from pathlib import Path
import re
import docx
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Cm, Pt


ROOT_DIR = Path(__file__).resolve().parent.parent
DOC_PATH = ROOT_DIR / "assets" / "template jurnal.docx"
FALLBACK_PATH = ROOT_DIR / "assets" / "jurnal_sikomu_random_forest.docx"
FIGURES_DIR = ROOT_DIR / "assets" / "journal_figures"

JOURNAL_TITLE = (
    "Implementasi Algoritma Random Forest pada Sistem Manajemen Multi-Unit Usaha "
    "Koperasi Karyawan untuk Prediksi Penjualan di Koperasi Karyawan Ciledug Jaya Makmur"
)

IEEE_REFERENCES = [
    '[1] J. Hatane, "Pengembangan sistem informasi berbasis web pada koperasi," *Jurnal Pengembangan Teknologi Informasi dan Ilmu Komputer (J-PTIIK)*, vol. 10, no. 4, hlm. 1–11, 2026.',
    '[2] R. B. Nugroho, N. Santoso, dan D. S. Rusdianto, "Pengembangan sistem informasi koperasi penjualan dan simpan pinjam berbasis website pada Primer Koperasi Angkatan Laut Akademi Angkatan Laut (Primkopal AAL) Surabaya," *Jurnal Pengembangan Teknologi Informasi dan Ilmu Komputer*, vol. 6, no. 4, hlm. 1975–1983, 2022.',
    '[3] P. G. S. C. Nugraha, N. W. Wardani, dan W. Sukarmayasa, "Rancang bangun sistem informasi software Point of Sale (POS) dengan metode Waterfall berbasis web," *JST (Jurnal Sains dan Teknologi)*, vol. 10, no. 1, hlm. 92–103, 2021.',
    '[4] D. Ramayanti, Y. Jumaryadi, dan A. K. Sunandar, "Implementasi metode Waterfall dalam pengembangan sistem Point of Sales dan e-Commerce," *TIN: Terapan Informatika Nusantara*, vol. 4, no. 3, hlm. 129–133, 2023.',
    '[5] H. Septanto dan D. Harto, "Pembuatan aplikasi Point of Sale (POS) untuk Agen Aan Motor Bogor," *Jurnal Informatika dan Teknik Elektro Terapan (JITET)*, vol. 12, no. 3, hlm. 2376–2389, 2024.',
    '[6] Sinta dan H. Magdalena, "Transformasi digital UMKM platform prototype berbasis web pemesanan dan logistik," *METIK Jurnal*, vol. 9, no. 1, hlm. 18–27, 2025.',
    '[7] A. Ratnasari, W. H. Haji, V. Ayumi, dan S. D. Asri, "Strategi optimalisasi digital marketing bagi Usaha Mikro, Kecil, dan Menengah (UMKM) untuk meningkatkan jangkauan pasar di era industri 4.0," *SGI: Sains, Teknologi dan Informatika USNI*, vol. 6, no. 2, hlm. 7–13, 2024.',
    '[8] M. Patria, D. Yuswansyah, dan R. S. Sanaky, "Eksplorasi desain dan kegunaan aplikasi pariwisata digital dalam mendukung transformasi industri pariwisata berbasis teknologi," *Computing and Education Technology Journal (CETJ)*, vol. 6, no. 1, hlm. 139–152, 2026.',
    '[9] N. W. Wardani, P. G. S. C. Nugraha, dan G. S. Mahendra, "Implementasi naïve bayes pada data mining untuk mengklasifikasikan penjualan barang terlaris pada perusahaan ritel," *JST (Jurnal Sains dan Teknologi)*, vol. 12, no. 3, hlm. 656–668, 2024.',
    '[10] K. Hidayat, W. Witanti, dan E. Ramadhan, "Analisis tren dan prediksi penjualan restoran menggunakan model time series prophet," *METIK Jurnal*, vol. 9, no. 2, hlm. 457–467, 2024.',
    '[11] A. Agustina, T. Tukino, B. Huda, dan E. Novalia, "Prediksi volume penjualan gadget berdasarkan promo dan channel penjualan menggunakan Random Forest," *JUSIFOR: Jurnal Sistem Informasi dan Informatika*, vol. 4, no. 1, hlm. 85–91, 2025.',
    '[12] F. N. Farida, A. Faqih, dan S. E. Permana, "Penerapan model prediksi penjualan pada usaha rumah makan menggunakan algoritma Random Forest," *JATI (Jurnal Mahasiswa Teknik Informatika)*, vol. 9, no. 4, hlm. 5895–5902, 2025.',
    '[13] M. Erkamim, S. Suswadi, M. Z. Subarkah, dan E. Widarti, "Komparasi algoritme Random Forest dan XGBoosting dalam klasifikasi performa UMKM," *Jurnal Sistem Informasi Bisnis*, vol. 13, no. 2, hlm. 127–134, 2023.',
    '[14] K. Muhammad, R. B. Trianto, dan J. Purwanto, "Pengembangan model random forest untuk prediksi kesehatan jiwa berbasis data klinis terstruktur dan tidak terstruktur," *JEPIN (Jurnal Edukasi dan Penelitian Informatika)*, vol. 11, no. 3, hlm. 426–433, 2025.',
    '[15] H. Noprisson dan V. Ayumi, "Implementasi Random Forest untuk klasifikasi jenis kendaraan dengan menggunakan algoritma Gamma Correction," *JSAI (Journal Scientific and Applied Informatics)*, vol. 6, no. 3, hlm. 475–481, 2023.',
]


def _set_run_font(run, size_pt: float = 10, bold: bool = False, italic: bool = False) -> None:
    run.font.name = "Times New Roman"
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic


def _add_formatted_runs(paragraph, text: str, size_pt: float = 10, base_bold: bool = False) -> None:
    """Parse penanda *italic* dan **bold** sederhana ke dalam run Word."""
    tokens = re.split(r"(\*\*[^*]+\*\*|\*[^*]+\*)", text)
    for tok in tokens:
        if not tok:
            continue
        if tok.startswith("**") and tok.endswith("**"):
            r = paragraph.add_run(tok[2:-2])
            _set_run_font(r, size_pt=size_pt, bold=True, italic=False)
        elif tok.startswith("*") and tok.endswith("*"):
            r = paragraph.add_run(tok[1:-1])
            _set_run_font(r, size_pt=size_pt, bold=base_bold, italic=True)
        else:
            r = paragraph.add_run(tok)
            _set_run_font(r, size_pt=size_pt, bold=base_bold, italic=False)


def _insert_paragraph_before(
    anchor_p,
    text: str = "",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    space_before: float = 0,
    space_after: float = 4,
    size_pt: float = 10,
    bold: bool = False,
    first_line_cm: float = 0,
    left_indent_cm: float = 0,
):
    p = anchor_p.insert_paragraph_before()
    p.alignment = align
    pf = p.paragraph_format
    pf.line_spacing = 1.0
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    if left_indent_cm:
        pf.left_indent = Cm(left_indent_cm)
    if first_line_cm:
        pf.first_line_indent = Cm(first_line_cm)
    if text:
        _add_formatted_runs(p, text, size_pt=size_pt, base_bold=bold)
    return p


def _insert_figure_before(anchor_p, image_path: Path, caption: str, width_cm: float = 14.5) -> None:
    """Sisipkan gambar rata tengah beserta keterangan gambar sebelum anchor_p."""
    if not image_path.exists():
        raise FileNotFoundError(f"File gambar tidak ditemukan: {image_path}")

    p_img = anchor_p.insert_paragraph_before()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.line_spacing = 1.0
    p_img.paragraph_format.space_before = Pt(6)
    p_img.paragraph_format.space_after = Pt(2)
    run = p_img.add_run()
    run.add_picture(str(image_path), width=Cm(width_cm))

    _insert_paragraph_before(
        anchor_p,
        text=caption,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=0,
        space_after=6,
        size_pt=9.5,
    )


def _insert_equation_before(anchor_p, parts: list[tuple[str, str]], eq_num: str) -> None:
    """
    Sisipkan persamaan di tengah dengan nomor persamaan rata kanan menggunakan tab stop.
    parts: list of (text, mode) where mode in {'normal', 'italic', 'sub', 'sup'}
    """
    p = anchor_p.insert_paragraph_before()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.line_spacing = 1.0
    pf.space_before = Pt(4)
    pf.space_after = Pt(4)
    pf.tab_stops.add_tab_stop(Cm(7.96), WD_TAB_ALIGNMENT.CENTER)
    pf.tab_stops.add_tab_stop(Cm(15.92), WD_TAB_ALIGNMENT.RIGHT)

    r_tab1 = p.add_run("\t")
    _set_run_font(r_tab1, size_pt=10)

    for txt, mode in parts:
        r = p.add_run(txt)
        _set_run_font(r, size_pt=10, italic=(mode == "italic"))
        if mode == "sub":
            r.font.subscript = True
        elif mode == "sup":
            r.font.superscript = True

    r_tab2 = p.add_run(f"\t({eq_num})")
    _set_run_font(r_tab2, size_pt=10)


def _set_cell_borders(cell, top=None, bottom=None, left=None, right=None) -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for side, spec in (("top", top), ("bottom", bottom), ("left", left), ("right", right)):
        el = OxmlElement(f"w:{side}")
        if spec is None:
            el.set(qn("w:val"), "nil")
        else:
            val, sz, color = spec
            el.set(qn("w:val"), val)
            el.set(qn("w:sz"), str(sz))
            el.set(qn("w:space"), "0")
            el.set(qn("w:color"), color)
        tcBorders.append(el)
    tcPr.append(tcBorders)


def _set_cell_margins(cell, top=60, bottom=60, left=100, right=100) -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement("w:tcMar")
    for side, val in (("top", top), ("bottom", bottom), ("left", left), ("right", right)):
        node = OxmlElement(f"w:{side}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        tcMar.append(node)
    tcPr.append(tcMar)


def _insert_table_before(
    doc,
    anchor_p,
    caption: str,
    headers: list[str],
    rows: list[list[str]],
    col_widths_cm: list[float],
    col_aligns: list[int],
    font_size_pt: float = 8.5,
    cell_lr_dxa: int = 80,
) -> None:
    """Sisipkan judul tabel di tengah dan tabel berbingkai rapi sebelum anchor_p."""
    _insert_paragraph_before(
        anchor_p,
        text=caption,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=6,
        space_after=3,
        size_pt=9.5,
    )

    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    anchor_p._p.addprevious(table._tbl)

    border_rule = ("single", 6, "333333")
    light_rule = ("single", 4, "CCCCCC")

    all_rows = [headers] + rows
    for r_idx, row_vals in enumerate(all_rows):
        tbl_row = table.rows[r_idx]
        if r_idx == 0:
            trPr = tbl_row._tr.get_or_add_trPr()
            trPr.append(OxmlElement("w:tblHeader"))
        trPr = tbl_row._tr.get_or_add_trPr()
        trPr.append(OxmlElement("w:cantSplit"))

        for c_idx, val in enumerate(row_vals):
            cell = tbl_row.cells[c_idx]
            cell.width = Cm(col_widths_cm[c_idx])
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            _set_cell_margins(cell, top=55, bottom=55, left=cell_lr_dxa, right=cell_lr_dxa)

            if r_idx == 0:
                shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F2F2F2"/>')
                cell._tc.get_or_add_tcPr().append(shading)
                _set_cell_borders(cell, top=border_rule, bottom=border_rule, left=None, right=None)
            elif r_idx == len(all_rows) - 1:
                _set_cell_borders(cell, top=light_rule, bottom=border_rule, left=None, right=None)
            else:
                _set_cell_borders(cell, top=light_rule, bottom=light_rule, left=None, right=None)

            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if r_idx == 0 else col_aligns[c_idx]
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            _add_formatted_runs(p, val, size_pt=font_size_pt, base_bold=(r_idx == 0))

    _insert_paragraph_before(anchor_p, text="", space_before=0, space_after=3, size_pt=9)


def _clear_between_headings(doc, start_heading_text: str, end_heading_text: str):
    """Hapus seluruh elemen (paragraf & tabel) di antara dua Heading 1, kembalikan paragraf end_heading."""
    start_p = next((p for p in doc.paragraphs if p.text.strip() == start_heading_text), None)
    end_p = next((p for p in doc.paragraphs if p.text.strip() == end_heading_text), None)
    if start_p is None or end_p is None:
        raise ValueError(f"Heading '{start_heading_text}' atau '{end_heading_text}' tidak ditemukan.")

    body = doc.element.body
    children = list(body)
    start_idx = children.index(start_p._p)
    end_idx = children.index(end_p._p)
    if start_idx >= end_idx:
        raise ValueError(f"Heading '{start_heading_text}' tidak berada sebelum '{end_heading_text}'.")

    for el in children[start_idx + 1 : end_idx]:
        body.remove(el)

    return end_p


def _clear_after_heading(doc, heading_text: str):
    """Hapus seluruh elemen setelah Heading 1 hingga akhir dokumen (kecuali sectPr)."""
    start_p = next((p for p in doc.paragraphs if p.text.strip() == heading_text), None)
    if start_p is None:
        raise ValueError(f"Heading '{heading_text}' tidak ditemukan.")

    body = doc.element.body
    children = list(body)
    start_idx = children.index(start_p._p)

    for el in children[start_idx + 1 :]:
        if el.tag == qn("w:sectPr"):
            continue
        body.remove(el)

    return start_p


def _clear_from_prefix_to_prefix(doc, start_prefix: str, end_prefix: str):
    """Hapus paragraf berawalan start_prefix hingga tepat sebelum paragraf berawalan end_prefix."""
    start_p = next((p for p in doc.paragraphs if p.text.strip().startswith(start_prefix)), None)
    end_p = next((p for p in doc.paragraphs if p.text.strip().startswith(end_prefix)), None)
    if start_p is None or end_p is None:
        raise ValueError(f"Paragraf berawalan '{start_prefix}' atau '{end_prefix}' tidak ditemukan.")

    body = doc.element.body
    children = list(body)
    start_idx = children.index(start_p._p)
    end_idx = children.index(end_p._p)
    if start_idx >= end_idx:
        raise ValueError(f"'{start_prefix}' tidak berada sebelum '{end_prefix}'.")

    for el in children[start_idx:end_idx]:
        body.remove(el)

    return end_p


def populate_abstrak(doc) -> None:
    """Isi Abstrak (Indonesia) dan Abstract (Inggris) tepat sebelum Article history."""
    anchor_history = _clear_from_prefix_to_prefix(doc, "Abstrak", "Article history:")

    id_blocks = [
        ("**Abstrak.**", 3, 2),
        (
            "**Tujuan:** Penelitian ini mengatasi pencatatan manual pada unit warung ritel dan jasa "
            "titip di Koperasi Karyawan Ciledug Jaya Makmur, termasuk ketidaksesuaian saldo stok, "
            "rekap SHU manual, serta pengadaan barang tanpa acuan prediksi mingguan.",
            0,
            2,
        ),
        (
            "**Metode/Desain/Pendekatan:** Sistem Informasi Koperasi Multi-Unit (SIKOMU) dibangun "
            "berbasis web (*React*, *Node.js/Express*, MySQL 29 tabel, dan RBAC empat peran) lalu "
            "diintegrasikan dengan *Random Forest Regressor* (200 pohon, kedalaman 12) memakai data "
            "2 tahun (46 produk, 35.291 transaksi, 114 minggu; 4.876 latih dan 184 uji), dievaluasi "
            "terhadap *Baseline* (*rolling_mean_4*) serta diuji fungsionalnya melalui 12 skenario "
            "*Black-Box*.",
            0,
            2,
        ),
        (
            "**Hasil/Temuan:** Seluruh 12 skenario uji *Black-Box* lulus 100%, termasuk penolakan "
            "HTTP 401 pada tujuh rute tanpa token. Pada data uji, *Random Forest* menurunkan MAE "
            "dari 4,70 menjadi 1,93 pcs/minggu dan WAPE dari 31,52% menjadi 12,94% (ketepatan naik "
            "dari 68,48% ke 87,06%; versi bulat di basis data 87,21%). Fitur utama ialah "
            "*rolling_mean_8* (67,59%) dan *is_payday_week* (16,65%). Peramalan memproyeksikan "
            "2.587 pcs (4 minggu) dan 5.552 pcs (8 minggu) dengan 0 produk Kritis, 2 Perlu Restok, "
            "dan 44 Aman.",
            0,
            2,
        ),
        (
            "**Kebaharuan/Originalitas/Nilai:** Penyatuan operasional warung ritel (POS, shift kasir, "
            "*ledger* stok, SHU 80%:20%) dan jasa titip dengan peramalan *Random Forest* berbasis "
            "kalender gajian karyawan dan hari besar ke dalam saran jumlah pengadaan ulang otomatis.",
            0,
            3,
        ),
        (
            "**Kata Kunci:** Sistem Informasi Koperasi, Multi-Unit Usaha, *Point of Sale*, "
            "*Random Forest*, Prediksi Penjualan, Rekomendasi Restok",
            0,
            6,
        ),
    ]

    for txt, sb, sa in id_blocks:
        _insert_paragraph_before(
            anchor_history,
            text=txt,
            align=WD_ALIGN_PARAGRAPH.JUSTIFY,
            space_before=sb,
            space_after=sa,
            size_pt=9.0,
        )

    en_blocks = [
        ("**Abstract.**", 2, 2),
        (
            "**Purpose:** This study addresses manual bookkeeping in the retail store and "
            "entrusted-buying (*jastip*) units of Ciledug Jaya Makmur Employee Cooperative, including "
            "stock discrepancies, manual surplus distribution recaps, and restocking without weekly "
            "demand forecasts.",
            0,
            2,
        ),
        (
            "**Methods/Study design/approach:** A web-based Multi-Unit Cooperative Information "
            "System (SIKOMU) was built using React, Node.js/Express, a 29-table MySQL database, "
            "and four-role RBAC, integrated with a Random Forest Regressor (200 trees, max depth "
            "12) trained on two-year data (46 active products, 35,291 transactions, 114 weeks; "
            "4,876 training and 184 test rows), evaluated against a four-week moving average "
            "baseline, and tested via 12 Black-Box scenarios.",
            0,
            2,
        ),
        (
            "**Result/Findings:** All 12 Black-Box test scenarios passed (100%), including HTTP 401 "
            "blocking across seven unauthenticated endpoints. On the test set, Random Forest "
            "reduced MAE from 4.70 to 1.93 pcs/week and WAPE from 31.52% to 12.94% (accuracy "
            "improved from 68.48% to 87.06%; rounded database values reached 87.21%). Dominant "
            "predictors were rolling_mean_8 (67.59%) and is_payday_week (16.65%). Recursive "
            "forecasting projected 2,587 pcs (4 weeks) and 5,552 pcs (8 weeks), identifying 0 "
            "Critical, 2 Need Restock, and 44 Safe products.",
            0,
            2,
        ),
        (
            "**Novelty/Originality/Value:** Unifying cooperative retail POS, shift audit, ledger "
            "inventory, 80%:20% profit sharing, and *jastip* workflows with employee payday and "
            "holiday-aware Random Forest restock recommendations in a single web platform.",
            0,
            3,
        ),
        (
            "**Keywords:** Cooperative Information System, Multi-Unit Business, Point of Sale, "
            "Random Forest, Sales Forecasting, Restock Recommendation",
            0,
            6,
        ),
    ]

    for txt, sb, sa in en_blocks:
        _insert_paragraph_before(
            anchor_history,
            text=txt,
            align=WD_ALIGN_PARAGRAPH.JUSTIFY,
            space_before=sb,
            space_after=sa,
            size_pt=9.0,
        )

    _insert_paragraph_before(anchor_history, text="", space_before=0, space_after=4, size_pt=9.0)


def populate_pendahuluan(doc, anchor_metode) -> None:
    """Isi bab PENDAHULUAN tepat sebelum heading METODE PENELITIAN."""
    paragraphs = [
        (
            "Koperasi karyawan berperan menyediakan kebutuhan harian anggota sekaligus mengelola "
            "usaha bersama secara transparan [1, 2]. Di Koperasi Karyawan Ciledug Jaya Makmur, "
            "kegiatan operasional terbagi ke dalam dua unit usaha aktif, yakni warung ritel dan "
            "layanan jasa titip (*jastip*). Sebelum sistem digital diterapkan, pencatatan transaksi "
            "harian masih bergantung pada buku tulis dan rekap berkas Microsoft Excel. Pola kerja "
            "tersebut kerap menimbulkan selisih antara catatan stok dengan fisik barang di gudang, "
            "menghambat rekapitulasi pembagian Sisa Hasil Usaha (SHU) antara koperasi dan "
            "koordinator usaha, serta membuat pembelian barang ulang hanya bertumpu pada perkiraan "
            "kasir tanpa ukuran permintaan mingguan yang terukur [7]."
        ),
        (
            "Berbagai studi sebelumnya telah mengembangkan perangkat lunak berbasis web untuk "
            "digitalisasi koperasi dan usaha ritel. Hatane [1] serta Nugroho dkk. [2] merancang "
            "sistem informasi koperasi berbasis web untuk mempercepat pencatatan transaksi "
            "penjualan dan simpan pinjam anggota. Pada modul kasir, Nugraha dkk. [3], Ramayanti "
            "dkk. [4], serta Septanto dan Harto [5] membangun aplikasi *Point of Sale* (POS) web "
            "yang memisahkan stok, pembelian dari *supplier*, dan laporan penjualan harian. Di sisi "
            "pemesanan berbasis sesi, Sinta dan Magdalena [6] mengembangkan purwarupa platform "
            "pemesanan dan logistik UMKM, sementara Patria dkk. [8] menyoroti pentingnya "
            "keterbacaan antarmuka web agar mudah dioperasikan pengguna. Meskipun demikian, "
            "sistem-sistem tersebut umumnya berhenti pada tahap pencatatan transaksi dan pelaporan "
            "historis sehingga belum menyajikan proyeksi kebutuhan stok mingguan di dalam alur "
            "pengadaan barang."
        ),
        (
            "Pada ranah analitik data penjualan ritel, sejumlah peneliti menerapkan metode "
            "pembelajaran mesin untuk membantu pengambilan keputusan stok. Wardani dkk. [9] "
            "memakai algoritma *Naïve Bayes* untuk mengelompokkan kategori barang terlaris, "
            "sedangkan Hidayat dkk. [10] menggunakan model deret waktu *Prophet* dalam memetakan "
            "tren penjualan restoran. Untuk regresi volume penjualan yang dipengaruhi beberapa "
            "peubah kalender sekaligus, Agustina dkk. [11] serta Farida dkk. [12] menerapkan "
            "*Random Forest Regressor* pada data transaksi ritel dan rumah makan karena sifat "
            "ansambel pohon keputusannya tahan terhadap pencilan serta tidak memerlukan penskalaan "
            "fitur. Erkamim dkk. [13], Muhammad dkk. [14], serta Noprisson dan Ayumi [15] juga "
            "menunjukkan kemampuan *Random Forest* dalam memodelkan data tabular dengan variabel "
            "campuran numerik dan kategoris."
        ),
        (
            "Kebutuhan di Koperasi Karyawan Ciledug Jaya Makmur menuntut kedua sisi tersebut "
            "berjalan dalam satu sistem terpadu. Unit warung ritel membutuhkan kasir POS dengan "
            "kontrol shift, pencatatan mutasi stok berbasis *ledger*, retur/void berotorisasi "
            "admin, serta perhitungan SHU bersih 80% untuk koperasi dan 20% untuk koordinator, "
            "sementara unit jasa titip memerlukan pengelolaan vendor, menu, sesi pemesanan, dan "
            "bukti pembayaran anggota. Selain itu, pola belanja karyawan pabrik dan kantor sangat "
            "dipengaruhi siklus gajian bulanan (tanggal 25–31 dan tanggal 1–5) serta momentum "
            "Ramadan dan Idul Fitri, sehingga model rata-rata bergerak sederhana tidak mampu "
            "menyesuaikan lonjakan permintaan tepat pada pekan perubahan siklus."
        ),
        (
            "Berdasarkan persoalan tersebut, penelitian ini membangun Sistem Informasi Koperasi "
            "Multi-Unit (SIKOMU) yang menggabungkan manajemen operasional warung ritel dan jasa "
            "titip dengan modul peramalan penjualan menggunakan *Random Forest Regressor*. Model "
            "dilatih memakai data historis dua tahun (46 produk ritel aktif dan 35.291 transaksi "
            "penjualan dari 1 Juli 2024 hingga 6 September 2026) yang diagregasikan secara mingguan "
            "dengan fitur *lag*, *rolling mean*, penanda minggu gajian, dan hari besar. "
            "Fungsionalitas seluruh modul web diverifikasi memakai *Black-Box Testing*, sedangkan "
            "kinerja prediksi *Random Forest* dibandingkan terhadap *Baseline* rata-rata bergerak "
            "4 minggu berdasarkan metrik *Mean Absolute Error* (MAE) dan *Weighted Absolute "
            "Percentage Error* (WAPE), lalu digunakan untuk meramalkan kebutuhan pengadaan ulang "
            "hingga delapan minggu ke depan."
        ),
    ]

    for idx, text in enumerate(paragraphs):
        _insert_paragraph_before(
            anchor_metode,
            text=text,
            align=WD_ALIGN_PARAGRAPH.JUSTIFY,
            space_before=0,
            space_after=6 if idx == len(paragraphs) - 1 else 4,
            size_pt=10.0,
            first_line_cm=0.5,
        )


def populate_kesimpulan(doc, anchor_referensi) -> None:
    """Isi bab KESIMPULAN tepat sebelum heading REFERENSI."""
    paragraphs = [
        (
            "Penelitian ini berhasil merancang, membangun, dan menguji Sistem Informasi Koperasi "
            "Multi-Unit (SIKOMU) berbasis web untuk Koperasi Karyawan Ciledug Jaya Makmur "
            "menggunakan arsitektur *React*, *Node.js/Express*, dan basis data MySQL 29 tabel "
            "dengan kendali akses RBAC empat peran. Aplikasi telah melayani operasional warung "
            "ritel (master produk, pembelian dari *supplier*, kasir POS beserta buka/tutup shift "
            "dan *day closing*, inventori berbasis *ledger*, retur/void berotorisasi, serta "
            "perhitungan SHU 80%:20%) sekaligus pengelolaan sesi dan pesanan unit jasa titip. Hasil "
            "pengujian *Black-Box* pada enam modul utama (12 skenario uji) menunjukkan tingkat "
            "keberhasilan 100%, termasuk penolakan status HTTP 401 pada tujuh rute terproteksi "
            "ketika diakses tanpa token autentikasi [1, 3, 5]."
        ),
        (
            "Integrasi model *Random Forest Regressor* (200 pohon keputusan, *max_depth* = 12, "
            "*min_samples_leaf* = 3) pada dataset dua tahun berisi 46 produk aktif dan 35.291 "
            "transaksi (5.060 baris fitur mingguan bersih: 4.876 latih dan 184 uji periode 10–31 "
            "Agustus 2026) menghasilkan peningkatan akurasi dibandingkan metode *Baseline* "
            "(*rolling_mean_4*). Nilai MAE turun dari 4,70 pcs menjadi 1,93 pcs per produk per "
            "minggu dan WAPE turun dari 31,52% menjadi 12,94%, sehingga ketepatan model naik "
            "18,58 poin persentase dari 68,48% menjadi 87,06% (versi pembulatan bilangan bulat "
            "pada tabel *sales_predictions* mencapai MAE 1,91 pcs, WAPE 12,79%, dan ketepatan "
            "87,21% dengan total proyeksi 2.668 pcs terhadap aktual 2.745 pcs). Analisis "
            "*feature importance* mengonfirmasi bahwa *rolling_mean_8* (67,59%) dan "
            "*is_payday_week* (16,65%) menjadi penentu utama skala permintaan dan kenaikan "
            "transaksi saat minggu gajian karyawan, diikuti *is_lebaran* (3,08%) dan "
            "*is_ramadan* (1,66%) [11, 12, 13]."
        ),
        (
            "Dari sisi implementasi sistem informasi, *pipeline* peramalan rekursif menyimpan 5.428 "
            "baris ke tabel *sales_predictions* dan memproyeksikan total kebutuhan sebesar 2.587 pcs "
            "untuk empat minggu pertama serta 5.552 pcs untuk delapan minggu (7 September–26 "
            "Oktober 2026), menghasilkan klasifikasi stok 0 produk *Kritis*, 2 produk *Perlu "
            "Restok* (*Pop Mie Baso 75g* dan *Aqua Air Mineral 600ml*), dan 44 produk *Aman* yang "
            "tampil langsung di halaman *Dashboard Admin* dan *Prediksi Penjualan*. Untuk "
            "pengembangan selanjutnya, model dapat diperkaya dengan peubah eksternal seperti data "
            "kehadiran karyawan harian, kalender hari libur nasional, dan catatan promosi khusus "
            "koperasi, dibandingkan dengan algoritma *boosting* seperti *XGBoost* atau *LightGBM*, "
            "serta dilengkapi penjadwalan pelatihan ulang otomatis setiap akhir pekan."
        ),
    ]

    for idx, text in enumerate(paragraphs):
        _insert_paragraph_before(
            anchor_referensi,
            text=text,
            align=WD_ALIGN_PARAGRAPH.JUSTIFY,
            space_before=0,
            space_after=6 if idx == len(paragraphs) - 1 else 4,
            size_pt=10.0,
            first_line_cm=0.5,
        )


def populate_metode_penelitian(doc, anchor_hasil) -> None:
    """Isi bab METODE PENELITIAN secara menyeluruh (sistem SIKOMU + Random Forest)."""
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Penelitian ini merancang dan membangun Sistem Informasi Koperasi Multi-Unit (SIKOMU) "
            "untuk Koperasi Karyawan Ciledug Jaya Makmur, yang mengelola dua unit usaha yaitu "
            "warung ritel dan jasa titip (*jastip*) [1, 2]. Lingkup penelitian mencakup pengembangan "
            "aplikasi web manajemen koperasi serta integrasi model *Random Forest Regressor* guna "
            "memproyeksikan permintaan mingguan barang ritel dan menghitung jumlah pengadaan ulang "
            "(*restock*) berdasarkan saldo stok gudang [11, 12]."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 1: Tahapan dan Kerangka Penelitian
    _insert_paragraph_before(
        anchor_hasil,
        text="1. Tahapan dan Kerangka Penelitian",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Kegiatan penelitian dijalankan melalui enam tahap berurutan. Tahap awal berupa "
            "observasi proses pencatatan transaksi di koperasi dan digitalisasi arsip penjualan ke "
            "basis data, dilanjutkan dengan analisis kebutuhan pengguna, perancangan skema data, "
            "serta pembangunan aplikasi web multi-unit [3, 4]. Setelah modul transaksional berjalan, "
            "data penjualan ritel diolah melalui tahap rekayasa fitur, pelatihan dan peramalan "
            "*Random Forest*, lalu diakhiri dengan pengujian fungsional sistem serta pengukuran "
            "kesalahan prediksi model. Alur keenam tahapan tersebut diperlihatkan pada Gambar 1."
        ),
        first_line_cm=0.5,
    )
    _insert_figure_before(
        anchor_hasil,
        FIGURES_DIR / "gambar_1_kerangka_penelitian.png",
        caption="**Gambar 1.** Kerangka dan tahapan penelitian sistem SIKOMU",
        width_cm=15.0,
    )

    # Sub-bab 2: Perancangan Arsitektur, Hak Akses, dan Basis Data
    _insert_paragraph_before(
        anchor_hasil,
        text="2. Perancangan Arsitektur, Hak Akses, dan Basis Data Sistem SIKOMU",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Aplikasi SIKOMU memakai arsitektur *client–server* empat lapis [1, 3]. Lapis antarmuka "
            "dibangun dengan *React*, *Vite*, dan *Material UI* yang terhubung ke lapis layanan REST "
            "API berbasis *Node.js* dan *Express* dengan autentikasi *JSON Web Token* (JWT). Seluruh "
            "data transaksional disimpan pada basis data relasional MySQL, sedangkan proses pelatihan "
            "dan peramalan *Random Forest* dijalankan oleh skrip Python (*scikit-learn*) yang "
            "dipanggil dari endpoint */api/predictions/run* serta membaca dan menulis langsung ke "
            "MySQL, seperti terlihat pada Gambar 2."
        ),
        first_line_cm=0.5,
    )
    _insert_figure_before(
        anchor_hasil,
        FIGURES_DIR / "gambar_2_arsitektur_sistem.png",
        caption="**Gambar 2.** Arsitektur sistem SIKOMU dan integrasi modul *Random Forest*",
        width_cm=15.0,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Hak akses pengguna diatur menggunakan mekanisme *Role-Based Access Control* (RBAC) yang "
            "membagi pengguna ke dalam empat peran, yaitu *System Administrator*, *Business "
            "Coordinator*, *Jastip Coordinator*, dan *Cooperative Member* [2]. Hubungan antara "
            "keempat aktor dengan fungsi sistem ditunjukkan pada diagram *use case* (Gambar 3), "
            "sementara rincian cakupan modul per peran dirangkum pada Tabel 1."
        ),
        first_line_cm=0.5,
    )
    _insert_figure_before(
        anchor_hasil,
        FIGURES_DIR / "gambar_3_use_case_sikomu.png",
        caption="**Gambar 3.** Diagram *use case* sistem manajemen koperasi multi-unit SIKOMU",
        width_cm=15.2,
    )
    _insert_table_before(
        doc,
        anchor_hasil,
        caption="**Tabel 1.** Matriks peran pengguna dan cakupan modul pada sistem SIKOMU",
        headers=["Peran (*Role*)", "Unit Terkait", "Hak Akses dan Modul Utama"],
        rows=[
            ["*System Administrator*", "Lintas Unit", "Persetujuan akun anggota, master divisi/departemen, *dashboard* gabungan, audit shift dan *day closing*, laporan penjualan/stok/pembelian/SHU, serta log aktivitas."],
            ["*Business Coordinator*", "Warung Ritel", "Master kategori/subkategori/brand/produk/supplier, POS kasir dengan shift (*blind close*), retur/void berotorisasi admin, pembelian, inventori *ledger*, dan prediksi restok."],
            ["*Jastip Coordinator*", "Jasa Titip", "Pengelolaan master vendor dan menu jastip, pembukaan serta pengaturan status sesi jastip, dan rekap pesanan per vendor."],
            ["*Cooperative Member*", "Jasa Titip", "Pemilihan menu pada sesi jastip aktif, transaksi pembayaran beserta unggah bukti transfer, dan pemantauan riwayat pesanan."],
        ],
        col_widths_cm=[3.6, 2.3, 10.02],
        col_aligns=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT],
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Basis data *cooperative_system_db* memuat 29 tabel relasional yang mencakup tabel master, "
            "transaksi warung ritel (*sales*, *sales_details*, *sale_payments*, *sale_returns*, "
            "*pos_shifts*, *pos_day_closings*, *purchases*, dan catatan mutasi stok berbasis "
            "*ledger* pada *inventory_transactions*), transaksi jasa titip (*vendors*, *menus*, "
            "*jastip_orders*, *jastip_order_details*, *payments*, *vendor_orders*) [6], serta tabel "
            "*sales_predictions* dan *activity_logs*. Pembagian Sisa Hasil Usaha (SHU) bersih unit "
            "ritel sesudah dikurangi nilai retur dialokasikan sebesar 80% untuk koperasi dan 20% "
            "untuk koordinator usaha sesuai (1):"
        ),
        first_line_cm=0.5,
    )
    _insert_equation_before(
        anchor_hasil,
        parts=[
            ("SHU", "normal"),
            ("koperasi", "sub"),
            (" = ", "normal"),
            ("P", "italic"),
            ("bersih", "sub"),
            (" − ⌊0,20 × ", "normal"),
            ("P", "italic"),
            ("bersih", "sub"),
            ("⌋,   SHU", "normal"),
            ("koordinator", "sub"),
            (" = ⌊0,20 × ", "normal"),
            ("P", "italic"),
            ("bersih", "sub"),
            ("⌋", "normal"),
        ],
        eq_num="1",
    )

    # Sub-bab 3: Pengumpulan Data dan Rekayasa Fitur
    _insert_paragraph_before(
        anchor_hasil,
        text="3. Pengumpulan Data dan Rekayasa Fitur (*Feature Engineering*)",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Sebelum SIKOMU digunakan, transaksi warung ritel dicatat di buku tulis harian dan "
            "direkap ke berkas Microsoft Excel. Data historis dari tanggal 1 Juli 2024 hingga "
            "6 September 2026 tersebut dibersihkan, diseragamkan satuan serta nama itemnya, lalu "
            "dimasukkan ke MySQL. Total data yang tersimpan meliputi 46 produk aktif (2 kategori, "
            "yaitu *Minuman* dan *Makanan Ringan*, yang terbagi ke dalam 14 subkategori dan 37 merek), "
            "35.291 transaksi penjualan, 70.893 baris rincian item, 228 transaksi pembelian, dan "
            "74.064 catatan mutasi inventori, ditambah 8 sesi jastip serta 19 akun pengguna."
        ),
        first_line_cm=0.5,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Untuk pemodelan deret waktu, transaksi harian diagregasikan menjadi interval mingguan "
            "(Senin–Minggu) dengan penanda awal minggu (*week_start*) dari 1 Juli 2024 hingga "
            "31 Agustus 2026 berjumlah 114 minggu [10]. Setiap produk dipetakan pada matriks penuh "
            "46 produk × 114 minggu = 5.244 baris observasi; minggu tanpa penjualan diisi 0, "
            "sedangkan harga jual mingguan yang kosong diisi memakai metode *forward-fill* dan "
            "*backward-fill* dari *selling_price* [11, 12]. Dari deret mingguan ini dibentuk 14 "
            "fitur prediktor (*X*) dan 1 variabel target (*qty*) pada Tabel 2."
        ),
        first_line_cm=0.5,
    )
    _insert_table_before(
        doc,
        anchor_hasil,
        caption="**Tabel 2.** Daftar variabel fitur dan target pada pemodelan *Random Forest*",
        headers=["Kelompok Fitur", "Nama Variabel", "Tipe", "Keterangan"],
        rows=[
            ["Atribut Produk", "product_id", "*Integer*", "Nomor identitas unik produk aktif (1 sampai 69)"],
            ["Atribut Produk", "category_id", "*Integer*", "Identitas kategori produk (Minuman dan Makanan Ringan)"],
            ["Atribut Produk", "price", "*Float*", "Rata-rata harga jual produk pada minggu berjalan (Rp)"],
            ["Fitur *Lag*", "lag_1 s/d lag_4", "*Float*", "Kuantitas terjual pada 1, 2, 3, dan 4 minggu sebelumnya"],
            ["Tren Bergerak", "rolling_mean_4", "*Float*", "Rata-rata kuantitas terjual 4 minggu sebelumnya (*t*−4 s/d *t*−1)"],
            ["Tren Bergerak", "rolling_mean_8", "*Float*", "Rata-rata kuantitas terjual 8 minggu sebelumnya (*t*−8 s/d *t*−1)"],
            ["Kalender & Gajian", "month", "*Integer*", "Nomor bulan dalam tahun kalender (1 sampai 12)"],
            ["Kalender & Gajian", "week_of_month", "*Integer*", "Posisi minggu ke-*k* di dalam satu bulan (1 sampai 5)"],
            ["Kalender & Gajian", "is_payday_week", "*Binary*", "Bernilai 1 jika minggu memuat tanggal 25–31 atau 1–5; 0 selainnya"],
            ["Hari Besar", "is_ramadan", "*Binary*", "Bernilai 1 jika rentang minggu bersinggungan dengan bulan Ramadan"],
            ["Hari Besar", "is_lebaran", "*Binary*", "Bernilai 1 jika rentang minggu berada pada H−7 hingga H+7 Idul Fitri"],
            ["Target (*y*)", "qty", "*Integer*", "Jumlah unit produk terjual pada minggu ke-*t* (pcs/unit)"],
        ],
        col_widths_cm=[3.2, 3.3, 1.8, 7.62],
        col_aligns=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT],
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Pada perhitungan *rolling mean* dengan jendela *w* ∈ {4, 8} minggu, data penjualan "
            "digeser satu minggu ke belakang (*shift-1*) sebelum dirata-ratakan supaya nilai "
            "aktual minggu ke-*t* tidak masuk ke fitur masukan minggu bersangkutan (*data leakage*), "
            "sesuai (2). Empat minggu awal per produk dihapus karena belum memiliki *lag_1* hingga "
            "*lag_4* yang lengkap, sehingga tersisa 110 minggu (29 Juli 2024 hingga 31 Agustus 2026) "
            "atau 46 × 110 = 5.060 baris siap latih."
        ),
        first_line_cm=0.5,
    )
    _insert_equation_before(
        anchor_hasil,
        parts=[
            ("RollingMean", "italic"),
            ("p,t", "sub"),
            ("(w)", "sup"),
            (" = (1 / ", "normal"),
            ("w", "italic"),
            (") · Σ", "normal"),
            ("k=1..w", "sub"),
            (" y", "italic"),
            ("p, t−k", "sub"),
        ],
        eq_num="2",
    )

    # Sub-bab 4: Pemodelan Random Forest dan Rekomendasi Restok
    _insert_paragraph_before(
        anchor_hasil,
        text="4. Pemodelan *Random Forest* dan Perhitungan Rekomendasi Restok",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Data latih dan data uji dipisahkan berdasarkan urutan waktu (*time-based split*) tanpa "
            "pengacakan baris [11, 14]. Sebanyak 106 minggu pertama (29 Juli 2024 hingga 3 Agustus "
            "2026, berjumlah 4.876 baris) dijadikan data latih, sedangkan 4 minggu terakhir (10 "
            "Agustus hingga 31 Agustus 2026, berjumlah 184 baris) dijadikan data uji. Untuk mengisi "
            "perbandingan *backtest* pada minggu historis di dalam himpunan latih, digunakan "
            "*5-fold K-Fold* berbasis *week_start* sehingga setiap minggu uji pada fold tidak "
            "tercampur dengan data latihnya."
        ),
        first_line_cm=0.5,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Model *Random Forest Regressor* dikonfigurasi dengan *n_estimators* = 200, *max_depth* "
            "= 12, *min_samples_leaf* = 3, dan *random_state* = 42. Nilai prediksi akhir merupakan "
            "rata-rata keluaran seluruh pohon keputusan dengan batas bawah nol seperti dituliskan "
            "pada (3) [13, 14]:"
        ),
        first_line_cm=0.5,
    )
    _insert_equation_before(
        anchor_hasil,
        parts=[
            ("ŷ", "italic"),
            ("p,t", "sub"),
            (" = max(0,  (1 / ", "normal"),
            ("B", "italic"),
            (") · Σ", "normal"),
            ("b=1..B", "sub"),
            (" T", "italic"),
            ("b", "sub"),
            ("(", "normal"),
            ("x", "italic"),
            ("p,t", "sub"),
            ("))", "normal"),
        ],
        eq_num="3",
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Setelah pengujian pada 4 minggu terakhir, model dilatih kembali memakai seluruh 5.060 "
            "baris data historis untuk meramalkan 8 minggu ke depan secara bertahap (*recursive "
            "forecasting*), di mana nilai prediksi minggu ke-(*t*+1) dimasukkan kembali sebagai "
            "*lag_1* bagi iterasi minggu berikutnya. Tahapan lengkap *pipeline* dirangkum pada Gambar 4."
        ),
        first_line_cm=0.5,
    )
    _insert_figure_before(
        anchor_hasil,
        FIGURES_DIR / "gambar_4_alur_random_forest.png",
        caption="**Gambar 4.** Alur ekstraksi, pelatihan, evaluasi, dan peramalan *Random Forest*",
        width_cm=15.0,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Hasil *backtest* dan peramalan 8 minggu disimpan ke tabel *sales_predictions*, lalu "
            "digabungkan dengan saldo stok berjalan (*S*aktual,p) dari *inventory_transactions* serta "
            "batas stok minimum (*S*min,p) pada tabel *products* untuk menghitung kebutuhan pengadaan "
            "ulang pada horizon *K* ∈ {1, 2, 4, 8} minggu menggunakan (4):"
        ),
        first_line_cm=0.5,
    )
    _insert_equation_before(
        anchor_hasil,
        parts=[
            ("Restok", "normal"),
            ("p,K", "sub"),
            (" = max(0,  Σ", "normal"),
            ("h=1..K", "sub"),
            (" ŷ", "italic"),
            ("p, t+h", "sub"),
            (" + ", "normal"),
            ("S", "italic"),
            ("min,p", "sub"),
            (" − ", "normal"),
            ("S", "italic"),
            ("aktual,p", "sub"),
            (")", "normal"),
        ],
        eq_num="4",
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Status stok tiap produk ditetapkan berdasarkan dua ambang tersebut: **Kritis** apabila "
            "*S*aktual,p ≤ *S*min,p, **Perlu Restok** apabila *S*aktual,p > *S*min,p dengan nilai "
            "Restok 1 Minggu > 0, dan **Aman** apabila Restok 1 Minggu = 0."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 5: Metode Pengujian Sistem dan Evaluasi Model
    _insert_paragraph_before(
        anchor_hasil,
        text="5. Metode Pengujian Sistem dan Evaluasi Model",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Fungsionalitas aplikasi web SIKOMU diuji menggunakan metode *Black-Box Testing* dengan "
            "mengamati kesesuaian masukan dan keluaran pada antarmuka serta endpoint API tanpa "
            "memeriksa struktur kode sumber [3, 5]. Rencana pengujian mencakup enam modul utama "
            "sebagaimana tercantum pada Tabel 3."
        ),
        first_line_cm=0.5,
    )
    _insert_table_before(
        doc,
        anchor_hasil,
        caption="**Tabel 3.** Rencana skenario pengujian *Black-Box* pada sistem SIKOMU",
        headers=["Modul Pengujian", "Skenario Uji Utama", "Keluaran yang Diharapkan"],
        rows=[
            ["Autentikasi & RBAC", "Login empat peran pengguna, validasi token JWT, dan akses URL di luar wewenang peran.", "Token diterbitkan sesuai peran; akses di luar hak peran ditolak dengan status HTTP 401 atau 403."],
            ["POS Kasir & Shift", "Pembukaan shift, transaksi *cash/QRIS/transfer/mixed*, retur/void berotorisasi admin, dan *blind close*.", "Stok dan kas shift sesuai penjumlahan transaksi; retur/void gagal tanpa kredensial admin yang valid."],
            ["Pembelian & Inventori", "Pencatatan pembelian dari *supplier*, *adjustment* masuk/keluar, dan filter kartu stok.", "Saldo stok bertambah atau berkurang pada *inventory_transactions* dan tercatat di *activity_logs*."],
            ["Unit Jasa Titip", "Pembukaan sesi jastip, pemesanan menu oleh anggota, unggah bukti bayar, dan penyelesaian sesi.", "Rekap pesanan per vendor serta total penjualan, profit, dan SHU sesi jastip tersimpan ke basis data."],
            ["Dashboard & Laporan", "Pengubahan filter periode *dashboard*, verifikasi audit shift, *day closing*, dan ekspor PDF laporan.", "Angka ringkasan dan grafik tampil sesuai periode terpilih; berkas PDF laporan dapat diunduh."],
            ["Prediksi & Restok", "Pembacaan ringkasan prediksi RF dan pembaruan model melalui endpoint */api/predictions/run*.", "Baris *sales_predictions*, nilai MAE/WAPE, serta status stok produk diperbarui sesuai hasil hitung terbaru."],
        ],
        col_widths_cm=[3.5, 6.2, 6.22],
        col_aligns=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Evaluasi model *Random Forest* pada 184 baris data uji (*n* = 184) dibandingkan "
            "terhadap metode *Baseline* berupa rata-rata bergerak 4 minggu (*rolling_mean_4*). "
            "Pengukuran galat menggunakan *Mean Absolute Error* (MAE) dan *Weighted Absolute "
            "Percentage Error* (WAPE) karena nilai penjualan nol pada minggu tertentu menyebabkan "
            "MAPE per baris menjadi tidak terdefinisi [10, 12]. Rumus MAE, WAPE, dan ketepatan "
            "model dituliskan pada (5), (6), dan (7):"
        ),
        first_line_cm=0.5,
    )
    _insert_equation_before(
        anchor_hasil,
        parts=[
            ("MAE = (1 / ", "normal"),
            ("n", "italic"),
            (") · Σ", "normal"),
            ("i=1..n", "sub"),
            (" |", "normal"),
            ("y", "italic"),
            ("i", "sub"),
            (" − ", "normal"),
            ("ŷ", "italic"),
            ("i", "sub"),
            ("|", "normal"),
        ],
        eq_num="5",
    )
    _insert_equation_before(
        anchor_hasil,
        parts=[
            ("WAPE = ( Σ", "normal"),
            ("i=1..n", "sub"),
            (" |", "normal"),
            ("y", "italic"),
            ("i", "sub"),
            (" − ", "normal"),
            ("ŷ", "italic"),
            ("i", "sub"),
            ("| / Σ", "normal"),
            ("i=1..n", "sub"),
            (" |", "normal"),
            ("y", "italic"),
            ("i", "sub"),
            ("| ) × 100%", "normal"),
        ],
        eq_num="6",
    )
    _insert_equation_before(
        anchor_hasil,
        parts=[
            ("Ketepatan = max(0,  100% − WAPE)", "normal"),
        ],
        eq_num="7",
    )


def populate_referensi(doc) -> None:
    """Isi bab REFERENSI sesuai gaya IEEE [1]..[15] dengan hanging indent 0.75 cm."""
    _clear_after_heading(doc, "REFERENSI")
    for ref_text in IEEE_REFERENCES:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        pf = p.paragraph_format
        pf.line_spacing = 1.0
        pf.space_before = Pt(0)
        pf.space_after = Pt(3)
        pf.left_indent = Cm(0.75)
        pf.first_line_indent = Cm(-0.75)
        _add_formatted_runs(p, ref_text, size_pt=10)


def populate_hasil_dan_pembahasan(doc, anchor_kesimpulan) -> None:
    """Isi bab HASIL DAN PEMBAHASAN tepat sebelum heading KESIMPULAN."""
    # Sub-bab 1: Implementasi Antarmuka Sistem SIKOMU
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="1. Implementasi Antarmuka Sistem SIKOMU",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=4,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Aplikasi web SIKOMU dibangun menggunakan *React*, *Vite*, dan *Material UI* pada sisi "
            "antarmuka yang berkomunikasi dengan layanan *Express* dan basis data MySQL untuk "
            "melayani empat peran pengguna, yaitu *System Administrator*, *Business Coordinator*, "
            "*Jastip Coordinator*, dan *Cooperative Member* [1, 2]. Halaman ringkasan untuk "
            "pengelola koperasi menampilkan kinerja gabungan kedua unit usaha beserta ringkasan "
            "prioritas pengadaan barang ritel, seperti ditunjukkan pada Gambar 5."
        ),
        first_line_cm=0.5,
    )
    _insert_figure_before(
        anchor_kesimpulan,
        FIGURES_DIR / "gambar_5_ui_dashboard.png",
        caption="**Gambar 5.** Antarmuka *Dashboard Admin* yang menampilkan ringkasan penjualan, profit, SHU, dan prioritas restok",
        width_cm=14.8,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Pada unit warung ritel, *Business Coordinator* mengelola penjualan melalui modul "
            "*Point of Sale* (POS) yang mensyaratkan pembukaan shift kasir beserta pencatatan modal "
            "awal laci kas sebelum transaksi berlangsung [3, 5]. Antarmuka kasir memuat kolom "
            "pemindaian *barcode*, penyaring kategori, kartu produk dengan indikator sisa stok, "
            "serta panel keranjang belanja seperti terlihat pada Gambar 6."
        ),
        first_line_cm=0.5,
    )
    _insert_figure_before(
        anchor_kesimpulan,
        FIGURES_DIR / "gambar_6_ui_pos.png",
        caption="**Gambar 6.** Antarmuka modul *Penjualan / POS* dalam kondisi shift aktif beserta katalog produk dan keranjang",
        width_cm=14.8,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Unit usaha jasa titip dikelola secara terpisah oleh *Jastip Coordinator* mulai dari "
            "pendataan vendor dan menu, pembukaan sesi pemesanan, hingga pencatatan riwayat sesi "
            "yang telah selesai [6]. Halaman riwayat sesi pada Gambar 7 memperlihatkan delapan sesi "
            "jasa titip yang tercatat lengkap beserta jumlah menu, vendor, dan pesanan anggota pada "
            "masing-masing sesi."
        ),
        first_line_cm=0.5,
    )
    _insert_figure_before(
        anchor_kesimpulan,
        FIGURES_DIR / "gambar_7_ui_jastip.png",
        caption="**Gambar 7.** Antarmuka halaman *Riwayat Sesi* jasa titip yang merekam sesi selesai beserta rekap menu, vendor, dan pesanan",
        width_cm=14.8,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Keluaran model *Random Forest* disajikan pada halaman *Prediksi Penjualan* yang "
            "dapat diakses oleh *System Administrator* dan *Business Coordinator* [11, 12]. Halaman "
            "ini menampilkan kartu metrik akurasi model (87,21% dengan WAPE 12,79% dan MAE 1,91), "
            "jumlah produk yang memerlukan pengadaan ulang, total proyeksi 4 minggu (2.587 pcs), "
            "grafik perbandingan data aktual terhadap kurva prediksi per produk, serta tombol "
            "pembaruan model menuju endpoint */api/predictions/run* seperti pada Gambar 8."
        ),
        first_line_cm=0.5,
    )
    _insert_figure_before(
        anchor_kesimpulan,
        FIGURES_DIR / "gambar_8_ui_prediksi.png",
        caption="**Gambar 8.** Antarmuka halaman *Prediksi Penjualan* yang menampilkan metrik evaluasi dan grafik aktual terhadap prediksi",
        width_cm=14.8,
    )

    # Sub-bab 2: Hasil Pengujian Fungsional (Black-Box Testing)
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="2. Hasil Pengujian Fungsional (*Black-Box Testing*)",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Pengujian *Black-Box* dijalankan untuk memastikan seluruh masukan dan keluaran pada "
            "enam modul utama SIKOMU berjalan sesuai rancangan pada Tabel 3 [3, 5]. Pemeriksaan "
            "mencakup 12 skenario uji yang mencakup proteksi endpoint API tanpa token autentikasi, "
            "pengalihan rute sesuai peran pengguna, siklus pembukaan dan penutupan shift kasir, "
            "pencatatan stok serta laporan transaksi, hingga pembaruan hasil prediksi *Random "
            "Forest*. Rangkuman hasil uji disajikan pada Tabel 4."
        ),
        first_line_cm=0.5,
    )
    _insert_table_before(
        doc,
        anchor_kesimpulan,
        caption="**Tabel 4.** Hasil pengujian *Black-Box* pada enam modul utama sistem SIKOMU",
        headers=["No", "Modul", "Skenario Pengujian", "Hasil yang Diamati", "Status"],
        rows=[
            ["1", "Autentikasi & RBAC", "Akses endpoint API terproteksi tanpa token JWT pada tujuh rute utama sistem.", "Seluruh tujuh endpoint menolak akses dan mengembalikan status HTTP 401.", "Sesuai"],
            ["2", "Autentikasi & RBAC", "Login akun *System Administrator*, *Business Coordinator*, dan *Jastip Coordinator*.", "Pengguna dialihkan ke *dashboard* masing-masing peran dan rute peran lain diblokir.", "Sesuai"],
            ["3", "POS Kasir & Shift", "Pembukaan shift kasir dengan modal awal Rp 200.000 pada halaman *Penjualan / POS*.", "Status shift aktif terbentuk (*SHF-20261128-0001*) serta katalog produk dan keranjang terbuka.", "Sesuai"],
            ["4", "POS Kasir & Shift", "Penambahan item ke keranjang serta penutupan shift melalui tab *Shift Kasir*.", "Subtotal item terhitung otomatis dan shift tertutup rapi dengan saldo kas akhir tercatat.", "Sesuai"],
            ["5", "Pembelian & Inventori", "Pengecekan daftar produk aktif beserta nilai batas stok minimum dan satuan unit.", "Seluruh 46 produk ritel aktif tampil lengkap beserta kategori dan stok berjalannya.", "Sesuai"],
            ["6", "Pembelian & Inventori", "Pembacaan ringkasan stok gudang melalui endpoint */api/inventory/stocks*.", "Saldo stok akhir tiap SKU sesuai agregasi mutasi masuk dan keluar pada *ledger*.", "Sesuai"],
            ["7", "Unit Jasa Titip", "Pembacaan daftar sesi aktif dan riwayat sesi pada akun *Jastip Coordinator*.", "Status sesi aktif terdeteksi akurat dan 8 sesi selesai tampil di tabel riwayat sesi.", "Sesuai"],
            ["8", "Unit Jasa Titip", "Pemeriksaan detail rekap menu, jumlah vendor, dan pesanan per sesi jastip.", "Setiap baris riwayat sesi menampilkan hitungan menu, vendor, dan pesanan yang cocok.", "Sesuai"],
            ["9", "Dashboard & Laporan", "Pembukaan *Dashboard Admin* dengan filter periode *1 Bulan Terakhir*.", "Kartu Penjualan Rp 17,6 jt, Profit Rp 4,3 jt, dan SHU Rp 3,4 jt termuat tanpa galat.", "Sesuai"],
            ["10", "Dashboard & Laporan", "Pemeriksaan widget prioritas restok pada *Dashboard Admin*.", "Widget menampilkan akurasi 87,21% serta dua produk berstatus perlu restok beserta jumlahnya.", "Sesuai"],
            ["11", "Prediksi & Restok", "Pembacaan ringkasan evaluasi dan proyeksi pada halaman *Prediksi Penjualan*.", "Metrik MAE, WAPE, akurasi, total prediksi 4 minggu, dan grafik produk tampil lengkap.", "Sesuai"],
            ["12", "Prediksi & Restok", "Eksekusi *pipeline* pelatihan dan penyimpanan hasil ke tabel *sales_predictions*.", "Sebanyak 5.428 baris tersimpan (5.060 evaluasi dan 368 prediksi 8 minggu) ke MySQL.", "Sesuai"],
        ],
        col_widths_cm=[0.85, 2.85, 5.15, 5.52, 1.55],
        col_aligns=[
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.CENTER,
        ],
        font_size_pt=8.0,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Seluruh 12 skenario pengujian pada Tabel 4 menghasilkan keluaran yang sesuai dengan "
            "spesifikasi (100% lulus uji), termasuk penolakan HTTP 401 pada tujuh rute terproteksi "
            "(*/api/admin/dashboard/stats*, */api/predictions*, */api/sales*, */api/products*, "
            "*/api/inventory/stocks*, */api/purchases*, dan */api/jastip/sessions*) ketika "
            "diakses tanpa kredensial."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 3: Hasil Transformasi Dataset dan Evaluasi Model Random Forest
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="3. Hasil Transformasi Dataset dan Evaluasi Model *Random Forest*",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Ekstraksi data dua tahun dari basis data MySQL SIKOMU mencakup 46 produk ritel aktif "
            "yang tersebar ke dalam 2 kategori (*Minuman* dan *Makanan Ringan*), 14 subkategori, "
            "dan 37 merek. Agregasi 35.291 transaksi harian pada periode 1 Juli 2024 hingga 6 "
            "September 2026 menjadi deret waktu mingguan (Senin–Minggu, batas akhir minggu 31 "
            "Agustus 2026) menghasilkan matriks penuh sebesar 46 produk × 114 minggu = 5.244 baris. "
            "Setelah empat minggu awal per produk dihapus agar fitur *lag_1* hingga *lag_4* terisi "
            "lengkap, tersisa 5.060 baris bersih (110 minggu, dari 29 Juli 2024 hingga 31 Agustus "
            "2026) yang dibagi secara berurutan menjadi 4.876 baris data latih (106 minggu) dan "
            "184 baris data uji (4 minggu terakhir, 10–31 Agustus 2026)."
        ),
        first_line_cm=0.5,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Evaluasi pada 184 baris data uji memperlihatkan bahwa model *Random Forest Regressor* "
            "menghasilkan galat lebih rendah dibandingkan metode *Baseline* (*rolling_mean_4*), "
            "baik sebelum maupun sesudah pembulatan ke bilangan bulat yang disimpan di basis data "
            "[11, 13]. Ringkasan metrik kesalahan dan ketepatan kedua metode dirangkum pada Tabel 5."
        ),
        first_line_cm=0.5,
    )
    _insert_table_before(
        doc,
        anchor_kesimpulan,
        caption="**Tabel 5.** Perbandingan kesalahan dan ketepatan prediksi pada data uji (10–31 Agustus 2026)",
        headers=["Metode Prediksi", "Baris Uji (*n*)", "MAE (pcs/minggu)", "WAPE (%)", "Ketepatan (%)"],
        rows=[
            ["*Baseline* (*rolling_mean_4*)", "184", "4,70", "31,52%", "68,48%"],
            ["*Random Forest Regressor* (*rf_v1*, kontinu)", "184", "1,93", "12,94%", "87,06%"],
            ["*Random Forest Regressor* (*rf_v1*, bulat DB)", "184", "1,91", "12,79%", "87,21%"],
            ["Selisih Perbaikan (*RF* kontinu vs *Baseline*)", "—", "−2,77", "−18,58 poin", "+18,58 poin"],
        ],
        col_widths_cm=[5.9, 2.2, 2.8, 2.5, 2.52],
        col_aligns=[
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.CENTER,
        ],
    )
    _insert_figure_before(
        anchor_kesimpulan,
        FIGURES_DIR / "gambar_9_evaluasi_model.png",
        caption="**Gambar 9.** Perbandingan total penjualan mingguan aktual terhadap prediksi *Random Forest* dan *Baseline* serta galat MAE dan WAPE pada periode uji",
        width_cm=15.2,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Pada Tabel 5, *Baseline* menghasilkan MAE sebesar 4,70 pcs per produk per minggu "
            "dengan WAPE 31,52% (ketepatan 68,48%). Model *Random Forest* menurunkan MAE menjadi "
            "1,93 pcs dan WAPE menjadi 12,94% (ketepatan 87,06%), atau berkurang 18,58 poin "
            "persentase galat dibandingkan *Baseline*. Untuk versi bilangan bulat yang tersimpan "
            "di tabel *sales_predictions*, total permintaan terprediksi berjumlah 2.668 pcs "
            "dibandingkan penjualan aktual sebesar 2.745 pcs (selisih total 77 pcs atau 2,81%), "
            "dengan MAE 1,91 pcs, WAPE 12,79%, dan ketepatan 87,21%."
        ),
        first_line_cm=0.5,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Gambar 9(a) menjelaskan penyebab perbedaan kinerja tersebut dari pola mingguan data "
            "uji [10, 12]. Pada dua minggu non-gajian (10 dan 17 Agustus 2026), penjualan aktual "
            "tercatat 471 pcs dan 545 pcs; prediksi *Random Forest* mengikuti di angka 537 pcs "
            "dan 538 pcs, sedangkan *Baseline* tertahan tinggi pada 714,5 pcs dan 679,5 pcs karena "
            "masih terbawa volume minggu gajian akhir Juli–awal Agustus. Memasuki dua minggu gajian "
            "(24 dan 31 Agustus 2026), permintaan aktual naik menjadi 857 pcs dan 872 pcs. "
            "*Random Forest* langsung menyesuaikan ke angka 788 pcs dan 805 pcs, sementara "
            "*Baseline* justru turun ke 613,8 pcs dan 638,0 pcs karena rata-rata empat minggu "
            "sebelumnya didominasi periode non-gajian."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 4: Kontribusi Variabel Fitur (Feature Importance)
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="4. Kontribusi Variabel Fitur (*Feature Importance*)",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Perhitungan *feature importance* pada model final yang dilatih menggunakan seluruh "
            "5.060 baris data historis digunakan untuk mengukur seberapa besar kontribusi tiap "
            "fitur dalam pemisahan cabang 200 pohon keputusan [11, 14]. Daftar sepuluh fitur "
            "dengan bobot tertinggi tercantum pada Tabel 6 dan divisualisasikan pada Gambar 10."
        ),
        first_line_cm=0.5,
    )
    _insert_table_before(
        doc,
        anchor_kesimpulan,
        caption="**Tabel 6.** Sepuluh fitur dengan kontribusi tertinggi pada model *Random Forest*",
        headers=["Peringkat", "Nama Fitur", "Nilai Kontribusi", "Persentase (%)", "Peran dalam Pemodelan"],
        rows=[
            ["1", "rolling_mean_8", "0,6759", "67,59%", "Menentukan skala dasar permintaan tiap produk"],
            ["2", "is_payday_week", "0,1665", "16,65%", "Menyesuaikan kenaikan permintaan saat minggu gajian"],
            ["3", "is_lebaran", "0,0308", "3,08%", "Menangkap lonjakan konsumsi sekitar Idul Fitri"],
            ["4", "rolling_mean_4", "0,0236", "2,36%", "Mengikuti pergeseran tren permintaan satu bulan terakhir"],
            ["5", "product_id", "0,0168", "1,68%", "Membedakan karakteristik spesifik antar-SKU produk"],
            ["6", "is_ramadan", "0,0166", "1,66%", "Menangkap perubahan pola belanja selama bulan Ramadan"],
            ["7", "lag_1", "0,0152", "1,52%", "Mencatat volume penjualan 1 minggu sebelumnya"],
            ["8", "month", "0,0132", "1,32%", "Memberi informasi posisi bulan kalender berjalan"],
            ["9", "lag_4", "0,0118", "1,18%", "Mencatat volume penjualan pada siklus 4 minggu lalu"],
            ["10", "lag_2", "0,0096", "0,96%", "Mencatat volume penjualan 2 minggu sebelumnya"],
        ],
        col_widths_cm=[1.7, 2.9, 2.3, 2.3, 6.72],
        col_aligns=[
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.LEFT,
        ],
    )
    _insert_figure_before(
        anchor_kesimpulan,
        FIGURES_DIR / "gambar_10_feature_importance.png",
        caption="**Gambar 10.** Distribusi bobot kontribusi sepuluh fitur utama pada model *Random Forest*",
        width_cm=14.6,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Berdasarkan Tabel 6 dan Gambar 10, dua fitur teratas yaitu *rolling_mean_8* (67,59%) "
            "dan *is_payday_week* (16,65%) menyumbang 84,24% dari total bobot keputusan pohon. "
            "*Rolling mean* delapan minggu memisahkan kelompok barang cepat laku dari barang "
            "lambat laku, sementara penanda minggu gajian membedakan pekan belanja karyawan pada "
            "tanggal 25–31 dan 1–5 dari minggu pertengahan bulan. Keberadaan dataset historis "
            "sepanjang dua tahun penuh juga membuat penanda hari besar *is_lebaran* (3,08%) dan "
            "*is_ramadan* (1,66%) terekam selama dua periode Ramadan dan Idul Fitri (2025 dan "
            "2026) sehingga berkontribusi bersama *rolling_mean_4* dan fitur *lag*."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 5: Peramalan 8 Minggu ke Depan dan Rekomendasi Restok pada Sistem Web
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="5. Peramalan 8 Minggu ke Depan dan Rekomendasi Restok pada Sistem Web",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Eksekusi skrip pelatihan dan peramalan menyimpan 5.428 baris ke tabel "
            "*sales_predictions*, terdiri atas 5.060 baris evaluasi historis dan 368 baris "
            "peramalan rekursif untuk 46 produk aktif selama 8 minggu ke depan (periode 7 "
            "September hingga 26 Oktober 2026). Total proyeksi permintaan seluruh produk tercatat "
            "sebesar 2.587 pcs untuk 4 minggu pertama dan 5.552 pcs untuk keseluruhan 8 minggu. "
            "Saat dipadukan dengan saldo stok berjalan dan stok minimum pada horizon 1 minggu, "
            "sistem mengklasifikasikan 0 produk berstatus **Kritis**, 2 produk berstatus **Perlu "
            "Restok** (*Pop Mie Baso 75g* dan *Aqua Air Mineral 600ml*), serta 44 produk berstatus "
            "**Aman**. Sepuluh produk dengan urutan kebutuhan pengadaan tertinggi disajikan pada "
            "Tabel 7."
        ),
        first_line_cm=0.5,
    )
    _insert_table_before(
        doc,
        anchor_kesimpulan,
        caption="**Tabel 7.** Hasil prediksi 4 dan 8 minggu (7 September–26 Oktober 2026) serta rekomendasi restok 10 produk teratas (M+1..M+4: minggu ke-1 s/d ke-4; R1, R4: saran restok 1 dan 4 minggu)",
        headers=[
            "Nama Produk",
            "Stok",
            "Min",
            "M+1",
            "M+2",
            "M+3",
            "M+4",
            "4 Mg",
            "8 Mg",
            "R1",
            "R4",
            "Status",
        ],
        rows=[
            ["Pop Mie Baso 75g", "42", "30", "14", "13", "19", "21", "67", "149", "2", "55", "Perlu Restok"],
            ["Aqua Air Mineral 600ml", "48", "24", "25", "21", "31", "32", "109", "229", "1", "85", "Perlu Restok"],
            ["Indomie Goreng Spesial 85g", "68", "40", "25", "21", "30", "30", "106", "224", "0", "78", "Aman"],
            ["Le Minerale 600ml", "55", "24", "25", "20", "27", "29", "101", "219", "0", "70", "Aman"],
            ["Teh Pucuk Harum 350ml", "58", "24", "23", "21", "28", "28", "100", "210", "0", "66", "Aman"],
            ["Beng-Beng Wafer Cokelat", "67", "40", "19", "18", "25", "26", "88", "186", "0", "61", "Aman"],
            ["Indomie Soto Mie 70g", "65", "36", "21", "18", "26", "25", "90", "195", "0", "61", "Aman"],
            ["Pop Mie Ayam 75g", "62", "30", "19", "19", "26", "27", "91", "196", "0", "59", "Aman"],
            ["Indomie Ayam Bawang 69g", "66", "36", "19", "18", "24", "24", "85", "178", "0", "55", "Aman"],
            ["Mie Sedaap Goreng 90g", "65", "36", "18", "17", "24", "24", "83", "174", "0", "54", "Aman"],
        ],
        col_widths_cm=[4.27, 0.90, 0.85, 0.90, 0.90, 0.90, 0.90, 1.00, 1.00, 0.95, 1.05, 2.30],
        col_aligns=[
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.CENTER,
        ],
        font_size_pt=8.0,
        cell_lr_dxa=50,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Data pada Tabel 7 memperlihatkan konsistensi pola kenaikan dari minggu non-gajian ke "
            "minggu gajian. Sebagai contoh, proyeksi *Aqua Air Mineral 600ml* pada M+1 (7 September) "
            "dan M+2 (14 September) masing-masing berjumlah 25 pcs dan 21 pcs, lalu naik menjadi "
            "31 pcs pada M+3 (21 September) dan 32 pcs pada M+4 (28 September). Pada sisi "
            "pengendalian stok, *Pop Mie Baso 75g* memiliki stok gudang 42 pcs, batas minimum 30 "
            "pcs, dan prediksi minggu pertama 14 pcs. Karena sisa stok diperkirakan turun menjadi "
            "28 pcs di bawah batas minimum, persamaan (4) menghasilkan saran restok sebesar 2 pcs "
            "untuk horizon 1 minggu, 55 pcs untuk 4 minggu, dan 137 pcs untuk 8 minggu. Hal serupa "
            "terjadi pada *Aqua Air Mineral 600ml* dengan stok 48 pcs, batas minimum 24 pcs, dan "
            "prediksi minggu pertama 25 pcs sehingga membutuhkan tambahan minimal 1 pcs pada minggu "
            "berjalan serta 85 pcs untuk kebutuhan 4 minggu dan 205 pcs untuk 8 minggu."
        ),
        first_line_cm=0.5,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Perbarui bagian jurnal di template jurnal.docx")
    parser.add_argument(
        "--section",
        choices=["abstrak", "pendahuluan", "metode", "hasil", "kesimpulan", "referensi", "front_end", "all"],
        default="metode",
        help="Bagian yang akan diisi (abstrak, pendahuluan, metode, hasil, kesimpulan, referensi, front_end, atau all).",
    )
    args = parser.parse_args()

    doc = docx.Document(DOC_PATH)

    title_p = doc.paragraphs[0]
    title_p.text = ""
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = title_p.add_run(JOURNAL_TITLE)
    _set_run_font(r_title, size_pt=14, bold=True)

    if args.section in ("abstrak", "front_end", "all"):
        populate_abstrak(doc)

    if args.section in ("pendahuluan", "front_end", "all"):
        anchor_metode = _clear_between_headings(doc, "PENDAHULUAN", "METODE PENELITIAN")
        populate_pendahuluan(doc, anchor_metode)

    if args.section in ("metode", "all"):
        anchor_hasil = _clear_between_headings(doc, "METODE PENELITIAN", "HASIL DAN PEMBAHASAN")
        populate_metode_penelitian(doc, anchor_hasil)
        populate_referensi(doc)
    elif args.section == "referensi":
        populate_referensi(doc)

    if args.section in ("hasil", "all"):
        anchor_kesimpulan = _clear_between_headings(doc, "HASIL DAN PEMBAHASAN", "KESIMPULAN")
        populate_hasil_dan_pembahasan(doc, anchor_kesimpulan)

    if args.section in ("kesimpulan", "front_end", "all"):
        anchor_referensi = _clear_between_headings(doc, "KESIMPULAN", "REFERENSI")
        populate_kesimpulan(doc, anchor_referensi)

    try:
        doc.save(DOC_PATH)
        print(f"Berhasil memperbarui ({args.section}): {DOC_PATH}")
    except PermissionError:
        doc.save(FALLBACK_PATH)
        print(f"File asli sedang dibuka, disimpan ke: {FALLBACK_PATH}")


if __name__ == "__main__":
    main()
