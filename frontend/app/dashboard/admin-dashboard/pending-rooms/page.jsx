"use client"
import {useState,useEffect} from "react"
import DashStatus from "./components/DashStatus"
import PendingRoomList from "./components/PendingRoomList"

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;



export default function PendingPage(){

    const getToken = getTokenFromLocalStorage("token");
    const getRefreshToken = getTokenFromLocalStorage("refreshToken");

    const [pendingRooms,setPendingRooms] = useState([])
    const [totalPendingRooms,setTotalPendingRooms] = useState(0);
    const [data,setData] = useState([])

    const fetchPendingRooms = async()=>{
        
        try{
            const response = await fetch(`${BASE_URL}/api/admin/room-verification/status?status=pending`,{
                headers: {
                    "Authorization": `Bearer ${getToken}`
                }
            });
            const data = await response.json();
            console.log("This is data",data);
            setData(data.data);
            setTotalPendingRooms(data.count);
        }
        catch(err){
            console.error("This is an error",err);
        }
    }

    useEffect(()=>{
        fetchPendingRooms();
    },[])

    return(
        <div>
            <PendingRoomList list ={data} />
        </div>
    )
}