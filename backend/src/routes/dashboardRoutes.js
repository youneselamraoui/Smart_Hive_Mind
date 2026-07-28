const { Router } = require("express");
const ctrl = require("../controllers/dashboardController");

const router = Router();

router.get("/dashboard/summary", ctrl.getSummary);

module.exports = router;
