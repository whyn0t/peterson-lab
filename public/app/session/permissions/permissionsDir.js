angular.module('app')
    .directive('permissions', ['$rootScope', '$window', 'userMediaService', 'UM_Event', function($rootScope, $window, userMediaService, UM_Event) {
        function link (scope, element, attrs){
            scope.permissions = {};
            userMediaService
                .then(function(){
                    scope.permissions.state = 'granted';
                }, function(err){
                    if (err.name == 'PermissionDeniedError'){
                        scope.permissions.state = 'denied';
                    } else if (err.name == 'NotFoundError') {
                        scope.permissions.state = 'notFound';
                    }
                }
            );

            scope.continue = function(){
                $rootScope.$emit(UM_Event.GOTSTREAM);
            }

            scope.reload = function(){
                $window.location.reload();
            }
        }

        //TODO refer to template file
        return {
            restrict: 'E',
            //templateUrl: 'permissionsDir.html',
            template: '<div><div class="row-fluid"><div class="col-md-6 col-md-offset-3"><h3 class="info-message text-center">In order to make sure that you are not in a distracting environment, we ' +
            'need to collect audio and video data during this task. This data will be stored on a secure server, ' +
            'separately from your provided information, and separately from any identifying information. This data ' +
            'will only be accessible by researchers affiliated with this project.</h3></div></div> ' +
            '<div class="row-fluid"><div ng-show="permissions.state == \'denied\'" class="alert alert-danger col-md-6 col-md-offset-3">' +
            '<h4 class="text-center">Access to your webcam and microphone is currently blocked.</h4>' +
            '<h4 class="text-center">Please click this button <img src="/images/browser-bar-buttons-pointer.png"/> on the right side of your browser bar and select the "Always allow.." option.</h4>'+
            '</div>'+
            '<div ng-show="permissions.state == \'notFound\'" class="alert alert-warning text-center col-md-4 col-md-offset-4"><h4>You need a webcam and ' +
            'microphone attached to your computer to continue.</h4></div> ' +
            '<div ng-show="permissions.state == \'granted\'" class="alert alert-success text-center col-md-4 col-md-offset-4"><h4>' +
            'Your camera and microphone are ready!</h4></div></div> ' +
            '<div class="row-fluid"><div class="col-md-6 col-md-offset-3 text-center"><button ng-show="permissions.state != \'granted\'" ng-click="reload()">Reload Page</button> ' +
            '<button ng-show="permissions.state == \'granted\'" ng-click="continue()">Continue</button> </div></div></div>',
            link: link
        }
    }]);