// Code was written by Muhammad Sindida Hilmy

import { Op } from "sequelize";
import sequelize from 'sequelize';
import Peminjaman from "../models/PeminjamanModel.js";
import Buku from "../models/BukuModel.js";
import Users from "../models/UserModel.js";

// Request Peminjaman
export const requestPeminjaman = async (req, res) => {
    try {
     
        const { id_buku } = req.params;
        const { durasi, jumlahBuku } = req.body;

        const buku = await Buku.findByPk(id_buku);
        if (!buku || buku.status_ketersediaan !== 'Tersedia') {
            return res.status(404).json({ error: 'Buku tidak tersedia untuk dipinjam' });
        }

        const jumlahPeminjaman = await Peminjaman.count({
            where: {
                id_user: req.user.userId,
                status_peminjaman: {
                    [Op.or]: ['menunggu persetujuan', 'sedang dipinjam']
                }
            }
        });

        if (jumlahPeminjaman >= 1) {
            return res.status(403).json({ error: 'Anda masih memiliki pinjaman yang belum diselesaikan. Pengajuan pinjaman baru tidak dapat dilakukan sampai pinjaman sebelumnya diselesaikan.' });
        }

        let tanggal_pengembalian;
        switch (durasi) {
            case '1 Hari':
                tanggal_pengembalian = new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000);
                break;
            case '1 Bulan':
                if (buku.kategori === 'Kurikulum') {
                    tanggal_pengembalian = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
                } else {
                    tanggal_pengembalian = new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000); // Default 1 hari untuk non-kurikulum
                }
                break;
            default:
                tanggal_pengembalian = new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000);
                break;
        }

        const peminjaman = await Peminjaman.create({
            id_buku,
            id_user: req.user.userId, 
            tanggal_peminjaman: new Date(),
            tanggal_pengembalian,
            status_peminjaman: 'menunggu persetujuan',
            jumlah_pinjaman: jumlahBuku
        });

        return res.status(201).json({ message: 'Peminjaman berhasil diajukan, menunggu persetujuan pustakawan' });
    } catch (error) {
        console.error('Error saat membuat catatan peminjaman:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat membuat catatan peminjaman' });
    }
};

// Acc peminjaman
export const accPeminjaman = async (req, res) => {
    try {

        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { id_peminjaman } = req.params;

        const peminjaman = await Peminjaman.findByPk(id_peminjaman);
        if (!peminjaman) {
            return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });
        }

        const buku = await Buku.findByPk(peminjaman.id_buku);

        // Ambil jumlah buku yang diminta dari peminjaman yang disetujui
        const jumlahBukuDipinjam = peminjaman.jumlah_pinjaman;
         if (jumlahBukuDipinjam > buku.jumlah_buku) {
            return res.status(400).json({ error: 'Jumlah buku yang diminta melebihi stok yang tersedia' });
        }

         // Update tanggal peminjaman menjadi waktu saat ini
         await Peminjaman.update({ tanggal_peminjaman: new Date() }, {
            where: {
                id_peminjaman: id_peminjaman
            }
        });

        // Hitung durasi peminjaman sejak waktu pustakawan meng-acc
        const durasiPeminjaman = new Date(peminjaman.tanggal_pengembalian).getTime() - new Date(peminjaman.tanggal_peminjaman).getTime();
        const tanggalPengembalianBaru = new Date(new Date().getTime() + durasiPeminjaman);
        
        // Memeriksa apakah tanggal pengembalian jatuh pada hari Sabtu atau Minggu
        const dayOfWeek = tanggalPengembalianBaru.getDay();
        if (dayOfWeek === 6) { // Sabtu
            tanggalPengembalianBaru.setDate(tanggalPengembalianBaru.getDate() + 2); // Geser ke hari Senin (2 hari ke depan)
        } else if (dayOfWeek === 0) { // Minggu
            tanggalPengembalianBaru.setDate(tanggalPengembalianBaru.getDate() + 1); // Geser ke hari Senin (1 hari ke depan)
        }

        // Update tanggal pengembalian peminjaman
        await Peminjaman.update({ tanggal_pengembalian: tanggalPengembalianBaru }, {
            where: {
                id_peminjaman: id_peminjaman
            }
        });

        await Peminjaman.update({ status_peminjaman: 'sedang dipinjam'}, {
            where: {
                id_peminjaman: id_peminjaman
            }
        });

        // Kurangi jumlah buku yang diminta dari jumlah buku yang tersedia dalam database
        const jumlahBukuTersediaBaru = buku.jumlah_buku - jumlahBukuDipinjam;

        // Simpan jumlah buku yang tersedia yang baru ke dalam database
        await Buku.update({ jumlah_buku: jumlahBukuTersediaBaru }, {
            where: {
                id_buku: peminjaman.id_buku
            }
        });

        if (jumlahBukuTersediaBaru <= 0) {
            await Buku.update({ status_ketersediaan: 'Tidak Tersedia' }, {
                where: {
                    id_buku: peminjaman.id_buku
                }
            });
        } else {
            await Buku.update({ status_ketersediaan: 'Tersedia' }, {
                where: {
                    id_buku: peminjaman.id_buku
                }
            });
        }

        const { catatan } = req.body;
        if (catatan) {
            await Peminjaman.update({ catatan: catatan }, {
                where: {
                    id_peminjaman: id_peminjaman
                }
            });
        }

        return res.status(200).json({ message: 'Peminjaman telah di-acc oleh pustakawan' });
    } catch (error) {
        console.error('Error saat meng-acc peminjaman:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat meng-acc peminjaman' });
    }
};

