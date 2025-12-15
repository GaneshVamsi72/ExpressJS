/*
Illustration of Express error handling concepts:
- Express default error handler (what happens by default)
- Custom AppError class
- Async error wrapper (catchAsync)
- Using next(err) and throwing inside routes
- Centralized error-handling middleware
- Converting common Mongoose errors (CastError, ValidationError, duplicate key, DocumentNotFoundError)

Points to remember:
- Express default handler returns 500 if an error reaches it.
- To control responses, write a custom error-handling middleware with 4 args: (err, req, res, next).
- For async/await routes, either use try/catch or use an async wrapper that .catch(next).
- Use a custom error class (AppError) to attach status codes and messages uniformly.
- Mongoose errors must be detected by `err.name` or `err.code` and converted to friendly HTTP responses.
*/
const express = require('express');
const app = express();

let port = 3000;

const mongoose = require('mongoose');

const AppError = require('./utils/AppError');
const catchAsync = require('./utils/catchAsync');

const User = require('./models/Users');

main()
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/express_errors_demo');
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.use(express.json());

// Simple logger middleware
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${ms}ms`);
    });

    next();
});

app.get('/', (req, res) => {
    res.send('Hello - Express Error Handling Demo');
});

// 1) Synchronous throw -> goes to default/custom error handler
app.get('/error-throw', (req, res) => {
    // This is a synchronous error. Express will forward it to the error handler.
    throw new Error('Synchronous error thrown!');
});

// 2) next(err) -> explicit pass to error handler
app.get('/next-error', (req, res, next) => {
    const err = new Error('Error passed with next()');
    next(err);
});

// 3) Async error WITHOUT wrapper (bad) - will NOT be caught by default
app.get('/async-bad', async (req, res) => {
    // If this throws, Express won't catch it automatically (it will be an unhandled promise rejection)
    const users = await User.find({}); // if DB fails, this route will hang/crash
    res.json(users);
});

// 4) Async error WITH catchAsync wrapper (good)
app.get('/async-good', catchAsync(async (req, res, next) => {
    // Simulating an async error
    await Promise.reject(new Error('Async failure insider catchAsync'));
}));

// 5) Create user - can trigger ValidationError or Duplicate Key error
app.post('/users', catchAsync(async (req, res, next) => {
    // Send JSON body: { "name": "Vamsi", "email": "a@b.com", "age": 20 }
    const user = await User.create(req.body); // ValidationError or E11000 possible
    res.status(201).json({ status: 'success', data: user });
}));

// 6) Get user by id - can trigger CastError (invalid ObjectId) or 404 using AppError
app.get('/users/:id', catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);

    // If id format is wrong, Mongoose will throw CastError and jump to error handler
    if (!user) return next(new AppError('User Not Found', 404));
    
    res.json({ status: 'success', data: user});
}));

// 404 handler for unknown routes
app.all('*', (req, res, next) => {
    // If route not found, forward an AppError to the error middleware
    next(new AppError(`Can't find ${req.url} on this server`, 404));
});

// CENTRALIZED ERROR HANDLING MIDDLEWARE
// This is where we convert Mongoose errors into friendly messages and send a consistent JSON response.
app.use((err, req, res, next) => {
    // IMPORTANT: don't mutate the original error in a bad way.
    // We'll create a shallow copy to work with some properties.
    let error = Object.assign({}, err);
    error.message = err.message; // preserve message (This line is necessary because Object.assign() can't access message (non-enumerable(hidden) properties))

    // Log the original error for debugging
    console.error('ERROR 💥', err);

    // Handle specific Mongoose errors
    // 1) CastError -> invalid ObjectId
    if (err.name === 'CastError') {
        error = new AppError('Invalid ID format', 400);
    }

    // 2) ValidationError -> schema validation failed
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message).join('. ');
        error = new AppError(messages, 400);
    }

    // 3) Duplicate key error (E11000)
    if (err.code === 11000) {
        // err.keyValue shows which field caused duplicate
        const field = Object.keys(err.keyValue || {}).join(', ');
        error = new AppError(`Duplicate field value: ${field}`, 400);
    }

    // 4) DocumentNotFoundError (from .orFail())
    if (err.name === 'DocumentNotFoundError') {
        error = new AppError('Requested document not found', 404);
    }

    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
        statusCode: statusCode,
        message: error.message || 'Something went wrong'
    });
});