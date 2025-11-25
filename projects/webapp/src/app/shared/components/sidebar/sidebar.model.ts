export interface SidebarSubItem {
  id: string;
  title: string;
  link: string;
  order: number;
  disabled: boolean;
}

export interface SidebarItem {
  id: string;
  title: string;
  link: string;
  order: number;
  disabled: boolean;
  icon: string;
  items: SidebarSubItem[];
}