// Tolak peminjaman
export const tolakPeminjaman = async (req, res) => {
    try {
   
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { id_peminjaman } = req.params;

        const peminjaman = await Peminjaman.findByPk(id_peminjaman);
        if (!peminjaman) {
            return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });
        }

        await Peminjaman.destroy({
            where: {
                id_peminjaman: id_peminjaman
            }
        });

        return res.status(200).json({ message: 'Peminjaman telah ditolak oleh pustakawan' });
    } catch (error) {
        console.error('Error saat menolak peminjaman:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menolak peminjaman' });
    }
};

// Fungsi untuk menghitung denda
    const hitungDenda = (tanggal_pengembalian, tanggalPerpanjanganInput) => {
    //const satuHari = 24 * 60 * 60 * 1000;
    const tanggalKembali = new Date(tanggal_pengembalian);
    const tanggal_perpanjangan = tanggalPerpanjanganInput ? new Date(tanggalPerpanjanganInput) : null;

    // Tentukan tanggal yang digunakan untuk menghitung denda
    let tanggalHitung = tanggal_perpanjangan || tanggalKembali;

    //  tanggal kembali pertama di eksekusi jika tanggal perpanjangan tidak ada
    if (!tanggal_perpanjangan) {
        tanggalHitung = tanggalKembali;
    }

    let selisihHari = 0;
    let currentDay = new Date(tanggalHitung);

    // hitung hanya untuk hari kerja
    while (currentDay <= new Date()) {
        // Periksa apakah hari saat ini bukan hari Sabtu atau Minggu
        if (currentDay.getDay() !== 6 && currentDay.getDay() !== 0) {
            selisihHari++;
        }
        currentDay.setDate(currentDay.getDate() + 1); // Pindah ke hari berikutnya
    }

    if (selisihHari <= 0) {
        return 0; // tepat waktu/ sebelum jatuh tempo tidak denda
    }

    const denda = selisihHari * 500; 
    return denda;
};

