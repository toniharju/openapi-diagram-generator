const isEmpty = ( v ) => {
	if( v instanceof Object ) {
		return v === undefined || v === null || Object.entries( v ).length === 0;
	} else if( v instanceof Boolean ) {
		return v === undefined || v === null;
	} else {
		return v === undefined || v === null || v.length === 0;
	}
}

const getOrDefault = ( v, d ) => {
	return !isEmpty( v ) ? v : d;
}

module.exports = { isEmpty, getOrDefault };