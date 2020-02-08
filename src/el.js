class El {

	static path( path ) {
		return '<div class="path">' + path() + '</div>';
	};

	static pathTitle( title ) {
		return `<div class="path_title">${ title }</div>`;
	};

	static paths( paths ) {
		return '<div class="paths">' + paths() + '</div>';
	};

	static operation( operationType, operation ) {
		return `<div class="operation type_${operationType}">${operation()}</div>`;
	};

	static operationTitle( title ) {
		return `<div class="operation_title">${ title }</div>`;
	};

	static operationSubtitle( subtitle ) {
		return `<div class="operation_subtitle">${ subtitle }</div>`;
	};

	static operationParameter( parameter ) {
		return `<div class="operation_parameter">${ parameter }</div>`;
	};

	static operationParameters( subtitle, parameters ) {
		return `<div class="operation_parameters">` + 
					`<div class="operation_subtitle">${ subtitle }</div>` +
					`<div class="operation_parameter">${ parameters }</div>` +
				`</div>`;
	}

}

module.exports = El;
