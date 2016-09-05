/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _oaBg = __webpack_require__(1);
	
	angular.module('ngOfflineAssets', [_oaBg._name]).constant('OA_VERSION', '0.0.1');

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	oaBgDirective.$inject = ["offlineAssets", "$timeout"];
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports._name = undefined;
	
	var _offlineAssets = __webpack_require__(2);
	
	function oaBgDirective(offlineAssets, $timeout) {
	  'ngInject';
	
	  return {
	    restrict: 'A',
	    scope: {
	      url: '=oaSrc',
	      from: '=oaFrom',
	      dest: '=oaDest',
	      important: '=oaImportant',
	      loadingClass: '@oaLoadingClass',
	      failClass: '@oaFailClass',
	      fail: '&oaOnFail',
	      removeLoading: '@oaRemoveLoadingClass'
	    },
	    link: function link(scope, element, attrs) {
	      ngDownloadFile.tagDownload(scope, element, function (url) {
	        //Set src to image attrs
	        $timeout(function () {
	          element.attr('src', url);
	        }, 10);
	      });
	    }
	  };
	};
	
	var _name = exports._name = 'oaBg';
	exports.default = angular.module(_name, []).directive(_name, oaBgDirective);

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	function offlineAssetsService() {
	  'ngInject';
	
	  return {};
	}
	
	var _name = exports._name = 'offlineAssets';
	exports.default = angular.module(_name, []).factory(_name.concat('Service'), offlineAssetsService);

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZDkxYThmZWYzMTVmZWMyZDhiNTYiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9kaXJlY3RpdmVzL29hQmcuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2RpcmVjdGl2ZXMvb2FCZy5qcz8xN2ViIiwid2VicGFjazovLy8uL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzIiwid2VicGFjazovLy8uL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzPzViNWMiXSwibmFtZXMiOlsiYW5ndWxhciIsIm1vZHVsZSIsImNvbnN0YW50Iiwib2FCZ0RpcmVjdGl2ZSIsIm9mZmxpbmVBc3NldHMiLCIkdGltZW91dCIsInJlc3RyaWN0Iiwic2NvcGUiLCJ1cmwiLCJmcm9tIiwiZGVzdCIsImltcG9ydGFudCIsImxvYWRpbmdDbGFzcyIsImZhaWxDbGFzcyIsImZhaWwiLCJyZW1vdmVMb2FkaW5nIiwibGluayIsImVsZW1lbnQiLCJhdHRycyIsIm5nRG93bmxvYWRGaWxlIiwidGFnRG93bmxvYWQiLCJhdHRyIiwiX25hbWUiLCJkaXJlY3RpdmUiLCJvZmZsaW5lQXNzZXRzU2VydmljZSIsImZhY3RvcnkiLCJjb25jYXQiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDdENBOztBQUVBOztBQUVBQSxTQUFRQyxPQUFPLG1CQUFtQixlQUlqQ0MsU0FBUyxjQUFjLFM7Ozs7OztBQ1J4Qjs7O0FDRUEsUUFBTyxlQUFlLFNBQVMsY0FBYztHQUMzQyxPQUFPOztBQUVULFNBQVEsUUFBUTs7QURxQmhCOztBQXhCQSxVQUFTQyxjQUFjQyxlQUFlQyxVQUFVO0dBQUU7O0dBQ2hELE9BQU87S0FDTEMsVUFBVTtLQUNWQyxPQUFPO09BQ0xDLEtBQUs7T0FDTEMsTUFBTTtPQUNOQyxNQUFNO09BQ05DLFdBQVc7T0FDWEMsY0FBYztPQUNkQyxXQUFXO09BQ1hDLE1BQU07T0FDTkMsZUFBZTs7S0FFakJDLE1BQU0sY0FBU1QsT0FBT1UsU0FBU0MsT0FBTztPQUNwQ0MsZUFBZUMsWUFBWWIsT0FBT1UsU0FBUyxVQUFTVCxLQUFLOztTQUV2REgsU0FBUyxZQUFVO1dBQ2pCWSxRQUFRSSxLQUFLLE9BQU9iO1lBQ25COzs7O0VBSVY7O0FBSU0sS0FBSWMsd0JBQVE7QUNRbkIsU0FBUSxVRFBPdEIsUUFBUUMsT0FBT3FCLE9BQU8sSUFDbENDLFVBQVVELE9BQU9uQixlOzs7Ozs7QUU5QnBCOztBQ0VBLFFBQU8sZUFBZSxTQUFTLGNBQWM7R0FDM0MsT0FBTzs7QUREVCxVQUFTcUIsdUJBQXNCO0dBQUU7O0dBQy9CLE9BQU87OztBQUdGLEtBQUlGLHdCQUFRO0FDTW5CLFNBQVEsVURMT3RCLFFBQVFDLE9BQU9xQixPQUFPLElBQ2xDRyxRQUFRSCxNQUFNSSxPQUFPLFlBQVlGLHNCIiwiZmlsZSI6Im5nLW9mZmxpbmUtYXNzZXRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCBkOTFhOGZlZjMxNWZlYzJkOGI1NlxuICoqLyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCB7IF9uYW1lIGFzIG9hQmcgfSBmcm9tICcuL2RpcmVjdGl2ZXMvb2FCZyc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbmdPZmZsaW5lQXNzZXRzJywgW1xyXG4gIG9hQmdcclxuXSlcclxuXHJcbi5jb25zdGFudCgnT0FfVkVSU0lPTicsICcwLjAuMScpXHJcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gb2FCZ0RpcmVjdGl2ZShvZmZsaW5lQXNzZXRzLCAkdGltZW91dCkgeyAnbmdJbmplY3QnO1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgdXJsOiAnPW9hU3JjJyxcclxuICAgICAgZnJvbTogJz1vYUZyb20nLFxyXG4gICAgICBkZXN0OiAnPW9hRGVzdCcsXHJcbiAgICAgIGltcG9ydGFudDogJz1vYUltcG9ydGFudCcsXHJcbiAgICAgIGxvYWRpbmdDbGFzczogJ0BvYUxvYWRpbmdDbGFzcycsXHJcbiAgICAgIGZhaWxDbGFzczogJ0BvYUZhaWxDbGFzcycsXHJcbiAgICAgIGZhaWw6ICcmb2FPbkZhaWwnLFxyXG4gICAgICByZW1vdmVMb2FkaW5nOiAnQG9hUmVtb3ZlTG9hZGluZ0NsYXNzJyxcclxuICAgIH0sXHJcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgbmdEb3dubG9hZEZpbGUudGFnRG93bmxvYWQoc2NvcGUsIGVsZW1lbnQsIGZ1bmN0aW9uKHVybCkge1xyXG4gICAgICAgIC8vU2V0IHNyYyB0byBpbWFnZSBhdHRyc1xyXG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICBlbGVtZW50LmF0dHIoJ3NyYycsIHVybCk7XHJcbiAgICAgICAgfSwgMTApO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG5cclxuaW1wb3J0IHsgX25hbWUgYXMgb2ZmbGluZUFzc2V0cyB9IGZyb20gJy4uL3NlcnZpY2VzL29mZmxpbmVBc3NldHMnO1xyXG5cclxuZXhwb3J0IHZhciBfbmFtZSA9ICdvYUJnJztcclxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoX25hbWUsIFtdKVxyXG4gIC5kaXJlY3RpdmUoX25hbWUsIG9hQmdEaXJlY3RpdmUpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2RpcmVjdGl2ZXMvb2FCZy5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuX25hbWUgPSB1bmRlZmluZWQ7XG5cbnZhciBfb2ZmbGluZUFzc2V0cyA9IHJlcXVpcmUoJy4uL3NlcnZpY2VzL29mZmxpbmVBc3NldHMnKTtcblxuZnVuY3Rpb24gb2FCZ0RpcmVjdGl2ZShvZmZsaW5lQXNzZXRzLCAkdGltZW91dCkge1xuICAnbmdJbmplY3QnO1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBzY29wZToge1xuICAgICAgdXJsOiAnPW9hU3JjJyxcbiAgICAgIGZyb206ICc9b2FGcm9tJyxcbiAgICAgIGRlc3Q6ICc9b2FEZXN0JyxcbiAgICAgIGltcG9ydGFudDogJz1vYUltcG9ydGFudCcsXG4gICAgICBsb2FkaW5nQ2xhc3M6ICdAb2FMb2FkaW5nQ2xhc3MnLFxuICAgICAgZmFpbENsYXNzOiAnQG9hRmFpbENsYXNzJyxcbiAgICAgIGZhaWw6ICcmb2FPbkZhaWwnLFxuICAgICAgcmVtb3ZlTG9hZGluZzogJ0BvYVJlbW92ZUxvYWRpbmdDbGFzcydcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBuZ0Rvd25sb2FkRmlsZS50YWdEb3dubG9hZChzY29wZSwgZWxlbWVudCwgZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAvL1NldCBzcmMgdG8gaW1hZ2UgYXR0cnNcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGVsZW1lbnQuYXR0cignc3JjJywgdXJsKTtcbiAgICAgICAgfSwgMTApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufTtcblxudmFyIF9uYW1lID0gZXhwb3J0cy5fbmFtZSA9ICdvYUJnJztcbmV4cG9ydHMuZGVmYXVsdCA9IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXSkuZGlyZWN0aXZlKF9uYW1lLCBvYUJnRGlyZWN0aXZlKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9kaXJlY3RpdmVzL29hQmcuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBvZmZsaW5lQXNzZXRzU2VydmljZSgpeyAnbmdJbmplY3QnO1xyXG4gIHJldHVybiB7fTtcclxufVxyXG5cclxuZXhwb3J0IHZhciBfbmFtZSA9ICdvZmZsaW5lQXNzZXRzJztcclxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoX25hbWUsIFtdKVxyXG4gIC5mYWN0b3J5KF9uYW1lLmNvbmNhdCgnU2VydmljZScpLCBvZmZsaW5lQXNzZXRzU2VydmljZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2VydmljZXMvb2ZmbGluZUFzc2V0cy5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmZ1bmN0aW9uIG9mZmxpbmVBc3NldHNTZXJ2aWNlKCkge1xuICAnbmdJbmplY3QnO1xuXG4gIHJldHVybiB7fTtcbn1cblxudmFyIF9uYW1lID0gZXhwb3J0cy5fbmFtZSA9ICdvZmZsaW5lQXNzZXRzJztcbmV4cG9ydHMuZGVmYXVsdCA9IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXSkuZmFjdG9yeShfbmFtZS5jb25jYXQoJ1NlcnZpY2UnKSwgb2ZmbGluZUFzc2V0c1NlcnZpY2UpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NlcnZpY2VzL29mZmxpbmVBc3NldHMuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9