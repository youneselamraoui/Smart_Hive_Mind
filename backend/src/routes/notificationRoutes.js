const { Router } = require("express");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/notificationController");

const router = Router();

router.get("/notifications", auth, ctrl.lister);
router.get("/notifications/non-lus", auth, ctrl.nonLus);
router.put("/notifications/:id/lu", auth, ctrl.marquerLu);
router.put("/notifications/tout-lu", auth, ctrl.marquerToutLu);

module.exports = router;
