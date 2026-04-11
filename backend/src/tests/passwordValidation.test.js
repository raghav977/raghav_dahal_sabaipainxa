const { passwordStrength } = require("../services/validationServices");

describe("Password Strength Validation", () => {

  test("should return Weak for very simple password", () => {
    expect(passwordStrength("abc")).toBe("Weak");
    expect(passwordStrength("12345")).toBe("Weak");
  });

  test("should return Medium for moderate password", () => {
    expect(passwordStrength("abcdefG1")).toBe("Medium");
    expect(passwordStrength("abc12345")).toBe("Medium");
  });

  test("should return Strong for strong password", () => {
    expect(passwordStrength("Strong@123")).toBe("Strong");
    expect(passwordStrength("VeryStrongPassword@2024")).toBe("Strong");
  });

  test("should handle special characters correctly", () => {
    expect(passwordStrength("abc@123")).toBe("Medium");
  });

  test("should give Strong for long and complex password", () => {
    expect(passwordStrength("Abcdefghijkl@123")).toBe("Strong");
  });

});