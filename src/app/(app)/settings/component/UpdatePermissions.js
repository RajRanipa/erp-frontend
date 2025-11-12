// src/app/(app)/settings/components/UpdatePermissions.jsx
'use client';
import React, { useMemo, useState } from 'react';
import Dialog from '@/Components/Dialog';
import CustomInput from '@/Components/inputs/CustomInput';
import CheckBox from '@/Components/inputs/CheckBox';
import {axiosInstance} from '@/lib/axiosInstance';
import { cn } from '@/utils/cn';
import { addIcon } from '@/utils/SVG';
import { Toast } from '@/Components/toast';
import { useAuthz } from '@/hook/useAuthz'; 

// this file should be use for updating permissions of a role like dashboard:read -> dashboard:write or dasboard:read -> dashboard:read