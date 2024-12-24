// Code was written by Muhammad Sindida Hilmy

import Buku from "../models/BukuModel.js";
import Peminjaman from "../models/PeminjamanModel.js";
import { Op } from "sequelize";
import sequelize from "sequelize";
import fs from 'fs';
import path from 'path';

// Menambahkan data buku
export const createDataBook = async (req, res) => {
    
    if (req.user.role !== 'pustakawan') {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini.' });
    }

    try {
        const { judul, 
                penulis, 
                penerbit, 
                tahun_terbit, 
                dcc, 
                kategori, 
                jumlah_buku, 
                bahasa, 
                lokasi_penyimpanan, 
                status_ketersediaan, 
                kondisi, 
                keterangan, 
                kelas } = req.body;

        if (!judul) {
            return res.status(400).json({ error: 'Judul wajib diisi.' });
        }

        if (!penulis) {
            return res.status(400).json({ error: 'Penulis wajib diisi.' });
        }

        if (!dcc) {
            return res.status(400).json({ error: 'DCC wajib diisi.' });
        } 

        if (!kategori) {
            return res.status(400).json({ error: 'Kategori wajib dipilih.' });
        }

        if (!jumlah_buku) {
            return res.status(400).json({ error: 'Jumlah buku wajib diisi.' });
        }

        if (!bahasa) {
            return res.status(400).json({ error: 'Bahasa wajib dipilih.' });
        }

        const judulSama = await Buku.findOne({ where: { judul } });
        if (judulSama) {
            return res.status(400).json({ error: 'Judul buku sudah ada.' });
        }

        const dccSama = await Buku.findOne({ where: { dcc } });
        if (dccSama) {
            return res.status(400).json({ error: 'DCC sudah terdaftar.' });
        }

        // Path untuk foto baru
        const fotoPath = req.file ? `${req.file.filename}` : null;

        const buku = await Buku.create({
            judul,
            penulis,
            penerbit,
            tahun_terbit,
            dcc,
            kategori,
            jumlah_buku,
            bahasa,
            lokasi_penyimpanan,
            status_ketersediaan,
            foto: fotoPath, 
            kondisi,
            keterangan,
            kelas
        });

        return res.status(201).json({ message: 'Data buku berhasil ditambahkan.', buku });
    } catch (error) {
        console.error('Error saat menambahkan data buku :', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menambahkan data buku.' });
    }
};

// Menampilkan data buku
export const getDataBook = async (req, res) => {
    try {
        const buku = await Buku.findAll({
            attributes: [
                'id_buku', 
                'judul', 
                'penulis', 
                'penerbit', 
                'dcc', 
                'kategori', 
                'status_ketersediaan', 
                'foto', 
                'kelas', 
                'createdAt']
        });

        return res.json({buku});
    } catch (error) {
        console.error('Error saat menampilkan data buku :', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menampilkan data buku.' });
    }
};

// Mencari data buku
export const searchData = async (req, res) => {
    try {
        const { judul } = req.query;

        let buku;
        if (judul) {
            
            buku = await Buku.findAll({
                where: {
                    judul: {
                        [Op.like]: `%${judul}%` // Pencarian yang fleksibel
                    }
                },
                attributes: ['id_buku', 
                    'judul', 
                    'penulis', 
                    'foto']
            });
        }

        return res.json({buku});
    } catch (error) {
        console.error('Error saat menampilkan data buku:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menampilkan data buku.' });
    }
};

// Mengubah data buku
export const updateDataBook = async (req, res) => {
    try {
       
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini.' });
        }

        const { id_buku } = req.params;
        const { judul, 
                penulis, 
                penerbit, 
                tahun_terbit, 
                dcc, 
                kategori, 
                jumlah_buku, 
                bahasa, 
                lokasi_penyimpanan, 
                status_ketersediaan, 
                kondisi, 
                keterangan, 
                kelas } = req.body;

        if (!judul) return res.status(400).json({ error: 'Judul wajib diisi.' });
        if (!dcc) return res.status(400).json({ error: 'DCC wajib diisi.' });
        if (!penulis) return res.status(400).json({ error: 'Penulis wajib diisi.' });
        if (!kategori) return res.status(400).json({ error: 'Kategori wajib dipilih.' });
        if (!jumlah_buku) return res.status(400).json({ error: 'Jumlah buku wajib diisi.' });
        if (!bahasa) return res.status(400).json({ error: 'Bahasa wajib dipilih.' });
        if (!kondisi) return res.status(400).json({ error: 'Kondisi wajib dipilih.' });
        if (!status_ketersediaan) return res.status(400).json({ error: 'Status ketersediaan wajib dipilih.' });

         if (parseInt(jumlah_buku) === 0) {
            return res.status(400).json({ error: 'Jumlah buku tidak boleh bernilai 0.' });
        }

        const existingBook = await Buku.findOne({
            where: {
                judul,
                id_buku: { [Op.ne]: id_buku } // Mengecualikan buku yang sedang diubah
            }
        });

        if (existingBook) {
            return res.status(400).json({ error: 'Judul buku sudah ada.' });
        }

        const dccSama = await Buku.findOne({
            where: {
                dcc,
                id_buku: { [Op.ne]: id_buku } // Mengecualikan buku yang sedang diubah
            }
        });
        
        if (dccSama) {
            return res.status(400).json({ error: 'DCC sudah terdaftar.' });
        }

        // Mengecek apakah buku ada di database
        const buku = await Buku.findByPk(id_buku);
        if (!buku) {
            return res.status(404).json({ error: 'Buku tidak ditemukan.' });
        }

         const peminjamanAktif = await Peminjaman.findOne({
            where: {
                id_buku: id_buku,
                status_peminjaman: 'sedang dipinjam'
            }
        });
        
        if (peminjamanAktif) {
            return res.status(400).json({ error: 'Tidak dapat mengedit data buku karena ada peminjaman yang sedang berlangsung untuk buku ini.' });
        }

        let updatedStatusKetersediaan = status_ketersediaan;
        if (kondisi.toLowerCase() === 'baik') {
            updatedStatusKetersediaan = 'Tersedia';
        }

        else {
            updatedStatusKetersediaan = 'Tidak Tersedia';
        }

        // Update data buku tanpa foto terlebih dahulu
        await buku.update({
            judul,
            penulis,
            penerbit,
            tahun_terbit,
            dcc,
            kategori,
            jumlah_buku,
            bahasa,
            lokasi_penyimpanan,
            status_ketersediaan: updatedStatusKetersediaan,
            kondisi,
            keterangan,
            kelas
        });

        // Proses upload foto jika ada
        if (req.file) {
            // Hapus foto lama jika ada
            if (buku.foto) {
                const oldPhotoPath = path.join('uploadBook/', buku.foto);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            // Update dengan foto baru
            buku.foto = req.file.filename;
            await buku.save();
        }

        return res.status(200).json({ message: 'Data buku berhasil diperbarui.' });
    } catch (error) {
        console.error('Error saat memperbarui data buku:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data buku.' });
    }
};

