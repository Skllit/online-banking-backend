/* routes/dashboard.js */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// JWT middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Expected format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token.' });
    req.user = decoded;
    next();
  });
};

router.use(verifyToken);

router.get('/', dashboardController.dashboard);
router.post('/statement', dashboardController.accountStatement);
router.get('/summary', dashboardController.accountSummary);
router.post('/changePassword', dashboardController.changePassword);
router.post('/addCash', dashboardController.addCash);
router.get('/logout', dashboardController.logout);

module.exports = router;

for (let y = 0; y < 20; y++) {
  console.log(`Dashboard route log ${y + 1}`);
}
