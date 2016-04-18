/**
 * Constructs a Bugzilla object.
 * @class
 * @classdesc An object that communicates with Bugzilla via XML-RPC.
 */
var Bugzilla = function() {
	"use strict";
	
	/**
	 * The URL of the Bugzilla server.  TODO: make as an option when creating the class.
	 * @private
	 * @type {String}
	 */
	this.url = 'https://bugzilla.dtec.com/xmlrpc.cgi';
}

/**
 * Gets the version of Bugzilla and spits it to the console.
 * Not really useful other than confirming connectivity.
 */
Bugzilla.prototype.getVersion = function() {
	"use strict";
	
	$.xmlrpc({
		url: this.url,
		methodName: 'Bugzilla.version',
		success: function(response, status, jqXHR) {
			console.log(response[0].version);
		},
		error: function(jqXHR, status, error) {
			console.log(arguments);
		}
	});
}

/**
 * Gets a promise that will return bug info for the passed in bug number.
 * @param {number} bugId - The bug number.
 * @return {Promise} On success, will return the response object from Bugzilla.
 */
Bugzilla.prototype.getBug = function(bugId) {
	"use strict";

	return $.xmlrpc({
		url: this.url,
		methodName: 'Bug.get',
		params: [{"ids": [bugId]}]
	});
}

/**
 * Adds a comment to the bug passed in.
 * @param {number} bugId - The bug number.
 * @param {String} comment - The comment.
 * @param {number} hoursWorked - The number of hours worked. Default: 0
 * @return {Promise} On success, will return the response object from Bugzilla.
 */
Bugzilla.prototype.addComment = function(bugId, comment, hoursWorked) {
	"use strict";
	hoursWorked = hoursWorked || 0;
	
	return $.xmlrpc({
		url: this.url,
		methodName: 'Bug.add_comment',
		params: [{"id": bugId, "comment": comment, "work_time": hoursWorked}]
	});
}

/**
 * Updates the bug with the given parameters.
 * @param {number} bugId - The bug number.
 * @param {Object} params - An key-value object with the fields to be updated (see documentation for details).
 * @return {Promise} On success, will return the response object from Bugzilla.
 */
Bugzilla.prototype.updateBug = function(bugId, params) {
	"use strict";
	params.ids = [bugId];
	
	return $.xmlrpc({
		url: this.url,
		methodName: 'Bug.update',
		params: [params]
	});
}

/**
 * Gets a promise that will return bug info for bugs using the passed in criteria.
 * @param {Object} searchCriteria - The search criteria.
 * @return {Promise} On success, will return the response object from Bugzilla.
 */
Bugzilla.prototype.searchBugs = function(searchCriteria) {
	"use strict";

	return $.xmlrpc({
		url: this.url,
		methodName: 'Bug.search',
		params: [searchCriteria]
	});
}

/**
 * Gets a promise that will return all products.
 * @return {Promise} On success, will return the response object from Bugzilla.
 */
Bugzilla.prototype.getProducts = function() {
	"use strict";
	
	return $.xmlrpc({
		url: this.url,
		methodName: 'Product.get_enterable_products'
	})
	.then(function(response) {
		return $.xmlrpc({
			url: this.url,
			methodName: 'Product.get',
			params: [{ids: response[0].ids}],
			dataFilter: function(data, type) {
				// this fixes a problem where Bugzilla sends malformed XML
				return data.replace(/<\/methodR.*/, '</methodResponse>');
			}
		});
	});
}

/**
 * Modification to jquery.xmlrpc to handle dates.
 * See https://github.com/timheap/jquery-xmlrpc/issues/5
 */
$.xmlrpc.makeType('dateTime.iso8601', true, function(d) {
	return [
		d.getUTCFullYear(), '-', _pad(d.getUTCMonth()+1), '-',
		_pad(d.getUTCDate()), 'T', _pad(d.getUTCHours()), ':',
		_pad(d.getUTCMinutes()), ':', _pad(d.getUTCSeconds()), 'Z'
	].join('');
}, function(text, node) {
		// ISO 8601 dates can be either YYYY-MM-DD _or_
		// YYYYMMDD. Added check for the latter case, since it's
		// not handled by FireFox's Date constructor. jfuller
		// 2013-05-13
		if (!/-/.test(text)) {
			text = text.replace(/(\d{4})(\d{2})(\d{2})(.+)/, "$1-$2-$3$4");
		}
	return new Date(text);
});