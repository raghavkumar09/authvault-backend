/**
 * Standardized API Response wrapper
 */
class ApiResponse {
    constructor(statusCode, message, data = null, pagination = null) {
        this.statusCode = statusCode;
        this.success = statusCode >= 200 && statusCode < 300;
        this.message = message;
        if (data !== null) this.data = data;
        if (pagination !== null) this.pagination = pagination;
    }

    send(res) {
        return res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            ...(this.data !== undefined && { data: this.data }),
            ...(this.pagination !== undefined && { pagination: this.pagination }),
        });
    }
}

module.exports = ApiResponse;
