const {validateContactNumber} = require('../services/validationServices')


test('should validate contact number starting with 98 and 97 and having 10 digits', ()=>{
    expect(validateContactNumber("9801234567")).toBe(true);
    expect(validateContactNumber("9701234567")).toBe(true);
})

test('should invalidate contact number not starting with 98 or 97', ()=>{
    expect(validateContactNumber("9601234567")).toBe(false);
    expect(validateContactNumber("9901234567")).toBe(false);
})

test('should invalidate contact number with less than 10 digits', ()=>{
    expect(validateContactNumber("980123456")).toBe(false);
    expect(validateContactNumber("970123456")).toBe(false);
})

test('should invalidate contact number with more than 10 digits', ()=>{
    expect(validateContactNumber("98012345678")).toBe(false);
    expect(validateContactNumber("97012345678")).toBe(false);
})

test('should invalidate contact number with non-numeric characters', ()=>{
    expect(validateContactNumber("98A1234567")).toBe(false);
    expect(validateContactNumber("97B1234567")).toBe(false);
})

