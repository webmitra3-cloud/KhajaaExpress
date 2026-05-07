const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

const getOrCreateWallet = async ({ ownerType, ownerId }) => {
  let wallet = await Wallet.findOne({ ownerType, ownerId });
  if (!wallet) {
    wallet = await Wallet.create({ ownerType, ownerId, balance: 0 });
  }
  return wallet;
};

const addTransaction = async ({ walletId, type, amount, refOrderId, refPayoutId, note }) => {
  const txn = await WalletTransaction.create({
    walletId,
    type,
    amount,
    refOrderId,
    refPayoutId,
    note: note || ""
  });
  await Wallet.findByIdAndUpdate(walletId, { $inc: { balance: amount } });
  return txn;
};

module.exports = { getOrCreateWallet, addTransaction };
