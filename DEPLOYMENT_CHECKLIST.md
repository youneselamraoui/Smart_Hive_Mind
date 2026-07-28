# Checklist de déploiement — Smart Hive Mind

## 1. Contrat ProofRegistry déployé et vérifié sur Sepolia

- [ ] Compiler avec `cd blockchain && npx hardhat compile --network sepolia`
- [ ] Déployer : `npx hardhat run scripts/deploy.js --network sepolia`
- [ ] Copier l'adresse du contrat dans `.env.production` → `CONTRACT_ADDRESS=0x...`
- [ ] Vérifier le code sur Etherscan (flatten + soumettre via le portail Sepolia)
- [ ] Tester l'ancrage : `curl http://localhost:4000/anchor -X POST -H 'Content-Type: application/json' -d '{"hash":"0xtest"}'`

> **Risque** : RPC Sepolia instable. Prévoir un fallback (Alchemy + Infura).

## 2. Wallet de production financé

- [ ] Créer un wallet dédié (ne pas réutiliser un wallet de dev)
- [ ] Ajouter la private key dans `.env.production` → `PRIVATE_KEY=0x...`
- [ ] Financer avec un faucet Sepolia (≥ 0.5 ETH) pour lancer les transactions
- [ ] Vérifier le solde : `cast balance --rpc-url $SEPOLIA_RPC_URL $ADDRESS`
- [ ] Ajouter une adresse de secours avec 0.1 ETH au cas où le wallet principal serait à court

> **Risque** : Faucets Sepolia souvent en pénurie. Prévoir plusieurs faucets ou un bridge Goerli→Sepolia.

## 3. Tests CI (branche main)

- [ ] Hardhat : `cd blockchain && npx hardhat test` → 0 échecs
- [ ] Backend : `cd backend && npm test` → 5 tests passent
- [ ] IA : `for d in ai-services/*/; do (cd "$d" && pytest); done` → 0 échecs
- [ ] Vérifier que GitHub Actions (ou équivalent) tourne sur la branche `main` et que le badge de status est vert

> **Note** : Si un test IA dépend d'un modèle distant, le mock doit être validé en CI.

## 4. Qualité et sécurité (SonarQube + Trivy)

- [ ] Scanner SonarQube : `sonar-scanner` → Quality Gate = **Passed**
- [ ] Image Docker : `trivy image smart-hive-backend:latest` → aucune vulnérabilité **CRITICAL** ou **HIGH**
- [ ] Même check pour les images IA : `trivy image smart-hive-ai-diagnostic:latest` (et predictive, decisionnel, conversational)
- [ ] Même check pour `nginx:alpine`, `mongo:7`, `louislam/uptime-kuma:1`, `grafana/loki:3.4`, `grafana/promtail:3.4`

> **Risque** : Les images IA (Python + ML) peuvent contenir des CVE dans les dépendances. Envisager un `.trivyignore` pour les faux positifs documentés.

## 5. Variables d'environnement

- [ ] Copier `.env.production.example` → `.env` sur le serveur
- [ ] Remplir **toutes** les variables (aucun secret vide)
- [ ] Lancer le check : `docker compose run --rm backend node src/config/validateEnv.js` → doit sortir avec code 0
- [ ] Variables critiques : `JWT_SECRET` (64+ caractères, généré via `openssl rand -hex 64`), `MONGO_URI` (avec auth si exposé), `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `CORS_ORIGIN`

## 6. Certificat SSL (Certbot)

- [ ] DNS pointé vers le serveur (voir étape 10)
- [ ] Lancer certbot une première fois : `docker compose -f docker-compose.prod.yml run --rm certbot`
- [ ] Vérifier le certificat : `docker compose -f docker-compose.prod.yml exec nginx nginx -t`
- [ ] Forcer un renouvellement à blanc pour valider la cron : `docker compose -f docker-compose.prod.yml run --rm certbot renew --dry-run`
- [ ] Vérifier les en-têtes de sécurité : `curl -sI https://smart-hive-mind.example.com | grep -i "strict-transport-security\|x-content-type-options\|x-frame-options"`

> **Risque** : Le rate‑limit de Let's Encrypt (5 certificats par domaine/semaine). Utiliser le staging (`--test-cert`) pendant les tests.

## 7. Sauvegarde MongoDB — test de restauration

- [ ] Exécuter une sauvegarde manuelle : `docker compose -f docker-compose.prod.yml exec cron-backup /usr/local/bin/backup.sh`
- [ ] Vérifier que l'archive apparaît dans `/backups` (volume `backup-data`)
- [ ] Télécharger l'archive depuis Backblaze B2 : `aws s3 cp s3://mon-bucket/backups/mongodb_*.tar.gz . --endpoint-url $B2_ENDPOINT`
- [ ] Restaurer dans une BDD de test : `tar -xzf mongodb_*.tar.gz && mongorestore --drop "mongodb://localhost:27017/smart-hive-mind-restore" mongodb_*/`
- [ ] Vérifier que les collections et les documents sont intacts (même nombre de documents, mêmes index)
- [ ] Nettoyer la BDD de test : `mongosh "mongodb://localhost:27017" --eval "db.getSiblingDB('smart-hive-mind-restore').dropDatabase()"`

