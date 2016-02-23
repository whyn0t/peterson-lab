angular.module('app').controller('browserDetectionCtrl', function($rootScope, $interval, deviceDetector) {
    var vm = this;
    vm.data = deviceDetector;
    var x = Number(vm.data.browser_version)

    if (vm.data.browser == 'chrome' && Number(vm.data.browser_version.split('.')[0]) >= 21){
        $rootScope.$emit("FFORCHROME");
    }
});