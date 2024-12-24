// Code was written by Muhammad Sindida Hilmy

import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op, Sequelize } from "sequelize";
import fs from 'fs';
import path from 'path';

// Menampilkan data pengguna
export const getDataUsers = async (req, res) => {
    try {
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const users = await Users.findAll({
            attributes: ['id_user', 'name', 'email', 'kelas', 'no_telepon', 'angkatan', 'role', 'jenis_kelamin', 'foto', 'createdAt']
        });

        if (users.length === 0) {
            res.status(404).json({ msg: 'Data pengguna belum ada' });
        } else {
            res.json({users});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server' });
    }
};

// Menampilkan profil
export const getDataUserProfil = async (req, res) => {
    try {
        const { email } = req.user;

        // Tampilkan hanya data pengguna yang sedang login
        const user = await Users.findOne({
            where: { email },
            attributes: ['name', 'email', 'kelas', 'no_telepon', 'angkatan', 'role', 'jenis_kelamin', 'foto'] 
        });

        if (!user) {
            res.status(404).json({ msg: 'Data pengguna belum ada' });
        } else {
            res.json(user);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server' });
    }
};

// Register
export const Register = async(req, res) => {
    const {nama, email, kelas, no_telepon, angkatan, jenis_kelamin, password, confPassword} = req.body;

    if (!nama) {
        return res.status(400).json({msg: 'Nama wajib diisi.'}); 
    }

    if (!email) {
        return res.status(400).json({msg: 'Email wajib diisi.'});
    }

    if (!kelas) {
        return res.status(400).json({msg: 'Kelas wajib diisi.'}); 
    }

    if (!jenis_kelamin) {
        return res.status(400).json({msg: 'Jenis kelamin wajib dipilih.'}); 
    }

    if (!no_telepon) {
        return res.status(400).json({msg: 'Nomor telepon wajib diisi.'}); 
    }

    if (!angkatan) {
        return res.status(400).json({msg: 'Angkatan wajib diisi.'});
    }

    if (!password) {
        return res.status(400).json({msg: 'Password wajib diisi.'});
    }

    if (!confPassword) {
        return res.status(400).json({msg: 'Konfirmasi password wajib diisi.'});
    }

    const existingUserByPhone = await Users.findOne({ where: { no_telepon } });
    if (existingUserByPhone) {
        return res.status(400).json({ msg: 'Nomor telepon sudah terdaftar oleh pengguna lain.' });
    }

    const existingUser = await Users.findOne({ where: { email: email } });
    if (existingUser) {
        return res.status(400).json({msg: 'Email sudah terdaftar oleh pengguna lain.'}); 
    }

    // Validasi email untuk memastikan tidak ada huruf kapital
    if (/[A-Z]/.test(email)) {
        return res.status(400).json({msg: 'Email yang Anda masukkan tidak valid.'}); 
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({msg: 'Email yang Anda masukkan tidak valid.'});
    }

    if (password.length < 8) {
        return res.status(400).json({msg: 'Password harus 8 atau lebih karakter.'});
    }

    const numberRegex = /[0-9]/;
    if (!numberRegex.test(password)) {
        return res.status(400).json({ msg: 'Password harus mengandung setidaknya satu angka.' });
    }

    const nonNumberRegex = /[^0-9]/;
    if (!nonNumberRegex.test(password)) {
        return res.status(400).json({ msg: 'Password tidak boleh hanya terdiri dari angka.' }); 
    }

    if(password !== confPassword) return res.status(400).json({msg:'Password dan Konfirmasi Password tidak sama.'});

    try {

        // Jika email belum terdaftar, lanjutkan proses pendaftaran
        const salt = await bcrypt.genSalt();

        // hash password
        const hashPassword = await bcrypt.hash(password, salt);
        
        await Users.create({
            name: nama,
            email: email,
            kelas: kelas,
            no_telepon: no_telepon,
            angkatan: angkatan,
            jenis_kelamin: jenis_kelamin,
            password: hashPassword
        });

        res.json({msg: 'Register Berhasil'});
    } catch (error) {

        console.log(error);
        return res.status(500).json({msg: 'Terjadi kesalahan server'}); 
    }
}

// Registrasi admin
export const RegisterAdmin = async(req, res) => {
  
    if (req.user.role !== 'pustakawan') {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
    }

    const {nama, email, kelas, no_telepon, angkatan, role, jenis_kelamin, password, confPassword} = req.body;

    if (!nama) {
        return res.status(400).json({msg: 'Nama lengkap wajib diisi.'}); 
    }

    if (!role) {
        return res.status(400).json({msg: 'Role wajib dipilih.'}); 
    }

    if (!email) {
        return res.status(400).json({msg: 'Email wajib diisi.'}); 
    }

    if (!jenis_kelamin) {
        return res.status(400).json({msg: 'Jenis kelamin wajib dipilih.'}); 
    }

    if (!no_telepon) {
        return res.status(400).json({msg: 'Nomor telepon wajib diisi.'}); 
    }

    if (!password) {
        return res.status(400).json({msg: 'Password wajib diisi.'}); 
    }

    if (!confPassword) {
        return res.status(400).json({msg: 'Konfirmasi password wajib diisi.'});
    }

    const existingUserByPhone = await Users.findOne({ where: { no_telepon } });
    if (existingUserByPhone) {
        return res.status(400).json({ msg: 'Nomor telepon sudah terdaftar oleh pengguna lain.' });
    }

    const existingUser = await Users.findOne({ where: { email: email } });
    if (existingUser) {
        return res.status(400).json({msg: 'Email sudah terdaftar oleh pengguna lain.'}); 
    }

    if (/[A-Z]/.test(email)) {
        return res.status(400).json({msg: 'Email yang Anda masukkan tidak valid.'}); 
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({msg: 'Email yang Anda masukkan tidak valid.'}); 
    }

    if (password.length < 8) {
        return res.status(400).json({msg: 'Password harus 8 atau lebih karakter.'}); 
    }

    const numberRegex = /[0-9]/;
    if (!numberRegex.test(password)) {
        return res.status(400).json({ msg: 'Password harus mengandung setidaknya satu angka.' }); 
    }

    const nonNumberRegex = /[^0-9]/;
    if (!nonNumberRegex.test(password)) {
        return res.status(400).json({ msg: 'Password tidak boleh hanya terdiri dari angka.' }); 
    }

    if(password !== confPassword) return res.status(400).json({msg:'Password dan konfirmasi password tidak cocok.'});

    try {

        // Jika email belum terdaftar, lanjutkan proses pendaftaran
        const salt = await bcrypt.genSalt();

        // hash password
        const hashPassword = await bcrypt.hash(password, salt);
        
        await Users.create({
            name: nama,
            email: email,
            kelas: kelas,
            no_telepon: no_telepon,
            angkatan: angkatan,
            role: role,
            jenis_kelamin: jenis_kelamin,
            password: hashPassword
        });

        res.json({msg: 'Berhasil Menambahkan Data'});
    } catch (error) {

        console.log(error);
        return res.status(500).json({msg: 'Terjadi kesalahan server'}); 
    }
}

// Login
export const Login = async (req, res) => {
    try {
        const user = await Users.findOne({
            where: {
                email: req.body.email
            }
        });
        if (!user) {
            return res.status(404).json({ msg: 'Email tidak ditemukan.' });
        }
    
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ msg: 'Password salah.' });

        // Jika cocok
        const userId = user.id_user;
        const name = user.name;
        const email = user.email;
        const kelas = user.kelas;
        const no_telepon = user.no_telepon;
        const angkatan = user.angkatan;
        const role = user.role;
        const jenis_kelamin = user.jenis_kelamin;
        const foto = user.foto;

        //Membuat akses token
        const accessToken = jwt.sign({ userId, name, email, kelas, no_telepon, angkatan, role, jenis_kelamin, foto}, process.env.ACCESS_TOKEN_SECRET, {

            expiresIn: '30s'
        });

        //Membuat refresh token
        const refreshToken = jwt.sign({ userId, name, email, kelas, no_telepon, angkatan, role, jenis_kelamin, foto }, process.env.REFRESH_TOKEN_SECRET, {

            expiresIn: '1d'
        });

        //Simpan token kedalam database
        await Users.update({ refresh_token: refreshToken }, {
            where: {
                id_user: userId
            }
        });

        //Http only cookie yang akan dikirim ke klien
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
            //Jika menggunakan https
            //secure: true
        });

        res.json({ accessToken, role  });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server' });
    }
}

