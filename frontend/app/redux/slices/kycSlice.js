import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/kyc/`;

const getToken = getTokenFromLocalStorage("token");
const getRefreshToken = getRefreshTokenFromLocalStorage("refreshToken");


export const fetchApprovedKycs = createAsyncThunk(
    "kyc/fetchApproveKycs",
    async()=>{
        const response = await fetch(`${BASE_URL}get-kyc?type=approved`,{
            headers: {
                "Authorization": `Bearer ${getToken}`
            }
        })
        const data = await response.json();
        const kyc = data.kycs;
        return kyc;

        
         
    }
)

export const fetchKycCategory = createAsyncThunk(

    "kyc/fetchcategory",async()=>{
        try{
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kyc/categories/`)
            
        }
        catch(err){

        }
    }

)