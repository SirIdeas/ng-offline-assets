'use strict';

import { _name as oaBg } from './directives/oaBg';
import { _name as oaSrc } from './directives/oaSrc';

angular.module('ngOfflineAssets', [
  oaBg,
  oaSrc
])

.constant('OA_VERSION', '0.0.1')
