import BsLoadingOverlayHttpInterceptor from './BsLoadingOverlayHttpInterceptorInterceptor';
import {BsLoadingOverlayService} from 'angular-loading-overlay/source/BsLoadingOverlayService';
import IBsLoadingOverlayHttpInterceptorOptions from './IBsLoadingOverlayHttpInterceptorOptions';

describe('Interceptor', () => {
    let interceptor: BsLoadingOverlayHttpInterceptor;
    let service: any;
    let options: IBsLoadingOverlayHttpInterceptorOptions;
    let requestConfig: ng.IRequestConfig;
    let responsePromise: ng.IHttpPromiseCallbackArg<any>;

    beforeEach(() => {
        service = {
            start: sinon.spy(),
            stop: sinon.spy()
        };

        requestConfig = {
            url: 'test',
            method: 'POST'
        };

        responsePromise = {
            data: 'test data'
        };

        options = {
            referenceId: 'some reference id'
        };

        interceptor = new BsLoadingOverlayHttpInterceptor(options, service);
    });

    describe('request', () => {
        it('should return provided request config', () => {
            let returnedRequestConfig = interceptor.request(requestConfig);
            expect(returnedRequestConfig).toEqual(requestConfig);
        });

        it('should call service start with provided options', () => {
            interceptor.request(requestConfig);

            expect(service.start.calledWith(options)).toBeTruthy();
        });

        it('should call service start once', () => {
            interceptor.request(requestConfig);

            expect(service.start.calledOnce).toBeTruthy();
        });

        it('should call service start once on called twice', () => {
            interceptor.request(requestConfig);
            interceptor.request(requestConfig);

            expect(service.start.calledOnce).toBeTruthy();
        });

        it('should call service start once on called twice', () => {
            interceptor.request(requestConfig);
            interceptor.request(requestConfig);

            expect(service.start.calledOnce).toBeTruthy();
        });

        it('should call service start once on called after response', () => {
            interceptor.response(responsePromise);
            interceptor.request(requestConfig);

            expect(service.start.calledOnce).toBeTruthy();
        });

        describe('with matcher provided', () => {
            beforeEach(() => {
                options = {
                    requestsMatcher: (requestConfig) => requestConfig.url === 'some url'
                };
                interceptor = new BsLoadingOverlayHttpInterceptor(options, service);
            });

            it('should call service start once if requestMatcher returns true matching requestConfig', () => {
                interceptor.request({
                    url: 'some url',
                    method: 'GET'
                });

                expect(service.start.calledOnce).toBeTruthy();
            });

            it('should not call service start if requestMatcher returns false matching requestConfig', () => {
                interceptor.request({
                    url: 'another url, no match here',
                    method: 'GET'
                });

                expect(service.start.called).toBeFalsy();
            });
        });
    });

    describe('requestError', () => {
        it('should return provided rejection', () => {
            const rejection = {rejectionField: 123};
            let returnedRejection = interceptor.requestError(rejection);
            expect(returnedRejection).toEqual(rejection);
        });

        it('should call service stop once on called after request', () => {
            interceptor.request(requestConfig);
            interceptor.requestError(requestConfig);

            expect(service.stop.calledOnce).toBeTruthy();
        });

        it('should call service stop with provided options on called after request', () => {
            interceptor.request(requestConfig);
            interceptor.requestError(requestConfig);

            expect(service.stop.calledWith(options)).toBeTruthy();
        });

        it('should call service stop once on called twice after request called twice', () => {
            interceptor.request(requestConfig);
            interceptor.request(requestConfig);
            interceptor.requestError(requestConfig);
            interceptor.requestError(requestConfig);

            expect(service.stop.calledOnce).toBeTruthy();
        });
    });

    describe('response', () => {
        it('should return provided promise', () => {
            const returnedPromise = interceptor.response(responsePromise);
            expect(returnedPromise).toBe(responsePromise);
        });

        it('should call service stop once on response called after request called', () => {
            interceptor.request(requestConfig);
            interceptor.response(responsePromise);

            expect(service.stop.calledOnce).toBeTruthy();
        });

        it('should not call service stop on response called without request called', () => {
            interceptor.response(responsePromise);

            expect(service.stop.called).toBeFalsy();
        });

        it('should call service stop with provided options on response called after request called', () => {
            interceptor.request(requestConfig);
            interceptor.response(responsePromise);

            expect(service.stop.calledWith(options)).toBeTruthy();
        });

        it('should call service stop once on response called twice after request called twice', () => {
            interceptor.request(requestConfig);
            interceptor.request(requestConfig);
            interceptor.response(responsePromise);
            interceptor.response(responsePromise);

            expect(service.stop.calledOnce).toBeTruthy();
        });
    });

    describe('responseError', () => {
        it('should return provided promise', () => {
            const returnedPromise = interceptor.responseError(responsePromise);
            expect(returnedPromise).toBe(responsePromise);
        });

        it('should call service stop once on responseError called after request called', () => {
            interceptor.request(requestConfig);
            interceptor.responseError(responsePromise);

            expect(service.stop.calledOnce).toBeTruthy();
        });

        it('should call service stop with provided options on responseError called after request called', () => {
            interceptor.request(requestConfig);
            interceptor.responseError(responsePromise);

            expect(service.stop.calledWith(options)).toBeTruthy();
        });

        it('should call service stop once on responseError called twice after request called twice', () => {
            interceptor.request(requestConfig);
            interceptor.request(requestConfig);
            interceptor.responseError(responsePromise);
            interceptor.responseError(responsePromise);

            expect(service.stop.calledOnce).toBeTruthy();
        });
    });
});
