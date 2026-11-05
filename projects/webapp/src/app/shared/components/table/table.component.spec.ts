import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableComponent } from './table.component';
import { ColumnDefinition, TableSortOrder } from './table.model';

describe('TableComponent', () => {
  let component: TableComponent<any>;
  let fixture: ComponentFixture<TableComponent<any>>;

  interface TestData {
    id: string;
    name: string;
    age: number;
  }

  const testData: TestData[] = [
    { id: '1', name: 'Alice', age: 30 },
    { id: '2', name: 'Bob', age: 25 },
    { id: '3', name: 'Charlie', age: 35 }
  ];

  const testColumns: ColumnDefinition<TestData>[] = [
    { id: 'id', field: 'id', header: 'ID' },
    { id: 'name', field: 'name', header: 'Name', enableSort: true },
    { id: 'age', field: 'age', header: 'Age', enableSort: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent<TestData>);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty data', () => {
    fixture.detectChanges();
    expect(component.data()).toEqual([]);
  });

  it('should accept data input', () => {
    fixture.componentRef.setInput('data', testData);
    fixture.detectChanges();
    expect(component.data()).toEqual(testData);
  });

  it('should accept columns input', () => {
    fixture.componentRef.setInput('columns', testColumns);
    fixture.detectChanges();
    expect(component.columns()).toEqual(testColumns);
  });

  it('should compute mapped row data', () => {
    fixture.componentRef.setInput('data', testData);
    fixture.componentRef.setInput('columns', testColumns);
    fixture.detectChanges();
    expect(component.rows().length).toBe(3);
  });

  it('should emit rowClicked event', () => {
    let clickedRow: TestData | undefined;
    component.rowClicked.subscribe((row) => (clickedRow = row));

    const testRow = testData[0];
    component.rowClicked.emit(testRow);

    expect(clickedRow).toEqual(testRow);
  });

  it('should handle pagination when enabled', () => {
    fixture.componentRef.setInput('data', testData);
    fixture.componentRef.setInput('columns', testColumns);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('pageSize', 2);
    fixture.detectChanges();

    expect(component.startItem()).toBe(0);
    expect(component.endItem()).toBe(2);
  });

  it('should handle infinite scroll when page is 0', () => {
    fixture.componentRef.setInput('data', testData);
    fixture.componentRef.setInput('columns', testColumns);
    fixture.componentRef.setInput('page', 0);
    fixture.componentRef.setInput('pageSize', 2);
    fixture.detectChanges();

    expect(component.isInfiniteScrollEnabled()).toBe(true);
  });

  it('should detect last page', () => {
    fixture.componentRef.setInput('data', testData);
    fixture.componentRef.setInput('columns', testColumns);
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('pageSize', 2);
    fixture.detectChanges();

    expect(component.isLastPage()).toBe(true);
  });

  it('should handle sort clicking', () => {
    fixture.componentRef.setInput('columns', testColumns);
    fixture.detectChanges();

    const column = component.columns()[1]; // name column
    column.sort = TableSortOrder.NONE;

    component.sortClicked(column);
    expect(column.sort).toBe(TableSortOrder.DESC);

    component.sortClicked(column);
    expect(column.sort).toBe(TableSortOrder.ASC);

    component.sortClicked(column);
    expect(column.sort).toBe(TableSortOrder.NONE);
  });

  it('should reset other columns sort when sorting a column', () => {
    const columns = [
      { id: 'col1', field: 'field1', header: 'Col1', enableSort: true, sort: TableSortOrder.ASC },
      { id: 'col2', field: 'field2', header: 'Col2', enableSort: true, sort: TableSortOrder.NONE }
    ];
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();

    component.sortClicked(columns[1]);
    expect(columns[0].sort).toBe(TableSortOrder.NONE);
    expect(columns[1].sort).toBe(TableSortOrder.DESC);
  });

  it('should accept loading state', () => {
    fixture.componentRef.setInput('$loading', true);
    fixture.detectChanges();
    expect(component.$loading()).toBe(true);
  });

  it('should accept filters input', () => {
    const filters = { name: 'Alice' };
    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();
    expect(component.filters()).toEqual(filters);
  });

  it('should accept config input', () => {
    const config = { id: 'test-table' };
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
    expect(component.config()).toEqual(config);
  });

  it('should compute configId', () => {
    fixture.componentRef.setInput('config', { id: 'my-table' });
    fixture.detectChanges();
    expect(component.configId()).toBe('-my-table');
  });

  it('should have empty configId when no config id provided', () => {
    fixture.componentRef.setInput('config', {});
    fixture.detectChanges();
    expect(component.configId()).toBe('');
  });
});