// Mengembalikan peminjaman
export const kembalikanPeminjaman = async (req, res) => {
    try {

        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { id_peminjaman } = req.params;

        const peminjaman = await Peminjaman.findByPk(id_peminjaman);
        if (!peminjaman) {
            return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });
        }

        // Inisialisasi variabel denda
        let denda = 0;

        const peminjam = await Users.findByPk(peminjaman.id_user);
        // Hitung denda jika peminjam bukan guru/staf
        if (peminjam.role !== 'guru' && peminjam.role !== 'staf') {
            denda = hitungDenda(peminjaman.tanggal_pengembalian, peminjaman.tanggal_perpanjangan);
        }

        // Update status peminjaman menjadi "telah dikembalikan" dan menambahkan tanggal pengembalian aktual
        await Peminjaman.update({ 
            status_peminjaman: 'sudah dikembalikan',
            denda: denda,
            tanggal_pengembalian_aktual: new Date() 
        }, {
            where: {
                id_peminjaman: id_peminjaman
            }
        });

        // Update jumlah buku yang tersedia berdasarkan jumlah buku yang dikembalikan
        const jumlahBukuDikembalikan = peminjaman.jumlah_pinjaman;
        const buku = await Buku.findByPk(peminjaman.id_buku);

        // Simpan jumlah buku yang tersedia yang baru
        const jumlahBukuTersediaBaru = buku.jumlah_buku + jumlahBukuDikembalikan;
        await Buku.update({ jumlah_buku: jumlahBukuTersediaBaru, status_ketersediaan: 'Tersedia' }, {
            where: {
                id_buku: peminjaman.id_buku
            }
        });

        // Hitung keterlambatan jika ada
        const tanggal_pengembalian_aktual = new Date();
        const tanggalKembali = peminjaman.tanggal_perpanjangan || peminjaman.tanggal_pengembalian;
        const selisihHari = Math.ceil((tanggal_pengembalian_aktual - tanggalKembali) / (1000 * 60 * 60 * 24));

        let jumlah_pengembalian_terlambat = 0;
        if (selisihHari > 0) {
            jumlah_pengembalian_terlambat = 1;
        }

        // Update jumlah pengembalian terlambat
        await peminjaman.update({ jumlah_pengembalian_terlambat });

        return res.status(200).json({ message: 'Peminjaman telah berhasil dikembalikan' });
    } catch (error) {
        console.error('Error saat mengembalikan buku:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat mengembalikan buku' });
    }
};

// Menampilkan data peminjaman by user
export const getDataByUser = async (req, res) => {
    try {
     
        const { userId } = req.user;
        const { status } = req.query;

        let peminjaman;

        if (req.user.role === 'pustakawan') {

            peminjaman = await Peminjaman.findAll({
                where: {
                    status_peminjaman: {
                        [Op.or]: ['sedang dipinjam', 'sudah dikembalikan', 'menunggu persetujuan']
                    }
                },
                include: [
                    {
                        model: Buku,
                        attributes: ['judul']
                    },
                    {
                        model: Users,
                        attributes: ['name', 'kelas', 'no_telepon']
                    }
                ],
                attributes: ['id_peminjaman', 'tanggal_peminjaman', 'tanggal_pengembalian', 'tanggal_pengembalian_aktual', 'tanggal_perpanjangan', 'status_peminjaman', 'denda', 'jumlah_pinjaman', 'catatan', 'jumlah_pengembalian_terlambat'],
                order: [
                    ['tanggal_peminjaman', 'ASC']
                ]
            });
        } else {
           
            const whereClause = { id_user: userId };
            if (status) {
                whereClause.status_peminjaman = status;
            }
            peminjaman = await Peminjaman.findAll({
                where: whereClause,
                include: [{
                    model: Buku,
                    attributes: ['judul']
                },
            {
                model: Users,
                        attributes: ['name', 'kelas', 'no_telepon']
                }
            ],
                attributes: ['id_peminjaman', 'tanggal_peminjaman', 'tanggal_pengembalian', 'tanggal_pengembalian_aktual', 'tanggal_perpanjangan', 'status_peminjaman', 'denda', 'jumlah_pinjaman', 'catatan', 'jumlah_pengembalian_terlambat'],
                order: [
                    ['tanggal_peminjaman', 'ASC']
                ]
            });
        }

        return res.json(peminjaman);
    } catch (error) {
        console.error('Error saat mendapatkan catatan peminjaman:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat mendapatkan catatan peminjaman' });
    }
};

// Insert data peminjaman manual

