const { Op } = require("sequelize");
// import { response } from "../app";
const responses = require("../http/response");

class BaseController{
    constructor(model,options={}){
        this.model = model;
        this.searchFields = options.searchFields || [];
        this.filterFields = options.filterFields || [];
        this.defaultLimit = options.defaultLimit || 10;
        this.defaultOrder = options.defaultOrder || [['createdAt','DESC']];
    }


    // get wala 
    async list(req,res){
        try{
            const limit = parseInt(req.query.limit) || this.defaultLimit;
            const offset = parseInt(req.query.offset) || 0;
            const search = req.query.search || null;
            const ordering = req.query.ordering || null;

            const where = {};

            // Search functionality
            if(search && this.searchFields.length>0){
                where[Op.or] = this.searchFields.map((field)=>({
                    [field]:{[Op.like] : `%${search}%`},
                }))
            }

            // filtering (exact match wala)

            this.filterFields.forEach((field)=>{
                if(req.query[field]){
                    where[field] = req.query[field];
                }
            });

            // ordering wala yo chai

            let order = this.defaultOrder;
            if(ordering){
                const orderFields = ordering.split(',');
                order = orderFields.map((field)=>{
                    if(field.startsWith('-')){
                        return [field.substring(1),'DESC'];
                    }
                    return [field,'ASC'];
                });
            }


            const {count,rows} = await this.model.findAndCountAll({
                where,
                limit,
                offset,
                order,
            });

            res.json({
                total: count,
                limit,
                offset,
                results: rows,
                next: offset + limit < count ? offset + limit : null,
        previous: offset - limit >= 0 ? offset - limit : null,
            });





        }
        catch(err){
            res.status(500).json({ error: err.message });
            // console.log("Something went wrong in listing:", err);
        }
    }


    // get by id wala

    async retrieve(req,res){
        try{
            const item = await this.model.findByPk(req.params.id);
            if(!item){
                return responses.notFound(res, "Item not found");
            }
            res.json(item);

        }
        catch(err){
            responses.serverError(res, err.message);
        }
    }


    // create wala
    async create(req,res){
        try{
            console.log("Request body in create:", req.body);
            console.log("Model in create:", this.model.name);
            const item = await this.model.create(req.body);
            res.status(201).json(item);
        }
        catch(err){
            console.error("Error in create:", err);
            responses.serverError(res, err.message);
        }
    }


    // update wala

    async update(req,res){
        try{
            const item = await this.model.findByPk(req.params.id);
            if(!item){
                return responses.notFound(res, "Item not found");
            }
            await item.update(req.body);
            res.json(item);
        }
        catch(err){
            return responses.serverError(res, err.message);
        }


    }

    // delete wala

    async delete(req,res){
        try{
            const item = await this.model.findByPk(req.params.id);
            if(!item){
                return responses.notFound(res, "Item not found");
            }
            await item.destroy();
            res.status(204).send();
        }
        catch(err){
            return responses.serverError(res, err.message);
        }
    }
}

module.exports = BaseController;