// Cek judul buku (FE/ tambah data buku = menghindari foto masuk saat terjadi kesalahan)
export const checkBookTitle = async (req, res) => {
    try {
      const { judul } = req.body;
  
      // Cari buku dengan judul yang sama di database
      const existingBook = await Buku.findOne({ where: { judul } });
  
      if (existingBook) {
        return res.json({ exists: true }); // Jika buku dengan judul sudah ada
      }
  
      return res.json({ exists: false });
    } catch (error) {
      console.error('Error saat mengecek data buku:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan saat mengecek judul buku.' });
    }
  };

  // Cek dcc buku (FE/ tambah data buku = menghindari foto masuk saat terjadi kesalahan)
  export const checkDcc = async (req, res) => {
    try {
      const { dcc } = req.body; 
  
      // Cari buku dengan dcc yang sama di database
      const existingDcc = await Buku.findOne({ where: { dcc } });
  
      if (existingDcc) {
        return res.json({ exists: true });
      }
  
      return res.json({ exists: false });
    } catch (error) {
      console.error('Error checking dcc:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan saat mengecek DCC.' });
    }
  };

// Menghapus data buku
export const deleteDataBook = async (req, res) => {
    try {

      if (req.user.role !== 'pustakawan') {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini.' });
      }
  
      const { id_buku } = req.params;
  
      const buku = await Buku.findByPk(id_buku);
      if (!buku) {
        return res.status(404).json({ error: 'Buku tidak ditemukan' });
      }
  
      const filePath = buku.foto ? path.join(process.cwd(), 'uploadBook', buku.foto) : null;
  
      try {
        await Buku.destroy({
          where: { id_buku: id_buku }
        });
  
        // Menghapus file foto jika path valid
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
  
        return res.json({ message: 'Data buku berhasil dihapus.' });
      } catch (deleteError) {
        if (deleteError.name === 'SequelizeForeignKeyConstraintError') {
          return res.status(400).json({
            error: 'Gagal menghapus buku karena masih ada peminjaman terkait. Hapus data peminjaman terlebih dahulu dan coba lagi.',
          });
        }
        throw deleteError;
      }
    } catch (error) {
      console.error('Error saat menghapus data buku:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus data buku.' });
    }
  };

