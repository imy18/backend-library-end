// Code was written by Muhammad Sindida Hilmy

import express from "express";

import { verifyToken } from "../middleware/VerifyToken.js";
import { 
    createKritikSaran, 
    deleteDataKritikSaran, 
    getDataKritikSaran 
} from "../controllers/KritikSaran.js";


const router = express.Router();

router.post('/kritiksaran', createKritikSaran);
router.get('/kritiksaran/data', verifyToken, getDataKritikSaran);
router.delete('/kritiksaran/delete', verifyToken, deleteDataKritikSaran)

export default router;