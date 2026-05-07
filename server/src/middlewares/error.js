const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Server error",
    errors: err.errors || null
  });
};

module.exports = { notFound, errorHandler };
