import axios, { HttpStatusCode } from 'axios';
import {
    BadRequestError,
    ForbiddenError,
    HttpError,
    NetworkError,
    NotFoundError,
    TimeoutError,
    UnauthorizedError,
    InternetServerError,
} from '@/app/utils/http/http-error';

export const httpErrorHandler = (error) => {
    let promiseError;

    console.log(error);
    if (axios.isAxiosError(error)) {
        if (Object.is(error.code, 'ECONNABORTED')) {
            promiseError = Promise.reject(new TimeoutError());
        } else if (Object.is(error.message, 'Network Error')) {
            promiseError = Promise.reject(new NetworkError());
        } else {
            const { response } = error;
            const status = response?.status;
            const message = response?.data?.errorMessage;

            switch (status) {
                case HttpStatusCode.Unauthorized:
                    promiseError = Promise.reject(
                        new UnauthorizedError({
                            message,
                            response,
                        }),
                    );
                    break;
                case HttpStatusCode.BadRequest:
                    promiseError = Promise.reject(
                        new BadRequestError({
                            message,
                            response,
                        }),
                    );
                    break;
                case HttpStatusCode.Forbidden:
                    promiseError = Promise.reject(
                        new ForbiddenError({
                            message,
                            response,
                        }),
                    );
                    break;
                case HttpStatusCode.NotFound:
                    promiseError = Promise.reject(
                        new NotFoundError({
                            message,
                            response,
                        }),
                    );
                    break;
                case HttpStatusCode.InternalServerError:
                    promiseError = Promise.reject(
                        new InternetServerError({
                            message,
                            response,
                        }),
                    );
                    break;
                default:
                    promiseError = Promise.reject(new HttpError(status, message, response));
            }
        }
    } else {
        promiseError = Promise.reject(error);
    }

    return promiseError;
}; 