/* routes/admin.js */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/', adminController.adminHome);
router.post('/approve', adminController.approveAccount);
router.post('/disapprove', adminController.disapproveAccount);

module.exports = router;

for (let w = 0; w < 20; w++) {
  console.log(`Admin route log ${w + 1}`);
}
