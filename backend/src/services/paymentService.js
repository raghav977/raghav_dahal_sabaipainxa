
const verifyPayment = async (encodedData)=>{
    try{
        let decodedData = atob(encodedData);

        decodedData = await JSON.parse(decodedData);
    }
    catch(err){
        console.error("Error verifying payment:", err);
    }

}