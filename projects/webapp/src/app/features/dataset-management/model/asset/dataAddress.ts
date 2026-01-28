import { BaseAuth } from './baseAuth';
import { KafkaOAuth2Auth, KafkaSaslAuth, KafkaSslAuth } from './kafkaAuth';
import { Oauth2 } from './oauth2';

export interface BaseDataAddress {
  '@type'?: string;
  type: string;
  baseUrl: string;
  path?: string;
  queryParams?: string;
  proxyPath: string;
  proxyQueryParams: string;
}

export interface KafkaDataAddress {
  '@type'?: string;
  type: 'Kafka';
  'kafka.bootstrap.servers': string;
  topic: string;
  'security.protocol'?: string;
  'sasl.mechanism'?: string;
  'sasl.jaas.config'?: string;
  tls_ca_secret?: string;
  tls_client_cert?: string;
  tls_client_key?: string;
}

export type BaseDataHeaders = Record<`header${string}`, string>;

export type HttpDataAddress = BaseDataAddress &
  BaseDataHeaders &
  Partial<BaseAuth> &
  Partial<Oauth2>;
export type KafkaCompleteDataAddress = KafkaDataAddress &
  Partial<KafkaSaslAuth> &
  Partial<KafkaSslAuth> &
  Partial<KafkaOAuth2Auth>;

export type DataAddress = HttpDataAddress | KafkaCompleteDataAddress;
