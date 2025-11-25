import { FormControl } from '@angular/forms';

export interface FilterOption {
  label: string;
  control: FormControl;
  options?: { value: string | number | boolean | null; label: string }[];
  typeaheadList?: string[];
  placeholder?: string;
  id: string;
  type: string; // 'text' | 'select' | 'checkbox' | 'search' | 'typehead'
  extraCallbackForReset?: () => void;
  defaultValue?: string | number | null;
  inputType?: string; // for type='text', specify input type like 'number', 'email', etc.
  widthSize?: string; // small, medium, large
}
