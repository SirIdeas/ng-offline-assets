'use strict';

function oaBgDirective(offlineAssetsService, $timeout) { 'ngInject';
  return {
    restrict: 'A',
    scope: {
      url: '=oaSrc',
      // from: '=oaFrom',
      // dest: '=oaDest',
      // important: '=oaImportant',
      // loadingClass: '@oaLoadingClass',
      // failClass: '@oaFailClass',
      // fail: '&oaOnFail',
      // removeLoading: '@oaRemoveLoadingClass',
    },
    link: function(scope, element, attrs) {

      function cb(url) {
        // Set src to image attrs
        $timeout(function(){
          element.attr('src', url);
        }, 10);
      }

      offlineAssetsService.download(scope.url, cb);
      element.on('$destroy', function () {
        offlineAssetsService.release(scope.url, cb);
      });

    }
  };
};

import { _name as offlineAssets } from '../services/offlineAssets';

export var _name = 'oaSrc';
export default angular.module(_name, [
  offlineAssets
])
  .directive(_name, oaBgDirective);