const asyncHandler =(fn)=>
    (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((err)=>next(err)) // here errors will be handelled by error middleware.
    }
export default asyncHandler // or export {asyncHandler}
// In asyncHandler, Promise.resolve() is used to ensure that whether the passed function is async or normal, it is always treated as a Promise. This allows us to reliably use .catch() to handle any errors. While Promises typically use both .then() for success and .catch() for errors, in this case we only use .catch() because successful responses are already handled inside the route function itself. The goal of asyncHandler is only to catch errors and forward them to Express middleware.

//const asyncHandler =(fn)=> async()=>{} // takes a function as argument and return another function.


//Try Catch - method


// const asyncHandler=(fn)=> async(req,res,next)=>{ //extract res, req, next from the fn that was passed.
//     try{
//         await fn(res,req, next)
//     }
//     catch(error){
//         res.status(error.code||500).json({
//             success: false,
//             message: error.message
//         })
//     }
// } 
