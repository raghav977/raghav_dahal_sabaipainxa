

const serviceProviderMiddleware = async(req, res, next) => {
    const user = req.user;
    const getRoles = await user.getRoles();
    console.log("Service Provider Middleware triggered:", { userId: user.id, role: user.role });
    const roless = getRoles.map(r=> r.name);
    console.log("This is roles array in serviceProviderMiddleware:", roless);

    if(!roless.includes("Service_provider")){
        return res.status(403).json({ message: "Forbidden: Service Providers only." });
    }
    req.user.role = "service_provider";
    next();

}

module.exports = { serviceProviderMiddleware };