
class ApiResponse {
  constructor(
    statusCode,
    data,
    message = "Success",
  ) {
    this.status = statusCode;
    this.data = data;
    this.message = message;
    this.succuss = statusCode < 400;
  }
}

export default ApiResponse
