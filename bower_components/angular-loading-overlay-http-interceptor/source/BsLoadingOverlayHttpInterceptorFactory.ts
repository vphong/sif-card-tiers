import BsLoadingOverlayHttpInterceptorInterceptor from './BsLoadingOverlayHttpInterceptorInterceptor';
import IBsLoadingOverlayHttpInterceptorOptions from './IBsLoadingOverlayHttpInterceptorOptions';
import {BsLoadingOverlayService} from 'angular-loading-overlay/source/BsLoadingOverlayService';

const bsLoadingOverlayHttpInterceptorFactoryFactory: ng.IHttpInterceptorFactory =
    (bsLoadingOverlayService: BsLoadingOverlayService) =>
        (config: IBsLoadingOverlayHttpInterceptorOptions) =>
            new BsLoadingOverlayHttpInterceptorInterceptor(config, bsLoadingOverlayService);

bsLoadingOverlayHttpInterceptorFactoryFactory.$inject = ['bsLoadingOverlayService'];

export default bsLoadingOverlayHttpInterceptorFactoryFactory;
