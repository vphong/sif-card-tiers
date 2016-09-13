import IBsLoadingOverlayOptions from 'angular-loading-overlay/source/IBsLoadingOverlayOptions';

interface IBsLoadingOverlayHttpInterceptorOptions extends IBsLoadingOverlayOptions {
    requestsMatcher?: (requestConfig: ng.IRequestConfig) => boolean;
}

export default IBsLoadingOverlayHttpInterceptorOptions;
