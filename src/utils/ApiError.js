class ApiError extends Error {
    // We are basically creating a child class of Node.JS's parent error class. We do this so that the structure of error that we will provide will stay professional everywhere . So We enforce a uniform error format. Whenever something goes wrong in my API, I don’t want random errors. I want a structured failure object that frontend can always understand.
    constructor(
        statusCode,
        message = 'Something went Wrong!', //if no msg given, aaccept this.
        errors = []
    ) {
        super(message) // calls constructor of parent class. We need to use this in order to use "this" and in inheritance
        this.statusCode = statusCode
        this.data = null //In your current design: data does NOT hold anything in errors. You intentionally set it to null for clean structure. Why? Because: Error = operation failed. Failed operation = no valid result
        this.message = message // The super(message) call passes the message to the parent Error class, which internally sets the message property and initializes the error object along with the stack trace. Assigning this.message = message afterward is often redundant but done for explicitness and to ensure the message is included in API responses, especially when converting the error object to JSON, where built-in Error properties may not always be enumerable.
        this.success = false
        this.errors = errors
    }
}
export default ApiError
