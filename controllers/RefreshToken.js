// Code was written by Muhammad Sindida Hilmy

import Users from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const refreshToken = async(req, res) => {
    try {

       // Mengambil refresh token dari cookies
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token tidak ditemukan' });
        }

        // Verifikasi refresh token
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Refresh token tidak valid' });
            }

            // Cari user berdasarkan ID dari decoded token
            const user = await Users.findByPk(decoded.userId);

            // Validasi apakah user ditemukan
            if (!user) {
                return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
            }

            const accessToken = jwt.sign({
                userId: user.id_user,
                name: user.name,
                email: user.email,
                kelas: user.kelas,
                no_telepon: user.no_telepon,
                angkatan: user.angkatan,
                role: user.role,
                jenis_kelamin: user.jenis_kelamin,
                foto: user.foto
            }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

            res.json({ accessToken });
        });
    } catch (error) {
        console.error('Error saat menyegarkan token:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat menyegarkan token' });
    }
};