const { Router } = require("express");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/aiAssistController");

const router = Router();

router.post("/ai/index-publications", auth, ctrl.indexPublications);
router.post("/ai/ask", auth, ctrl.askConversational);
router.post("/ai/assist-writing", auth, ctrl.assistWriting);
router.post("/ai/generate-content", auth, ctrl.generateContent);
router.post("/ai/analyze-text", auth, ctrl.analyzeText);

module.exports = router;
