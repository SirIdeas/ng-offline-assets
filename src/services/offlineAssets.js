'use strict';

function offlineAssetsService(){ 'ngInject';
  return {};
}

export var _name = 'offlineAssets';
export default angular.module(_name, [])
  .factory(_name.concat('Service'), offlineAssetsService);