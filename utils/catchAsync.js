// Async wrapper to catch errors

let catchAsync = function (fn) {
    return function (req, res, next) {
        fn(req, res, next).catch((err) => next(err));
    };
};

module.exports = catchAsync;