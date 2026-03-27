# Registre des traitements — Yuni AI

## Traitement : Recommandations IA personnalisees

### Responsable
- **Organisme** : Yunicity SAS
- **DPO** : A designer avant production
- **Sous-traitant technique** : Yuni AI (microservice)

### Donnees traitees

| Donnee | Forme stockee | Duree conservation | Base legale |
|--------|--------------|-------------------|-------------|
| user_id | SHA-256 hashe avec sel | Jamais stocke en cache | Pseudonymisation |
| Interets | Categories (sport, culture...) | 24h Redis (TTL) | Interet legitime |
| Geolocalisation | Tronquee a ~1km | 24h Redis (TTL) | Interet legitime |
| Points citoyens | Bucket de 100 pts | 24h Redis (TTL) | Interet legitime |
| Texte prompt IA | Non stocke | Temps de traitement | Interet legitime |

### Base legale
- Consentement explicite (Article 6.1.a RGPD)
- Capture lors de l'onboarding Yunicity
- Retrait possible a tout moment via DELETE /v1/ai/user-data/:hash

### Droits des personnes

| Droit | Implementation | Statut |
|-------|---------------|--------|
| Acces (Art. 15) | Donnees anonymes, non rattachables | Non applicable |
| Effacement (Art. 17) | DELETE /v1/ai/user-data/:hash | Operationnel |
| Portabilite (Art. 20) | Donnees pseudonymisees | Non applicable |
| Opposition (Art. 21) | Rollout flag = exclusion | Operationnel |
| Limitation (Art. 18) | TTL 24h auto-expire | Par conception |

### Sous-traitants

| Sous-traitant | Pays | DPA signe | Usage |
|--------------|------|-----------|-------|
| Mistral AI | France | A signer avant prod | Generation recommandations |
| Railway | USA | A verifier (clauses SCCs) | Hebergement recette/prod |
| Redis (Railway plugin) | USA | Couvert par Railway DPA | Cache applicatif |
| Qdrant | Allemagne | A signer avant prod | Recherche vectorielle |

### Mesures techniques

- Anonymisation par SHA-256 + sel des identifiants utilisateur
- Troncature geographique a 2 decimales (~1km)
- Cles de cache anonymes (pas de user_id dans la cle)
- TTL 24h sur toutes les donnees en cache
- Chiffrement en transit (TLS) pour toutes les communications
- Pas de stockage de donnees personnelles en clair
- Logs filtres (PII masquees via structlog processor)

### Registre des demandes de suppression

Chaque demande DELETE /v1/ai/user-data/:hash est loguee avec :
- Hash utilisateur masque (8 premiers caracteres)
- IP tronquee (3 premiers octets)
- Subject JWT (demandeur)
- Horodatage
- Resultat du traitement

Conservation du registre : 3 ans (obligation legale).
