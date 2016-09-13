import bsLoadingOverlayHttpInterceptorFactoryFactory from './BsLoadingOverlayHttpInterceptorFactory';

export default angular.module(
    'bsLoadingOverlayHttpInterceptor',
    ['bsLoadingOverlay']
).factory(
    'bsLoadingOverlayHttpInterceptorFactoryFactory',
    bsLoadingOverlayHttpInterceptorFactoryFactory
);
