const mapPacking = (packing) => {
  const unit = packing.UOM ? `${packing.UOM}` : '';
  const name = packing.name ?? '';
  const brandType = packing.brandType ?? '';
  const productColor = packing.productColor ?? '';

  const parts = [name, brandType, productColor, unit].filter(Boolean);
  if (parts.length === 0) return '';
  return (<div className='flex gap-1 flex-col'>
    <span>{name}</span>
    <span className='flex gap-1 text-xs'>
    <span>{brandType}</span>
    <span className={`dark:text-${productColor}-400 text-${productColor}-600`}>{productColor}</span>
    </span>
  </div>)
  return `${parts.join(' ')}${unit}`.trim();
};

const mapDimension = (dm) => {
  const unit = dm.unit ? ` ${dm.unit}` : '';
  const l = dm.length ?? '';
  const w = dm.width ?? '';
  const th = dm.thickness ?? '';

  const parts = [l, w, th].filter(Boolean);
  if (parts.length === 0) return '';
  return `${parts.join(' × ')}${unit}`.trim();
};

const mapTemperature = (tp) => {
  const value = tp?.value || null;
  const unit = tp?.unit ? ` ${tp.unit}` : '';
  const classList = value > 1400 ? 'text-red-600 dark:text-red-400 ' : value > 1200 ? 'dark:text-blue-400 text-blue-600' : 'dark:text-green-400 text-green-600';
  <span className={classList}>{`${value} ${unit}`}</span>
  return <span className={classList}>{`${value} ${unit}`}</span>
};


export { mapPacking , mapDimension , mapTemperature };