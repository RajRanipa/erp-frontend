"use client";
// src/app/manufacturing/page.js
import { useState, useEffect, useRef } from "react";
import DisplayMain from "@/components/layout/DisplayMain";

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

export default function CRMDashboard({ children }) {
    return (
        <DisplayMain>
            {children ?? (
                (
                    <div>
                       CRM Dashboard is in production 
                    </div>
                )
            )}
        </DisplayMain>
    );
}