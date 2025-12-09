class HttpService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://medical-records-updates2.onrender.com/';
    this.accessConfig = {
      'medical-record': {
        'extract-files': {
          accessUrl: '',
          url: 'medical-record/extract-files',
          accessPermission: 'medical-record~extract-files'
        }
      }
    };
  }

  checkUserAccess(accessStr, actionStr) {
    const access = this.accessConfig[accessStr]?.[actionStr];
    if (!access) {
      console.error(`Access not found for ${accessStr}~${actionStr}`);
      return null;
    }
    return access;
  }

  formatUrlParams(url, params) {
    return url;
  }

  objectToFormData(obj) {
    const formData = new FormData();
    if (obj.files) {
      obj.files.forEach(file => {
        formData.append('files', file);
      });
    }
    // Don't append data for the local backend
    return formData;
  }

  async makeApiCall(url, params, headers, access) {
    try {
      console.log('=== HTTP SERVICE DEBUG ===');
      console.log('Making API call to:', url);
      console.log('Headers:', headers);
      console.log('Params type:', typeof params);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers.headers ? Object.fromEntries(headers.headers.entries()) : {},
        body: params
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      return {
        status: true,
        data: data,
        message: 'Success'
      };
    } catch (error) {
      console.error('HTTP Service Error:', error);
      return {
        status: false,
        message: error.message,
        error: error
      };
    }
  }

  async httpRequest(accessStr, actionStr, params, options = {}) {
    const isMultipartFormData = options.isMultipartFormData ?? false;
    const optionalParam = options.optionalParam ?? '';
    const showLoader = options.showLoader ?? true;
    const hideErrorResToaster = options.hideErrorResToaster ?? false;
    const hideErrorLogs = options.hideErrorLogs ?? false;
    const endPointUrl = options.endPoint ?? this.baseURL;

    const access = this.checkUserAccess(accessStr, actionStr);
    if (!access) {
      if (!hideErrorLogs) {
        console.error(`You don't have access. Please contact Admin, module: ${accessStr}, function: ${actionStr}`);
      }
      return Promise.resolve({
        status: false,
        message: `You don't have access. Please contact Admin`
      });
    }

    let url = endPointUrl;
    if (!url.endsWith('/')) url += '/';
    url += access.url + optionalParam;
    
    console.log('Final URL:', url);

    const headers = new Map();
    headers.set('access-name', access.accessPermission);

    let processedParams = params;
    if (isMultipartFormData) {
      processedParams = this.objectToFormData(params);
    }

    const accessHeader = { headers };
    const response = this.makeApiCall(url, processedParams, accessHeader, access);

    return response
      .then((apiResponse) => {
        if (!apiResponse?.status) {
          if (!hideErrorResToaster) {
            console.error(apiResponse?.message);
          }
        }
        return apiResponse;
      })
      .catch((reason) => {
        return {
          status: false,
          message: reason.message || 'Request failed',
          error: reason
        };
      });
  }
}

export default new HttpService();