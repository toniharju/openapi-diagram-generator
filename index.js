const fs = require( 'fs' );
const sass = require( 'node-sass' );

const El = require( './src/el' );
const OpenAPI3 = require( './src/openapi3' );
const { isEmpty } = require( './src/utils' );

class Main {

	constructor( source ) {

		const jsonData = fs.readFileSync( source, 'utf8' );
		this.data = JSON.parse( jsonData );

		let style = fs.readFileSync( './templates/root.scss', 'utf8' );
		style = sass.renderSync( { data: style } ).css.toString( 'utf8' );
		this.template = fs.readFileSync( './templates/root.html', 'utf8' );
		this.template = this.template.replace( '%TITLE%', this.data[ 'info' ][ 'title' ] );
		this.template = this.template.replace( '%STYLE%', style );

		this.render();

	}

	render() {

		let bodyHtml = '';
		let openApi = null;
		if( this.data.openapi.substr( 0, 1 ) === '3' )
			openApi = new OpenAPI3( this.data );
		else
			throw 'Only OpenAPI 3 is supported';
		
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
							const responseComponentsHtml = responses.reduce( ( a, response, i ) => {
								return a + response.mediaTypes.reduce( ( b, mediaType, j ) => {
									let html = b;
									if( !isEmpty( mediaType.schema ) && !isEmpty( mediaType.schema.componentRef ) ) {
										html += `${ response.code }: ${ mediaType.type }: ${ mediaType.schema.componentRef }`;
										if( j < operation.mediaTypes.length || i < responses.length ) html += '<br />';
									}
									return html;
								}, '' );
							}, '' );
							const responseDefinitionsHtml = responses.reduce( ( a, response, i ) => {
								return a + response.mediaTypes.reduce( ( b, mediaType, j ) => {
									let html = b;
									if( !isEmpty( mediaType.schema ) && !isEmpty( mediaType.schema.definitionRef ) ) {
										html += `${ response.code }: ${ mediaType.type }: ${ mediaType.schema.definitionRef }`;
										if( j < operation.mediaTypes.length || i < responses.length ) html += '<br />';
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
								( !isEmpty( urlParameterHtml ) ? 
									El.operationParameters( 'url parameters', urlParameterHtml ) : '' ) + 
								( !isEmpty( queryParameterHtml ) ? 
									El.operationParameters( 'query parameters', queryParameterHtml ) : '' ) +
								( !isEmpty( requestComponentsHtml ) ? 
									El.operationParameters( 'request component refs', requestComponentsHtml ) : '' ) +
								( !isEmpty( requestDefinitionsHtml ) ? 
									El.operationParameters( 'request definition refs', requestDefinitionsHtml ) : '' ) +
								( !isEmpty( responseCodesHtml ) ? 
									El.operationParameters( 'response codes', responseCodesHtml ) : '' ) + 
								( !isEmpty( responseComponentsHtml ) ? 
									El.operationParameters( 'response component refs', responseComponentsHtml ) : '' ) +
								( !isEmpty( responseDefinitionsHtml ) ? 
									El.operationParameters( 'response definition refs', responseDefinitionsHtml ) : '' )
							);

						} );
					}
					return operationsHtml;
				} );
			}
			return pathHtml;
		} );

		const api_title = this.data.info.title;
		const api_version = this.data.info.version;
		const api_description = this.data.info.description;

		const headerHtml = `<header>` +
			`<div class="header-top">` +
				`<div class="api-title">${ api_title }</div>` +
				`<div class="api-version">${ api_version }</div>` + 
			`</div>` +
			( !isEmpty( api_description ) ? `<div class="api-description">${ api_description }</div>` : '' ) +
		`</header>`;

		this.template = this.template.replace( '%ROOT%', headerHtml + bodyHtml );

		console.log( this.template );

	}

}

if( process.argv[2] !== undefined ) {
	new Main( process.argv[2] );
} else {
	console.log( 'Usage: node index.js [source file/url]' );
}
