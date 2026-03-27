# Protocole Yuni AI Civic Data

## Vision

Format ouvert pour l'echange de donnees civiques agregees entre villes europeennes.
Compatible avec les standards INSPIRE (EU), DCAT-AP, ODbL.

## Format d'export

- **JSON** : `CivicDataExport` — schema Pydantic valide
- **CSV** : export tabulaire des zones de vitalite
- **Licence** : ODbL-1.0 (Open Database License)

## Garanties RGPD

- Aucune donnee individuelle exportee
- Agregats uniquement (minimum 100 personnes par zone)
- Geographie approximative (bounding box, pas point exact)
- Compteurs arrondis a la centaine
- Licence ODbL : utilisation libre avec attribution

## Interoperabilite

| Standard | Compatibilite |
|----------|--------------|
| **data.gouv.fr** | Format DCAT-AP 2.1 compatible |
| **OpenStreetMap** | Zones geographiques referencees par bounding box |
| **Eurostat** | Metriques d'engagement civic standardisees |
| **INSPIRE** | Conforme aux principes de partage de donnees geospatiales EU |

## Endpoints API

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /v1/civic/export/{city}` | JWT | Export complet ODBL JSON |
| `GET /v1/civic/export/{city}/metadata` | Public | Metadonnees DCAT-AP |
| `POST /v1/civic/export/{city}/validate` | Admin | Validation RGPD |

## Partenaires cibles Phase 2

- Intercommunalites francaises (EPCI)
- Villes europeennes jumelles
- Agences de cohesion territoriale (ANCT)
- Observatoires territoriaux regionaux
