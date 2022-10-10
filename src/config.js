const dotenv = require("dotenv").config();

const {
  PORT,
  API_ENDPOINT_PRODUCTS,
  API_ENDPOINT_DETAIL,
  API_REQUEST_PRODUCTS,
  API_REQUEST_DETAIL
} = process.env;

module.exports = {
  PORT: PORT || 3001,
  apiEndpointProducts: API_ENDPOINT_PRODUCTS,
  endPointDetail: API_ENDPOINT_DETAIL,
  requestProducts: API_REQUEST_PRODUCTS,
  requestDetail: API_REQUEST_DETAIL,
};
