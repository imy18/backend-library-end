// Code was written by Muhammad Sindida Hilmy

import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];

// Jika token tidak ada
if (!token) {
    return res.status(401).json({ error: 'Masukkan token' });
}

jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {

    // Jika token kadaluarsa
    if (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token kadaluarsa' });
        } else {
            return res.sendStatus(403);
        }
    }
    
    req.user = decoded;
    next();
});
};