// Logout
export const Logout = async(req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Token tidak ditemukan dalam cookies' });
        }
        const user = await Users.findOne({
            where: {
                refresh_token: refreshToken
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan dalam basis data' });
        }
        const userId = user.id_user;
        const affectedRows = await Users.update({ refresh_token: null }, {
            where: {
                id_user: userId
            }
        });
        if (affectedRows === 0) {
            return res.status(500).json({ error: 'Gagal menghapus token. Logout tidak berhasil' });
        }
        res.clearCookie('refreshToken');
        return res.sendStatus(200);
    } catch (error) {
        console.error('Error saat logout:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat logout' });
    }
}

// Reset password
export const resetPassword = async (req, res) => {
    try {

        const user = await Users.findOne({ where: { email: req.user.email } });
        if (!user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword) {
            return res.status(400).json({ error: 'Password wajib diisi.' });
        }

        if (!newPassword) {
            return res.status(400).json({ error: 'Password baru wajib diisi.' });
        }

        if (!confirmPassword) {
            return res.status(400).json({ error: 'Konfirmasi password baru wajib diisi.' });
        }


        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return res.status(400).json({ error: 'Password yang Anda masukkan tidak valid.' });
        }

        const isSameAsOldPassword = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOldPassword) {
            return res.status(400).json({ error: 'Password baru tidak boleh sama dengan password lama.' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password baru harus 8 atau lebih karakter.' });
        }

        const numberRegex = /[0-9]/;
        if (!numberRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password baru harus mengandung setidaknya satu angka.' });
        }

        const nonNumberRegex = /[^0-9]/;
        if (!nonNumberRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password baru tidak boleh hanya terdiri dari angka.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Password baru dan konfirmasi password baru tidak cocok.' });
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Simpan password baru ke database
        await Users.update({ password: hashedPassword }, {
            where: { email: req.user.email }
        });

        return res.json({ message: 'Kata sandi berhasil diperbarui.' });
    } catch (error) {
        console.error('Error saat reset password:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat reset password' });
    }
};

