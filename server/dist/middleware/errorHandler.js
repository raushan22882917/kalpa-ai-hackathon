export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Log error details
    console.error(`[ERROR] ${new Date().toISOString()}`, {
        statusCode,
        message,
        path: req.path,
        method: req.method,
        stack: err.stack
    });
    // Send error response
    res.status(statusCode).json({
        error: {
            message,
            statusCode,
            timestamp: new Date().toISOString()
        }
    });
};
export const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
