// Code was written by Muhammad Sindida Hilmy

import express from "express";
import { verifyToken } from "../middleware/VerifyToken.js";
import {
    createDataBook,
    searchData,
    filterConditionBook,
    getDataBook,
    detailDataBook,
    checkDcc,
    filterDataBook,
    updateDataBook,
    deleteDataBook,
    checkBookTitle,
    getLabelBook,
    searchDataBookFE
} from "../controllers/Buku.js";

import upload from '../middleware/multerBook.js';

const router = express.Router();

router.post('/buku/create', verifyToken, upload.single('foto'), createDataBook);
router.get('/buku', getDataBook);
router.get('/buku/search', searchData);
router.put('/buku/update/:id_buku', verifyToken, upload.single('foto'), updateDataBook);
router.delete('/buku/delete/:id_buku', verifyToken, deleteDataBook);
router.get('/buku/filter', filterDataBook); 
router.get('/buku/detail/:id_buku', detailDataBook);
router.get('/buku/kondisi/:kondisi', verifyToken, filterConditionBook);
router.get('/buku/label', verifyToken, getLabelBook);
router.get('/peminjaman/search', searchDataBookFE);
router.post('/buku/check-judul', checkBookTitle);
router.post('/buku/check-dcc', checkDcc);

export default router;