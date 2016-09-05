'use strict';

function oaBgDirective(offlineAssets, $timeout) { 'ngInject';
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
      removeLoading: '@oaRemoveLoadingClass',
    },
    link: function(scope, element, attrs) {
      ngDownloadFile.tagDownload(scope, element, function(url) {
        //Set src to image attrs
        $timeout(function(){
          element.attr('src', url);
        }, 10);
      });
    }
  };
};

import { _name as offlineAssets } from '../services/offlineAssets';

export var _name = 'oaBg';
export default angular.module(_name, [])
  .directive(_name, oaBgDirective);