export const insertDataManual = async (req, res) => {
    try {
        // Validasi peran pengguna
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        // Ambil data dari request body
        const { judul, name_user, tanggal_pengembalian, jumlah_pinjaman, catatan } = req.body;

        // Validasi input
        if (!name_user) return res.status(400).json({ error: 'Nama wajib diisi.' });
        if (!judul) return res.status(400).json({ error: 'Judul buku wajib diisi.' });
        if (!tanggal_pengembalian) return res.status(400).json({ error: 'Tanggal pengembalian wajib dipilih.' });
        if (!jumlah_pinjaman) return res.status(400).json({ error: 'Jumlah buku wajib diisi.' });

        // Cari data pengguna berdasarkan nama
        const user = await Users.findOne({ where: { name: name_user } });
        if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

         // Cari data buku berdasarkan judul
         const buku = await Buku.findOne({ where: { judul } });
         if (!buku) return res.status(404).json({ error: 'Buku tidak ditemukan.' });
 
         // Pastikan jumlah buku yang tersedia cukup
         if (buku.jumlah_buku < jumlah_pinjaman) {
             return res.status(400).json({ error: 'Jumlah buku yang tersedia tidak mencukupi.' });
         }
 

        // Periksa apakah pengguna memiliki peminjaman yang sedang berlangsung
        const jumlahPeminjaman = await Peminjaman.count({
            where: {
                id_user: user.id_user,
                status_peminjaman: {
                    [Op.or]: ['menunggu persetujuan', 'sedang dipinjam']
                }
            }
        });
        if (jumlahPeminjaman >= 1) {
            return res.status(403).json({ error: 'Pengguna ini masih memiliki transaksi peminjaman yang sedang berlangsung.' });
        }


        // Tambahkan data peminjaman ke database
        const peminjamanManual = await Peminjaman.create({
            id_buku: buku.id_buku,
            id_user: user.id_user,
            tanggal_peminjaman: new Date(),
            tanggal_pengembalian: tanggal_pengembalian,
            status_peminjaman: 'sedang dipinjam',
            jumlah_pinjaman: jumlah_pinjaman,
            catatan: catatan
        });

        // Kurangi jumlah buku yang tersedia
        const jumlahBukuTersediaBaru = buku.jumlah_buku - jumlah_pinjaman;

        await Buku.update(
            {
                jumlah_buku: jumlahBukuTersediaBaru,
                status_ketersediaan: jumlahBukuTersediaBaru > 0 ? 'Tersedia' : 'Tidak tersedia'
            },
            { where: { id_buku: buku.id_buku } }
        );

        return res.status(201).json({ message: 'Data peminjam berhasil ditambahkan', peminjaman: peminjamanManual });
    } catch (error) {
        console.error('Error saat menambahkan data peminjam:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menambahkan data peminjam' });
    }
};


