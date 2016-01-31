angular.module('app').controller('browserDetectionCtrl', function($rootScope, $interval, deviceDetector) {
    var vm = this;
    vm.data = deviceDetector;
    //vm.allData = JSON.stringify(vm.data, null, 2);

    //detect chrome/FF usage
    var FForChrome = vm.data.raw.browser.chrome || vm.data.raw.browser.firefox;

    if (FForChrome){
        $rootScope.$emit("FFORCHROME");
    }
});