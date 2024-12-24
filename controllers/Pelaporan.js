// Code was written by Muhammad Sindida Hilmy

import Pelaporan from "../models/PelaporanModel.js";
import Peminjaman from "../models/PeminjamanModel.js";
import Buku from "../models/BukuModel.js";
import Users from "../models/UserModel.js";

// Melaporkan 
export const reportBook = async (req, res) => {
    try {
        const { id_peminjaman } = req.params;
        const { kategori, deskripsi, jumlahBuku } = req.body;
        const { userId } = req.user;

        // Ambil informasi peminjaman
        const peminjaman = await Peminjaman.findOne({
            where: { id_peminjaman },
        });

        if (!peminjaman) {
            return res.status(404).json({ error: 'Data peminjaman tidak ditemukan.' });
        }

        if (!kategori) {
            return res.status(400).json({ error: 'Kategori wajib dipilih.' });
        }

        if (!deskripsi) {
            return res.status(400).json({ error: 'Deskripsi wajib diisi.' });
        }

        if (!jumlahBuku || isNaN(jumlahBuku)) {
            return res.status(400).json({ error: 'Jumlah buku wajib diisi dengan angka.' });
        }

        // Cek apakah sudah ada laporan sebelumnya
        const laporanSebelumnya = await Pelaporan.findOne({
            where: {
                id_user: userId,
                id_peminjaman: id_peminjaman,
            },
        });

        if (laporanSebelumnya) {
            return res.status(403).json({ error: 'Anda sudah melaporkan untuk peminjaman ini sebelumnya.' });
        }

        // Buat laporan
        const laporan = await Pelaporan.create({
            id_user: userId,
            id_buku: peminjaman.id_buku,
            id_peminjaman: peminjaman.id_peminjaman,
            tanggal: new Date(),
            kategori,
            jumlah_buku: jumlahBuku,
            deskripsi,
        });

        return res.status(201).json({ message: 'Laporan berhasil dibuat', laporan });
    } catch (error) {
        console.error('Error saat membuat laporan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat membuat laporan' });
    }
};


// Menampilkan data laporan
export const getDataReport = async (req, res) => {
    try {

        if (!req.user || req.user.role !== 'pustakawan') {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        // Ambil parameter kategori dari query string
        const { kategori } = req.query;

        // Buat query berdasarkan kategori laporan
        let whereCondition = {};
        if (kategori) {
            whereCondition.kategori = kategori;
        }

        const dataLaporan = await Pelaporan.findAll({
            where: whereCondition,
            include: [
                { model: Buku, as: 'buku', attributes: ['judul'] },
                { model: Users, as: 'user', attributes: ['name', 'no_telepon', 'kelas'] }
            ]
        });

        const total = dataLaporan.length;

        return res.status(200).json({ total, dataLaporan });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan dalam memproses permintaan' });
    }
};

// Update data laporan
export const updateDataReport = async (req, res) => {
    try {
        
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { id_pelaporan } = req.params;
        const { deskripsi } = req.body;

        const pelaporan = await Pelaporan.findByPk(id_pelaporan);
        if (!pelaporan) {
            return res.status(404).json({ error: 'Laporan tidak ditemukan' });
        }

        await Pelaporan.update({
            deskripsi
        }, {
            where: { id_pelaporan: id_pelaporan }
        });

        return res.json({ message: 'Data laporan berhasil diperbarui.' });
    } catch (error) {
        console.error('Error saat update data pelaporan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data pelaporan' });
    }
};

// Menampilkan detail pelaporan (update)
export const getDataReportDetail = async (req, res) => {
    try {
        const { id_pelaporan } = req.params;
        const pelaporan = await Pelaporan.findByPk(id_pelaporan);
        
        if (!pelaporan) {
            return res.status(404).json({ error: 'Laporan tidak ditemukan' });
        }

        return res.json(pelaporan);
    } catch (error) {
        console.error('Error saat mendapatkan data pelaporan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat mendapatkan data pelaporan' });
    }
};

// Menghapus data pelaporan
export const deleteDataLaporan = async (req, res) => {
    try {
       
        if (!req.user || req.user.role !== 'pustakawan') {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { id_pelaporan } = req.params;

        const laporan = await Pelaporan.findByPk(id_pelaporan);
        if (!laporan) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }

        await laporan.destroy();

        return res.status(200).json({ message: 'Laporan berhasil dihapus' });
    } catch (error) {
        console.error('Terjadi kesalahan saat menghapus laporan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan dalam memproses permintaan' });
    }
};