const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    monthlyIncome: {
        type: Number,
    },
    bills: {
        type: Number,
    },
    food: {
        type: Number,
    },
    health: {
        type: Number,
    },
    lifestyle: {
        type: Number,
    },
    misc: {
        type: Number,
    },
    obligations: {
        type: Number,
    },
    savings: {
        type: Number,
    },
    transport: {
        type: Number,
    },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);