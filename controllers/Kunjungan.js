// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from 'sequelize';
import Kunjungan from "../models/KunjunganModel.js";

// Mengisi kehadiran kunjungan
export const addData = async (req, res) => {
    try {

        const { nama_pengunjung } = req.body;
        if (!nama_pengunjung) {
            return res.status(400).json({ error: 'Nama wajib diisi.' });
        }

        const newKunjungan = await Kunjungan.create({
            nama_pengunjung,
            tanggal_kunjungan: new Date(),
            status_kunjungan: "masuk" 
        });

        res.status(201).json({
            message: "Berhasil.",
            data: newKunjungan
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mencatat kunjungan",
            error: error.message
        });
    }
};


// Menampilkan data kunjungan
export const getData = async (req, res) => {
    if (req.user.role !== 'pustakawan') {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini.' });
      }
    try {
        const kunjungan = await Kunjungan.findAll();
        res.status(200).json({
            data: kunjungan
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data kunjungan",
            error: error.message
        });
    }
};

// Menghapus data kunjungan
export const deleteData = async (req, res) => {
    try {
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini.' });
          }
          
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Bulan dan tahun harus diisi." });
        }

        // Delete berdasarkan bulan dan tahun
        const result = await Kunjungan.destroy({
            where: {
                [Sequelize.Op.and]: [
                    Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('tanggal_kunjungan')), month),
                    Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('tanggal_kunjungan')), year)
                ]
            }
        });

        if (result === 0) {
            return res.status(404).json({ message: "Tidak ada data yang ditemukan untuk bulan dan tahun yang diberikan." });
        }

        res.status(200).json({ message: "Data kunjungan berhasil dihapus.", deletedRows: result });
    } catch (error) {
        console.error("Error saat menghapus data kunjungan:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat menghapus data kunjungan." });
    }
};