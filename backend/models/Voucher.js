const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true },           // FOOD, SHOP, MOVIE ...
  value: { type: Number, default: 100 },                // voucher ki Rs value
  minSpend: { type: Number, default: 200 },             // minimum kharcha jis par valid hai
  code: { type: String, required: true, unique: true }, // e.g. FOOD-7K3M-9QXA
  status: { type: String, enum: ['issued', 'redeemed', 'expired'], default: 'issued' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
