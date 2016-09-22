'use strict';

function oaBgDirective(offlineAssetsService, $timeout) { 'ngInject';
  return {
    restrict: 'A',
    scope: {
      url: '=oaBg',
      localUrl: '=oaLocalUrl',
    },
    link: function(scope, element, attrs) {
      offlineAssetsService.download(scope.url, function (url) {
        if (scope.localUrl){
          scope.localUrl = url;
        }
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