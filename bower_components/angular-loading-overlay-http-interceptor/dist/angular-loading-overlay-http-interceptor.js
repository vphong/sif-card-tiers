/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "./dist/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var BsLoadingOverlayHttpInterceptorFactory_1 = __webpack_require__(1);
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = angular.module('bsLoadingOverlayHttpInterceptor', ['bsLoadingOverlay']).factory('bsLoadingOverlayHttpInterceptorFactoryFactory', BsLoadingOverlayHttpInterceptorFactory_1.default);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var BsLoadingOverlayHttpInterceptorInterceptor_1 = __webpack_require__(2);
	var bsLoadingOverlayHttpInterceptorFactoryFactory = function (bsLoadingOverlayService) {
	    return function (config) {
	        return new BsLoadingOverlayHttpInterceptorInterceptor_1.default(config, bsLoadingOverlayService);
	    };
	};
	bsLoadingOverlayHttpInterceptorFactoryFactory.$inject = ['bsLoadingOverlayService'];
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = bsLoadingOverlayHttpInterceptorFactoryFactory;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	var BsLoadingOverlayHttpInterceptorInterceptor = (function () {
	    function BsLoadingOverlayHttpInterceptorInterceptor(config, bsLoadingOverlayService) {
	        var _this = this;
	        if (config === void 0) { config = {}; }
	        this.config = config;
	        this.bsLoadingOverlayService = bsLoadingOverlayService;
	        this.requestsCount = 0;
	        this.request = function (requestConfig) {
	            if (_this.config.requestsMatcher) {
	                if (_this.config.requestsMatcher(requestConfig)) {
	                    _this.onRequest();
	                }
	            }
	            else {
	                _this.onRequest();
	            }
	            return requestConfig;
	        };
	        this.requestError = function (rejection) {
	            _this.onResponse();
	            return rejection;
	        };
	        this.response = function (response) {
	            _this.onResponse();
	            return response;
	        };
	        this.responseError = function (rejection) {
	            _this.onResponse();
	            return rejection;
	        };
	    }
	    BsLoadingOverlayHttpInterceptorInterceptor.prototype.onRequest = function () {
	        if (this.requestsCount === 0) {
	            this.bsLoadingOverlayService.start(this.config);
	        }
	        this.requestsCount++;
	    };
	    BsLoadingOverlayHttpInterceptorInterceptor.prototype.onResponse = function () {
	        var newRequestsCount = this.requestsCount - 1;
	        if (newRequestsCount === 0) {
	            this.bsLoadingOverlayService.stop(this.config);
	        }
	        this.requestsCount = Math.max(0, newRequestsCount);
	    };
	    return BsLoadingOverlayHttpInterceptorInterceptor;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = BsLoadingOverlayHttpInterceptorInterceptor;


/***/ }
/******/ ]);