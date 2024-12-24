// Code was written by Muhammad Sindida Hilmy

import express from "express";

import { verifyToken } from "../middleware/VerifyToken.js";
import { 
    requestPerpanjangan, 
    deleteDataPerpanjangan, 
    approvePerpanjangan, 
    rejectPerpanjangan, 
    getPerpanjangan 
} from "../controllers/Perpanjangan.js";

const router = express.Router();

router.post('/perpanjangan/request/:id_peminjaman', verifyToken, requestPerpanjangan);
router.put('/perpanjangan/acc/:id_perpanjangan', verifyToken, approvePerpanjangan);
router.put('/perpanjangan/tolak/:id_perpanjangan', verifyToken, rejectPerpanjangan);
router.get('/perpanjangan/data', verifyToken, getPerpanjangan);
router.delete('/perpanjangan/delete/:id_perpanjangan', verifyToken, deleteDataPerpanjangan);

export default router;