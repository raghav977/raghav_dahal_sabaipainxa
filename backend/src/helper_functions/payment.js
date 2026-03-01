


require('dotenv').config();
const axios = require('axios');


const crypto = require('crypto');

const hashPayment = ({amount,transaction_uuid})=>{

    try{
        const data = `total amount: ${amount}|transaction uuid: ${transaction_uuid}`;

        const secretHash =  process.env.ESEWA_SECRET_KEY;

        const hash = crypto.createHmac('sha256', secretHash)
        .update(data)
        .digest('hex');

        return {
            signature:hash,
            signed_field_names: "total amount,transaction uuid"
        }



        }
        catch(err){
            throw err;

        }



    
}