// Pencarian data peminjaman by buku
export const getDataByBuku = async (req, res) => {
    try {
        
        if (!req.user || req.user.role !== 'pustakawan') {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { judul } = req.params; 
        
        // Cari catatan peminjaman berdasarkan judul buku
        const catatanPeminjaman = await Peminjaman.findAll({
            include: [
                {
                    model: Buku,
                    where: {
                        judul: {
                            [Op.like]: `%${judul}%`, 
                        },
                    },
                },
                {
                    model: Users, 
                    attributes: ['name', 'no_telepon', 'kelas'],
                }
            ],
            where: {
                status_peminjaman: {
                    [Op.or]: ['sedang dipinjam', 'sudah dikembalikan']
                }
            },
            order: [['tanggal_peminjaman', 'ASC']] 
        });

        if (catatanPeminjaman.length > 0) {
            const peminjamanPerBulanTahun = {};
            let totalPeminjaman = 0;
            catatanPeminjaman.forEach(peminjaman => {
                const bulanPeminjaman = new Date(peminjaman.tanggal_peminjaman).getMonth() + 1;
                const tahunPeminjaman = new Date(peminjaman.tanggal_peminjaman).getFullYear();
                const key = `${bulanPeminjaman}-${tahunPeminjaman}`;
                if (!peminjamanPerBulanTahun[key]) {
                    peminjamanPerBulanTahun[key] = {
                        bulanPeminjaman: bulanPeminjaman,
                        tahunPeminjaman: tahunPeminjaman,
                        totalBukuDipinjam: 0,
                        totalPeminjaman: 0,
                        data: []
                    };
                }

                peminjamanPerBulanTahun[key].totalPeminjaman++;
                peminjamanPerBulanTahun[key].totalBukuDipinjam += peminjaman.jumlah_pinjaman;
                peminjamanPerBulanTahun[key].data.push({
                    id_peminjaman: peminjaman.id_peminjaman,
                    id_buku: peminjaman.id_buku,
                    name: peminjaman.user ? peminjaman.user.name : 'User tidak ditemukan', 
                    kelas: peminjaman.user ? peminjaman.user.kelas : '-',
                    no_telepon: peminjaman.user ? peminjaman.user.no_telepon : '-',
                    judul: peminjaman.buku ? peminjaman.buku.judul : 'No Buku',
                    tanggal_peminjaman: peminjaman.tanggal_peminjaman,
                    tanggal_pengembalian: peminjaman.tanggal_pengembalian,
                    tanggal_pengembalian_aktual: peminjaman.tanggal_pengembalian_aktual,
                    tanggal_perpanjangan: peminjaman.tanggal_perpanjangan,
                    status_peminjaman: peminjaman.status_peminjaman,
                    jumlah_pinjaman: peminjaman.jumlah_pinjaman,
                    catatan: peminjaman.catatan
                });
                totalPeminjaman++;
            });

            const peminjamanArray = Object.values(peminjamanPerBulanTahun).sort((a, b) => {
                const dateA = new Date(`${a.tahunPeminjaman}-${a.bulanPeminjaman}-01`);
                const dateB = new Date(`${b.tahunPeminjaman}-${b.bulanPeminjaman}-01`);
                return dateA - dateB;
            });

            return res.status(200).json({ peminjaman: peminjamanArray });
        } else {
            return res.status(404).json({ message: 'Tidak ada catatan peminjaman yang ditemukan untuk judul buku yang diberikan' });
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan dalam memproses permintaan' });
    }
};

// Pencarian data total buku dipinjam berdasarkan nama
export const countDataByUser = async (req, res) => {
    try {

        if (!req.user || req.user.role !== 'pustakawan') {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { name } = req.params;

        if (!name || name.trim().length < 4) {
            return res.status(400).json({ message: 'Nama pengguna harus minimal 4 karakter' });
        }

        const user = await Users.findOne({
            where: {
                name: {
                    [Op.like]: `%${name}%` 
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }

        const totalJumlahPinjaman = await Peminjaman.sum('jumlah_pinjaman', {
            where: {
                id_user: user.id_user,
                status_peminjaman: 'sedang dipinjam'
            }
        });

        return res.status(200).json({
            namaLengkap: user.name,
            jumlahPinjaman: totalJumlahPinjaman || 0
        });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan dalam memproses permintaan' });
    }
};

// Telusuri data peminjaman
export const searchData = async (req, res) => {
    try {

        if (!req.user || req.user.role !== 'pustakawan') {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { query } = req.query; 
 
        if (!query) {
            return res.status(400).json({ error: 'Parameter query diperlukan' });
        }

        const catatanPeminjaman = await Peminjaman.findAll({
            attributes: ['id_peminjaman', 'tanggal_peminjaman', 'tanggal_pengembalian', 'tanggal_perpanjangan', 'status_peminjaman', 'jumlah_pinjaman', 'catatan'],
            where: {
            
                [Op.and]: [
                    { status_peminjaman: 'sedang dipinjam' },
                    {
                    
                [Op.or]: [
                    { '$user.name$': { [Op.like]: `%${query}%` } }, 
                    { '$buku.judul$': { [Op.like]: `%${query}%` } },
                ]
            }
                ]
            },
            
            include: [
                {
                    model: Buku,
                    as: 'buku',
                    attributes: ['judul']
                }, 
                {
                    model: Users, 
                    as: 'user',
                    attributes: ['name', 'kelas', 'no_telepon']
                }
            ]
        });

        const totalPeminjaman = catatanPeminjaman.length;

        return res.status(200).json({totalPeminjaman: totalPeminjaman, catatanPeminjaman: catatanPeminjaman });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan dalam memproses permintaan' });
    }
}; 

// Menampilkan data laporan peminjaman
export const generateDataReport = async (req, res) => {
    try {

        if (!req.user || req.user.role !== 'pustakawan') {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { type } = req.query;
        if (!type) {
            return res.status(400).json({ error: 'Parameter type diperlukan' });
        }

        let reportData;
        switch (type) {
            case 'totalPerBulan':
                reportData = await generateTotalPeminjamanPerBulan();
                break;

            case 'bukuPalingSeringDipinjam':
                reportData = await generateBukuPalingSeringDipinjam();
                break;

            case 'keterlambatan':
            reportData = await generateLaporanKeterlambatan();
                break;
            default:
                return res.status(400).json({ error: 'Jenis laporan tidak valid' });
        }

        return res.status(200).json({ reportData });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan dalam memproses permintaan' });
    }
};

const generateTotalPeminjamanPerBulan = async () => {

    // Menghitung jumlah total peminjaman per bulan dengan format 'Bulan Tahun'
    const totalPeminjamanPerBulan = await Peminjaman.findAll({
        attributes: [
            [sequelize.fn('DATE_FORMAT', sequelize.col('tanggal_peminjaman'), '%M %Y'), 'bulan'],
            [sequelize.fn('COUNT', sequelize.col('*')), 'totalPeminjaman'],
            [sequelize.fn('SUM', sequelize.col('jumlah_pinjaman')), 'totalBukuDipinjam']
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('tanggal_peminjaman'), '%Y-%m')]
    });

    return totalPeminjamanPerBulan;
};

const formatMonth = (monthNumber) => {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1];
};

const generateBukuPalingSeringDipinjam = async () => {
    try {
        // Menghitung jenis buku yang paling sering dipinjam
        const bukuPalingSeringDipinjam = await Peminjaman.findAll({
            attributes: [
                [sequelize.col('buku.judul'), 'judulBuku'],
                [sequelize.fn('COUNT', sequelize.col('*')), 'totalPeminjaman'],
                [sequelize.literal('(SELECT SUM(jumlah_pinjaman) FROM Peminjaman WHERE Peminjaman.id_buku = buku.id_buku)'), 'totalBukuDipinjam'],
                [sequelize.fn('MONTH', sequelize.col('tanggal_peminjaman')), 'bulanPeminjaman'], // Ambil bulan dari tanggalPeminjaman
                [sequelize.fn('YEAR', sequelize.col('tanggal_peminjaman')), 'tahunPeminjaman'] // Ambil tahun dari tanggalPeminjaman
            ],
            include: [{
                model: Buku,
                as: 'buku',
                attributes: []
            }],
            group: ['buku.judul', sequelize.fn('MONTH', sequelize.col('tanggal_peminjaman')), sequelize.fn('YEAR', sequelize.col('tanggal_peminjaman'))],
            order: [
                [sequelize.fn('YEAR', sequelize.col('tanggal_peminjaman')), 'DESC'],
                [sequelize.fn('MONTH', sequelize.col('tanggal_peminjaman')), 'DESC'],
                [sequelize.literal('totalBukuDipinjam'), 'DESC']
            ]
        });

        const groupedData = {};
        bukuPalingSeringDipinjam.forEach(item => {
            const bulan = item.getDataValue('bulanPeminjaman');
            const tahun = item.getDataValue('tahunPeminjaman');
            const judulBuku = item.getDataValue('judulBuku');
            const totalPeminjaman = item.getDataValue('totalPeminjaman');
            const totalBukuDipinjam = item.getDataValue('totalBukuDipinjam');

            const bulanNama = formatMonth(bulan);
            const key = `Bulan: ${bulanNama}, Tahun: ${tahun}`;
            if (!groupedData[key]) {
                groupedData[key] = [];
            }
            groupedData[key].push({ judulBuku, totalPeminjaman, totalBukuDipinjam });
        });

        const reportData = [];
        for (const [key, value] of Object.entries(groupedData)) {
            reportData.push({
                reportData: key,
                data: value
            });
        }

        return reportData;
    } catch (error) {
        console.error('Error saat menghasilkan laporan buku yang paling sering dipinjam:', error);
        throw error;
    }
};

const generateLaporanKeterlambatan = async () => {
    try {
        // Menghitung data peminjaman yang terlambat
        const peminjamanTerlambat = await Peminjaman.findAll({
            attributes: [
                'id_peminjaman', 'tanggal_peminjaman', 'tanggal_pengembalian',
                'tanggal_perpanjangan', 'tanggal_pengembalian_aktual', 'status_peminjaman', 'denda',
                'jumlah_pinjaman', 'jumlah_pengembalian_terlambat', 'catatan',
                [sequelize.literal('MONTH(tanggal_peminjaman)'), 'bulanPeminjaman'],
                [sequelize.literal('YEAR(tanggal_peminjaman)'), 'tahunPeminjaman']
            ],
            include: [{
                model: Buku,
                as: 'buku',
                attributes: ['judul']
            }, {
                model: Users,
                as: 'user',
                attributes: ['name', 'kelas', 'no_telepon']
            }],
            where: {
                [Op.or]: [
                    sequelize.literal('tanggal_perpanjangan < COALESCE(tanggal_pengembalian_aktual, NOW())'),
                    sequelize.literal('(tanggal_perpanjangan IS NULL AND tanggal_pengembalian < COALESCE(tanggal_pengembalian_aktual, NOW()))')
                ],
                status_peminjaman: ['sudah dikembalikan', 'sedang dipinjam']
            },
            order: [
                [sequelize.literal('CASE WHEN tanggal_perpanjangan IS NOT NULL THEN tanggal_perpanjangan ELSE tanggal_pengembalian END'), 'DESC']
            ]
        });

        const totalPeminjamanTerlambat = peminjamanTerlambat.length;

        // Mapping bulan angka ke nama bulan
        const bulanMap = {
            1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
            7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
        };

        const groupedData = {};
        peminjamanTerlambat.forEach(item => {
            const month = item.dataValues.bulanPeminjaman;
            const year = item.dataValues.tahunPeminjaman;
            const monthName = bulanMap[month] || 'Unknown'; 
            const key = `${monthName}-${year}`;
            if (!groupedData[key]) {
                groupedData[key] = [];
            }
            groupedData[key].push(item);
        });

        // menghitung total perbulan
        const monthlyTotal = [];
        for (const key in groupedData) {
            if (Object.hasOwnProperty.call(groupedData, key)) {
                const data = groupedData[key];
                const [monthName, year] = key.split('-'); 
                monthlyTotal.push({
                    bulanPeminjaman: monthName, 
                    tahunPeminjaman: year,
                    data: data,
                    total: data.length
                });
            }
        }

        return { totalPeminjamanTerlambat, monthlyTotal };
    } catch (error) {
        console.error('Error saat menghasilkan laporan keterlambatan:', error);
        throw error;
    }
};

// Rekapitulasi buku
export const getDataByMonthYear = async (req, res) => {
    try {

        if (!req.user || req.user.role !== 'pustakawan') {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { month, year } = req.params;

        const totalBuku = await Buku.sum('jumlah_buku', {
            where: {
                createdAt: {
                    [Op.and]: [
                        sequelize.literal(`YEAR(createdAt) = ${year}`),
                        sequelize.literal(`MONTH(createdAt) <= ${month}`)
                    ]
                }
            }
        });

        const totalBukuDipinjam = await Peminjaman.sum('jumlah_pinjaman', {
            where: {
                status_peminjaman: { [Op.or]: ['sedang dipinjam', 'sudah dikembalikan'] },
                updatedAt: {
                    [Op.and]: [
                        sequelize.literal(`MONTH(updatedAt) = ${month}`),
                        sequelize.literal(`YEAR(updatedAt) = ${year}`)
                    ]
                }
            }
        });

         const totalBukuRusak = await Buku.sum('jumlah_buku', {
            where: {
                kondisi: 'rusak',
                updatedAt: {
                    [Op.and]: [
                        sequelize.literal(`MONTH(updatedAt) = ${month}`),
                        sequelize.literal(`YEAR(updatedAt) = ${year}`)
                    ]
                }
            }
        });

        return res.status(200).json({
            month,
            year,
            totalBuku,
            totalBukuDipinjam,
            totalBukuRusak
        });
    } catch (error) {
        console.error('Error saat mendapatkan data:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat mendapatkan data' });
    }
};

// Hapus data peminjamann
export const deleteDataPeminjaman = async (req, res) => {
    try {
        const { id_peminjaman } = req.params;

        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error:'Anda tidak memiliki izin untuk melakukan tindakan ini'});
        }

        const peminjaman = await Peminjaman.findByPk(id_peminjaman);
        if (!peminjaman) {
            return res.status(404).json({ error: 'Data peminjaman tidak ditemukan' });
        }

        await Peminjaman.destroy({
            where: { id_peminjaman }
        });

        return res.json({ message: 'Data peminjaman berhasil dihapus' });
    } catch (error) {
        console.error('Error saat menghapus data peminjaman:', error);
        return res.status(500).json({ error: 'Hapus data laporan yang berkaitan dengan peminjaman ini dan coba lagi.' });
    }
};