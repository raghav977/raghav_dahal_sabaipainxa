
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
// const client = require("../config/redis");
const generateToken = async (user)=>{
    // console.log("Generating token for user:", user);
    const user_roles = await user.getRoles() || [];
    // checking the user roles and assigning roles to the token
    const payload = {
        id: user.id,
        email: user.email,
        roles: user_roles ? user_roles.map(role => role.name) : [],
        name: user.name,
        username: user.username
    };
    // console.log("Token payload:", payload);

    return jwt.sign(payload,JWT_SECRET,{expiresIn:"1h"});
}

const verifyToken = async(token)=>{
    // console.log("Verifying token:", token);
    try{
        const decoded = jwt.verify(token,JWT_SECRET);
        // console.log("Decoded token:", decoded);
        return decoded;
    }catch(err){
        console.error("Error verifying token:", err);
        throw err;

    }
}

const decodeToken = async(token)=>{
    try{
        const decoded = jwt.decode(token);
        return decoded;
    }catch(err){
        console.error("Error decoding token:", err);
        return null;
    }
}

const generateRefreshToken = async (user)=>{
    console.log("Generating refresh token for user:", user);
   
    const payload = {
        id: user.id,
        email: user.email,
        roles: user.roles ? user.roles.map(role => role.name) : [],
        name: user.name,
        username: user.username
    };  
    return jwt.sign(payload,JWT_SECRET,{expiresIn:"7d"});
}


const blackListToken = async(token)=>{
    
    const decoded = jwt.decode(token);
    if(decoded && decoded.exp){
        const exp = decoded.exp;
        const currentTime = Math.floor(Date.now() / 1000);
        const ttl = exp - currentTime;
        if(ttl > 0){
            // await client.setEx(`bl_${token}`, ttl, 'blacklisted');
            console.log(`Token blacklisted for ${ttl} seconds`);
        }
    }



}
const isTokenBlacklisted = async(token)=>{
    const result = await client.get(`bl_${token}`);
    return result === 'blacklisted';
};



module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    generateRefreshToken,
    blackListToken,
    isTokenBlacklisted,
};