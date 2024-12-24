// Code was written by Muhammad Sindida Hilmy

import Kritiksaran from "../models/KritikSaranModel.js";

// Membuat data kritikSaran
export const createKritikSaran = async (req, res) => {
    try {
        const { subjek, isi } = req.body;

        const kritiksaran = await Kritiksaran.create({
            tanggal: new Date(),
            subjek: subjek,
            isi: isi
        });

        return res.status(201).json({ message: 'Kritik dan saran berhasil dikirim'});
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan kritik dan saran' });
    }
};

// Menampilkan data kritikSaran
export const getDataKritikSaran = async (req, res) => {
    try {
        
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const dataKritikSaran = await Kritiksaran.findAll({
            attributes: ['id_kritikSaran','tanggal', 'subjek', 'isi']
        });

        const totalKeseluruhan = dataKritikSaran.length;

        // Kelompokkan data 
        const groupedData = {};
        dataKritikSaran.forEach(item => {
            const date = new Date(item.tanggal);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const key = `${month}, ${year}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    total: 0,
                    data: []
                };
            }
            groupedData[key].total++;
            groupedData[key].data.push({
                id_kritikSaran: item.id_kritikSaran,
                tanggal: item.tanggal,
                subjek: item.subjek,
                isi: item.isi
            });
        });

        return res.status(200).json({ totalKeseluruhan, groupedData });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan dalam memproses permintaan' });
    }
};

// Menghapus data kritikSaran
export const deleteDataKritikSaran = async (req, res) => {
    try {
        
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        await Kritiksaran.destroy({
            where: {}, // Kriteria kosong untuk menghapus semua data
            truncate: true 
        });

        return res.json({ message: 'Semua data kritik dan saran berhasil dihapus' });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan dalam memproses permintaan' });
    }
};