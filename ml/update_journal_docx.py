"""Isi bab Metode Penelitian dan Hasil dan Pembahasan ke dalam assets/template jurnal.docx."""

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

JOURNAL_TITLE = (
    "Implementasi Algoritma Random Forest pada Sistem Manajemen Multi-Unit Usaha "
    "Koperasi Karyawan untuk Prediksi Penjualan di Koperasi Karyawan Ciledug Jaya Makmur"
)


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


def _insert_paragraph_before(anchor_p, text: str = "", align=WD_ALIGN_PARAGRAPH.JUSTIFY,
                             space_before: float = 0, space_after: float = 4,
                             size_pt: float = 10, bold: bool = False, first_line_cm: float = 0):
    p = anchor_p.insert_paragraph_before()
    p.alignment = align
    pf = p.paragraph_format
    pf.line_spacing = 1.0
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    if first_line_cm:
        pf.first_line_indent = Cm(first_line_cm)
    if text:
        _add_formatted_runs(p, text, size_pt=size_pt, base_bold=bold)
    return p


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

    # Pindahkan tabel tepat sebelum anchor_p di XML body
    anchor_p._p.addprevious(table._tbl)

    border_rule = ("single", 6, "333333")
    light_rule = ("single", 4, "CCCCCC")

    all_rows = [headers] + rows
    for r_idx, row_vals in enumerate(all_rows):
        tbl_row = table.rows[r_idx]
        # Jaga agar header tabel mengulang di halaman berikutnya jika terpotong
        if r_idx == 0:
            trPr = tbl_row._tr.get_or_add_trPr()
            trPr.append(OxmlElement("w:tblHeader"))
        trPr = tbl_row._tr.get_or_add_trPr()
        trPr.append(OxmlElement("w:cantSplit"))

        for c_idx, val in enumerate(row_vals):
            cell = tbl_row.cells[c_idx]
            cell.width = Cm(col_widths_cm[c_idx])
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            _set_cell_margins(cell, top=55, bottom=55, left=80, right=80)

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
            _add_formatted_runs(p, val, size_pt=8.5, base_bold=(r_idx == 0))

    # Spasi kecil sesudah tabel
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


