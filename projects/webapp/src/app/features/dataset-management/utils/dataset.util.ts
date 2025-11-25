import { FormControl } from '@angular/forms';
import { FilterOption } from '../../../core/components/filters/filter-option.model';
import { Asset } from '../model/asset/asset';
import { AssetProperties } from '../model/asset/assetProperties';
import { removeEmptyProperties } from '../../../core/utils/object.util';
import { SecretInputV3 } from 'management-sdk';
import { DataAddress } from '../model/asset/dataAddress';

export const accessTypes = [
  {
    label: 'All',
    value: ''
  },
  {
    label: 'Paid',
    value: 'paid'
  },
  {
    label: 'Free',
    value: 'free'
  }
];

export const deliveryMethods = [
  {
    label: 'API',
    value: '',
    disabled: false
  },
  {
    label: 'File',
    value: 'file',
    disabled: false
  },
  {
    label: 'Kafka',
    value: 'Kafka',
    disabled: true
  },
  {
    label: 'Streaming',
    value: 'streaming',
    disabled: false
  }
];

export const domainCategories = [
  {
    label: 'All',
    value: ''
  },
  {
    label: 'Road',
    value: 'Road'
  }
];

export const piiConstraints = [
  {
    label: 'All',
    value: ''
  },
  {
    label: 'Contains PII constraint',
    value: true
  },
  {
    label: 'Do not contains PII constraint',
    value: false
  }
];

export const paymentConstraints = [
  {
    label: 'All',
    value: ''
  },
  {
    label: 'Contains payment constraint',
    value: true
  },
  {
    label: 'Do not contains payment constraint',
    value: false
  }
];

export const accessLevels = [
  {
    label: 'All',
    value: ''
  },
  {
    label: 'Public',
    value: 'public'
  },
  {
    label: 'Restricted',
    value: 'restricted'
  },
  {
    label: 'Private',
    value: 'private'
  }
];

export enum AuthTypesEnum {
  OAuth2 = 'OAuth2',
  BaseAuth = 'BaseAuth',
  None = 'None'
}
export const authMethods = [
  {
    label: AuthTypesEnum.OAuth2,
    value: AuthTypesEnum.OAuth2
  },
  {
    label: AuthTypesEnum.BaseAuth,
    value: AuthTypesEnum.BaseAuth
  },
  {
    label: AuthTypesEnum.None,
    value: ''
  }
];

// export function filterAssetBySearch(assets: Asset[], values: [key: string]): Asset[] {
export function filterAssetBySearch(assets: Asset[], values: Record<string, string>): Asset[] {
  const ret = [] as Asset[];
  let hasFilter = false;
  // LOOP ON ALL VALUES
  if (values) {
    for (const [key, value] of Object.entries(values)) {
      if (key === 'search' && value != '') {
        hasFilter = true;
        const researchedValue = value.toLowerCase();
        ret.push(
          ...assets.filter((asset) => {
            return (
              asset.properties?.description?.toLowerCase().includes(researchedValue) ||
              asset.properties?.name?.toLowerCase().includes(researchedValue) ||
              asset.properties?.contenttype?.toLowerCase().includes(researchedValue) ||
              asset['@id'].toLowerCase().includes(researchedValue) ||
              asset.properties?.averageRecordSizeBytes ||
              asset.properties?.licenses?.includes(researchedValue) ||
              asset.properties?.licenses?.toString().toLowerCase().includes(researchedValue)
            );
          })
        );
      } else {
        if (value != null && value !== '') {
          hasFilter = true;
          ret.push(
            ...assets.filter((asset) => {
              return asset.properties[key as keyof AssetProperties]
                ?.toString()
                .toLowerCase()
                .includes(value);
            })
          );
        }
      }
    }
  }
  return hasFilter ? ret : assets;
}

