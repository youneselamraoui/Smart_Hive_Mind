const { Router } = require("express");
const ctrl = require("../controllers/preuveController");

const router = Router();

router.get("/preuves/verify/:txHash", ctrl.verifyByTxHash);

module.exports = router;