def populate_metode_penelitian(doc, anchor_hasil) -> None:
    """Isi bab METODE PENELITIAN tepat sebelum heading HASIL DAN PEMBAHASAN."""
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Penelitian ini dilakukan pada Koperasi Karyawan Ciledug Jaya Makmur yang mengoperasikan "
            "Sistem Informasi Koperasi Multi-Unit (SIKOMU) untuk dua unit usaha, yaitu unit jasa titip "
            "(*jastip*) dan unit warung ritel kebutuhan karyawan. Pembahasan dalam artikel ini dibatasi "
            "pada unit warung ritel, khususnya pada modul prediksi penjualan mingguan dan perhitungan "
            "rekomendasi pengadaan ulang (*restock*) barang. Alur kerja sistem dimulai dari ekstraksi data "
            "transaksi pada basis data MySQL, pembentukan tabel fitur (*feature engineering*), pembagian "
            "data berbasis waktu (*time-based split*), pelatihan dan pengujian model *Random Forest Regressor*, "
            "hingga peramalan bertahap (*recursive forecasting*) selama empat minggu ke depan."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 1
    _insert_paragraph_before(
        anchor_hasil,
        text="1. Pengumpulan Data Historis dan Agregasi Mingguan",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Sebelum aplikasi SIKOMU dibangun, pencatatan transaksi warung ritel di Koperasi Karyawan "
            "Ciledug Jaya Makmur belum menggunakan sistem komputerisasi. Penjualan harian dicatat secara "
            "manual pada buku catatan oleh koordinator warung ritel, lalu dipindahkan ke lembar kerja "
            "Microsoft Excel oleh pengurus koperasi untuk rekapitulasi berkala. Pada tahap awal penelitian, "
            "catatan manual dan arsip rekapitulasi tersebut melalui proses pembersihan data (*data cleaning*), "
            "penyeragaman kode dan satuan produk, serta digitalisasi ke dalam skema tabel relasional MySQL "
            "pada sistem SIKOMU yang meliputi tabel *products*, *subcategories*, *categories*, *brands*, "
            "*sales*, *sales_details*, dan *inventory_transactions*."
        ),
        first_line_cm=0.5,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Data yang terkumpul mencakup 47 produk ritel aktif (terdiri atas produk minuman kemasan, "
            "kopi dan susu saset, makanan ringan, mie instan, serta produk kebutuhan pribadi) selama "
            "rentang 62 minggu dari tanggal 30 Juni 2025 hingga 6 September 2026. Total transaksi yang "
            "tersimpan pada basis data berjumlah 19.134 struk penjualan dengan 38.449 baris rincian item "
            "dan 40.155 catatan mutasi keluar-masuk barang. Seluruh transaksi harian kemudian diagregasikan "
            "menjadi interval mingguan (Senin hingga Minggu) dengan penanda awal minggu pada hari Senin "
            "(*week_start*). Untuk menjaga keutuhan deret waktu pada seluruh produk, dibentuk matriks "
            "penuh berukuran 47 produk × 62 minggu = 2.914 baris observasi. Minggu yang tidak memiliki "
            "transaksi penjualan pada suatu produk diisi dengan kuantitas 0, sedangkan harga jual mingguan "
            "yang kosong dilengkapi memakai metode *forward-fill* dan *backward-fill* berdasarkan harga jual "
            "produk (*selling_price*) [1, 2]."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 2
    _insert_paragraph_before(
        anchor_hasil,
        text="2. Rekayasa Fitur (*Feature Engineering*)",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Algoritma *Random Forest* bekerja pada data berbentuk tabel yang memetakan vektor fitur masukan "
            "(X) terhadap nilai target (y), sehingga deret waktu mingguan setiap produk perlu diubah menjadi "
            "fitur numerik dan biner [2, 3]. Pada penelitian ini dibentuk 14 variabel prediktor dan 1 variabel "
            "target (*qty*) yang disajikan pada Tabel 1."
        ),
        first_line_cm=0.5,
    )

    _insert_table_before(
        doc,
        anchor_hasil,
        caption="**Tabel 1.** Daftar variabel fitur dan target pada pemodelan *Random Forest*",
        headers=["Kelompok Fitur", "Nama Variabel", "Tipe", "Keterangan"],
        rows=[
            ["Atribut Produk", "product_id", "*Integer*", "Nomor identitas unik produk aktif (1 sampai 69)"],
            ["Atribut Produk", "category_id", "*Integer*", "Identitas kategori produk (Minuman, Makanan Ringan, *Cosmetic*)"],
            ["Atribut Produk", "price", "*Float*", "Rata-rata harga jual produk pada minggu berjalan (Rp)"],
            ["Fitur *Lag*", "lag_1 s/d lag_4", "*Float*", "Kuantitas terjual pada 1, 2, 3, dan 4 minggu sebelumnya"],
            ["Tren Bergerak", "rolling_mean_4", "*Float*", "Rata-rata kuantitas terjual 4 minggu sebelumnya (*t*−4 s/d *t*−1)"],
            ["Tren Bergerak", "rolling_mean_8", "*Float*", "Rata-rata kuantitas terjual 8 minggu sebelumnya (*t*−8 s/d *t*−1)"],
            ["Kalender & Gajian", "month", "*Integer*", "Nomor bulan dalam tahun kalender (1 sampai 12)"],
            ["Kalender & Gajian", "week_of_month", "*Integer*", "Posisi minggu ke-*k* di dalam satu bulan (1 sampai 5)"],
            ["Kalender & Gajian", "is_payday_week", "*Binary*", "Bernilai 1 jika minggu memuat tanggal 25–31 atau 1–5; 0 selainnya"],
            ["Hari Besar", "is_ramadan", "*Binary*", "Bernilai 1 jika rentang minggu bersinggungan dengan bulan Ramadan"],
            ["Hari Besar", "is_lebaran", "*Binary*", "Bernilai 1 jika rentang minggu berada pada H−7 hingga H+7 Idul Fitri"],
            ["Target (*y*)", "qty", "*Integer*", "Jumlah unit produk terjual pada minggu ke-*t* (pcs)"],
        ],
        col_widths_cm=[3.2, 3.3, 1.8, 7.62],
        col_aligns=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT],
    )

    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Pada perhitungan fitur rata-rata bergerak (*rolling mean*) dengan jendela waktu *w* ∈ {4, 8} "
            "minggu, deret penjualan digeser satu minggu ke belakang (*shift-1*) sebelum dirata-ratakan agar "
            "nilai aktual minggu ke-*t* tidak ikut masuk ke dalam fitur masukan minggu ke-*t* (*data leakage*). "
            "Rumus perhitungan rata-rata bergerak dituliskan pada (1):"
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
        eq_num="1",
    )

    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "dengan *y*p,t−k menyatakan kuantitas penjualan aktual produk *p* pada *k* minggu sebelum minggu "
            "ke-*t*, dan *w* adalah panjang jendela waktu (4 atau 8 minggu). Empat minggu paling awal pada "
            "masing-masing produk dihapus karena belum memiliki riwayat *lag_1* hingga *lag_4* yang lengkap, "
            "sehingga tersisa 47 produk × 58 minggu = 2.726 baris data siap latih."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 3
    _insert_paragraph_before(
        anchor_hasil,
        text="3. Pembagian Data Berbasis Waktu (*Time-Based Split*) dan Pelatihan Model",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Pemisahan data latih dan data uji dilakukan berdasarkan urutan waktu tanpa pengacakan baris "
            "(*no random shuffling*) agar pengujian meniru kondisi nyata saat memprediksi minggu yang belum "
            "terjadi [3]. Sebanyak 54 minggu pertama (28 Juli 2025 hingga 3 Agustus 2026, berjumlah 2.538 "
            "baris) dijadikan data latih, sedangkan 4 minggu terakhir (10 Agustus 2026 hingga 31 Agustus 2026, "
            "berjumlah 188 baris) dijadikan data uji."
        ),
        first_line_cm=0.5,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Model *Random Forest Regressor* membentuk *B* buah pohon regresi menggunakan sampel *bootstrap* "
            "dari data latih, lalu menghitung rata-rata keluaran seluruh pohon dengan batas bawah nol sebagaimana "
            "dinyatakan pada (2) [1, 4]:"
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
        eq_num="2",
    )

    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "dengan *ŷ*p,t adalah prediksi penjualan produk *p* pada minggu ke-*t*, *B* adalah jumlah pohon "
            "keputusan (*n_estimators* = 200), dan *T*b(*x*p,t) adalah nilai prediksi pohon ke-*b* terhadap "
            "vektor fitur *x*p,t. Parameter lain pada model ini ditetapkan pada *max_depth* = 12, "
            "*min_samples_leaf* = 3, dan *random_state* = 42."
        ),
        first_line_cm=0.5,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Setelah pengujian pada 4 minggu terakhir selesai, model dilatih kembali memakai seluruh 2.726 "
            "baris data historis untuk memprediksi permintaan 4 minggu ke depan (7 September 2026 hingga 28 "
            "September 2026). Prediksi dijalankan bertahap (*recursive forecasting*) sesuai urutan pada Tabel 2, "
            "di mana nilai prediksi minggu ke-(*t*+1) dimasukkan kembali ke riwayat produk sebagai *lag_1* untuk "
            "menghitung minggu ke-(*t*+2) sampai minggu ke-(*t*+4)."
        ),
        first_line_cm=0.5,
    )

    _insert_table_before(
        doc,
        anchor_hasil,
        caption="**Tabel 2.** Prosedur pelatihan *Random Forest* dan *recursive forecasting* 4 minggu",
        headers=["Tahap", "Langkah Prosedur Algoritma"],
        rows=[
            ["1", "Muat transaksi harian dari MySQL lalu agregasikan menjadi kuantitas mingguan per *product_id*."],
            ["2", "Bentuk 14 fitur (*lag_1..4*, *rolling_mean_4..8* dengan *shift-1*, kalender, event, atribut produk)."],
            ["3", "Pisahkan data uji (4 minggu terakhir, 188 baris) dan data latih (54 minggu awal, 2.538 baris)."],
            ["4", "Latih *Random Forest Regressor* (*n_estimators*=200, *max_depth*=12, *min_samples_leaf*=3) pada data latih."],
            ["5", "Hitung MAE, WAPE, dan ketepatan pada data uji dibanding *Baseline* (*rolling_mean_4*)."],
            ["6", "Latih ulang *Random Forest Regressor* menggunakan seluruh 2.726 baris data historis."],
            ["7", "Untuk *step* = 1 sampai 4: hitung penanda kalender minggu *target_week*, ambil fitur *lag* dan *rolling mean* dari riwayat produk, prediksi kuantitas minggu tersebut, lalu tambahkan hasil prediksi ke riwayat untuk iterasi berikutnya."],
        ],
        col_widths_cm=[1.6, 14.32],
        col_aligns=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT],
    )

    # Sub-bab 4
    _insert_paragraph_before(
        anchor_hasil,
        text="4. Metode Pengujian Akurasi dan Perhitungan Rekomendasi Restok",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Hasil prediksi *Random Forest* dibandingkan terhadap metode *Baseline* berupa rata-rata bergerak "
            "4 minggu terakhir (*rolling_mean_4*). Pengukuran kesalahan memakai *Mean Absolute Error* (MAE) dan "
            "*Weighted Absolute Percentage Error* (WAPE). Metrik WAPE dipilih sebagai pengganti *Mean Absolute "
            "Percentage Error* (MAPE) karena pada tingkat SKU ritel, produk yang terjual sedikit atau bernilai "
            "nol pada minggu tertentu membuat perhitungan pembagian per baris pada MAPE menjadi tidak terdefinisi "
            "[3, 4]. Perhitungan MAE, WAPE, dan ketepatan model dirumuskan pada (3), (4), dan (5):"
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
        eq_num="3",
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
        eq_num="4",
    )
    _insert_equation_before(
        anchor_hasil,
        parts=[
            ("Ketepatan = max(0,  100% − WAPE)", "normal"),
        ],
        eq_num="5",
    )

    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "dengan *n* adalah jumlah baris pada data uji (*n* = 188), *y*i adalah kuantitas terjual aktual, "
            "dan *ŷ*i adalah kuantitas hasil prediksi. Selanjutnya, prediksi 4 minggu ke depan disimpan ke tabel "
            "*sales_predictions* dan digabungkan dengan saldo stok berjalan (*S*aktual,p) dari tabel "
            "*inventory_transactions* serta stok pengaman minimum (*S*min,p) dari tabel *products*. Jumlah "
            "rekomendasi pengadaan ulang untuk horizon *K* minggu (*K* ∈ {1, 4}) dihitung menggunakan (6):"
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
        eq_num="6",
    )

    _insert_paragraph_before(
        anchor_hasil,
        text=(
            "Sistem kemudian menetapkan tiga status stok produk: (1) **Kritis** jika *S*aktual,p ≤ *S*min,p, "
            "(2) **Perlu Restok** jika *S*aktual,p > *S*min,p tetapi nilai Restok 1 Minggu lebih dari 0, dan "
            "(3) **Aman** jika nilai Restok 1 Minggu sama dengan 0."
        ),
        first_line_cm=0.5,
    )


