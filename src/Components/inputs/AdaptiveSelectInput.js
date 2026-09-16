'use client';

import SelectInput from './SelectInput';
import SelectTypeInput from './SelectTypeInput';

/**
 * Keeps short controlled lists simple and makes larger lists searchable.
 * Both input components emit the same `{ target: { name, value } }` shape.
 */
export default function AdaptiveSelectInput({
  options = [],
  force = false,
  searchableThreshold = 5,
  ...props
}) {
  const normalizedOptions = Array.isArray(options) ? options : [];
  const InputComponent = normalizedOptions.length > searchableThreshold || force
    ? SelectTypeInput
    : SelectInput;

  return <InputComponent {...props} options={normalizedOptions} />;
}
