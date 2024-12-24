// Code was written by Muhammad Sindida Hilmy

import express from "express";
import { verifyToken } from "../middleware/VerifyToken.js";

import { getData, 
        addData, 
        deleteData 
} from "../controllers/Kunjungan.js";

const router = express.Router();

router.get("/kunjungan", verifyToken, getData);
router.post("/kunjungan/form", addData);
router.delete('/kunjungan/delete',verifyToken, deleteData);

export default router;