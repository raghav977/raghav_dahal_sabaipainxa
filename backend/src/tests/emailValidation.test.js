




const {validateEmail} = require("../services/validationServices")




test('Should validate the email address correctly', ()=>{
  expect(validateEmail("test@example.com")).toBe(true);
})


test('should invalidte if email is empty', ()=>{
  expect(validateEmail("")).toBe(false);
})

test('should invalidate if email is missing @ symbol', ()=>{
  expect(validateEmail("testexample.com")).toBe(false);
})

test('should invalidate if email is missing domain', ()=>{
  expect(validateEmail("test@.com")).toBe(false);
})

test('should invalidate if email has spaces', ()=>{
  expect(validateEmail("test @example.com")).toBe(false);
})

test('should invalidate if email has multiple @ symbols', ()=>{
  expect(validateEmail("test@@example.com")).toBe(false);
})

test('should invalidate if email has invalid characters', ()=>{
  expect(validateEmail("test@exa!mple.com")).toBe(false);
})