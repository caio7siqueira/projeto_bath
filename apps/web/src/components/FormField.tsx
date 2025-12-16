'use client';

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  [key: string]: any;
}

export function FormField({
  label,
  id,
  type = 'text',
  placeholder,
  error,
  required,
  ...props
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...props}
        className={`mt-1 w-full rounded-lg border px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  id: string;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  [key: string]: any;
}

export function SelectField({
  label,
  id,
  options,
  error,
  required,
  ...props
}: SelectFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        {...props}
        className={`mt-1 w-full rounded-lg border px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