// Filter data buku
export const filterDataBook = async (req, res) => {
    try {
        const { bahasa, kategori, status_ketersediaan, lokasi_penyimpanan } = req.query;
        let filterCriteria = {};

        if (bahasa) {
            filterCriteria.bahasa = bahasa;
        }

        if (kategori) {
            filterCriteria.kategori = kategori;
        }

        if (status_ketersediaan) {
            filterCriteria.status_ketersediaan = status_ketersediaan;
        }

        if (lokasi_penyimpanan) {
            filterCriteria.lokasi_penyimpanan = lokasi_penyimpanan;
        }

        const filter = await Buku.findAll({
            where: filterCriteria,
            attributes: ['id_buku', 
                'judul', 
                'penulis', 
                'kategori', 
                'jumlah_buku', 
                'bahasa', 
                'lokasi_penyimpanan', 
                'status_ketersediaan', 
                'foto']
        });

        let totalBooks = 0;
        filter.forEach(book => {
            totalBooks += book.jumlah_buku;
        });

        res.json({totalBooks, filter});
    } catch (error) {
        console.error('Error saat melakukan filter buku:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat melakukan filter buku.' });
    }
};

// Detail data buku
export const detailDataBook = async (req, res) => {
    try {
        const { id_buku } = req.params;

        const buku = await Buku.findByPk(id_buku);

        if (!buku) {
            return res.status(404).json({ error: 'Buku tidak ditemukan' });
        }

        res.json({
            judul: buku.judul,
            penulis: buku.penulis,
            penerbit: buku.penerbit,
            tahun_terbit: buku.tahun_terbit,
            dcc: buku.dcc,
            kategori: buku.kategori,
            jumlah_buku: buku.jumlah_buku,
            bahasa: buku.bahasa,
            lokasi_penyimpanan: buku.lokasi_penyimpanan,
            status_ketersediaan: buku.status_ketersediaan,
            foto: buku.foto,
            kondisi: buku.kondisi,
            keterangan: buku.keterangan,
            kelas: buku.kelas
        });

    } catch (error) {
        console.error('Error saat mendapatkan detail buku :', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mendapatkan detail buku.' });
    }
};
 
// Kategorisasi
export const filterConditionBook = async (req, res) => {
    try {
        
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini.' });
        }

        const { kondisi } = req.params;

        if (kondisi !== 'baik' && kondisi !== 'rusak' && kondisi !== 'hilang') {
            return res.status(400).json({ error: 'kondisi tidak valid.' });
        }

        const buku = await Buku.findAll({
            attributes: ['id_buku', 
                'judul', 
                'penulis', 
                'jumlah_buku',  
                'kondisi'],
            where: { kondisi: kondisi }
        });

        const totalBooks = buku.reduce((total, b) => total + b.jumlah_buku, 0);

        return res.status(200).json({
            totalBooks, 
            books: buku,
        });
    } catch (error) {
        console.error('Error saat memfilter data buku:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat memfilter data buku.' });
    }
};

// Menampilkan label buku
export const getLabelBook = async (req, res) => {
    try {

        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const buku = await Buku.findAll({
            attributes: [
                'dcc',
                [sequelize.literal("LEFT(penulis, 3)"), 'penulis'], // Mengambil 3 huruf pertama dari penulis
                [sequelize.literal("LEFT(judul, 1)"), 'judul'], // Mengambil 1 huruf pertama dari judul
                'jumlah_buku',
                'kelas',
                'createdAt'
            ]
        });
        return res.json(buku);
    } catch (error) {
        console.error('Error saat menampilkan laebl buku :', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menampilkan label buku.' });
    }
};

// Co search insert data peminjaman
export const searchDataBookFE = async (req, res) => {
    const { query } = req.query; 

    if (!query) {
        // Jika query kosong, kirimkan error response
        return res.status(400).json({ error: 'Query tidak boleh kosong.' });
    }

    try {
        // Cari buku berdasarkan judul menggunakan LIKE
        const buku = await Buku.findAll({
            where: {
                judul: {
                    [Op.like]: `%${query}%` // Judul yang mirip dengan query
                }
            },
            limit: 5
        });
        
        res.json(buku);
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
    }
};