# Architecture Yuni AI — Vue d'ensemble

## Couches applicatives

```
┌─────────────────────────────────────────────────┐
│            COUCHE D'ENTREE                      │
│  APIs REST (FastAPI) + WebSocket Voice           │
│  Auth JWT + API Keys partenaires                 │
│  Rate limiting + CORS + Security headers         │
├─────────────────────────────────────────────────┤
│            COUCHE IA                            │
│  Mistral Large 2 (taches complexes)              │
│  Mistral Small (taches simples — cout ÷15)       │
│  OpenAI Whisper (STT) + AWS Polly (TTS)          │
│  Router intelligent Large/Small                  │
├─────────────────────────────────────────────────┤
│            COUCHE MEMOIRE                       │
│  Redis (cache exact + sessions + config)         │
│  Qdrant (recherche semantique + cache v2)        │
├─────────────────────────────────────────────────┤
│            COUCHE DONNEES                       │
│  APIs Yunicity (jamais d'acces direct DB)         │
│  City Registry (config dynamique multi-villes)   │
│  Federation EU (partage ODBL inter-villes)       │
├─────────────────────────────────────────────────┤
│            COUCHE CONFORMITE                    │
│  Boite Noire Civile (audit trail immuable)       │
│  RGPD (anonymisation, consentement, TTL)         │
│  EU AI Act (transparence, explicabilite)         │
│  Protocole civique ODBL (open data)              │
└─────────────────────────────────────────────────┘
```

## Flux principal — Recommandation

1. Citoyen envoie une requete via app mobile
2. FastAPI valide JWT + verifie rollout ville
3. Cache exact Redis (< 5ms si hit)
4. Cache semantique Qdrant (si similarity > 0.92)
5. Si miss : recherche Qdrant → reranking → Mistral Large
6. Resultat mis en cache (Redis + Qdrant)
7. XP attribue (fire-and-forget)
8. Decision enregistree dans Boite Noire Civile

## Points de souverainete

- **Modele IA** : Mistral AI (Paris, France)
- **Hebergement** : Railway EU (migration OVH possible)
- **Donnees** : jamais d'acces direct aux bases Yunicity
- **Anonymisation** : SHA-256 des la collecte
- **Protocole ouvert** : ODBL pour interoperabilite EU
