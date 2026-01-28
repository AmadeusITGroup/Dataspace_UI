export interface KafkaSaslAuth {
  'kafka:sasl:mechanism'?: 'PLAIN' | 'OAUTHBEARER';
  'kafka:sasl:username'?: string;
  'kafka:sasl:password'?: string;
  'sasl.jaas.config'?: string;
  secretName?: string;
}

export interface KafkaSslAuth {
  'kafka:ssl:enabled'?: string;
  'security.protocol'?: 'PLAINTEXT' | 'SASL_PLAINTEXT' | 'SASL_SSL' | 'SSL';
  tls_ca_secret?: string;
}

export interface KafkaOAuth2Auth {
  'kafka:oauth2:clientId'?: string;
  'kafka:oauth2:clientSecret'?: string;
  'kafka:oauth2:tenantId'?: string;
  'kafka:oauth2:scope'?: string;
  secretName?: string;
}
