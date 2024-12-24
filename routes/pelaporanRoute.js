// Code was written by Muhammad Sindida Hilmy

import express from "express";

import { verifyToken } from "../middleware/VerifyToken.js";
import { 
    reportBook, 
    getDataReport, 
    deleteDataLaporan, 
    updateDataReport, 
    getDataReportDetail 
} from '../controllers/Pelaporan.js';

const router = express.Router();

router.post('/pelaporan/laporkan/:id_peminjaman', verifyToken, reportBook);
router.get('/pelaporan/laporan',verifyToken, getDataReport);
router.put('/report/update/:id_pelaporan', verifyToken, updateDataReport);
router.get('/report/detail/:id_pelaporan', verifyToken, getDataReportDetail);
router.delete('/pelaporan/delete/:id_pelaporan', verifyToken, deleteDataLaporan);

export default router; 