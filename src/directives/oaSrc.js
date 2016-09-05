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
      element.attr('src', scope.url);

      offlineAssetsService.download(scope.url).$promise.then(function(url) {
        
        // Set src to image attrs
        $timeout(function(){
          element.attr('src', url);
        }, 10);

      })


      // Captar el error
      .catch(function (err) {
        console.log(err);

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