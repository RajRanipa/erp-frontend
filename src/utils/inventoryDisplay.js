const quantityFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 3,
});

const ATTRIBUTE_ORDER = [
  'classification_temperature',
  'density',
  'length',
  'width',
  'thickness',
];

const attributeValue = attribute => {
  const value = String(
    attribute?.displayValue ?? attribute?.normalizedValue ?? '',
  ).trim();
  const unit = String(attribute?.unit || '').trim();
  if (!value || !unit) return value;
  const normalizedValue = value.toLocaleLowerCase();
  const normalizedUnit = unit.toLocaleLowerCase();
  return normalizedValue.includes(normalizedUnit) ? value : `${value} ${unit}`;
};

export const formatInventoryQuantity = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? quantityFormatter.format(numeric) : '0';
};

export const formatItemSpecification = item => {
  const attributes = Array.isArray(item?.attributes) ? item.attributes : [];
  if (!attributes.length) return '—';
  const byCode = new Map(attributes.map(attribute => [attribute.code, attribute]));
  const temperature = attributeValue(byCode.get('classification_temperature'));
  const density = attributeValue(byCode.get('density'));
  const dimensions = ['length', 'width', 'thickness']
    .map(code => attributeValue(byCode.get(code)))
    .filter(Boolean)
    .join(' × ');
  const used = new Set(ATTRIBUTE_ORDER);
  const remaining = attributes
    .filter(attribute => !used.has(attribute.code))
    .map(attributeValue)
    .filter(Boolean);
  return [temperature, density, dimensions, ...remaining].filter(Boolean).join(' · ') || '—';
};
