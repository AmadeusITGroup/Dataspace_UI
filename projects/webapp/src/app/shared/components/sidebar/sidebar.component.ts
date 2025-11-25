import { ChangeDetectionStrategy, Component, inject, linkedSignal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterService } from '../../../core/services/router.service';
import { sidebarMenu } from './sidebar.constant';
import { SidebarItem } from './sidebar.model';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrl: 'sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly menu = sidebarMenu;
  readonly expanded = linkedSignal<string, Set<string>>({
    source: inject(RouterService).routerUrl,
    computation: (source, previous) => {
      const res = previous?.value ?? new Set<string>();
      // Remove query params and fragments from the current route
      const [currentPath] = source.split(/[?#]/);
      for (const item of sidebarMenu) {
        if (
          item.items?.some((subItem) => {
            // Remove query params and fragments from the sidebar link
            const [itemPath] = subItem.link.split(/[?#]/);
            return currentPath === itemPath;
          })
        ) {
          res.add(item.id);
        }
      }
      return res;
    },
    equal: () => false
  });

  isOpen(item: SidebarItem): boolean {
    return this.expanded().has(item.id);
  }

  toggleCollapse({ id }: SidebarItem) {
    this.expanded.update((prev) => {
      if (prev.has(id)) {
        prev.delete(id);
      } else {
        prev.add(id);
      }
      return prev;
    });
  }
}