def populate_hasil_dan_pembahasan(doc, anchor_kesimpulan) -> None:
    """Isi bab HASIL DAN PEMBAHASAN tepat sebelum heading KESIMPULAN."""
    # Sub-bab 1
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="1. Hasil Transformasi Dataset Mingguan",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=4,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Proses ekstraksi dari basis data MySQL SIKOMU menghasilkan 47 produk ritel aktif yang tersebar "
            "pada 15 subkategori dan 3 kategori (Minuman, Makanan Ringan termasuk Mie Instan, serta *Cosmetic*). "
            "Agregasi 19.134 transaksi harian ke interval Senin–Minggu membentuk 2.914 baris deret waktu penuh "
            "(47 produk × 62 minggu) pada periode 30 Juni 2025 hingga 6 September 2026. Setelah penghapusan 4 "
            "minggu pertama pada tiap produk untuk melengkapi variabel *lag_1* hingga *lag_4*, diperoleh 2.726 "
            "baris fitur bersih yang dipisahkan secara berurutan menjadi 2.538 baris data latih (54 minggu) dan "
            "188 baris data uji (4 minggu terakhir, periode 10 Agustus 2026 hingga 31 Agustus 2026)."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 2
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="2. Perbandingan Akurasi Model *Random Forest* terhadap *Baseline*",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Pengujian pada 188 baris data uji menunjukkan bahwa model *Random Forest Regressor* menghasilkan "
            "nilai kesalahan lebih rendah dibandingkan metode *Baseline* (*rolling_mean_4*). Ringkasan hasil "
            "evaluasi kedua metode disajikan pada Tabel 3."
        ),
        first_line_cm=0.5,
    )

    _insert_table_before(
        doc,
        anchor_kesimpulan,
        caption="**Tabel 3.** Perbandingan kesalahan dan ketepatan prediksi pada data uji (10–31 Agustus 2026)",
        headers=["Metode Prediksi", "Baris Uji (*n*)", "MAE (pcs/minggu)", "WAPE (%)", "Ketepatan (%)"],
        rows=[
            ["*Baseline* (*rolling_mean_4*)", "188", "3,58", "25,59%", "74,41%"],
            ["*Random Forest Regressor* (*rf_v1*)", "188", "2,42", "17,30%", "82,70%"],
            ["Selisih Perbaikan", "—", "−1,16", "−8,29 poin", "+8,29 poin"],
        ],
        col_widths_cm=[5.6, 2.3, 3.0, 2.5, 2.52],
        col_aligns=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )

    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Berdasarkan Tabel 3, *Baseline* hanya mengandalkan rata-rata empat minggu sebelumnya sehingga "
            "menghasilkan MAE sebesar 3,58 pcs per produk per minggu dengan WAPE 25,59% (ketepatan 74,41%). "
            "Sebaliknya, model *Random Forest* menurunkan MAE menjadi 2,42 pcs dan WAPE menjadi 17,30% "
            "(ketepatan 82,70%), atau turun 8,29 poin persentase error dibanding *Baseline*. Ketika hasil "
            "prediksi uji dibulatkan ke bilangan bulat terdekat (*integer*) saat disimpan ke dalam tabel "
            "*sales_predictions*, total permintaan terprediksi berjumlah 2.693 pcs dibandingkan penjualan aktual "
            "sebesar 2.631 pcs (selisih total 62 pcs atau 2,36%), dengan nilai MAE 2,40 pcs, WAPE 17,18%, "
            "dan ketepatan 82,82%. Sisa selisih sebesar 17,30% berasal dari variasi transaksi harian yang tidak "
            "terekam dalam riwayat penjualan, seperti tingkat kehadiran karyawan, kondisi cuaca, maupun kegiatan "
            "internal kantor."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 3
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="3. Kontribusi Variabel Fitur (*Feature Importance*)",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Untuk melihat variabel mana yang paling banyak dipakai oleh 200 pohon keputusan dalam menentukan "
            "angka prediksi, dilakukan perhitungan nilai *feature importance* pada model terlatih. Sepuluh "
            "fitur dengan bobot tertinggi tercantum pada Tabel 4."
        ),
        first_line_cm=0.5,
    )

    _insert_table_before(
        doc,
        anchor_kesimpulan,
        caption="**Tabel 4.** Sepuluh fitur dengan kontribusi tertinggi pada model *Random Forest*",
        headers=["Peringkat", "Nama Fitur", "Nilai Kontribusi", "Persentase (%)", "Peran dalam Pemodelan"],
        rows=[
            ["1", "rolling_mean_8", "0,6467", "64,67%", "Menentukan skala dasar permintaan tiap produk"],
            ["2", "is_payday_week", "0,1570", "15,70%", "Menyesuaikan kenaikan permintaan saat minggu gajian"],
            ["3", "rolling_mean_4", "0,0566", "5,66%", "Menangkap pergeseran tren jangka menengah 1 bulan"],
            ["4", "is_ramadan", "0,0230", "2,30%", "Menangkap lonjakan konsumsi selama bulan Ramadan"],
            ["5", "lag_1", "0,0179", "1,79%", "Mencatat volume penjualan 1 minggu sebelumnya"],
            ["6", "lag_2", "0,0162", "1,62%", "Mencatat volume penjualan 2 minggu sebelumnya"],
            ["7", "month", "0,0161", "1,61%", "Memberi informasi posisi bulan dalam tahun berjalan"],
            ["8", "product_id", "0,0160", "1,60%", "Membedakan karakteristik spesifik antar-SKU produk"],
            ["9", "lag_4", "0,0154", "1,54%", "Mencatat volume penjualan pada siklus 4 minggu lalu"],
            ["10", "lag_3", "0,0139", "1,39%", "Mencatat volume penjualan 3 minggu sebelumnya"],
        ],
        col_widths_cm=[1.7, 2.9, 2.3, 2.3, 6.72],
        col_aligns=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT],
    )

    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Tabel 4 memperlihatkan bahwa fitur *rolling_mean_8* menyumbang bobot terbesar sebesar 64,67% karena "
            "mampu membedakan tingkat laku produk cepat laku (seperti air mineral dan mie instan) dari produk "
            "berperputaran lambat. Variabel *is_payday_week* menempati urutan kedua dengan bobot 15,70%. Kombinasi "
            "kedua fitur ini menjelaskan mengapa *Random Forest* mengungguli *Baseline*: model menempatkan angka "
            "dasar sesuai rata-rata delapan minggu produk, lalu menaikkan prediksi ketika kalender memasuki minggu "
            "gajian karyawan (tanggal 25–31 dan 1–5) atau periode Ramadan."
        ),
        first_line_cm=0.5,
    )

    # Sub-bab 4
    _insert_paragraph_before(
        anchor_kesimpulan,
        text="4. Prediksi 4 Minggu ke Depan dan Rekomendasi Restok pada Sistem Web",
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=3,
        bold=True,
    )
    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Setelah seluruh 376 baris hasil evaluasi dan peramalan (188 baris uji dan 188 baris prediksi 4 minggu "
            "ke depan) disimpan ke tabel *sales_predictions*, sistem menghitung total proyeksi permintaan "
            "seluruh 47 produk aktif selama periode 7 September hingga 28 September 2026 sebesar 2.755 pcs. "
            "Berdasarkan saldo stok berjalan di gudang, sistem mengklasifikasikan 0 produk berstatus **Kritis**, "
            "3 produk berstatus **Perlu Restok**, dan 44 produk berstatus **Aman** untuk horizon 1 minggu pertama. "
            "Sepuluh produk dengan prioritas kebutuhan restok 4 minggu tertinggi ditampilkan pada Tabel 5."
        ),
        first_line_cm=0.5,
    )

    _insert_table_before(
        doc,
        anchor_kesimpulan,
        caption="**Tabel 5.** Hasil prediksi 4 minggu (7–28 September 2026) dan rekomendasi restok 10 produk teratas",
        headers=[
            "Nama Produk",
            "Stok",
            "Min",
            "Mg +1",
            "Mg +2",
            "Mg +3",
            "Mg +4",
            "Total",
            "Restok 1 Mg",
            "Restok 4 Mg",
            "Status",
        ],
        rows=[
            ["Mie Sedaap Goreng 90g", "48", "36", "15", "15", "23", "27", "80", "3", "68", "Perlu Restok"],
            ["Good Day Cappuccino Sachet 20g", "52", "40", "14", "15", "22", "24", "75", "2", "63", "Perlu Restok"],
            ["Nabati Richeese Wafer Keju", "43", "30", "15", "15", "22", "24", "76", "2", "63", "Perlu Restok"],
            ["Aqua Air Mineral 600ml", "55", "24", "25", "27", "35", "36", "123", "0", "92", "Aman"],
            ["Le Minerale 600ml", "52", "24", "23", "24", "34", "34", "115", "0", "87", "Aman"],
            ["Teh Pucuk Harum 350ml", "51", "24", "23", "25", "33", "32", "113", "0", "86", "Aman"],
            ["Pop Mie Ayam 75g", "55", "30", "22", "24", "30", "30", "106", "0", "81", "Aman"],
            ["Indomie Goreng Spesial 85g", "66", "40", "19", "18", "31", "32", "100", "0", "74", "Aman"],
            ["Beng-Beng Wafer Cokelat", "69", "40", "21", "22", "29", "30", "102", "0", "73", "Aman"],
            ["Indomie Ayam Bawang 69g", "67", "36", "20", "20", "28", "26", "94", "0", "63", "Aman"],
        ],
        col_widths_cm=[4.22, 0.95, 0.85, 0.95, 0.95, 0.95, 0.95, 1.05, 1.4, 1.4, 2.25],
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
            WD_ALIGN_PARAGRAPH.CENTER,
        ],
    )

    _insert_paragraph_before(
        anchor_kesimpulan,
        text=(
            "Pada Tabel 5 terlihat pola kenaikan prediksi dari minggu non-gajian (Minggu +1 tanggal 7 September "
            "2026 dan Minggu +2 tanggal 14 September 2026) menuju minggu gajian (Minggu +3 tanggal 21 September "
            "2026 dan Minggu +4 tanggal 28 September 2026). Sebagai contoh, prediksi penjualan *Aqua Air Mineral "
            "600ml* meningkat dari 25 pcs dan 27 pcs pada dua minggu awal menjadi 35 pcs dan 36 pcs pada dua "
            "minggu terakhir bulan tersebut, sedangkan *Indomie Goreng Spesial 85g* naik dari 19 pcs dan 18 pcs "
            "menjadi 31 pcs dan 32 pcs. Dari sisi pengelolaan inventori, produk *Mie Sedaap Goreng 90g* memiliki "
            "stok berjalan 48 pcs, batas minimum 36 pcs, dan prediksi Minggu +1 sebesar 15 pcs. Apabila tidak "
            "dilakukan penambahan stok pada minggu pertama, sisa stok akan turun menjadi 33 pcs atau di bawah "
            "batas minimum 36 pcs, sehingga sistem merekomendasikan pengadaan minimal 3 pcs untuk minggu berjalan "
            "dan 68 pcs untuk kebutuhan 4 minggu ke depan. Seluruh tabel rekomendasi, metrik akurasi, grafik "
            "perbandingan aktual terhadap prediksi, serta tombol pembaruan model terhubung langsung ke halaman "
            "Prediksi & Restok pada antarmuka web SIKOMU melalui endpoint API */api/predictions*."
        ),
        first_line_cm=0.5,
    )


def main() -> None:
    doc = docx.Document(DOC_PATH)

    # 1. Perbarui judul artikel pada paragraf pertama
    title_p = doc.paragraphs[0]
    title_p.text = ""
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = title_p.add_run(JOURNAL_TITLE)
    _set_run_font(r_title, size_pt=14, bold=True)

    # 2. Isi bab METODE PENELITIAN
    anchor_hasil = _clear_between_headings(doc, "METODE PENELITIAN", "HASIL DAN PEMBAHASAN")
    populate_metode_penelitian(doc, anchor_hasil)

    # 3. Isi bab HASIL DAN PEMBAHASAN
    anchor_kesimpulan = _clear_between_headings(doc, "HASIL DAN PEMBAHASAN", "KESIMPULAN")
    populate_hasil_dan_pembahasan(doc, anchor_kesimpulan)

    try:
        doc.save(DOC_PATH)
        print(f"Berhasil memperbarui: {DOC_PATH}")
    except PermissionError:
        doc.save(FALLBACK_PATH)
        print(f"File asli sedang dibuka, disimpan ke: {FALLBACK_PATH}")


if __name__ == "__main__":
    main()
