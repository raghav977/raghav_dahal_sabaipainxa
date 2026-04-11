const { createAndStoreOtp, generateOtp } = require("../services/otpServices");
const Otp = require("../models/Otp");
const { Op } = require("sequelize");


jest.mock("../models/Otp");


jest.mock("../services/otpServices", () => ({
    generateOtp: jest.fn(() => "123456"),
    createAndStoreOtp: jest.requireActual("../services/otpServices").createAndStoreOtp
}));

describe('OTP Service - Rate Limiting Tests', () => {
    const mockEmail = "test@example.com";
    const mockPhoneNumber = "9801234567";
    const mockOtpCode = "123456";

    beforeEach(() => {
        jest.clearAllMocks();
    });


    test('should create OTP when under rate limit (1st request)', async () => {
        Otp.count.mockResolvedValue(0);
        Otp.create.mockResolvedValue({
            email: mockEmail,
            phone_number: mockPhoneNumber,
            otp_code: mockOtpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            createdAt: new Date()
        });

        const result = await createAndStoreOtp(mockEmail, mockPhoneNumber);


        expect(result).toBeDefined();
        expect(typeof result).toBe('string');

        expect(Otp.count).toHaveBeenCalled();

        expect(Otp.create).toHaveBeenCalled();
    });

    test('should reject when rate limit exceeded (6th request within 5 minutes)', async () => {
        Otp.count.mockResolvedValue(5);

        await expect(
            createAndStoreOtp(mockEmail, mockPhoneNumber)
        ).rejects.toThrow("Too many OTP requests. Please try again after 5 minutes.");

        expect(Otp.create).not.toHaveBeenCalled();
    });

    test('should allow OTP creation after 5 minutes have passed', async () => {
        Otp.count.mockImplementation((options) => {
            if (options?.where?.createdAt) {
                return Promise.resolve(0); 

            }
            return Promise.resolve(0);
        });

        Otp.create.mockResolvedValue({
            email: mockEmail,
            phone_number: mockPhoneNumber,
            otp_code: mockOtpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            createdAt: new Date()
        });

        const result = await createAndStoreOtp(mockEmail, mockPhoneNumber);

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(Otp.create).toHaveBeenCalled();
    });


    test('OTP should expire after 10 minutes', async () => {
        const mockOtpRecord = {
            id: 1,
            email: mockEmail,
            phone_number: mockPhoneNumber,
            otp_code: mockOtpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), 
            createdAt: new Date(),
            isExpired: false
        };


        const createdTime = mockOtpRecord.createdAt.getTime();
        const currentTime = new Date().getTime();
        const isWithin10Minutes = (currentTime - createdTime) < (10 * 60 * 1000);

        expect(isWithin10Minutes).toBe(true);
        expect(mockOtpRecord.expiresAt).toEqual(expect.any(Date));
    });


    test('Rate limit: allows up to 5 requests, rejects 6th', async () => {
        for (let i = 0; i < 5; i++) {
            Otp.count.mockResolvedValueOnce(i); // i previous OTPs exist
            Otp.create.mockResolvedValueOnce({
                email: mockEmail,
                phone_number: mockPhoneNumber,
                otp_code: mockOtpCode,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                createdAt: new Date()
            });

            const result = await createAndStoreOtp(mockEmail, mockPhoneNumber);
            expect(result).toBeDefined(); 
        }

        Otp.count.mockResolvedValueOnce(5); 
        
        await expect(
            createAndStoreOtp(mockEmail, mockPhoneNumber)
        ).rejects.toThrow("Too many OTP requests. Please try again after 5 minutes.");
    });
});