class ErrorHelper extends Error {
    constructor(message, statusCode=500) {
        super(message);

        this.message = message;
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ErrorHelper;
