


const adminProviderMiddleware = async(req, res, next) => {
    const user = req.user;
    // console.log("hello from adminProviderMiddleware");
    // console.log("Admin Provider Middleware triggered:", { userId: user.id, role: user.role });

    const roles = await user.getRoles();
    const roless = roles.map(r=> r.name);
    console.log("User roles in adminProviderMiddleware:", roless);
    // console.log("This is roles array in adminProviderMiddleware:", roless);

    if(!roless.includes("Admin") && !roless.includes("Service_provider")){
        return res.status(403).json({ message: "Forbidden: Admins or Service Providers only." });
    }
    if(roless.includes("Admin")){
        req.user.role = "admin";
    }
    if(roless.includes("Service_provider")){
        req.user.role = "service_provider";
    }
    // console.log("User roles verified in adminProviderMiddleware:", req.user.role);
    next();
}


module.exports = {adminProviderMiddleware};