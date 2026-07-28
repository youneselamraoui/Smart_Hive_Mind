const { Router } = require("express");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/badgeController");
const { attribuerBadgeSchema } = require("../validators/badgeSchema");

const router = Router();

router.post("/badges/attribuer", auth, validate(attribuerBadgeSchema), ctrl.attribuer);
router.get("/badges", auth, ctrl.lister);

module.exports = router;