> **Note** : La fenêtre de la cron est 03:00. S'assurer que le serveur ne redémarre pas à ce moment-là (apt upgrades, etc.).

## 8. Monitoring Uptime‑Kuma actif

- [ ] Accéder à `http://<IP>:3001` et créer le compte admin
- [ ] Ajouter les monitors suivants :

| Monitor | URL | Intervalle |
|---------|-----|------------|
| Backend | `http://backend:3000/api/dashboard/summary` | 60s |
| IA Diagnostic | `http://ai-diagnostic:8000/health` | 60s |
| IA Prédictif | `http://ai-predictive:8000/health` | 60s |
| IA Décisionnel | `http://ai-decisionnel:8000/health` | 60s |
| IA Conversationnel | `http://ai-conversational:8000/health` | 60s |
| Blockchain Service | `http://blockchain-service:4000/verify/0xtest` | 60s |
| Certificat SSL | `https://smart-hive-mind.example.com` (resolves) | 5min |

- [ ] Configurer au moins une notification (email SMTP ou webhook Slack/Discord)
- [ ] Tester la notification : cliquer "Test Notification" dans Uptime‑Kuma
- [ ] Rebooter un service (ex: `docker compose stop backend`) → l'alerte doit arriver en < 5 min

> **Risque** : Si tous les monitors partagent le même intervalle, les alertes peuvent submerger. Échelonner les intervalles.

## 9. Test de bout en bout manuel

- [ ] **Créer un compte** : POST `/api/auth/register` (email + mot de passe + nom) → reçoit un JWT
- [ ] **Publier un document** : POST `/api/publications` avec un fichier (via form‑data) → reçoit un `_id` et un `hash` blockchain
- [ ] **Vérifier l'ancrage réel sur Etherscan** : ouvrir `https://sepolia.etherscan.io/tx/${txHash}` et confirmer que la transaction est visible
- [ ] **Obtenir une évaluation IA réelle** : POST `/api/publications/:id/evaluate` → vérifier que le diagnostic (IA diagnostic) retourne un score et un rapport non vide
- [ ] **Vérifier les logs Loki** : `curl http://localhost:3100/loki/api/v1/query_range?query={service="backend"}` → les logs des requêtes précédentes doivent apparaître
- [ ] **Vérifier le tableau de bord** : GET `/api/dashboard/summary` → les métriques agrégées sont cohérentes

> **Acceptance** : Documenter les valeurs attendues vs réelles dans cette checklist même. Si un champ est vide ou un service retourne 500, la mise en production est bloquée.

## 10. DNS pointé — propagation vérifiée

- [ ] Ajouter un enregistrement A (ou AAAA si IPv6) pointant `<domaine>` → `<IP du serveur>`
- [ ] Vérifier la propagation :
  ```bash
  dig +short smart-hive-mind.example.com
  nslookup smart-hive-mind.example.com
  ```
- [ ] Vérifier le reverse (PTR) si besoin pour les logs et les emails :
  ```bash
  dig +short -x <IP>
  ```
- [ ] Vérifier que le sous-domaine wildcard n'est pas ouvert : `curl -v http://random.smart-hive-mind.example.com` → doit retourner une erreur (pas de serveur)
- [ ] Attendre le TTL (généralement 300s à 3600s), puis `curl -I https://smart-hive-mind.example.com` → HTTP 200 + TLS valide

> **Piège classique** : Le TTL peut être long si l'enregistrement a déjà été créé en dev. Le réduire à 60s avant le déploiement, puis le remonter à 3600s une fois la propagation confirmée.

---

## Récapitulatif des alias / commandes utiles

```bash
alias dcp="docker compose -f docker-compose.prod.yml"
alias dcp-logs="dcp logs -f --tail=100"
alias dcp-exec="dcp exec"
alias dcp-run="dcp run --rm"
```

| Commande | Usage |
|----------|-------|
| `dcp up -d` | Démarrer tout l'environnement |
| `dcp down` | Arrêter et nettoyer les conteneurs |
| `dcp pull` | Mettre à jour les images |
| `dcp restart <service>` | Redémarrer un service en particulier |
| `dcp logs <service>` | Voir les logs d'un service |
| `dcp exec mongo mongosh` | Console MongoDB |
| `dcp exec cron-backup backup.sh` | Lancer une sauvegarde manuelle |
