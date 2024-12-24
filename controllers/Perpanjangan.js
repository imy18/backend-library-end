// Code was written by Muhammad Sindida Hilmy

import Perpanjangan from '../models/PerpanjanganModel.js';
import Peminjaman from '../models/PeminjamanModel.js';
import Users from '../models/UserModel.js';
import Buku from '../models/BukuModel.js';

// Request perpanjangan
export const requestPerpanjangan = async (req, res) => {
    try {
        const { id_peminjaman } = req.params;
        const { durasi_perpanjangan } = req.body;
        const { userId } = req.user;

        const peminjaman = await Peminjaman.findOne({
            where: {
                id_peminjaman: id_peminjaman,
                id_user: userId,
                status_peminjaman: 'sedang dipinjam'
            }
        });

        // Cek apakah tanggal perpanjangan sudah terisi
        if (peminjaman.tanggal_perpanjangan) {
            return res.status(403).json({ error: 'Anda telah melakukan perpanjangan sebelumnya, tidak dapat mengajukan permintaan perpanjangan lagi.' });
        }

        // Cek apakah tanggal pengembalian sudah lewat
        if (peminjaman.tanggal_pengembalian < new Date()) {
            return res.status(403).json({ error: 'Tanggal pengembalian sudah lewat, Anda tidak dapat mengajukan permintaan perpanjangan.' });
        }

        // Cek apakah pengguna telah mengajukan perpanjangan pinjaman dengan peminjaman yang sama sebelumnya
        const permintaanPerpanjanganSebelumnya = await Perpanjangan.findOne({
            where: {
                id_peminjaman: id_peminjaman,
                id_user: userId,
                status: 'menunggu persetujuan'
            }
        });

        if (permintaanPerpanjanganSebelumnya) {
            return res.status(403).json({ error: 'Anda sudah mengajukan permintaan perpanjangan untuk peminjaman ini sebelumnya.' });
        }

        const permintaanPerpanjangan = await Perpanjangan.create({
            id_peminjaman: peminjaman.id_peminjaman,
            id_buku: peminjaman.id_buku,
            id_user: userId,
            tanggal_perpanjangan: new Date(),
            durasi_perpanjangan: durasi_perpanjangan,
            status: 'menunggu persetujuan',
        });

        return res.status(201).json({ message: 'Permintaan perpanjangan berhasil diajukan' });
    } catch (error) {
        console.error('Error saat membuat permintaan perpanjangan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat membuat permintaan perpanjangan' });
    }
};

// Acc permintaan perpanjangan
export const approvePerpanjangan = async (req, res) => {
    try {

        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { id_perpanjangan } = req.params;

        const permintaanPerpanjangan = await Perpanjangan.findByPk(id_perpanjangan);
        if (!permintaanPerpanjangan) {
            return res.status(404).json({ error: 'Permintaan perpanjangan tidak ditemukan' });
        }

        const peminjaman = await Peminjaman.findByPk(permintaanPerpanjangan.id_peminjaman);

        // 2 hari
        let tanggalPerpanjanganBaru = new Date(peminjaman.tanggal_pengembalian.getTime() + 2 * 24 * 60 * 60 * 1000);

        const tanggalAcc = new Date();
        if (tanggalAcc > peminjaman.tanggal_pengembalian) {
            return res.status(400).json({ error: 'Tanggal persetujuan permintaan perpanjangan melebihi batas pengembalian yang ditetapkan pada peminjaman.' });
        }
        
        // Jika tanggal perpanjangan jatuh pada hari Sabtu atau Minggu, pindahkan ke hari Senin
        if (tanggalPerpanjanganBaru.getDay() === 0) { // Minggu
            tanggalPerpanjanganBaru.setDate(tanggalPerpanjanganBaru.getDate() + 1); // Pindahkan ke hari Senin
        } else if (tanggalPerpanjanganBaru.getDay() === 6) { // Sabtu
            tanggalPerpanjanganBaru.setDate(tanggalPerpanjanganBaru.getDate() + 2); // Pindahkan ke hari Senin
        }

        await permintaanPerpanjangan.update({ status: 'disetujui' });

        await peminjaman.update({ tanggal_perpanjangan: tanggalPerpanjanganBaru });

        return res.status(200).json({ message: 'Permintaan perpanjangan berhasil disetujui' });
    } catch (error) {
        console.error('Error saat menyetujui permintaan perpanjangan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menyetujui permintaan perpanjangan' });
    }
};

// Reject permintaan perpanjangan
export const rejectPerpanjangan = async (req, res) => {
    try {

        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { id_perpanjangan } = req.params;

        const permintaanPerpanjangan = await Perpanjangan.findByPk(id_perpanjangan);
        if (!permintaanPerpanjangan) {
            return res.status(404).json({ error: 'Permintaan perpanjangan tidak ditemukan' });
        }

        await permintaanPerpanjangan.destroy();

        return res.status(200).json({ message: 'Permintaan perpanjangan berhasil ditolak dan dihapus' });
    } catch (error) {
        console.error('Error saat menolak permintaan perpanjangan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menolak permintaan perpanjangan' });
    }
};

// Menampilkan data perpanjangan
export const getPerpanjangan = async (req, res) => {
    try {

      if (req.user.role !== 'pustakawan') {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
    }
  
      const perpanjangan = await Perpanjangan.findAll({
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
        attributes: [
          'id_perpanjangan',
          'id_peminjaman',
          'id_buku',
          'id_user',
          'tanggal_perpanjangan',
          'durasi_perpanjangan',
          'status'
        ],
        order: [
          ['tanggal_perpanjangan', 'ASC'] 
        ]
      });
  
      res.json(perpanjangan);
    } catch (error) {
      console.error('Error getting perpanjangan data:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data perpanjangan' });
    }
  };

  // Menghapus data perpanjangan
  export const deleteDataPerpanjangan = async (req, res) => {
    const { id_perpanjangan } = req.params;
  
    try {
      if (req.user.role !== 'pustakawan') {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
      }
     
      const perpanjangan = await Perpanjangan.findOne({ where: { id_perpanjangan } });
      if (!perpanjangan) {
        return res.status(404).json({ error: 'Data perpanjangan tidak ditemukan' });
      }
  
      await Perpanjangan.destroy({ where: { id_perpanjangan } });
  
      res.json({ message: 'Data perpanjangan berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting perpanjangan data:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat menghapus data perpanjangan' });
    }
  };