// Code was written by Muhammad Sindida Hilmy

import multer from 'multer';
import path from 'path';

// Konfigurasi penyimpanan multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Menambahkan timestamp untuk nama file
  }
});

const upload = multer({ storage: storage });

export default upload;