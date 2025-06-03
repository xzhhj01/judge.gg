import { AxiosResponse } from 'axios';

export class NetworkError extends Error {
    constructor(message = 'Network Error') {
        super(message);
        this.name = 'NetworkError';
        this.message = message;
    }
}

export class TimeoutError extends Error {
    constructor(message = 'Timeout Error') {
        super(message);
        this.name = 'TimeoutError';
        this.message = message;
    }
}

export class HttpError extends Error {
    constructor(statusCode, message, response) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
    }
}

export class BadRequestError extends HttpError {
    constructor({ message = 'Bad Request', statusCode = 400, response } = {}) {
        super(statusCode, message, response);
        this.name = 'BadRequestError';
    }
}

export class UnauthorizedError extends HttpError {
    constructor({ message = 'Unauthorized', statusCode = 401, response } = {}) {
        super(statusCode, message, response);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends HttpError {
    constructor({ message = 'Forbidden', statusCode = 403, response } = {}) {
        super(statusCode, message, response);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends HttpError {
    constructor({ message = 'Not Found', statusCode = 404, response } = {}) {
        super(statusCode, message, response);
        this.name = 'NotFoundError';
    }
}

export class InternetServerError extends HttpError {
    constructor({ message = 'Internal Server Error', statusCode = 500, response } = {}) {
        super(statusCode, message, response);
        this.name = 'InternetServerError';
    }
} 