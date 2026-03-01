const Service = require("../../models/Services");
const BaseController = require("../baseController");

class AdminServiceController extends BaseController{
    constructor(){
        super(Service,{
            searchFields:["name"],
            filterFields:["package_enabled"],
            defaultLimit:10,
            defaultOrder:[["createdAt","DESC"]],
        })
    }


}


module.exports = AdminServiceController;