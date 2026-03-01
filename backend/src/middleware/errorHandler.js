const responses = require("../http/response")

const errorHandler = async(err,req,res,next)=>{
    console.error(err);
    return responses.serverError(res,{data:err.message})
    
}

module.exports = errorHandler;