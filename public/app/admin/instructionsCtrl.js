angular.module('app')
    .controller('instructionsCtrl', ['$scope','$uibModalInstance', 'instructions', function($scope, $uibModalInstance, instructions){
        //TODO pull the newStudy object from the parent scope and add the study instructions
        //TODO make the popup dynamic so that it shows the instructions for already made studies.
        $scope.response = {};
        $scope.response.instructions = instructions;

        $scope.submitInstructions = function() {
            $uibModalInstance.close($scope.response.instructions);
        }

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        }

    }]);