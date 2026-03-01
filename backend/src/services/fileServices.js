
const path = require("path");

const getFilePath = (file)=>{
    if(!file) return null;
    return path.join("/uploads",file.filename);
}

module.exports = {
    getFilePath
}