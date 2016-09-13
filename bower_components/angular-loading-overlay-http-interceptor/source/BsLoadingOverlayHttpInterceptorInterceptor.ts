import IBsLoadingOverlayHttpInterceptorOptions from './IBsLoadingOverlayHttpInterceptorOptions';
import {BsLoadingOverlayService} from 'angular-loading-overlay/source/BsLoadingOverlayService';

export default class BsLoadingOverlayHttpInterceptorInterceptor implements ng.IHttpInterceptor {
    constructor(
        private config: IBsLoadingOverlayHttpInterceptorOptions = {},
        private bsLoadingOverlayService: BsLoadingOverlayService
    ) {}

    private requestsCount = 0;

    private onRequest() {
        if (this.requestsCount === 0) {
            this.bsLoadingOverlayService.start(this.config);
        }

        this.requestsCount ++;
    }

    private onResponse() {
        const newRequestsCount = this.requestsCount - 1;

        if (newRequestsCount === 0) {
            this.bsLoadingOverlayService.stop(this.config);
        }

        this.requestsCount = Math.max(0, newRequestsCount);
    }

    request = (requestConfig: ng.IRequestConfig) => {
        if (this.config.requestsMatcher) {
            if (this.config.requestsMatcher(requestConfig)) {
                this.onRequest();
            }
        } else {
            this.onRequest();
        }

        return requestConfig;
    };

    requestError = (rejection) => {
        this.onResponse();
        return rejection;
    };

    response = (response: ng.IHttpPromiseCallbackArg<any>) => {
        this.onResponse();
        return response;
    };

    responseError = (rejection) => {
        this.onResponse();
        return rejection;
    };
}
