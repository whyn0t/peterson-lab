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
            template: '<div><h3 class="info-message">In order to make sure that you are not in a distracting environment, we ' +
            'need to collect audio and video data during this task. This data will be stored on a secure server, ' +
            'separately from your provided information, and separately from any identifying information. This data ' +
            'will only be accessible by researchers affiliated with this project.</h3> ' +
            '<h4 ng-show="permissions.state == \'denied\'" class="alert alert-danger">' +
            'You need to enable access to your computer\'s webcam and microphone to continue.</h4> ' +
            '<h4 ng-show="permissions.state == \'notFound\'" class="alert alert-warning">You need a webcam and ' +
            'microphone attached to your computer to continue.</h4> ' +
            '<h4 ng-show="permissions.state == \'granted\'" class="alert alert-success">' +
            'Your camera and microphone are ready!</h4> ' +
            '<button ng-show="permissions.state != \'granted\'" ng-click="reload()">Reload Page</button> ' +
            '<button ng-show="permissions.state == \'granted\'" ng-click="continue()">Continue</button> </div>',
            link: link
        }
    }]);