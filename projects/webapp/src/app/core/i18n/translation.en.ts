export const I18N = {
  COMMON: {
    TABLE: {
      LOAD_MORE: 'Load more',
      NO_RESULTS: 'No results',
      TOGGLE_HELP: 'Expand or Collapse row',
      SORT_HELP: 'Sort current column',
      LOADING: 'Loading... Please wait....',
      EXPAND: 'Expand column'
    }
  },
  ASSET: {
    FIELDS: {
      ASSET_ID: {
        TITLE: 'Asset ID',
        DESCRIPTION:
          'The unique identifier thru existing assets. It is used to reference the asset in the system.'
      },
      DATA_ADDRESS: {
        TITLE: 'Private Connector Settings',
        DESCRIPTION:
          'The connector is the gateway of participant data space for communication and data exchanges with other participants within this space',
        AUTHORIZATION: {
          TITLE: 'Authorization',
          DESCRIPTION: 'The Authorization method used to access the data source ',
          NO_AUTH: 'No Authorization specified'
        },

        BASE_AUTH: {
          TITLE: 'Base Authorization',
          DESCRIPTION:
            'The Authorization method used to access the data source using a username and password.',
          BASE_URL: 'URL of the API serving the data',
          PATH: 'Path to be appended to the Base Url',
          QUERY_PARAMS: 'Query params to be appended to the Base Url',
          PROXY_PATH:
            'Enable the proxying of path parameters provided by the consumer when request the data',
          PROXY_QUERY_PARAMS:
            'Enable the proxying of query parameters provided by the consumer when request the data',
          AUTH_KEY: 'Name of header in which api key will be sent',
          AUTH_CODE:
            'The api key to authenticate to the api or the Secret Value if the Secret Name is provided',
          AUTH_CODE_RECOMMENDED:
            "Using the field without 'Secret Name' is strongly discouraged as it means the api key will be stored in the database",
          SECRET_NAME: 'Alias of the secret stored in the vault that contains the Api key'
        },
        OAUTH2: {
          TITLE: 'OAuth2 Authorization',
          DESCRIPTION: 'The Authorization method used to access the data source using OAuth2.',
          TOKEN_URL: 'URL of the OAuth2 server to request the access token',
          CLIENT_SECRET_KEY:
            'Alias of the secret stored in the vault that contains the client secret. This is used for the client_secret field in the access token request to the oauth2 server',
          PRIVATE_KEY_NAME:
            'Alias of the secret stored in the vault that contains the private key used to sign the client assertion token. The client assertion token is put in the client_assertion field in the access token request to the oauth2 server. ',
          AT_LEAST_ONE_REQUIRED:
            'Either <i>Client Secret Key</i> or <i>Private key name</i> must be provided. If both filled, the <i>Client Secret Key</i> will be used.',
          KID: 'Value of the kid header sent in the request to the authorization server',
          SECRET_VALUE:
            "The value of the secret to be used for the 'Client Secret Key' or 'Private Key Name' field"
        }
      }
    }
  },
  POLICY: {
    POLICY_TOOLTIPS: {
      COPY: 'Inserts an example to help you start. Attention: Overrides existing value.',
      HELPER:
        'The field must be a valid JSON object. Click on this button to check the ODRL W3C standard documentation'
    }
  },
  CONTRACT_DEFINITION: {
    CONTRACT_DEFINITION_TOOLTIPS: {
      ACCESS_POLICY:
        'Defines the non-public requirements for accessing a dataset governed by a contract. These requirements are therefore not advertised to the agent. For example, access control policy may require an agent to be in a business partner tier',
      CONTRACT_POLICY:
        'Defines the requirements governing use a participant must follow when accessing the data. This policy is advertised to agents as part of a contract and are visible in the catalog.'
    }
  },
  CONTRACT_NEGOTIATION: {
    CONTRACT_NEGOTIATION_TOOLTIPS: {
      SEARCH_TEXT:
        'The search filters contract negotiations by matching the search text (case-insensitive) against the negotiation ID, contract ID, counter party ID, state, type, dataset ID, dataset description, or dataset name.'
    }
  }
};
