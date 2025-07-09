/*
We create an asyncHandler function in the utils folder to simplify error handling in 
asynchronous route handlers.

When we use async/await in our route controllers, and an error occurs (like a 
failed DB query), it needs to be passed to Express's error-handling middleware. But 
Express doesn’t catch errors in async functions automatically — so we have to
wrap every controller with try-catch.
This becomes repetitive and messy when we have many routes.
*/

const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
               .catch((err)=>{
                    next(err)
               })
    }
}
export default asyncHandler
/*
const asyncHandler=(func)=>async(req,res,next)=>{
    try{
        await func(req,res,next);
    }
    catch(error){
        res.status(error.code || 500).json({
            success:false,
            msg:error.message
        })
    }
}
*/