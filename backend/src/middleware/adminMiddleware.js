
const adminMiddleware = async(req, res, next) => {
    const user = req.user;
    const getRoles = await user.getRoles();
    console.log("User roles fetched in adminMiddleware:", getRoles);
    console.log("User roles in adminMiddleware:", getRoles.map(r => r.name));
    const roless = getRoles.map(r=> r.name);
    if(roless.includes("Admin")){
        console.log("User is an admin:", { userId: user.id });
        req.user.role = "admin";
    }
    console.log("User roles array in adminMiddleware:", roless);
    console.log("Admin middleware triggered:", { userId: user.id, role: user.role });

    if (user && user.role === "admin") {
        console.log("is this admin")
        next();
    }
    else {
        return res.status(403).json({ message: "Forbidden: Admins only." });
    }
}

module.exports = { adminMiddleware };