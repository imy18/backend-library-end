// Code was written by Muhammad Sindida Hilmy

import express from 'express';
import db from './config/Database.js';
import dotenv from 'dotenv';
import kritiksaranRoute from './routes/kritiksaranRoute.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import userRoute from './routes/userRoute.js';
import bukuRoute from './routes/bukuRoute.js';
import peminjamanRoute from './routes/peminjamanRoute.js';
import perpanjanganRoute from './routes/perpanjanganRoute.js';
import pelaporanRoute from './routes/pelaporanRoute.js'
import kunjunganRoute from './routes/kunjunganRoute.js'
import path from 'path';

// Membuat tabel
//import Kritiksaran from './models/KritikSaranModel.js';

dotenv.config();
const app = express();

app.use(session({
  secret: process.env.SESS_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: 'auto'
  }
}));

// Memastikan koneksi berjalan dengan baik ke database
try {
  await db.authenticate();
  console.log('Database Connected...');

// Generate table
//  await Kritiksaran.sync();
} catch (error) {
  console.error(error);
}

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(cookieParser());
app.use(express.json());

// Middleware untuk folder uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/uploadBook', express.static(path.join(process.cwd(), 'uploadBook')));

//  Middleware
app.use(kunjunganRoute);
app.use(kritiksaranRoute);
app.use(userRoute);
app.use(bukuRoute);
app.use(peminjamanRoute);
app.use(perpanjanganRoute);
app.use(pelaporanRoute);

app.listen(5000, () => console.log('Server running at port 5000'));