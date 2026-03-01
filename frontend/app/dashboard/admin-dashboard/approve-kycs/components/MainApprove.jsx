// import React from 'react'
"use client"
import { useEffect,useState } from "react"
import StatsDashboard from './StatsDashboard';
// import ApproveKyc from "../page";
import ApproveKycList from "./ApproveKycList"



import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

export default function MainApprove() {

    const getToken = getTokenFromLocalStorage("token");
    const getRefreshToken = getTokenFromLocalStorage("refreshToken");

    const [approvedKyc,setApprovedKyc] = useState([]);
    const [totalApproved,setTotalApproved] = useState(0);

    const fetchApprovedKycs = async()=>{
        try{
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kyc/get-kyc?type=approved`,{
                headers: {
                    "Authorization": `Bearer ${getToken}`
                }
            });
            if(!response.ok){
                console.log("Something went wrong.",response);
                return;
            }
            const data = await response.json();
            console.log(data.kycs);
            console.log();
            setApprovedKyc(data.kycs);
            setTotalApproved(data.kycs.length);
        }
        catch(err){
            console.log("Something went wrong",err);

        }
    }

    useEffect(()=>{
        fetchApprovedKycs();
    },[])


  return (
    <div>
        {/* heading */}
        <h1 className="text-2xl font-bold">Approved Kycs</h1>
        {/* stats for dashboard */}
        <StatsDashboard total = {totalApproved}/>
        {/* <ApproveKyc></ApproveKyc>
         */}
         <ApproveKycList data={approvedKyc}/>
        

    </div>
  )
}

