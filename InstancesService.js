angular.module('AnrModule').service('InstancesService', ['$mdDialog', '$state', 'gettextCatalog', 'AnrService', function($mdDialog, $state, gettextCatalog, AnrService ){
	this.detach = function($scope, ev, iid, successCallback, gotoanr){
		var confirm = $mdDialog.confirm()
		    .title(gettextCatalog.getString('Are you sure you want to detach this instance?'))
		    .textContent(gettextCatalog.getString('This instance and all its children will be removed from the risk analysis. This operation cannot be undone.'))
		    .ariaLabel('Detach instance')
		    .targetEvent(ev)
		    .ok(gettextCatalog.getString('Detach'))
		    .cancel(gettextCatalog.getString('Cancel'));
		$mdDialog.show(confirm).then(function() {
		    AnrService.deleteInstance($scope.model.anr.id, iid, function () {
		        $scope.updateInstances();
		        successCallback.call();
		    });
		    if(gotoanr != undefined && gotoanr){
		    	$state.transitionTo('main.kb_mgmt.models.details', {modelId: $scope.model.id});
		    }
		});
	}
}]);