// Ubah data profil
export const editDataUser = async (req, res) => {
    try {
      const userEmail = req.user.email;
      const { no_telepon } = req.body;
  
      console.log('User email:', userEmail);
      console.log('No Telepon:', no_telepon);
  
      const user = await Users.findOne({ where: { email: userEmail } });
  
      if (!user) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }

      if (!no_telepon) {
        return res.status(400).json({ error: 'Nomor telepon wajib diisi.' });
      }
  
      const existingUser = await Users.findOne({
        where: {
          no_telepon,
          email: { [Op.ne]: userEmail }, // Menghindari konflik dengan pengguna yang sedang login
        },
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Nomor telepon sudah terdaftar oleh pengguna lain.' });
      }
  
      // Simpan jalur foto lama sebelum diperbarui
      const oldPhotoPath = user.foto;
  
      // Update nomor telepon
      user.no_telepon = no_telepon;
  
      // Update foto jika ada file baru yang diunggah
      if (req.file) {
        console.log('New photo file:', req.file.filename);
        user.foto = req.file.filename; 
      }
  
      // Simpan perubahan ke database
      await user.save();
  
      if (oldPhotoPath && req.file) {
        const oldFilePath = path.join('uploads', oldPhotoPath);
        fs.unlink(oldFilePath, (err) => {
          if (err) {
            console.error('Error saat menghapus foto lama:', err);
          } else {
            console.log('Foto lama berhasil dihapus:', oldPhotoPath);
          }
        });
      }
  
      return res.json({
        message: 'Data pengguna berhasil diperbarui.',
        photoUrl: req.file ? `/uploads/${req.file.filename}` : user.foto,
      });
    } catch (error) {
      console.error('Error saat mengedit data pengguna:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan saat mengedit data pengguna' });
    }
  };
  
