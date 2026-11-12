import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { managementContextPath } from '../../../config/api.config';
import { OntologyDetails, OntologySummary } from '../model/ontology';

@Injectable()
export class OntologyManagementService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${managementContextPath}/v1alpha/ontologies`;

  getOntologies() {
    return this.#http.get<OntologySummary[]>(this.#baseUrl);
  }

  getOntology(id: string) {
    return this.#http.get<OntologyDetails>(`${this.#baseUrl}/${encodeURIComponent(id)}`);
  }
}
