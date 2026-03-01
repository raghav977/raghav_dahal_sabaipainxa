
const bidNumberValidation = (number) => {
    if (number === undefined || number === null) {
        return { valid: false, message: "Number is required." };
    }
    number = Number(number);
    if (isNaN(number)) {
        return { valid: false, message: "Invalid number." };
    }
    if(number < 0){
        return { valid: false, message: "Number must be non-negative." };
    }

    
    console.log("This is number in validation:", number);
    // console.log(number<100000);
    if(number > 100000){
        return { valid: false, message: "Number must not be greater than 6 digits." };
    }


    return { valid: true, value: number };
}


module.exports = {bidNumberValidation}