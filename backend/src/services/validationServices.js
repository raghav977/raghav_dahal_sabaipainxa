const responses = require("../http/response");
const User = require("../models/User");

const checkEmailExists = async(email)=>{


    const user = await User.findOne({where:{email}});
    return user ? true : false;
}

const fieldsValidation = (...fields)=>{
    console.log("fieldsValidation called with fields:", fields);
    for(const field of fields){
        console.log("Validating field:", field);
        console.log("true? ",field.trim() !== "");
        if(!field || field.trim() === ""){
            return false;
        }
    }
    return true;
}

const checkValueInModel = async(Model, field, value)=>{
    const record = await Model.findOne({where:{[field]:value}});
    return record ? record : false;
}

const getValueInModel = async(Model, field, value)=>{
    const record = await Model.findOne({where:{[field]:value}});
    return record ? record : null;
}


const validateContactNumber = (numberString)=>{
    console.log("thE number string starts with 98?",numberString.startsWith('98'));
    console.log("thE number string starts with 97?",numberString.startsWith('97'));


    if(!numberString.startsWith('98') && !numberString.startsWith('97')){

        return false;

    }
    if(numberString.length!=10){
        return false;

    }

    return true;


}

const validateEmail = (email) => {
  const re = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+$/;
  return re.test(email);
};

const passwordStrength = (password) => {
  let score = 0;


  if (password.length >= 8) score++;
  if (password.length >= 12) score++;


  if (/[A-Z]/.test(password)) score++;        
  if (/[a-z]/.test(password)) score++;        
  if (/[0-9]/.test(password)) score++;        
  if (/[^A-Za-z0-9]/.test(password)) score++; 


  if (score <= 2) return "Weak";
  if (score <= 4) return "Medium";
  return "Strong";
};


module.exports = {
    checkEmailExists,
    fieldsValidation,
    checkValueInModel,
    getValueInModel,
    validateContactNumber,
    validateEmail,
    passwordStrength
}