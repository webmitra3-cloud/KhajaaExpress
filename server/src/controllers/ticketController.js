const { z } = require("zod");
const Ticket = require("../models/Ticket");
const { success, fail } = require("../utils/response");

const createSchema = z.object({
  orderId: z.string().optional(),
  category: z.string().min(2),
  message: z.string().min(3),
  imageUrl: z.string().url().optional().or(z.literal(""))
});

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"])
});

const createTicket = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const ticket = await Ticket.create({
    userId: req.user._id,
    orderId: parsed.data.orderId,
    category: parsed.data.category,
    message: parsed.data.message,
    imageUrl: parsed.data.imageUrl || ""
  });
  return success(res, "Ticket created", ticket, 201);
};

const listMyTickets = async (req, res) => {
  const tickets = await Ticket.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return success(res, "Tickets", tickets);
};

const listAllTickets = async (req, res) => {
  const tickets = await Ticket.find({}).sort({ createdAt: -1 });
  return success(res, "Tickets", tickets);
};

const updateTicket = async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return fail(res, "Ticket not found", null, 404);
  }
  ticket.status = parsed.data.status;
  await ticket.save();
  return success(res, "Ticket updated", ticket);
};

module.exports = { createTicket, listMyTickets, listAllTickets, updateTicket };
