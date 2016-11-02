angular.module('AnrModule').directive('editable', function(){
	return{
		restrict: 'A',
		scope: {
			callback: '='
		},
		controller: ['$scope', '$attrs', function($scope, $attrs){
			this.fields = [];
			this.addField = function(field){
				this.fields.push(field);
			}

			this.callback = $scope.callback;

			this.saveChange = function(field, direction){
				field.error = false;

				if( $attrs.forceCallback == undefined && field.initialValue == field.editedValue){
					// value didn't change, don't call callback
					field.cancel();
					if(direction != undefined){
						this.moveEdition(field, direction);
					}
					return true;
				}


				field.model[field.name] = field.editedValue;
				var result = this.callback.call(null, field.model, field.name);

				if(result.then == undefined){
					this.handleCallbackReturn(result, field, direction);
				}
				else{
					var self = this;
					result.then(function(){	 self.handleCallbackReturn(true, field, direction);}, function(){ self.handleCallbackReturn(false, field, direction);} );
				}
				return true;
			};

			this.handleCallbackReturn = function(success, field, direction){
				if( success ){//gestion des erreurs
					field.error = false;
					field.edited = false;

					if(direction != undefined){
						this.moveEdition(field, direction);
					}
				}
				else{
					field.error = true;
				}
			};

			this.moveEdition = function(field, direction){
				var current_pos = this.fields.indexOf(field);
				var next_position = 0;
				if(direction == 'prev'){
					next_position = current_pos - 1 >= 0 ? current_pos - 1 : this.fields.length - 1;
				}
				else{//next
					next_position = current_pos + 1 < this.fields.length ? current_pos + 1 : 0;
				}
				this.fields[next_position].edit();
			};
		}]
	}
}).directive('editModel', ['$parse', function($parse){

	return {
		require: ['^^editable', 'editModel'],
		restrict: 'A',
		scope:{
			editModel: "=",
		},
		controller: ['$scope', '$attrs', function($scope, $attrs){
			this.model = $scope.editModel;
		}]
	}

}]).directive('editField', ['$parse', function($parse){
	return {
		require: ['^^editable', '^^editModel'],
		restrict: 'A',
		template: '<span ng-if="! field.edited">{{field.model[field.name]}}</span>\
							<input class="edit-field" ng-class="{editerror: field.error}" ng-if="field.edited && field.type == \'text\'" type="text" ng-model="field.editedValue"  escape="cancelEdition()"  action="saveEdition" autofocus/>\
							<input class="edit-field" ng-class="{editerror: field.error}" ng-if="field.edited && field.type == \'number\'" type="number" ng-model="field.editedValue"  escape="cancelEdition()" action="saveEdition" autofocus/>\
							<textarea class="edit-field" ng-class="{editerror: field.error}" ng-if="field.edited && field.type == \'textarea\'" ng-model="field.editedValue" escape="cancelEdition()" action="saveEdition" autofocus></textarea>',
		scope: {
			name: '@editField'
		},
		link: function(scope, element, attrs, ctrls){
			scope.editableCtrl = ctrls[0];
			scope.modelCtrl = ctrls[1];

			scope.field = {
				edited: false,
				model: scope.modelCtrl.model,
				name: scope.name,
				type: attrs.editType && attrs.editType != "" ? attrs.editType : 'text',
				editedValue: null,
				edit: function(){
					this.edited = true;
					this.initialValue = this.model[this.name];
					this.editedValue = angular.copy(this.model[this.name]);
				},
				cancel: function(){
					this.model[this.name] = this.initialValue;
					this.edited = false;
					this.error = false;
				}
			}

			scope.editableCtrl.addField(scope.field);

			element.on('click', function(){
				if( ! scope.field.edited ){
					scope.$apply(function(){
						scope.startEdition();
					});
				}
			});

			scope.startEdition = function(){
				scope.field.edit();
			};

			scope.cancelEdition = function(){
				scope.field.cancel();
			};

			scope.saveEdition = function(direction){
					scope.editableCtrl.saveChange(scope.field, direction);
			};
		}
	}
}]).directive('escape', function(){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			element.bind("keydown keypress", function(event){
				if( event.which == 27){
					scope.$apply(function(){
						scope.$eval(attrs.escape);
					});
					event.preventDefault();
					event.stopPropagation();
				}
			});
		}
	};
}).directive('action', function() {
  return {
    restrict: 'A',
    scope:{
    	callback: '=action'
    },
    link: function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
      	function triggerValidation(direction){
      		scope.$apply(function() {
      			scope.callback.call(null, direction);
          });
          return event.preventDefault();
      	}

        if ( element.prop('tagName').toLowerCase() == "textarea" && ((event.which === 13 && event.ctrlKey) || (event.which === 13 && event.metaKey))) {
          triggerValidation();
        }
        else if(element.prop('tagName').toLowerCase() != "textarea" && event.which === 13){
      		triggerValidation();
      	}
      	else if(event.which == 9 && event.shiftKey){//Shift TAB
      		triggerValidation('prev');
      	}
      	else if(event.which == 9){//TAB
      		triggerValidation('next');
      	}

      });
    }
  };
});
