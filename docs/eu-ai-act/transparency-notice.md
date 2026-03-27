# Avis de transparence IA — Yuni AI

Conformement au Reglement EU sur l'Intelligence Artificielle (AI Act)

## Classification

Yuni AI est classe "Systeme IA a risque limite" (Article 52 EU AI Act).

## Ce que fait Yuni AI

- Recommande des activites et lieux locaux bases sur les interets declares
- Analyse la vitalite des quartiers a partir de donnees agregees
- Genere du contenu marketing pour les commercants locaux
- Prevoit l'affluence dans les zones urbaines
- Genere des quetes urbaines ludiques pour l'engagement citoyen

## Ce que Yuni AI ne fait pas

- Ne prend pas de decisions affectant des droits fondamentaux
- Ne classe pas des personnes selon des criteres sensibles (origine, religion, etc.)
- N'accede jamais a des donnees personnelles identifiables
- Ne pratique pas de scoring social ou de surveillance
- N'utilise pas de reconnaissance faciale ou biometrique

## Auditabilite

Toutes les decisions IA sont tracees dans la Boite Noire Civile :
- Chaque recommandation, score de vitalite, analyse de sentiment
- Checksum SHA-256 sur chaque enregistrement (integrite verifiable)
- Chaine d'audit consultable par les collectivites partenaires
- Endpoint : `GET /v1/civic/audit/{city}`

## Modeles IA utilises

| Modele | Fournisseur | Siege | Usage |
|--------|-------------|-------|-------|
| Mistral Large 2 | Mistral AI | Paris, France | Taches complexes (recommandations, chat) |
| Mistral Small | Mistral AI | Paris, France | Taches simples (sentiment, categorisation) |
| Whisper | OpenAI | San Francisco, USA | Transcription vocale (zero data retention) |
| Polly | AWS | Dublin, Irlande (eu-west-1) | Synthese vocale |

## Contact DPO

Pour toute question relative a vos donnees : [contact a definir par le CEO]

## Mise a jour

Ce document est mis a jour a chaque version majeure de Yuni AI.
Derniere mise a jour : v2.0.0 — Novembre 2026
