const SETUP_STEPS = [
  {
    key: 'companyBasics',
    label: 'Company Info',
    component: '../components/Step1CompanyInfo',
  },
  {
    key: 'address',
    label: 'Address',
    component: '../components/Step2Address',
  },
  {
    key: 'taxInfo',
    label: 'Tax Information',
    component: '../components/Step3TaxInfo',
  },
  {
    key: 'localization',
    label: 'Localization',
    component: '../components/Step4Localization',
  },
  {
    key: 'logo',
    label: 'Logo',
    component: '../components/Step5Logo',
  },
  {
    key: 'modules',
    label: 'Modules',
    component: '../components/Step6Modules',
  },
  {
    key: 'review',
    label: 'Review',
    component: '../components/Step7Review',
  },
];

export const TOTAL_STEPS = SETUP_STEPS.length;
export { SETUP_STEPS };
