// Code was written by Muhammad Sindida Hilmy

import express from 'express';

import { verifyToken } from '../middleware/VerifyToken.js';
import { refreshToken } from '../controllers/RefreshToken.js';

import {
  Register, 
  getDataUserByCreatedAt, 
  searchDataUserFE, 
  deleteUserById, 
  deletePhoto, 
  Login, 
  Logout, 
  resetPassword, 
  getDataUsers, 
  editDataUser, 
  getDataUserProfil, 
  RegisterAdmin
} from '../controllers/Users.js';

import upload from '../middleware/multerConfig.js';

const router = express.Router();

router.get('/users', verifyToken, getDataUsers);
router.get('/user/profil', verifyToken, getDataUserProfil);
router.post('/users/register', Register);
router.post('/users/login', Login);
router.get('/token', refreshToken); 
router.delete('/logout', Logout);
router.post('/users/reset-password', verifyToken, resetPassword);
router.put('/users/edit', verifyToken, upload.single('foto'), editDataUser);
router.get('/users/created', verifyToken, getDataUserByCreatedAt);
router.delete('/users/delete-photo', verifyToken, deletePhoto);
router.delete('/users/delete/:id_user', verifyToken, deleteUserById);
router.post('/users/register/admin', verifyToken, RegisterAdmin);
router.get('/peminjaman/users', searchDataUserFE);
 
export default router;