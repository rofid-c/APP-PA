const DAFTAR_ISI = [
  { id: 'pendahuluan', label: '1. Pendahuluan & Level Pengguna' },
  { id: 'arsip-perkara', label: '2. Arsip Perkara' },
  { id: 'kesekretariatan', label: '3. Arsip Kesekretariatan' },
  { id: 'laporan', label: '4. Arsip Laporan' },
  { id: 'dashboard', label: '5. Dashboard' },
  { id: 'kinerja', label: '6. Capaian Kinerja' },
  { id: 'pengaturan-master', label: '7. Kelola Data Master' },
  { id: 'pengguna', label: '8. Kelola Pengguna & Verifikasi Akun' },
  { id: 'profil', label: '9. Profil Saya' },
  { id: 'log', label: '10. Log Aktivitas' },
  { id: 'tips', label: '11. Catatan Tambahan' },
];

function Section({ id, title, children }) {
  return (
    <div id={id} className="card" style={{ marginBottom: 20, scrollMarginTop: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{title}</h2>
      {children}
    </div>
  );
}

function SubHeading({ children }) {
  return <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>{children}</h3>;
}

function P({ children }) {
  return <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334', marginBottom: 10 }}>{children}</p>;
}

function Steps({ items }) {
  return (
    <ol style={{ fontSize: 14, lineHeight: 1.8, color: '#334', paddingLeft: 22, marginBottom: 10 }}>
      {items.map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}
    </ol>
  );
}

function Bullets({ items }) {
  return (
    <ul style={{ fontSize: 14, lineHeight: 1.8, color: '#334', paddingLeft: 22, marginBottom: 10 }}>
      {items.map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}
    </ul>
  );
}

function Note({ children }) {
  return (
    <div style={{ background: '#eef6f1', borderLeft: '3px solid #146c4f', borderRadius: 6, padding: '10px 14px', fontSize: 13.5, color: '#334', marginBottom: 14 }}>
      {children}
    </div>
  );
}

export default function BantuanContent() {
  return (
    <div id="top">
      <div className="topbar">
        <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>BANTUAN & PANDUAN PENGGUNAAN</div>
      </div>

      <div className="page-body" style={{ maxWidth: 880, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334', marginBottom: 14 }}>
            Halaman ini berisi panduan penggunaan Bank Data Digital, mulai dari kewenangan tiap level
            pengguna sampai langkah-langkah untuk setiap menu.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
            {DAFTAR_ISI.map((item) => (
              <a key={item.id} href={`#${item.id}`} style={{ fontSize: 13.5, color: 'var(--hijau-tua)', fontWeight: 600, padding: '4px 0' }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <Section id="pendahuluan" title="1. Pendahuluan & Level Pengguna">
          <P>Aplikasi ini membedakan hak akses menjadi tiga level pengguna, yaitu Admin, Petugas, dan Peninjau.</P>

          <SubHeading>Admin</SubHeading>
          <P>Memiliki akses penuh ke seluruh menu, termasuk beberapa menu yang tidak dapat diakses oleh level lain, yaitu:</P>
          <Bullets items={[
            'Seluruh menu yang juga dapat diakses oleh Petugas (lihat penjelasan di bawah).',
            'Capaian Kinerja, yang hanya dapat diakses oleh Admin.',
            'Verifikasi Akun dan Kelola Pengguna, untuk menyetujui pendaftaran akun baru, mengubah role pengguna, dan menghapus akun.',
            'Kelola Data Master, yaitu pengaturan Jenis Perkara, Jenis Kesekretariatan, Jenis Laporan, dan Divisi.',
            'Koreksi data peminjaman yang salah input, serta pengaturan Sasaran dan Indikator Kinerja.',
            'Halaman Bantuan ini.',
          ]} />

          <SubHeading>Petugas</SubHeading>
          <P>Dapat mengelola arsip sehari-hari, namun tidak memiliki akses ke pengaturan sistem maupun data pengguna lain:</P>
          <Bullets items={[
            'Mengunggah, mengedit, menghapus, dan mencari Arsip Perkara.',
            'Mencatat peminjaman dan pengembalian arsip. Koreksi terhadap data yang sudah tercatat hanya dapat dilakukan oleh Admin.',
            'Mengelola Arsip Kesekretariatan dan Arsip Laporan.',
            'Melihat Log Aktivitas.',
            'Tidak memiliki akses ke Capaian Kinerja, Kelola Pengguna, maupun Kelola Data Master.',
          ]} />

          <SubHeading>Peninjau</SubHeading>
          <P>Memiliki akses paling terbatas, yaitu hanya untuk melihat data:</P>
          <Bullets items={[
            'Dapat mencari dan melihat detail Arsip Perkara, Arsip Kesekretariatan, dan Arsip Laporan.',
            'Tidak dapat mengunggah, mengedit, menghapus, atau mencatat peminjaman.',
            'Tidak memiliki akses ke Log Aktivitas.',
          ]} />

          <Note>
            Pengguna yang mendaftar sendiri melalui halaman Register akan berstatus <strong>pending</strong> dan
            belum dapat login sampai akunnya diverifikasi dan diberi role oleh Admin. Penjelasan lebih lanjut
            ada di bagian 8.
          </Note>
        </Section>

        <Section id="arsip-perkara" title="2. Arsip Perkara">
          <SubHeading>Mengunggah arsip baru</SubHeading>
          <Steps items={[
            'Buka menu Arsip Perkara pada sidebar, lalu klik tombol "Upload Arsip".',
            'Isi Nomor Perkara, Nama Para Pihak, Jenis Perkara, Tanggal BHT, serta lokasi fisik berkas (ruang, rak/lemari, tingkat/laci, dan boks).',
            'Pilih file PDF berkas perkara, kemudian simpan.',
          ]} />

          <SubHeading>Mencari arsip</SubHeading>
          <P>Pada halaman Arsip Perkara tersedia kolom pencarian berdasarkan nomor perkara atau nama pihak, serta filter berdasarkan Jenis Perkara, Tahun, dan status (Ada/Sedang Dipinjam).</P>

          <SubHeading>Melihat detail, mengedit, dan mengganti file</SubHeading>
          <P>Klik salah satu arsip pada daftar untuk membuka halaman detailnya. Dari halaman ini, Admin dan Petugas dapat mengedit data arsip, mengganti file PDF tanpa mengubah data lain, atau menghapus arsip tersebut.</P>

          <SubHeading>Mencatat peminjaman dan pengembalian</SubHeading>
          <Steps items={[
            'Pada halaman detail arsip, isi Nama Peminjam dan Tanggal Pinjam pada kotak "Catat Peminjaman", lalu simpan.',
            'Selama arsip masih dipinjam, statusnya akan tampil sebagai "Sedang Dipinjam" dan tidak dapat dipinjam oleh pihak lain sebelum dikembalikan.',
            'Untuk mencatat pengembalian, buka kembali halaman detail arsip yang sama, klik "Tandai Kembali", lalu isi tanggal pengembaliannya.',
          ]} />

          <Note>
            Khusus Admin: apabila terjadi kesalahan input pada riwayat peminjaman, misalnya salah nama atau
            salah tanggal, koreksi dapat dilakukan melalui tabel Riwayat Peminjaman pada halaman detail
            arsip dengan menekan tombol Edit pada baris yang bersangkutan. Fitur ini juga berlaku untuk
            peminjaman yang masih berjalan (belum dikembalikan), dan hanya terlihat oleh Admin.
          </Note>

          <SubHeading>Mencetak kode QR</SubHeading>
          <P>Setiap arsip memiliki kode QR yang mengarah langsung ke halaman detailnya, sehingga dapat ditempelkan pada map fisik untuk memudahkan pencarian. Kode QR dapat dicetak satu per satu dari halaman detail arsip, atau dicetak sekaligus untuk beberapa arsip melalui menu Cetak QR.</P>
        </Section>

        <Section id="kesekretariatan" title="3. Arsip Kesekretariatan">
          <P>Menu ini digunakan untuk berkas administrasi umum yang bukan merupakan berkas perkara, dan dikelompokkan berdasarkan divisi atau bagian. Setiap divisi memiliki halamannya masing-masing pada sidebar, di bawah menu Arsip Kesekretariatan.</P>
          <Steps items={[
            'Klik menu Arsip Kesekretariatan pada sidebar untuk melihat daftar divisi.',
            'Pilih divisi yang dituju, lalu klik "Upload" untuk menambahkan berkas. Pilih jenis arsip yang sesuai (daftar jenis arsip diatur melalui Kelola Data Master, lihat bagian 7), kemudian unggah filenya.',
            'Berkas yang sudah tersimpan dapat dicari, diedit, atau dihapus dari halaman divisi yang sama.',
          ]} />
          <Note>Daftar divisi, termasuk penambahan divisi baru, diatur melalui Pengaturan → Data Master → Divisi, dan hanya dapat dilakukan oleh Admin.</Note>
        </Section>

        <Section id="laporan" title="4. Arsip Laporan">
          <P>Menu ini digunakan untuk laporan bulanan rutin, misalnya L1PA1 sampai L1PA14. Tampilannya berupa tabel dengan baris untuk setiap jenis laporan dan kolom untuk setiap bulan dalam satu tahun.</P>
          <Steps items={[
            'Buka menu Arsip Laporan, lalu pilih tahun yang akan dilihat atau diisi.',
            'Klik sel yang masih kosong pada tabel, sesuai jenis laporan dan bulan yang dituju, untuk mengunggah file laporan bulan tersebut.',
            'Sel yang sudah terisi dapat diklik kembali untuk melihat, mengganti file, atau menghapus isinya.',
          ]} />
          <Note>Satu sel, yaitu kombinasi jenis laporan, bulan, dan tahun, hanya dapat memuat satu file. Apabila diunggah ulang pada sel yang sama, file lama akan otomatis digantikan.</Note>
        </Section>

        <Section id="dashboard" title="5. Dashboard">
          <P>Dashboard adalah halaman pertama yang tampil setelah login, dan berisi ringkasan berikut:</P>
          <Bullets items={[
            'Kartu statistik, meliputi total arsip, jumlah yang sedang dipinjam, serta rincian per jenis perkara dan per divisi.',
            'Grafik batang yang menunjukkan tren jumlah arsip per tahun.',
            'Grafik lingkaran yang menunjukkan proporsi arsip berdasarkan jenis perkara.',
            'Arsip Terbaru, yaitu daftar arsip yang paling baru diunggah dan dapat langsung dibuka detailnya.',
            'Aktivitas Terakhir, yaitu ringkasan kejadian terbaru pada sistem.',
          ]} />
        </Section>

        <Section id="kinerja" title="6. Capaian Kinerja">
          <P>
            Menu ini digunakan untuk mencatat capaian kinerja tahunan, sebagai pengganti pencatatan manual
            melalui Excel. Menu ini hanya dapat diakses oleh Admin, dan terdiri atas dua bagian: <strong>Kelola
            Kinerja</strong> pada menu Pengaturan, untuk mengatur struktur data dan target, serta <strong>Capaian
            Kinerja</strong> pada sidebar, untuk mengisi data bulanan dan mengekspor laporan.
          </P>

          <SubHeading>Struktur data: Sasaran dan Indikator</SubHeading>
          <P>Data kinerja disusun dalam dua tingkat, yaitu:</P>
          <Bullets items={[
            'Sasaran Kinerja, yaitu kategori besar, misalnya "Terwujudnya Peradilan yang Efektif, Transparan, dan Akuntabel".',
            'Indikator Kinerja, yaitu ukuran yang lebih spesifik di bawah suatu Sasaran, misalnya "Persentase Penyelesaian Perkara Tepat Waktu". Satu Sasaran dapat memiliki beberapa Indikator.',
          ]} />

          <SubHeading>Dua tipe Indikator</SubHeading>
          <P>Saat membuat Indikator baru, perlu ditentukan salah satu dari dua tipe berikut:</P>
          <Bullets items={[
            'Dua input (pembanding), digunakan apabila capaian dihitung dari perbandingan dua angka. Contohnya "Jumlah Perkara Diselesaikan Tepat Waktu" dibagi "Jumlah Perkara yang Diselesaikan". Kedua angka diisi setiap bulan, dan sistem akan menjumlahkannya sepanjang tahun untuk menghitung Realisasi, yaitu angka pertama dibagi angka kedua dikali seratus persen.',
            'Satu input (langsung), digunakan apabila capaian berupa satu angka per tahun, bukan hasil bagi dua angka. Contohnya Indeks Kepuasan Masyarakat atau Indeks Profesionalitas ASN. Indikator ini cukup diisi sekali per tahun, tanpa perhitungan Realisasi, dan langsung dibandingkan dengan Target.',
          ]} />
          <P>Pada kedua tipe tersebut, Capaian dihitung dari Realisasi (atau nilai langsung untuk tipe satu input) dibagi Target, dikali seratus persen.</P>

          <SubHeading>Langkah 1: Menyusun Sasaran dan Indikator</SubHeading>
          <Steps items={[
            'Buka Pengaturan → Kelola Kinerja.',
            'Ketik nama Sasaran Kinerja pada kotak yang tersedia, lalu klik "Tambah Sasaran". Ulangi untuk setiap Sasaran yang diperlukan.',
            'Pada kartu masing-masing Sasaran, klik "Tambah Indikator". Isi nama Indikator, pilih tipe input (satu atau dua), lalu isi label untuk setiap input. Label ini yang akan tampil sebagai judul kolom saat pengisian data. Sebagai contoh, untuk tipe dua input: Label 1 diisi "Jumlah Perkara Diselesaikan Tepat Waktu" dan Label 2 diisi "Jumlah Perkara yang Diselesaikan".',
            'Urutan Sasaran maupun Indikator dapat diatur menggunakan tombol naik/turun pada masing-masing baris.',
          ]} />

          <SubHeading>Langkah 2: Menentukan Target per tahun</SubHeading>
          <P>Masih pada halaman Kelola Kinerja, pilih tahun pada dropdown "Target untuk tahun", kemudian isi angka Target pada kolom yang tersedia untuk masing-masing Indikator. Target akan tersimpan otomatis begitu kolom tersebut kehilangan fokus, tanpa perlu tombol simpan tersendiri. Target dapat berbeda untuk tiap tahun meskipun Indikatornya sama.</P>

          <SubHeading>Langkah 3: Mengisi data bulanan</SubHeading>
          <Steps items={[
            'Buka menu Capaian Kinerja pada sidebar, lalu pilih tahun yang akan diisi.',
            'Untuk Indikator dengan tipe dua input, klik tombol "Isi Bulanan". Akan muncul dua belas baris (Januari sampai Desember) dengan dua kolom sesuai label yang sudah ditentukan. Isi angka untuk bulan-bulan yang datanya sudah tersedia, lalu klik Simpan.',
            'Untuk Indikator dengan tipe satu input, klik tombol "Isi Nilai" dan isi satu angka untuk tahun tersebut.',
            'Realisasi dan Capaian akan terhitung otomatis dan langsung tampil pada tabel setelah data disimpan.',
          ]} />

          <SubHeading>Menonaktifkan Indikator atau Sasaran yang sudah tidak digunakan</SubHeading>
          <P>
            Apabila terdapat Indikator atau Sasaran yang sudah tidak relevan lagi mulai tahun tertentu,
            sebaiknya <strong>tidak dihapus</strong>, terutama jika sudah memiliki data pada tahun-tahun
            sebelumnya. Sistem memang akan menolak permintaan hapus apabila Indikator tersebut sudah
            memiliki data, agar riwayat lama tetap tersimpan. Yang perlu dilakukan adalah menekan tombol
            "Nonaktifkan" pada halaman Kelola Kinerja.
          </P>
          <Bullets items={[
            'Indikator atau Sasaran yang dinonaktifkan tidak akan tampil lagi pada tahun-tahun baru yang belum memiliki data.',
            'Untuk tahun-tahun lama yang sudah memiliki data, Indikator tersebut tetap tampil seperti biasa, ditandai dengan label kecil bertuliskan "Nonaktif", sehingga laporan tahun-tahun sebelumnya tidak berubah maupun kehilangan data.',
            'Apabila suatu saat digunakan kembali, cukup klik "Aktifkan" agar tampil kembali pada tahun berjalan.',
          ]} />

          <SubHeading>Mengekspor ke Excel</SubHeading>
          <Steps items={[
            'Pada halaman Capaian Kinerja, pilih tahun yang akan diekspor, lalu klik "Export Excel".',
            'File yang dihasilkan sudah dalam format siap cetak (ukuran A4, orientasi landscape), lengkap dengan bagian tanda tangan dan tanggal export yang terisi otomatis.',
            'Nama dan NIP yang tampil pada bagian tanda tangan diambil dari Pengaturan → Kelola Kinerja, bagian Penandatangan Laporan. Data ini cukup diisi sekali, dan akan digunakan pada setiap proses export berikutnya. Apabila terjadi pergantian pejabat, data tersebut cukup diperbarui pada bagian yang sama.',
          ]} />
        </Section>

        <Section id="pengaturan-master" title="7. Kelola Data Master">
          <P>Melalui Pengaturan → Data Master, tersedia pengaturan untuk daftar-daftar berikut yang digunakan di seluruh aplikasi:</P>
          <Bullets items={[
            'Jenis Perkara, yaitu daftar jenis perkara (misalnya Cerai Gugat, Cerai Talak) yang muncul pada saat pengunggahan Arsip Perkara.',
            'Jenis Kesekretariatan, yaitu daftar jenis berkas administrasi untuk tiap divisi.',
            'Jenis Laporan, yaitu daftar jenis laporan bulanan yang muncul sebagai baris pada tabel Arsip Laporan.',
            'Divisi, yaitu daftar divisi atau bagian untuk Arsip Kesekretariatan, dan hanya dapat diatur oleh Admin.',
          ]} />
          <P>Setiap daftar dapat ditambah, diubah namanya, diurutkan ulang, dan dihapus. Urutan yang ditetapkan juga akan mempengaruhi warna label yang ditampilkan. Apabila suatu jenis atau divisi masih digunakan oleh arsip yang ada, sistem akan meminta penggantinya terlebih dahulu sebelum item tersebut dapat dihapus, agar tidak ada arsip yang kehilangan kategorinya.</P>
        </Section>

        <Section id="pengguna" title="8. Kelola Pengguna & Verifikasi Akun">
          <SubHeading>Alur pendaftaran akun baru</SubHeading>
          <Steps items={[
            'Calon pengguna mendaftar secara mandiri melalui halaman Register, dengan mengisi username, nama lengkap, dan password.',
            'Akun yang baru mendaftar akan tersimpan dengan status pending, dan belum dapat digunakan untuk login.',
            'Admin akan melihat tanda berupa angka pada menu Pengaturan, yang menunjukkan adanya akun yang menunggu verifikasi.',
            'Admin membuka Pengaturan → Akun → Verifikasi Akun, memilih role yang sesuai (Petugas, Peninjau, atau Admin), lalu menekan tombol "Verifikasi" agar akun tersebut aktif dan dapat digunakan untuk login. Apabila pendaftaran tidak disetujui, gunakan tombol "Tolak".',
          ]} />
          <SubHeading>Kelola Pengguna</SubHeading>
          <P>Pada tab yang sama juga tersedia daftar seluruh akun yang sudah aktif. Admin dapat mengubah role, mengatur ulang password, atau menghapus akun dari daftar tersebut. Sebagai pengaman, akun Admin terakhir yang tersisa tidak dapat dihapus maupun diturunkan rolenya, agar sistem tidak pernah kehilangan Admin sama sekali.</P>
        </Section>

        <Section id="profil" title="9. Profil Saya">
          <P>Setiap pengguna, pada level mana pun, dapat mengatur profil masing-masing melalui Pengaturan → Profil Saya, meliputi:</P>
          <Bullets items={[
            'Mengubah nama lengkap dan password.',
            'Mengubah foto profil, baik dengan memilih ikon dan warna maupun dengan mengunggah foto sendiri.',
          ]} />
        </Section>

        <Section id="log" title="10. Log Aktivitas">
          <P>Menu ini mencatat aksi-aksi penting pada sistem, seperti pengunggahan, pengeditan, penghapusan, pencatatan peminjaman dan pengembalian arsip, serta perubahan data kinerja, lengkap dengan keterangan pelaku dan waktu kejadian. Log Aktivitas dapat dilihat oleh Admin dan Petugas, namun tidak oleh Peninjau. Aksi yang tergolong ringan, seperti login atau sekadar melihat dan mengunduh file, tidak dicatat di sini agar log tetap berfokus pada perubahan data yang penting.</P>
        </Section>

        <Section id="tips" title="11. Catatan Tambahan">
          <Bullets items={[
            'Arsip yang sedang dipinjam tidak dapat dipinjam oleh pihak lain sebelum dikembalikan. Apabila arsip perlu dipinjamkan kepada pihak yang berbeda, catatan peminjaman sebelumnya harus ditandai kembali terlebih dahulu.',
            'Penghapusan jenis atau kategori yang masih digunakan oleh arsip yang ada akan meminta penggantinya terlebih dahulu, untuk mencegah arsip kehilangan kategorinya.',
            'Pada Capaian Kinerja, apabila ragu antara tipe satu input dan dua input saat membuat Indikator baru, periksa apakah capaiannya merupakan hasil bagi dua angka (dua input) atau berupa angka tunggal seperti indeks atau hasil survei (satu input).',
            'Apabila terdapat kendala teknis yang belum terjawab pada panduan ini, silakan menghubungi pihak yang mengelola aplikasi ini.',
          ]} />
        </Section>
      </div>

      <a
        href="#top"
        aria-label="Kembali ke atas"
        title="Kembali ke atas"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--hijau-tua)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          textDecoration: 'none',
          zIndex: 50,
        }}
      >
        ↑
      </a>
    </div>
  );
}
