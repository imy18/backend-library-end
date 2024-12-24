// Code was written by Muhammad Sindida Hilmy

import express from "express";

import { verifyToken } from "../middleware/VerifyToken.js";
import { 
    deleteDataPeminjaman, 
    getDataByMonthYear, 
    accPeminjaman, 
    tolakPeminjaman, 
    requestPeminjaman, 
    kembalikanPeminjaman, 
    getDataByUser, 
    insertDataManual, 
    getDataByBuku, 
    countDataByUser, 
    searchData, 
    generateDataReport
} from "../controllers/Peminjaman.js";

const router = express.Router();

router.post('/peminjaman/request/:id_buku', verifyToken, requestPeminjaman);
router.put('/peminjaman/acc/:id_peminjaman',verifyToken, accPeminjaman); 
router.put('/peminjaman/tolak/:id_peminjaman', verifyToken, tolakPeminjaman);
router.put('/peminjaman/kembali/:id_peminjaman',verifyToken, kembalikanPeminjaman);
router.get('/peminjaman/user', verifyToken, getDataByUser);
router.post('/peminjaman/add/manual',verifyToken, insertDataManual);
router.get('/peminjaman/data/:judul', verifyToken, getDataByBuku);
router.get('/peminjaman/count/:name', verifyToken, countDataByUser);
router.get('/loan/search',verifyToken, searchData);
router.get('/peminjaman/report', verifyToken, generateDataReport)
router.get('/peminjaman/:month/:year', verifyToken,getDataByMonthYear);
router.delete('/peminjaman/delete/:id_peminjaman',verifyToken, deleteDataPeminjaman);

export default router;