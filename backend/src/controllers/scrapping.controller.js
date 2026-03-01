const axios = require('axios');

const fetchPdfs = async(req,res)=>{
    try{
        const url = "https://belbarimun.gov.np/ne/application-letter";
        const response = await axios.get(url);
        console.log(response.data);
        return res.status(200).json({data:response.data});

    }
    catch(err){
        console.error(err);
        return res.status(500).json({error:"Failed to fetch PDFs"});
    }

}

module.exports = {fetchPdfs};