export function buildFilterOptions(controls: {
  search: FormControl;
  accessType: FormControl;
  deliveryMethod: FormControl;
  domainCategories: FormControl;
  containsPII: FormControl;
  containsPaymentInfo: FormControl;
  accessLevel: FormControl;
  licenses: FormControl;
}): FilterOption[] {
  return [
    {
      label: 'Search by',
      control: controls['search'],
      id: 'search',
      placeholder: 'Name, Description, Content Type, ID',
      type: 'search',
      defaultValue: ''
    },
    {
      label: 'Access Type',
      control: controls['accessType'],
      id: 'accessType',
      type: 'select',
      defaultValue: '',
      options: [
        {
          label: 'All',
          value: ''
        },
        {
          label: 'Paid',
          value: 'paid'
        },
        {
          label: 'Free',
          value: 'free'
        }
      ],
      widthSize: 'small'
    },
    {
      label: 'Access Level',
      control: controls.accessLevel,
      options: [
        {
          label: 'All',
          value: ''
        },
        {
          label: 'Public',
          value: 'public'
        },
        {
          label: 'Restricted',
          value: 'restricted'
        },
        {
          label: 'Private',
          value: 'private'
        }
      ],
      id: 'accessLevel',
      type: 'select',
      defaultValue: '',
      widthSize: 'small'
    },
    {
      label: 'Delivery Method',
      control: controls.deliveryMethod,
      id: 'deliveryMethod',
      type: 'select',
      defaultValue: '',
      options: [
        {
          label: 'All',
          value: ''
        },
        {
          label: 'API',
          value: 'api'
        },
        {
          label: 'File',
          value: 'file'
        },
        {
          label: 'Streaming',
          value: 'streaming'
        }
      ],
      widthSize: 'small'
    },
    {
      label: 'Domain Category',
      control: controls.domainCategories,
      options: [
        {
          label: 'All',
          value: ''
        },
        {
          label: 'Road',
          value: 'Road'
        }
      ],
      id: 'type',
      type: 'select',
      defaultValue: '',
      widthSize: 'small'
    },
    {
      label: 'PII Constraint',
      control: controls.containsPII,
      options: [
        {
          label: 'All',
          value: ''
        },
        {
          label: 'Contains PII',
          value: true
        },
        {
          label: 'Does Not Contain PII',
          value: false
        }
      ],
      id: 'containsPII',
      type: 'select',
      defaultValue: '',
      widthSize: 'medium'
    },
    {
      label: 'Payment Constraint',
      control: controls.containsPaymentInfo,
      options: [
        {
          label: 'All',
          value: ''
        },
        {
          label: 'Contains payment constraint',
          value: true
        },
        {
          label: 'Do not contains payment constraint',
          value: false
        }
      ],
      id: 'payment',
      type: 'select',
      defaultValue: '',
      widthSize: 'medium'
    }
  ];
}

export function transformInAssetProperties(
  formValues: {
    properties: AssetProperties;
    version: string;
    id: string;
  },
  id?: string
): Partial<Asset> {
  const mergedAsset = {
    ...formValues, // Changed form values
    properties: {
      ...formValues['properties'],
      version: formValues['version']
    }
  };

  // Clean up empty or undefined properties
  const cleanedProperties = removeEmptyProperties(mergedAsset.properties || {});
  return {
    '@id': id || formValues['id'] || '',
    properties: cleanedProperties
  };
}

export function transformInSecret(formValues: {
  authType: string;
  baseAuth: { secretName: string; authCode: string };
  oAuth2: { clientSecretKey: string; privateKeyName: string; secretValue: string };
}): SecretInputV3 | undefined {
  const authType = formValues.authType;
  // Handle BaseAuth
  if (authType === 'BaseAuth' && formValues.baseAuth.secretName && formValues.baseAuth.authCode) {
    return {
      '@context': { '@vocab': '' },
      '@type': 'Secret',
      '@id': formValues.baseAuth.secretName,
      value: formValues.baseAuth.authCode || ''
    };
  }
  // Handle OAuth2
  if (
    authType === 'OAuth2' &&
    (formValues.oAuth2.clientSecretKey || formValues.oAuth2.privateKeyName) &&
    formValues.oAuth2.secretValue
  ) {
    return {
      '@context': { '@vocab': '' },
      '@type': 'Secret',
      '@id': formValues.oAuth2.privateKeyName || formValues.oAuth2.clientSecretKey,
      value: formValues.oAuth2.secretValue || ''
    };
  }
  return undefined;
}

export function transformInDataAddressRest(
  formValues: {
    baseUrl: string;
    path: string;
    queryParams: string;
    proxyPath: string;
    proxyQueryParams: string;
    authType: string;
    baseAuth: {
      authKey: string;
      secretName: string;
      authCode: string;
    };
    oAuth2: {
      tokenUrl: string;
      clientId: string;
      clientSecretKey: string;
      privateKeyName: string;
      kid: string;
    };
  },
  deleteSecretInfo = false
): DataAddress {
  const dataAddressPartial: Partial<DataAddress> = formValues
    ? {
        type: 'HttpData',
        baseUrl: formValues.baseUrl,
        path: formValues.path,
        queryParams: formValues.queryParams,
        proxyPath: (formValues.proxyPath || false).toString(),
        proxyQueryParams: (formValues.proxyQueryParams || false).toString()
      }
    : {};
  // Handle BaseAuth
  if (formValues.authType === 'BaseAuth') {
    dataAddressPartial.authKey = formValues.baseAuth.authKey;
    dataAddressPartial.secretName = deleteSecretInfo ? '' : formValues.baseAuth.secretName;
    dataAddressPartial.authCode = dataAddressPartial.secretName ? '' : formValues.baseAuth.authCode;
  }

  // Handle OAuth2
  if (formValues.authType === 'OAuth2') {
    dataAddressPartial['oauth2:tokenUrl'] = formValues.oAuth2.tokenUrl;
    dataAddressPartial['oauth2:clientId'] = formValues.oAuth2.clientId;
    dataAddressPartial['oauth2:clientSecretKey'] = deleteSecretInfo
      ? ''
      : formValues.oAuth2.clientSecretKey;
    dataAddressPartial['oauth2:privateKeyName'] = formValues.oAuth2.privateKeyName;
    dataAddressPartial['oauth2:kid'] = formValues.oAuth2.kid;
  }

  // Clean up empty or undefined properties
  return removeEmptyProperties((dataAddressPartial as DataAddress) || {});
}
