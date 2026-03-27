# Release Checklist — Yuni AI v1.1.0

## Actions techniques (automatisees)

- [x] 225 tests verts (pytest)
- [x] mypy strict 45 fichiers — 0 erreur
- [x] ruff check — 0 warning
- [x] pip-audit — 0 CVE critique
- [x] Audit securite : 0 secret hardcode, guards webhook presents
- [x] Audit PII : 0 donnee personnelle dans les logs
- [x] JWT sur tous les endpoints sensibles
- [x] CHANGELOG complet Sprint 0 a Sprint 4

## Actions humaines OBLIGATOIRES avant prod

- [ ] **DPA Mistral AI signe**
  - https://mistral.ai/terms/data-processing-agreement
  - Obligatoire RGPD pour traitement de donnees personnelles

- [ ] **DPA Railway signe ou verification conformite RGPD**
  - Verifier si Railway EU region disponible
  - Documenter la localisation des donnees

- [ ] **RAILWAY_TOKEN_PROD cree et ajoute dans GitHub Secrets**
  - GitHub > Settings > Secrets > Actions
  - Nom : `RAILWAY_TOKEN_PROD`

- [ ] **Variables d'env prod configurees dans Railway dashboard**
  - Reference : `infra/environments/prod.env.template`
  - Verifier chaque variable une par une

- [ ] **ANONYMIZATION_SALT genere et stocke de facon permanente**
  - Generer : `python -c "import secrets; print(secrets.token_hex(32))"`
  - CRITIQUE : si ce sel change, tous les caches et hashs sont invalides
  - Stocker dans un gestionnaire de secrets (pas uniquement Railway)

- [ ] **JWT_PUBLIC_KEY de Yunicity prod recuperee**
  - Cle publique RSA au format PEM
  - Coordonner avec l'equipe backend Yunicity

- [ ] **Stripe webhook URL configuree sur dashboard.stripe.com**
  - URL : `https://yuni-ai.up.railway.app/v1/webhooks/stripe`
  - Events a activer :
    - `customer.subscription.created`
    - `customer.subscription.deleted`
    - `customer.subscription.updated`
    - `customer.subscription.paused`
    - `invoice.payment_failed`

- [ ] **Test paiement 3D Secure effectue en recette**
  - Carte test : `4000 0000 0000 3220`
  - Montant test : 0.01 EUR
  - Verifier webhook recu et statut mis a jour

- [ ] **Qdrant Cloud EU cree et QDRANT_URL configure**
  - Qdrant Cloud (cluster Europe) ou Railway Qdrant service
  - QDRANT_API_KEY genere et configure

- [ ] **Pre-computation Qdrant lancee sur donnees Reims reelles**
  - `make seed-qdrant` avec `YUNI_ENV=prod`
  - Verifier que les collections sont remplies

- [ ] **Monitoring Railway alertes configurees**
  - CPU > 80% pendant 5 min → Scale up
  - Memory > 85% → Alert + Scale up
  - Response time P95 > 1s → Alert critique
  - Error rate > 1% → Alert critique

- [ ] **Rollback teste**
  - `railway rollback --service yuni-ai-prod`
  - Verifier que le service revient a la version precedente

## Procedure de release

```bash
# 1. Merge develop → main (via PR avec review)
git checkout main
git merge develop

# 2. Creer le tag
git tag -a v1.1.0 -m "Yuni AI v1.1.0 — Production release"
git push origin v1.1.0

# 3. Le workflow deploy-prod.yml se declenche automatiquement
# 4. Approuver le deploy dans GitHub Actions (environment: production)
# 5. Verifier les smoke tests
# 6. Surveiller 5 min post-deploy via le workflow
```

## Post-deploy (premieres 48h)

- [ ] Cache hit rate >= 70% (verifier via GET /internal/metrics)
- [ ] Latence P95 /recommend < 800ms
- [ ] Latence P95 /chat < 3s
- [ ] Error rate < 1%
- [ ] Cout Mistral < 20 EUR/jour
- [ ] Score vitalite Reims Centre calcule (reference initiale)
