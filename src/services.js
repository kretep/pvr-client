import { getAPIPath } from './environment';

export default class ResourceService {

  constructor() {
    this.nodePromise = null;
  }

  static objectToUrlQueryParams(params) {
    var esc = encodeURIComponent;
    var query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&');
    return '?' + query;
  }

  static searchItems(collection, filter, page=1, pageSize=10, sortBy='-lastupdated_on') {

    // Construct parameters for paging & filtering
    var params = {
      page: page,
      pagesize: pageSize,
      count: '',
      sort_by: sortBy,
      hal: 'f'
    };
    if (filter) {
      params.filter = JSON.stringify(filter);
    }

    // Cancel any pending request
    //if (nodePromise) {
    //   nodePromise.abort();
    // }

    var paramString = ResourceService.objectToUrlQueryParams(params);
    return fetch(getAPIPath() + collection + paramString, {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        var result = {
          itemCount: data._size,
          pageCount: data._total_pages
        };
        if (data._embedded !== undefined && data._embedded["rh:doc"] !== undefined) {
          result.items = data._embedded["rh:doc"];
        }
        else {
          result.items = [];
        }
        return result;
    });
  }

  static getItems(collection, filter) {
    var params = {
      filter: JSON.stringify(filter),
      page: 1,
      pagesize: 1000,
      count: '',
      sort_by: 'name',
      hal: 'f'
    };
    var esc = encodeURIComponent;
    var query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&');
    const promise = fetch(`${getAPIPath() + collection}?${query}`, {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        if (data !== undefined) {
          if (data._embedded !== undefined && data._embedded["rh:doc"] !== undefined) {
            return data._embedded['rh:doc'];
          }
        }
        return [];
      });
      // .error(function(data, status) {
      //   deferred.reject(_processError(data, status));
      // });
    return promise;
  }

  static getItem(collection, id) {
    const promise = fetch(`${getAPIPath() + collection}/${id}`, {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        if (data !== undefined) {
          return data
        }
        return null
      });
      // .error(function(data, status) {
      //   deferred.reject(_processError(data, status));
      // });
    return promise;
  }

  static saveItem(collection, item) {
    var endpointUrl = getAPIPath() + collection;
    console.log(`Saving '${item.name}' in ${collection}`);

    var promise;
    var headers = {
      'Content-Type': 'application/json' 
    };

    // Type of request depends on update / new entry
    if (item._id) {
      // Update existing entity.
      // If the entity has an etag, it must be specified
      // in the headers (it may not have if the entity was
      // not created by restheart)
      var itemId = item._id.$oid;
      if (item._etag) {
        headers["If-Match"] = item._etag.$oid;
      }
      
      promise = fetch(`${endpointUrl}/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(item), //TODO: is stringify required?
        headers: headers,
        credentials: 'include'
      })
        .then(response => {
          // update etag with new value
          var etag = response.headers.get('etag');
          item._etag = { '$oid': etag };
          // complete call
          return itemId;
        });

      // .error(function(data, status) {
      //   deferred.reject(_processError(data, status));
      // });
    }
    else {
      // Create new entity
      promise = fetch(endpointUrl, {
        method: "POST",
        body: JSON.stringify(item),
        headers: headers,
        credentials: 'include'
      })
        .then(response => {
          console.log(response);
          // set etag
          var etag = response.headers.get('etag');
          item._etag = { '$oid': etag };
          // POST returns the created document url (containing id) in the headers
          var location = response.headers.get('location');
          var itemId = location.split('/').pop();
          item._id = { '$oid': itemId };
          return itemId;
        });
      // .error(function(data, status) {
      //   deferred.reject(_processError(data, status));
      // });
    }

    return promise;
  }

  static deleteItem(collection, item) {
    var endpointUrl = getAPIPath() + collection;

    var headers = item._etag ? {"If-Match": item._etag.$oid} : null;
    var itemId = item._id.$oid;
    var promise = fetch(`${endpointUrl}/${itemId}`, {
      method: "DELETE",
      headers: headers,
      credentials: 'include'
    })
      .then(() => itemId)
      // .error(function(data, status) {
      //   deferred.reject(_processError(data, status));
      // });
    return promise;
  }

  _processError(data, status) {
    if (status === 0) {
      return "Connection error";
    }
    var statusCode = data["http status code"];
    if (statusCode) {
      return "" + statusCode + " - " +
        data["http status description"] + "; " + data["message"];
    }
    return "Error returned from server: " + status;
  }


  /*nodes(page, pageSize, searchFilter) {
    // Construct parameters for paging & filtering
    var params = {
      page: page,
      pagesize: pageSize,
      count: '',
      sort_by: '-lastupdated_on'
    };
    if (searchFilter) {
      var filter = {
        name: {
          $regex: searchFilter,
          $options: 'i'
        }
      }
      params.filter = JSON.stringify(filter);
    }

    // Cancel any pending request
    if (this.nodePromise) {
      this.nodePromise.abort();
    }

    // Set up abort promise
    var deferredAbort = $q.defer();

    // Make the call
    var deferred = $q.defer();
    this.nodePromise = $http({
      url: getAPIPath(),
      method: "GET",
      params: params,
      timeout: deferredAbort.promise
    })
      .success(function(data) {
        var result = {
          nodeCount: data._size,
          pageCount: data._total_pages
        };
        if (data._embedded != undefined) {
          result.nodes = data._embedded["rh:doc"];
        }
        else {
          result.nodes = [];
        }
        deferred.resolve(result);
        this.nodePromise = null;
      })
      .error(function(data, status, headers, config) {
        // Check if the params match those of the current request.
        // If not, this function could have been called as result of an abort,
        // in which case we want to ignore the error.
        if (this.nodePromise && (config.params === this.nodePromise.params)) {
          this.nodePromise = null;
        //TODO: should we also resolve the deferred promise in case of cancellation?
        }
      });

    this.nodePromise.params = params; // Save these to identify the promise when aborting
    this.nodePromise.abort = function() {
      deferredAbort.resolve();
    };

    // Return promise
    return deferred.promise;
  }*/


}
