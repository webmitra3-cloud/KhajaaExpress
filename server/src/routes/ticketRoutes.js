const express = require("express");
const { createTicket, listMyTickets, listAllTickets, updateTicket } = require("../controllers/ticketController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.post("/", protect, requireRole("CUSTOMER"), createTicket);
router.get("/my", protect, requireRole("CUSTOMER"), listMyTickets);
router.get("/", protect, requireRole("ADMIN"), listAllTickets);
router.put("/:id", protect, requireRole("ADMIN"), updateTicket);

module.exports = router;
