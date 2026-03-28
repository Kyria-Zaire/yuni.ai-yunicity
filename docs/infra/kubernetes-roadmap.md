# Kubernetes Roadmap — Yuni AI Phase 3

## Trigger de migration

Conditions declenchant la migration Railway → Kubernetes :

- [ ] > 10 000 users simultanes (latence P95 > 1.5s)
- [ ] Cout Railway > 500€/mois (Kubernetes devient rentable)
- [ ] Besoin de deploiements canary ou blue/green

## Architecture cible

- Cluster GKE ou OVH Managed Kubernetes (souverainete)
- Deployment yuni-ai : 3 replicas min, HPA max 20
- Redis : Redis Cluster (3 shards) ou Redis Cloud
- Qdrant : Qdrant Cloud Europe (deja prevu)
- Ingress : Nginx avec rate limiting L7
- Secrets : Kubernetes Secrets + Sealed Secrets

## Checklist pre-migration

- [ ] Supprimer tout etat en memoire (YuniAIMetrics → Redis TimeSeries)
- [ ] Tester session Redis avec 3 replicas (pas de sticky session)
- [ ] Configurer liveness + readiness probes (/health/ready)
- [ ] Helm chart cree et teste en staging
- [ ] HPA configure sur CPU > 70%
- [ ] Monitoring Prometheus + Grafana en place
