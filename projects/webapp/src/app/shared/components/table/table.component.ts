import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  InputSignal,
  output,
  signal,
  Signal,
  WritableSignal
} from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { default as _get } from 'lodash.get';
import { CopyButtonComponent } from '../../../core/components/copy-button.component';
import { I18N } from '../../../core/i18n/translation.en';
import { DynamicComponentLoaderComponent } from './component-loader/component-loader.component';
import {
  CellClickedData,
  CellData,
  ColumnDefinition,
  MappedRowData,
  RowData,
  TableConfig,
  TableFilterMatch,
  TableFilters,
  TableSortOrder
} from './table.model';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, DynamicComponentLoaderComponent, NgbTooltip, CopyButtonComponent],
  templateUrl: './table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent<T> {
  // Inputs
  public id: InputSignal<string | undefined> = input();
  public columns: InputSignal<ColumnDefinition<T>[]> = input([] as ColumnDefinition<T>[]);
  public page: InputSignal<number> = input(-1);
  public pageSize: InputSignal<number> = input(-1);
  public data: InputSignal<T[]> = input([] as T[]);
  public filters: InputSignal<TableFilters> = input({});
  public config: InputSignal<TableConfig> = input({});
  public $loading: InputSignal<boolean> = input(false);
  // Outputs
  public rowClicked = output<T>();
  public cellClicked = output<CellClickedData<T>>();
  public itemsPerPageChanged = output<number>();

  public COL_EXPAND_SIZE = '70px';
  public readonly I18N = I18N;
  public readonly String = String;

  // Pagination
  private isPaginationEnabled: Signal<boolean> = computed(
    () => this.pageSize() !== -1 && this.page() !== -1
  );
  public isInfiniteScrollEnabled: Signal<boolean> = computed(
    () => this.pageSize() !== -1 && this.page() === 0
  );
  public currentIndexInfiniteScroll: WritableSignal<number> = signal(1);
  public startItem = computed(() => {
    return this.isPaginationEnabled() ? (this.page() - 1) * this.pageSize() : 0;
  });
  public endItem = computed(() => {
    if (this.isPaginationEnabled()) {
      return this.page() * this.pageSize();
    }
    if (this.isInfiniteScrollEnabled()) {
      return this.currentIndexInfiniteScroll() * this.pageSize();
    }
    return this.rows().length;
  });
  public isLastPage = computed(() => {
    return this.endItem() >= this.rows().length;
  });

  // List
  private mappedRowData: Signal<MappedRowData<T>[]> = computed(() => {
    return this.data().map((row) => {
      const cells = this.columns().map((col) => {
        // get is needed from lodash to handle nested properties
        const value = _get(row, col.field);
        return { id: col.id, value, valueGetter: col.getter ? col.getter(row) : null };
      });
      return { row, cells };
    });
  });
  public rows: WritableSignal<RowData<T>[]> = signal([]);

  // Others
  public refresh = signal<number>(0);
  public configId = computed(() => {
    return this.config()?.id ? '-' + this.config().id : '';
  });

  constructor() {
    // NB: If you change filters or page don't forget to reset page to 1
    // Might have a problem with sort resting on the current page (since it's inside table component)
    // No need to reset page if you are in InfiniteScroll mode or AllData mode (no page or pageSize)
    effect(() => {
      this.refresh();
      if (this.mappedRowData().length) {
        const filteredData = this.filterData(this.mappedRowData(), this.filters(), this.columns());
        const sortedData = this.sortData(filteredData, this.columns());
        const list = sortedData.map((item, index) => {
          return {
            index,
            data: item.row,
            expanded: false,
            cells: item.cells
          };
        });
        this.rows.set(list);
        this.itemsPerPageChanged.emit(this.calculateItemsPerPage());
        this.currentIndexInfiniteScroll.set(1);
      }
    });
  }

  private calculateItemsPerPage(): number {
    return (
      (this.endItem() >= this.rows().length ? this.rows().length : this.endItem()) -
      this.startItem()
    );
  }

  private filterData(
    list: MappedRowData<T>[],
    filters: TableFilters,
    columns: ColumnDefinition<T>[]
  ): { row: T; cells: CellData[] }[] {
    const filtersFilled = Object.keys(filters || {}).reduce((acc, key) => {
      if (filters[key]) {
        acc[key] = filters[key];
      }
      return acc;
    }, {} as TableFilters);
    const columnWithFiltersValue = columns.filter(
      (col) => col.enableFilter && filtersFilled[col.field] !== undefined
    );
    if (columnWithFiltersValue.length) {
      for (const columnToFilter of columnWithFiltersValue) {
        list = list.filter((item) => {
          const cell = item.cells.find((cell) => cell.id === columnToFilter.id);
          return this.filterValues(filters[columnToFilter.field], cell?.value, columnToFilter);
        });
      }
    }
    return list;
  }

  private filterValues(
    filterValue: unknown,
    cellValue: unknown,
    column: ColumnDefinition<T>
  ): boolean {
    const matchMode = column.filterMatch || TableFilterMatch.EXACT;
    if (column.overrideFilter) {
      return column.overrideFilter(filterValue, cellValue, matchMode);
    }
    // This more intended for field that returns strings
    // If you have other types of object prefer the overrideFilter
    const stringValue = JSON.stringify(filterValue);
    switch (matchMode) {
      case TableFilterMatch.EXACT:
        return cellValue === filterValue;
      case TableFilterMatch.IGNORE_CASE:
        return stringValue.toLowerCase() === stringValue.toLowerCase();
      case TableFilterMatch.CONTAINS:
        return stringValue.includes(stringValue);
      case TableFilterMatch.CONTAINS_IGNORE_CASE:
        return stringValue.toLowerCase().includes(stringValue.toLowerCase());
      default:
        return cellValue === filterValue;
    }
  }

  private sortData(list: MappedRowData<T>[], columns: ColumnDefinition<T>[]): MappedRowData<T>[] {
    const columnsToSort = columns.filter(
      (col) => col.sort !== undefined && col.sort !== TableSortOrder.NONE
    );
    if (columnsToSort.length) {
      if (columnsToSort.length > 1) {
        console.warn(
          `Only one column can be sorted at a time. First column with id '${columnsToSort[0].id}' will be used.`
        );
      }
      const columnToSort = columnsToSort[0];
      list.sort((a, b) => {
        const cellA = a.cells.find((cell) => cell.id === columnToSort.id);
        const cellB = b.cells.find((cell) => cell.id === columnToSort.id);
        return this.sortValues(cellA?.value, cellB?.value, columnToSort);
      });
    }
    return list;
  }

  private sortValues(itemA: unknown, itemB: unknown, column: ColumnDefinition<T>): number {
    if (column.overrideSort) {
      return column.overrideSort(itemA, itemB, column.sort as TableSortOrder);
    }
    const firstItem = column.sort === TableSortOrder.ASC ? itemA : itemB;
    const secondItem = column.sort === TableSortOrder.ASC ? itemB : itemA;
    if (typeof itemA === 'string' && typeof itemB === 'string') {
      return (firstItem as string).localeCompare(secondItem as string);
    }
    // @ts-expect-error this is more reserved for numbers or other types like dates
    return firstItem - secondItem;
  }

  public sortClicked(columClicked: ColumnDefinition<T>) {
    // DESC -> ASC -> NONE
    if (columClicked.sort === TableSortOrder.DESC) {
      columClicked.sort = TableSortOrder.ASC;
    } else if (columClicked.sort === TableSortOrder.ASC) {
      columClicked.sort = TableSortOrder.NONE;
    } else {
      columClicked.sort = TableSortOrder.DESC;
    }
    // Reset other sort to none (only can have one sort at a time)
    this.columns().forEach((col) => {
      if (col.id !== columClicked.id && col.sort) {
        col.sort = TableSortOrder.NONE;
      }
      return col;
    });
    this.refresh.set(this.refresh() + 1);
  }

  trackByCell(cell: CellData) {
    return cell.value || cell;
  }
}
