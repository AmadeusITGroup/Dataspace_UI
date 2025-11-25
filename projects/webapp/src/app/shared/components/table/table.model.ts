import { Placement } from '@ng-bootstrap/ng-bootstrap';

export interface ColumnDefinition<T> {
  // the id of the column, must be unique. Used for qa-id also
  id: string;
  // The translate key used in the header
  labelKey: string;
  // The translation key used in the header tooltip. Can contain html elements for more advancved tooltips
  headerTooltipKey?: string;
  // If true, a tooltip will be displayed for the cell content
  contentHasTooltip?: boolean;
  // contentTooltipPlacement: Placement of the tooltip, can be 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'
  // If not set, the default is 'top'
  contentTooltipPlacement?: Placement;
  // contentClass: Css classes to be applied to the content of the cell
  contentClass?: string;
  // contentStyle: Css styles to be applied to the content of the cell
  contentStyle?: string;
  // The field of the object that will be used to get the value. It can be a simple field or a nested field (e.g. 'user.name')
  field: string;
  // The getter function to be used to get the value. Overrides 'field'
  getter?: (row: T) => unknown;
  // actions to display in the cell
  actions?: {
    icon: string;
    label?: string;
    class?: string;
    tooltip?: string;
    onClick: (row: T, event: Event) => void;
  }[];
  // The component to be rendered in the cell
  component?: unknown;
  // If true, the column can handle filters
  enableFilter?: boolean;
  // The filter match mode to be used. If not set, the default is 'exact'
  filterMatch?: TableFilterMatch;
  // The initial sort order. If not set, the column will not be sortable
  sort?: TableSortOrder;
  // The function to be used to override the default sort
  overrideSort?: (itemA: unknown, itemB: unknown, sortOrder: TableSortOrder) => number;
  // The function to be used to override the default filter logic
  overrideFilter?: (
    filterValue: unknown,
    cellValue: unknown,
    filterMatch: TableFilterMatch
  ) => boolean;
  // The width of the column (can be in px, %, etc)
  width?: string;
  // The minWidth of the column (can be in px, %, etc)
  minWidth?: string;
  // The maxWidth of the column (can be in px, %, etc)
  maxWidth?: string;
  // cellStyle: Css styles to be applied to the cell
  cellStyle?: Record<string, string>;
  // cellClass: Css classes to be applied to the cell
  cellClass?: string;
  // A boolean to determine if the cell has a button to copy the value to the clipboard
  canBeCopied?: boolean;
}

export enum TableFilterMatch {
  // strict equality
  EXACT = 'exact',
  // strict equality ignoring case
  IGNORE_CASE = 'ignoreCase',
  // only partial match
  CONTAINS = 'contains',
  // only partial match ignoring case
  CONTAINS_IGNORE_CASE = 'containsIgnoreCase'
}

export enum TableSortOrder {
  ASC = 'asc',
  DESC = 'desc',
  NONE = 'none'
}

export type TableFilters = Record<string, unknown>;

export interface RowData<T> {
  index: number;
  expanded: boolean;
  data: T;
  cells: CellData[];
}

export interface CellData {
  id: string;
  value: unknown;
  valueGetter: unknown;
}

export interface MappedRowData<T> {
  row: T;
  cells: CellData[];
}

export interface CellClickedData<T> {
  row: RowData<T>;
  cell: CellData;
}

export interface TableConfig {
  // General id that can be used to identify a table, useful if you have 2 tables in the same page
  id?: string;
  // Component to be rendered when a row is expanded. If this field is set, the table will have add an additional column with a button to expand the row
  expandedComponent?: unknown;
  // Class to be applied to the <tr>
  rowClasses?: string | string[] | Record<string, boolean>;
  // Style to be applied to the <tr>
  rowStyles?: Record<string, string>;
  // Class to be applied to the expanded row <tr>
  expandedRowClasses?: string | string[] | Record<string, boolean>;
  // style to be applied to the expanded row <tr>
  expandedrowStyles?: Record<string, string>;
  // If true, the table will have alternate colors for the rows
  alternateRowsColor?: boolean;
  // Translation key to be used when there are no results. Use the default 'COMMON.NO_RESULTS' if not set
  noResultLabelKey?: string;
  // Translation key to be used when the table is loading. Use the default 'COMMON.LOADING' if not set
  loadingLabelKey?: string;
  // layout of the table, can be 'fixed' or 'auto'. If not set, the default is 'auto'
  layout?: 'fixed' | 'auto';
  // The color of the background of the expanded row, if set the background of the expanded row and it master will be changed
  backgroundColorExpandedRow?: string;
}
