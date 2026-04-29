class Apiresponse{// does the same work as Api Error, but for response. ApiResponse standardizes successful API outputs with status, data, message, and auto-derived success flag.
    constructor(statusCode, data, message="Success"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400 //If statusCode is less than 400 → success = true If 400 or more → 
        // success = false
    }
}
export default ApiResponse