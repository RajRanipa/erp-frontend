"use client";
// src/app/manufacturing/page.js
import { useState, useEffect, useRef } from "react";
import DisplayMain from "@/Components/layout/DisplayMain";
import NavLink from "@/Components/NavLink";
import { useActiveCampaign } from "./ActiveCampaignProvider";
import { axiosInstance } from "@/lib/axiosInstance";
import { Toast } from "@/Components/toast";
import { useRouter, usePathname } from "next/navigation";
import EditButton from "@/Components/buttons/EditButton";
import DeleteButton from "@/Components/buttons/DeleteButton";

const formatDMY = (d) => {
    if (!d) return '';
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return '';
    const tzOffset = x.getTimezoneOffset(); // minutes
    const local = new Date(x.getTime() - tzOffset * 60 * 1000);
    const dd = String(local.getDate()).padStart(2, '0');
    const mm = String(local.getMonth() + 1).padStart(2, '0');
    const yyyy = local.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

export default function ProductionDashboard({ children }) {
    
    // const confirmToast = useConfirmToast();
    const router = useRouter();
    const pathname = usePathname();
    const didClearRef = useRef(false);
    const [campaign, setCampaign] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setActiveCampaign, clearActiveCampaign, setList } = useActiveCampaign();

    const handleEdit = (id) => {
        router.push(`/manufacturing/campaigns/${id}/edit`);
    };

    const handleDelete = async (id, name, triggerEl) => {
        const ok = await Toast.promise(`Delete ${name} campaign? This action cannot be undone.`, {
            cancelText: 'Cancel',
            confirmText: 'Delete',
            focusTarget: triggerEl,
        });
        if (!ok) return;
        try {
            await axiosInstance.delete(`/api/campaigns/${id}`);
            setCampaign(prev => prev.filter(x => x._id !== id));
            Toast.success("Campaign deleted");
        } catch (err) {
            Toast.error(err?.response?.data?.message || "Failed to delete campaign");
        }
    };

    useEffect(() => {
        // Only clear when we're exactly on /manufacturing
        if (pathname === '/manufacturing' && !didClearRef.current) {
            console.log("clearActiveCampaign (once) on /manufacturing");
            clearActiveCampaign();
            didClearRef.current = true; // guard against React StrictMode double-invoke
        }
    }, [pathname, clearActiveCampaign]);

     const opencampaigns = (c) => {
        console.log("opencampaigns called");
        setActiveCampaign(c); // when i set here it's not working becuse first this called and then again clearActiveCampaign useEffect called
        console.log("campaign ", campaign);
        if (campaign.length > 1) {
            setList(campaign);
        }
        router.push(`/manufacturing/campaigns/view`)
    }

    useEffect(() => {
        const fetchCampaign = async () => {
            console.log("fetchCampaign called");
            try {
                const response = await axiosInstance.get("/api/campaigns");
                console.log("response", response);
                setCampaign(response.data);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
                Toast.error("Failed to fetch campaign");
            }
        };
        fetchCampaign();
    }, []);

   
    return (
        <DisplayMain>
            {children ?? (
                campaign.length > 0 ? (
                    <div>
                        {campaign.map((c) => (
                            <div key={c._id} className="p-2 border-b flex items-center justify-between border-color-200">
                                <div className="flex gap-2 flex-1 group" style={{ height: '-webkit-fill-available' }}>
                                    {/* above button hover below button grow applyed */}
                                    <button
                                        className="px-2 text-secondary-text capitalize cursor-pointer group-hover:grow text-start transition-all duration-300 group-hover:bg-gradient-to-r from-primary to-transparent"
                                        onClick={() => opencampaigns(c)}
                                    >
                                        {/*   */}
                                        {c.name}
                                    </button>
                                </div>
                                <div className="flex gap-2 ">
                                    <span
                                        className={`text-sm capitalize px-2 py-1 rounded-lg h-fit ${c.status.toLowerCase() === "planned"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : c.status.toLowerCase() === "running"
                                                ? "bg-blue-100 text-blue-800"
                                                : c.status.toLowerCase() === "completed"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-secondary text-secondary-text"
                                            }`}
                                    >
                                        {c.status}
                                    </span>
                                    <div className="text-primary-text">
                                        <p>Start: {formatDMY(c.startDate)}</p>
                                        <p>End: {formatDMY(c.endDate)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <EditButton itemName="Campaign" onClick={() => handleEdit(c._id)}/>
                                        <DeleteButton itemName="Campaign" onClick={(e) => handleDelete(c._id, c.name, e.currentTarget)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>in developing</div>
                )
            )}
        </DisplayMain>
    );
}