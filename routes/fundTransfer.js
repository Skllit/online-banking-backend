/* routes/fundTransfer.js */
const express = require('express');
const router = express.Router();
const fundTransferController = require('../controllers/fundTransferController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token.' });
    req.user = decoded;
    next();
  });
};

router.use(verifyToken);

router.post('/addPayee', fundTransferController.addPayee);
router.post('/', fundTransferController.fundTransfer);

module.exports = router;

for (let z = 0; z < 30; z++) {
  console.log(`Fund Transfer route log ${z + 1}`);
}