// Menampilkan data by createdAt
export const getDataUserByCreatedAt = async (req, res) => {
    try {

        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const userData = await Users.findAll({
            attributes: ['id_user', 'name', 'email', 'kelas', 'no_telepon', 'angkatan', 'role', 'jenis_kelamin', 'foto', 'createdAt'],
            order: [['createdAt', 'ASC']] 
        });

        const groupedUserData = {};
        userData.forEach(user => {
            const createdAt = new Date(user.createdAt);
            const month = createdAt.getMonth() + 1; // Bulan dimulai dari 0, tambahkan 1
            const year = createdAt.getFullYear();
            const key = `Bulan : ${month}\nTahun : ${year}`;
            if (!groupedUserData[key]) {
                groupedUserData[key] = [];
            }
            groupedUserData[key].push({
                id_user: user.id_user,
                nama: user.name,
                email: user.email,
                kelas: user.kelas,
                jenis_kelamin: user.jenis_kelamin,
                no_telepon: user.no_telepon,
                angkatan: user.angkatan,
                role: user.role,
                foto: user.foto,
                dibuat: user.createdAt

            });
        });

        // Mengonversi objek menjadi array untuk format JSON
        const result = [];
        let totalUsers = 0;
        const totalUsersPerMonth = {};
        for (const [key, value] of Object.entries(groupedUserData)) {
            const monthUsers = value.length;
            totalUsers += monthUsers;
            totalUsersPerMonth[key] = monthUsers;

            result.push({
                dataUser: key,
                userData: value
            });
        }

        return res.status(200).json({ 
            userData: result,
            totalUsers: totalUsers,
            totalUsersPerMonth: totalUsersPerMonth
        });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan dalam memproses permintaan' });
    }
};

// Menghapus foto
export const deletePhoto = async (req, res) => {
    try {
        const userId = req.user.userId; // Ambil userId dari payload token
        if (!userId) {
            return res.status(400).json({ error: 'ID diperlukan' });
        }

        const user = await Users.findOne({ where: { id_user: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        const filePath = path.join(process.cwd(), 'uploads', user.foto);

        // Cek apakah file ada
        if (fs.existsSync(filePath)) {
            // Hapus file
            fs.unlinkSync(filePath);
        } else {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        user.foto = null;
        await user.save();

        return res.json({ message: 'Foto berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting photo:', error);
        return res.status(400).json({ error: 'Foto tidak ditemukan' });
    }
};

// Menghapus data pengguna
export const deleteUserById = async (req, res) => {
    try {
       
        if (req.user.role !== 'pustakawan') {
            return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan tindakan ini' });
        }

        const { id_user } = req.params;

        const user = await Users.findByPk(id_user);
        if (!user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        try {
            // Coba hapus pengguna
            await Users.destroy({
                where: { id_user: id_user }
            });

            return res.json({ message: 'Pengguna berhasil dihapus' });
        } catch (deleteError) {
            // Tangani error relasi atau kesalahan lain
            console.error('Error saat menghapus pengguna:', deleteError);
            if (deleteError instanceof Sequelize.ForeignKeyConstraintError) {
                return res.status(400).json({
                    error: 'Pengguna ini terkait dengan data peminjaman. Hapus data peminjaman terkait terlebih dahulu dan coba lagi.',
                    
                });
            }
            // Tangani kesalahan lainnya
            throw deleteError;
        }
    } catch (error) {
        console.error('Kesalahan umum saat menghapus pengguna:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus pengguna' });
    }
};

// Co search (FE)
export const searchDataUserFE = async (req, res) => {
    const { query } = req.query; 

    if (!query) {
        return res.status(400).json({ error: 'Query tidak boleh kosong' });
    }

    try {
        const users = await Users.findAll({
            where: {
                name: {
                    [Op.like]: `%${query}%` 
                }
            },
            limit: 5 
        });

        res.json(users);
    } catch (error) {
      
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
};