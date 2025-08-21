'use client';
import Manufacturing from '../page';
import { useState } from 'react';
import CustomInput from '@/components/CustomInput';
import SelectInput from '@/components/SelectInput';
import TextArea from '@/components/TextArea';
import RadioButton from '@/components/RadioButton';
import { useToast } from '@/components/toast';
import { axiosInstance } from '@/../lib/axiosInstance';

export default function StartManufacturing() {
  const statusOptions = [
    { value: 'PLANNED', label: 'Planned' },
    { value: 'RUNNING', label: 'Running' },
    { value: 'COMPLETED', label: 'Completed' },
  ];
  const productOptions = [
    { value: 'productA', label: 'Product A' },
    { value: 'productB', label: 'Product B' },
    { value: 'productC', label: 'Product C' },
  ];

  const orderOptions = [
    { value: '', label: 'None' },
    { value: 'order123', label: 'Order #123' },
    { value: 'order456', label: 'Order #456' },
    { value: 'order789', label: 'Order #789' },
  ];

  const stageOptions = [
    { value: 'stage1', label: 'Stage 1: Preparation' },
    { value: 'stage2', label: 'Stage 2: Assembly' },
    { value: 'stage3', label: 'Stage 3: Quality Check' },
  ];

  const [formData, setFormData] = useState({
    // Campaign fields
    name: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED',
    remarks: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const [resetKey, setResetKey] = useState(0);

  function normalizeDate(d) {
    if (!d) return null;
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return null;
    x.setHours(0,0,0,0);
    return x;
  }
  function isSameOrAfter(d1, d2) {
    if (!d1 || !d2) return true;
    return d1.getTime() >= d2.getTime();
  }
  function validate(values) {
    const e = {};
    const today = new Date(); today.setHours(0,0,0,0);
    const start = normalizeDate(values.startDate);
    const end = normalizeDate(values.endDate);

    if (!values.name?.trim()) e.name = 'Name is required';
    if (!values.status) e.status = 'Status is required';

    if (!values.startDate) {
      e.startDate = 'Start Date is required';
    } else if (!start) {
      e.startDate = 'Start Date is invalid';
    } else if (!isSameOrAfter(start, today)) {
      e.startDate = 'Start Date cannot be in the past';
    }

    if (values.endDate) {
      if (!end) e.endDate = 'End Date is invalid';
      else if (!isSameOrAfter(end, today)) e.endDate = 'End Date cannot be in the past';
      else if (start && !isSameOrAfter(end, start)) e.endDate = 'End Date cannot be before Start Date';
    }

    return e;
  }

  function handleChange(name, valueOrEvent) {
    const value = valueOrEvent && valueOrEvent.target !== undefined
      ? valueOrEvent.target.value
      : valueOrEvent;

    const next = { ...formData, [name]: value };
    setFormData(next);
    setErrors(validate(next));
  }

  function handleBlur(name) {
    setTouched(prev => ({ ...prev, [name]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(formData);
    setErrors(nextErrors);
    setTouched({ name: true, startDate: true, endDate: true, status: true, remarks: !!formData.remarks });
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: formData.status,
        remarks: formData.remarks || '',
      };

      const response = await axiosInstance.post('/api/campaigns', payload);

      toast({
        type: 'success',
        message: response?.data?.message || 'Campaign created successfully',
        duration: 4000,
        autoClose: true,
        placement: 'top-center',
        animation: 'top-bottom',
      });

      // Optionally reset the form
      setFormData({ name: '', startDate: '', endDate: '', status: 'PLANNED', remarks: '' });
      setErrors({});
      setTouched({});
      setResetKey((k) => k + 1);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to create campaign';
      toast({
        type: 'error',
        message: msg,
        duration: 4000,
        autoClose: true,
        placement: 'top-center',
        animation: 'top-bottom',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Manufacturing>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold mb-6">Start New Manufacturing Batch</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-md p-6 space-y-6"
        >
          <div className=" pb-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Campaign Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                key={`name-${resetKey}`}
                type="text"
                name="name"
                value={formData.name}
                onChange={(value) => handleChange('name', value)}
                onBlur={() => handleBlur('name')}
                required
                placeholder="Campaign name"
                label="Name"
                err={touched.name ? errors.name : ''}
              />

              <SelectInput
                key={`status-${resetKey}`}
                name="status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleChange('status', value)}
                onBlur={() => handleBlur('status')}
                required
                placeholder="Status"
                label="Status"
                err={touched.status ? errors.status : ''}
              />

              <CustomInput
                key={`startDate-${resetKey}`}
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={(value) => handleChange('startDate', value)}
                onBlur={() => handleBlur('startDate')}
                required
                placeholder="Start date"
                label="Start Date"
                err={touched.startDate ? errors.startDate : ''}
              />

              <CustomInput
                key={`endDate-${resetKey}`}
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={(value) => handleChange('endDate', value)}
                onBlur={() => handleBlur('endDate')}
                placeholder="End date (optional)"
                label="End Date"
                err={touched.endDate ? errors.endDate : ''}
              />

              {/* <CustomInput
                type="number"
                name="totalRawIssued"
                min="0"
                step="0.001"
                value={formData.totalRawIssued}
                onChange={(value) => handleChange('totalRawIssued', value)}
                placeholder="Total raw issued (kg)"
                label="Total Raw Issued (kg)"
              />

              <CustomInput
                type="number"
                name="totalFiberProduced"
                min="0"
                step="0.001"
                value={formData.totalFiberProduced}
                onChange={(value) => handleChange('totalFiberProduced', value)}
                placeholder="Total fiber produced (kg)"
                label="Total Fiber Produced (kg)"
              />

              <CustomInput
                type="number"
                name="meltReturns"
                min="0"
                step="0.001"
                value={formData.meltReturns}
                onChange={(value) => handleChange('meltReturns', value)}
                placeholder="Melt returns (kg)"
                label="Melt Returns (kg)"
              /> */}

              <div className="md:col-span-2">
                <TextArea
                  key={`remarks-${resetKey}`}
                  name="remarks"
                  value={formData.remarks}
                  onChange={(value) => handleChange('remarks', value)}
                  placeholder="Optional notes"
                  rows={3}
                  label="Remarks"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Starting…' : 'Start Batch'}
            </button>
          </div>
        </form>
      </div>
    </Manufacturing>
  );
}