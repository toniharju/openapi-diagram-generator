const fs = require( 'fs' );
const pdf = require( 'html-pdf' );

const El = require( './src/el' );
const OpenAPI = require( './src/openapi' );
const { isEmpty } = require( './src/utils' );

class Main {

	constructor( source ) {

		const jsonData = fs.readFileSync( source, 'utf8' );
		this.data = JSON.parse( jsonData );

		const style = fs.readFileSync( './templates/root.css', 'utf8' );
		this.template = fs.readFileSync( './templates/root.html', 'utf8' );
		this.template = this.template.replace( '%TITLE%', this.data[ 'info' ][ 'title' ] );
		this.template = this.template.replace( '%STYLE%', style );

		this.render();

	}

	render() {

		let bodyHtml = '';

		const openApi = new OpenAPI( this.data );

		bodyHtml += El.paths( () => {
			let pathHtml = '';
			for( const path of openApi.paths ) {
				pathHtml += El.path( () => {
					let operationsHtml = El.pathTitle( path );
					for( const operation of openApi.operations.filter( operation => operation.path === path ) ) {
						operationsHtml += El.operation( operation.operationType, () => {

							const urlParameters = openApi.parameters.filter( ( parameter ) => {
								return parameter.path === path && 
									parameter.operationType === operation.operationType && 
									parameter.in === 'path';
							} );
							const urlParameterHtml = urlParameters.reduce( ( acc, parameter, i ) => {
								let html = `${ parameter.schema.type }: ${ parameter.name }`;
								if( parameter.required ) html = `<b>${ html }</b>`;
								if( i < urlParameters.length ) html += '<br />';
								return acc + html;
							}, '' );

							const queryParameters = openApi.parameters.filter( ( parameter ) => {
								return parameter.path === path && 
									parameter.operation === operation.operation && 
									parameter.in === 'query';
							} );
							const queryParameterHtml = queryParameters.reduce( ( acc, parameter, i ) => {
								let html = `${ parameter.schema.type }: ${ parameter.name }`;
								if( parameter.required ) html = `<b>${ html }</b>`;
								if( i < queryParameters.length ) html += '<br />';
								return acc + html;
							}, '' );

							const responses = openApi.responses.filter( ( response ) => {
								return response.path === path && response.operationType === operation.operationType;
							} );
							const responseCodesHtml = responses.reduce( ( acc, response, i ) => {
								let html = `${response.code}: ${response.description}`;
								if( i < responses.length ) html += '<br />';
								return acc + html;
							}, '' );
							const responseComponentsHtml = responses.reduce( ( a, response ) => {
								return a + response.mediaTypes.reduce( ( b, mediaType, i ) => {
									let html = b;
									if( !isEmpty( mediaType.schema ) && !isEmpty( mediaType.schema.componentRef ) ) {
										html += `${ response.code }: ${ mediaType.type }: ${ mediaType.schema.componentRef }`;
										if( i < operation.mediaTypes.length ) html += '<br />';
									}
									return html;
								}, '' );
							}, '' );
							const responseDefinitionsHtml = responses.reduce( ( a, response ) => {
								return a + response.mediaTypes.reduce( ( b, mediaType, i ) => {
									let html = b;
									if( !isEmpty( mediaType.schema ) && !isEmpty( mediaType.schema.definitionRef ) ) {
										html += `${ response.code }: ${ mediaType.type }: ${ mediaType.schema.definitionRef }`;
										if( i < operation.mediaTypes.length ) html += '<br />';
									}
									return html;
								}, '' );
							}, '' );

							const requestComponentsHtml = operation.mediaTypes.reduce( ( acc, mediaType, i ) => {
									let html = acc;
									if( !isEmpty( mediaType.schema.componentRef ) ) {
										html += `${ mediaType.type }: ${ mediaType.schema.componentRef }`;
										if( i < operation.mediaTypes.length ) html += '<br />';
									}
									return html;
							}, '' );

							const requestDefinitionsHtml = operation.mediaTypes.reduce( ( acc, mediaType, i ) => {
								let html = acc;
								if( !isEmpty( mediaType.schema.definitionRef ) ) {
									html += `${ mediaType.type }: ${ mediaType.schema.definitionRef }`;
									if( i < operation.mediaTypes ) html += '<br />';
								}
								return html;
							}, '' );

							return (
								El.operationTitle( operation.operationType.toUpperCase() ) +
								( !isEmpty( urlParameterHtml ) ? El.operationSubtitle( 'url parameters' ) : '' ) + 
								( !isEmpty( urlParameterHtml ) ? El.operationParameter( urlParameterHtml ) : '' ) + 
								( !isEmpty( queryParameterHtml ) ? El.operationSubtitle( 'query parameters' ) : '' ) +
								( !isEmpty( queryParameterHtml ) ? El.operationParameter( queryParameterHtml ) : '' ) +
								( !isEmpty( requestComponentsHtml ) ? El.operationSubtitle( 'request component refs' ) : '' ) +
								( !isEmpty( requestComponentsHtml ) ? El.operationParameter( requestComponentsHtml ) : '' ) +
								( !isEmpty( requestDefinitionsHtml ) ? El.operationSubtitle( 'request definition refs' ) : '' ) +
								( !isEmpty( requestDefinitionsHtml ) ? El.operationParameter( requestDefinitionsHtml ) : '' ) +
								( !isEmpty( responseCodesHtml ) ? El.operationSubtitle( 'response codes' ) : '' ) + 
								( !isEmpty( responseCodesHtml ) ? El.operationParameter( responseCodesHtml ) : '' ) + 
								( !isEmpty( responseComponentsHtml ) ? El.operationSubtitle( 'response component refs' ) : '' ) +
								( !isEmpty( responseComponentsHtml ) ? El.operationParameter( responseComponentsHtml ) : '' ) +
								( !isEmpty( responseDefinitionsHtml ) ? El.operationSubtitle( 'response definition refs' ) : '' ) +
								( !isEmpty( responseDefinitionsHtml ) ? El.operationParameter( responseDefinitionsHtml ) : '' )
							);

						} );
					}
					return operationsHtml;
				} );
			}
			return pathHtml;
		} );

		this.template = this.template.replace( '%ROOT%', bodyHtml );

		/*pdf.create( this.template ).toFile( './api-docs.pdf', ( err, res ) => {
			if( err )
				console.error( err );
			else
				console.log( 'Exported to ' + res.filename );
		} );*/

		console.log( this.template );

	}

}

if( process.argv[2] !== undefined ) {
	new Main( process.argv[2] );
} else {
	console.log( 'Usage: node index.js [source file/url]' );
}