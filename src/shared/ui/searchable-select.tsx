import { AppCombobox } from "@/shared/ui/app-form"

export type SearchableSelectOption = {
  id: string
  name: string
}

type SearchableSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  onCreateNew?: (query: string) => void
  createNewFormat?: string
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  className,
  onCreateNew,
  createNewFormat,
}: SearchableSelectProps) {
  return (
    <AppCombobox
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      disabled={disabled}
      className={className}
      onCreateNew={onCreateNew}
      createNewFormat={createNewFormat}
    />
  )
}

export { SearchableSelect }
