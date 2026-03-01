
const messages = require("./messages")

const responses = {

    success:(res,data={},message=messages.SUCCESS)=>{
        return res.status(200).json({
            status:"success",
            code:200,
            message,
            data
        })
    },

    created:(res,data={},message=messages.CREATED)=>{
        return res.status(201).json({
            status:"success",
            code:201,
            message,
            data
        })
    },

    updated:(res,data={},message=messages.UPDATED)=>{
        return res.status(200).json({
            status:"success",
            code:200,
            message,
            data
        })
    },

    deleted:(res,data={},message=messages.DELETED)=>{
        return res.status(200).json({
            status:"success",
            code:200,
            message,
            data
        })
    },
    
    loginSuccess:(res,data={},message=messages.LOGIN_SUCCESS)=>{
        return res.status(200).json({
            status:"success",
            code:200,
            message,
            data
        })
    },
    logoutSuccess:(res,data={},message=messages.LOGOUT_SUCCESS)=>{
        return res.status(200).json({
            status:"success",
            code:200,
            message,
            data
        })
    },

     emailSent: (res, message = messages.EMAIL_SENT) => {
    return res.status(200).json({
      status: "success",
      code: 200,
      message,
    });
  },


//   bad request wala

badRequest: (res,data={}, message = messages.BAD_REQUEST) => {
    return res.status(400).json({
      status: "error",
      code: 400,
      message,
      data
    });
  },


   unauthorized: (res, message = messages.UNAUTHORIZED) => {
    return res.status(401).json({
      status: "error",
      code: 401,
      message,
    });
  },


    forbidden: (res, message = messages.FORBIDDEN) => {
    return res.status(403).json({
      status: "error",
      code: 403,
      message,
    });
  },


    notFound: (res, message = messages.NOT_FOUND) => {
    return res.status(404).json({
      status: "error",
      code: 404,
      message,
    });
  },


   conflict: (res, data={},message = messages.CONFLICT) => {
    return res.status(409).json({
      status: "error",
      code: 409,
      message,
      data
    });
  },

  serverError: (res, data={},message = messages.SERVER_ERROR) => {
    return res.status(500).json({
      status: "error",
      code: 500,
      message,
      data
    });
  },
}


module.exports = responses;