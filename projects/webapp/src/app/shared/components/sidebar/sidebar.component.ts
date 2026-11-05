import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DfSidenavComponent,
  DfSidenavItemComponent,
  DfSidenavLinkComponent
} from '@design-factory/angular/sidenav';
import { sidebarMenu } from './sidebar.constant';
import { SidebarItem } from './sidebar.model';

/**
 * Left menu, rendered with Design Factory's SideNav.
 *
 * DF handles the active link (routerLinkActive + aria-current) and expands the group that
 * owns the active route; the user can still expand and collapse every group. Search,
 * resizing, minimising and the mobile panel are switched off: the previous menu had none.
 */
@Component({
  imports: [DfSidenavComponent, DfSidenavItemComponent, DfSidenavLinkComponent],
  selector: 'app-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrl: 'sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly menu: SidebarItem[] = sidebarMenu;
}
