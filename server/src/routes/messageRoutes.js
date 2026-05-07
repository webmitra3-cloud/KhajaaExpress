const express = require("express");
const { listMessages, createMessage } = require("../controllers/messageController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/:orderId", protect, listMessages);
router.post("/", protect, createMessage);

module.exports = router;
