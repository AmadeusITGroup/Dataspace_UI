import { SidebarItem } from './sidebar.model';

export const sidebarMenu: SidebarItem[] = [
  // {
  //     id: 'home',
  //     title: 'Home',
  //     link: '/',
  //     order: 0,
  //     active: true
  // },
  {
    id: 'catalog',
    title: 'Catalog',
    link: '/catalog',
    order: 1,
    disabled: false,
    icon: 'boxes',
    items: []
  },
  {
    id: 'datasetManagement',
    title: 'Dataset Management',
    link: '',
    order: 2,
    disabled: false,
    icon: 'diagram-2',
    items: [
      {
        id: 'dataset',
        title: 'My Datasets',
        link: '/dataset-management/dataset',
        order: 0,
        disabled: false
      },
      {
        id: 'policy',
        title: 'My Policies',
        link: '/dataset-management/policy',
        order: 1,
        disabled: false
      },
      {
        id: 'contractDefinition',
        title: 'My Offers',
        link: '/dataset-management/contract-definition',
        order: 2,
        disabled: false
      }
    ]
  },
  {
    id: 'contractManagement',
    title: 'Contract Management',
    link: '',
    order: 3,
    disabled: false,
    icon: 'pass',
    items: [
      {
        id: 'contractNegotiation',
        title: 'My Contract Negotiations',
        link: '/contract-management/contract-negotiation',
        order: 0,
        disabled: false
      },
      {
        id: 'contractTransfer',
        title: 'My Transfers',
        link: '/contract-management/contract-transfer',
        order: 1,
        disabled: false
      }
    ]
  }
];
