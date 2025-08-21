"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DisplayBar from "@/components/layout/DisplayBar";
import DisplayMain from "@/components/layout/DisplayMain";
import NavLink from "@/components/NavLink";
import Image from "next/image";
import { axiosInstance } from "../../lib/axiosInstance";
import { useToast } from "@/components/toast";

export default function ProductionDashboard({ children }) {
    const toast = useToast();
    const [campaign, setCampaign] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCampaign = async () => {
            console.log("fetchCampaign called");
            try {
                const response = await axiosInstance.get("/api/campaigns");
                console.log(response);
                setCampaign(data);
                setLoading(false);
                toast({
                    type: "success",
                    message: "Campaign fetched successfully",
                    duration: 4000,
                    autoClose: true,
                    placement: "top-center",
                    animation: "top-bottom",
                })
            } catch (error) {
                setError(error.message);
                setLoading(false);
                toast({
                    type: "error",
                    message: "Failed to fetch campaign",
                    duration: 4000,
                    autoClose: true,
                    placement: "top-center",
                    animation: "top-bottom",
                })
            }
        };
        fetchCampaign();
    }, []);

    return (
        <DashboardLayout>
            <DisplayBar title="Production Dashboard">
            <div className="flex items-center gap-4">
                <NavLink
                    href="/manufacturing"
                    activeClass="cursor-pointer px-2 py-1 rounded text-white bg-blue-500"
                    inactiveClass="cursor-pointer px-2 py-1 rounded text-gray-900 hover:text-blue-500 bg-gray-300"
                >
                    manufacturing
                </NavLink>
            </div>
                <NavLink
                    href="/manufacturing/start"
                    activeClass="cursor-pointer px-2 py-1 rounded text-white bg-blue-500"
                    inactiveClass="cursor-pointer px-2 py-1 rounded text-gray-900 hover:text-blue-500 bg-gray-300"
                >
                    Start New Production
                </NavLink>
            </DisplayBar>
            <DisplayMain>
                {children ? children : (
                    <div> in devloping </div>
                )}
            </DisplayMain>
        </DashboardLayout>
    );
}

{/* <section className="relative z-10">
    <h2 className="text-xl font-semibold mb-4">Production Progress</h2>
    <div className="absolute h-full w-full top-0 left-0 z-0 pointer-events-none flex items-center justify-center">
    </div>
    <div className="max-w-full w-auto grid grid-cols-4 items-start justify-center gap-4 relative z-10">
        <div className="border border-gray-300 p-4 h-fit rounded-lg w-full ">
            <div className="relative">
                <Image src="/rawMaterial.png" alt="icon" width={200} height={200}
                    className="pointer-events-none h-auto w-full opacity-20 grayscale-100  top-0 left-0"
                />
                <p
                    className="text-lg text-wrap capitalize absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full text-center font-bold">
                    mixing raw matrial and create betch
                </p>
            </div>
        </div>
        <div className="border border-gray-300 p-4 h-full rounded-lg w-full hidden">
            <span>step 2</span>
            <p className="text-sm text-wrap">
                add this batch to furnace for melting
            </p>
        </div>
        <div className="border border-gray-300 p-4 h-full rounded-lg w-full hidden">
            <span>step 3</span>
            <p className="text-sm text-wrap w-auto">
                melting go to spinnerwill and create fiber here we can directly go to packing for bulk product and want blanket then process is contionue
            </p>
        </div>
        <div className="border border-gray-300 p-4 h-full rounded-lg w-full hidden">
            <span>step 4</span>
            <p className="text-sm text-wrap w-auto">
                contionu bulk go for nidlling or pressing process and we make desire thickness of blanket here
            </p>
        </div>
        <div className="border border-gray-300 p-4 h-full rounded-lg w-full hidden">
            <span>step 5</span>
            <p className="text-sm text-wrap w-auto">
                pressing raw blanket go to furnace for heat process and remove oil and impurity here
            </p>
        </div>
        <div className="border border-gray-300 p-4 h-full rounded-lg w-full hidden">
            <span>step 6</span>
            <p className="text-sm text-wrap w-auto">
                after coming out of furnace go for side cutting and we get desired width of blanket
            </p>
        </div>
        <div className="border border-gray-300 p-4 h-full rounded-lg w-full hidden">
            <span>step 7</span>
            <p className="text-sm text-wrap w-auto">
                after again cutting but this time for desire length of blanket
            </p>
        </div>
        <div className="border border-gray-300 p-4 h-full rounded-lg w-full hidden">
            <span>step 8</span>
            <p className="text-sm text-wrap w-auto">
                then roll up and packing in plastic bag is mendotry process
            </p>
        </div>
    </div>
    <p className="pt-4 hidden">note : all process is contionue form first to last step , just if we need bulk we can go for packing in woven bag before nedling (step 4) </p>
    <p className="pt-4 hidden">for packing of blanket there is two condition , and fix is at time of production plastic bag is mendotry process,
        1st condition is at time of production running if customer order come we packe in woven bag or box as per customer requirment after plastic bag packing complete means contionue process otherwise we stock in factory in plastic bag
        2nd condition is production is not running and customer order come we packe in woven bag or box as per customer requirment from stock which is already in factory with plastick bag (so plastic bag go in all packing added woven or box on customer demand )
    </p>
</section> */}
