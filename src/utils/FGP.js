const mapPacking = (packing) => {

  const attributes = packing?.attributes || [];
  if (!Array.isArray(attributes) && !attributes.length > 0) return;
  const attribute = {
    name: packing?.name || '',
    grade: '',
    brandType: '',
    productColor: '',
  }
  attributes.map((attr) => {
    switch (attr.code) {
      case "grade":
        return attribute.grade = attr?.displayValue
      default:
        return null;
    }
  })
  return (`
    <p>${attribute.name}</p>
    <div className='flex gap-1 text-xs'><span>${attribute?.grade}</span><span>${attribute?.brandType}</span><span className={'dark:text-${attribute.productColor}-400 text-${attribute.productColor}-600'}>${attribute.productColor}</span></div>`)
};

const mapDimension = (dm) => {
  // console.log('dm', dm);
  const unit = dm?.unit ? ` ${dm.unit}` : '';
  const l = dm?.length ?? '';
  const w = dm?.width ?? '';
  const th = dm?.thickness ?? '';

  const parts = [l, w, th].filter(Boolean);
  if (parts.length === 0) return '—';
  return `${parts.join(' × ')}${unit}`.trim();
};

const mapTemperature = (tp) => {
  const value = tp?.value || null;
  const unit = tp?.unit ? ` ${tp.unit}` : '';
  const classList = value > 1400 ? 'text-red-600 dark:text-red-400 ' : value > 1200 ? 'dark:text-blue-400 text-blue-600' : 'dark:text-green-400 text-green-600';
  <span className={classList}>{`${value} ${unit}`}</span>
  return <span className={classList}>{`${value} ${unit}`}</span>
};

const mapItemOption = (item) => {
  if (item?.familyId?.code !== "BLANKET") return mapPacking(item);
  const attributes = item?.attributes ?? null;
  if (!Array.isArray(attributes) || !attributes.length > 0) return;
  // console.log('attributes', item);
  const attribute = {
    name: item?.name || '',
    temp: '',
    density: '',
    length: '',
    thickness: '',
    width: '',
    dimenstionUOM: '',
  }
  attributes.map((attr) => {
    switch (attr.code) {
      case 'classification_temperature':
        return attribute.temp = attr?.displayValue
      case 'density':
        return attribute.density = attr?.displayValue
      case 'length':
        return attribute.length = attr.normalizedValue
      case 'thickness':
        attribute.dimenstionUOM = attr.unit
        return attribute.thickness = attr.normalizedValue
      case 'width':
        return attribute.width = attr.normalizedValue

      default:
        return `<span>raj</span>`
    }
  })
  const label = (`<p class="capitalize">${attribute.name}</p><div class="flex gap-1 text-sm"><span class="text-blue-400">${attribute.temp}</span><span class="text-white-600">${attribute.density}</span><span class="text-white-500">${attribute.length} × ${attribute.width} × ${attribute.thickness} ${attribute.dimenstionUOM}</span></div>`).trim();
  // console.log('label', label);
  return label
}

export { mapPacking, mapDimension, mapTemperature, mapItemOption };