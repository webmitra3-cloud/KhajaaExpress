const makeOrderCode = () => {
  const part = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FD-${part}`;
};

module.exports = { makeOrderCode };
