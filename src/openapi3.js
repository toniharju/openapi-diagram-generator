const { isEmpty, getOrDefault } = require( './utils' );

class OpenAPI3 {

	constructor( data ) {
		this.generate( data );
	}

	generate( specs ) {

		const paths = [];
		const operations = [];

		const responses = [];
		const parameters = [];

		for( const [ fieldPattern, path ] of Object.entries( specs.paths ) ) {
			paths.push( fieldPattern );

			for( const [ operationType, operation ] of Object.entries( path ) ) {
				operations.push( {
					path: fieldPattern,
					operationType: operationType,
					summary: operation.summary,
					description: operation.description,
					mediaTypes: !isEmpty( operation.requestBody ) ? 
						this.populateMediaTypes( operation.requestBody.content ) : []
				} );

				this.populateResponses( responses, fieldPattern, operationType, operation.responses );
				this.populateParameters( parameters, fieldPattern, operationType, operation.parameters );
				
			}
		}

		this.paths = paths;
		this.operations = operations;
		this.responses = responses;
		this.parameters = parameters;

	}

	populateParameters( parametersList, fieldPattern, operationType, parameters ) {
		if( isEmpty( parameters ) )
			return;

		parametersList.push( ...parameters.map( ( parameter ) => {
			return {
				path: fieldPattern,
				operationType: operationType,
				name: parameter.name,
				in: parameter.in,
				description: getOrDefault( parameter.description, '' ),
				required: getOrDefault( parameter.required, false ),
				deprecated: getOrDefault( parameter.deprecated, false ),
				allowEmptyValue: getOrDefault( parameter.allowEmptyValue, false ),
				schema: this.populateSchema( parameter.schema )
			};
		} ) );
	}

	populateResponses( responsesList, fieldPattern, operationType, responses ) {
		if( isEmpty( responses ) )
			return;

		for( const [ responseCode, response ] of Object.entries( responses ) ) {
			responsesList.push( {
				path: fieldPattern,
				operationType: operationType,
				code: responseCode,
				description: response.description,
				mediaTypes: this.populateMediaTypes( response.content )
			} );
		}
	}

	populateSchema( schema ) {
		if( !isEmpty( schema ) ) {
			if( !isEmpty( schema[ '$ref' ] ) ) {
				const ref = schema[ '$ref' ].split( '/' );
				if( ref[1] === 'definitions' ) {
					return { definitionRef: ref[ref.length - 1] };
				} else if( ref[1] === 'components' ) {
					return { componentRef: ref[ref.length - 1] };
				}
			} else {
				return schema;
			}
		} else {
			return null;
		}
	}

	populateMediaTypes( content ) {
		const returnableMediaTypes = [];
		for( const [ mediaType, data ] of Object.entries( content ) ) {
			const type = { type: mediaType };
			if( !isEmpty( data ) ) {
				type.schema = this.populateSchema( data.schema );
			}
			returnableMediaTypes.push( type );
		}
		return returnableMediaTypes;
	}

}

module.exports = OpenAPI3;
