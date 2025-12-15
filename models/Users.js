const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Name is required']
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },

    age: {
        type: Number,
        min: [0, 'Age must be >= 0']
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;