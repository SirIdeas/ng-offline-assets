'use strict';

function oaBgDirective(offlineAssetsService, $timeout) { 'ngInject';
  return {
    restrict: 'A',
    scope: {
      url: '=oaBg',
      from: '=oaFrom',
      dest: '=oaDest',
      important: '=oaImportant',
      loadingClass: '@oaLoadingClass',
      failClass: '@oaFailClass',
      fail: '&oaOnFail',
      removeLoading: '@oaRemoveLoadingClass',
    },
    link: function(scope, element, attrs) {
      offlineAssetsService.download(scope.url, function (url) {
        // Set src to image attrs
        $timeout(function(){
          element.css('background-image', 'url(' + url + ')');
        }, 10);
      });
    }
  };
};

import { _name as offlineAssets } from '../services/offlineAssets';

export var _name = 'oaBg';
export default angular.module(_name, [
  offlineAssets
])
  .directive(_name, oaBgDirective);