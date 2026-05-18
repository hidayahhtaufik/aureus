# Aureus Production Deployment Runbook

Deploys the TalosFacilitator service to a Linux VPS behind Nginx + Let's Encrypt.

**Target host:** Ubuntu 24.04 / Debian 12, Docker installed, Nginx + certbot already configured (matching the existing `auranode.xyz` setup pattern).

**Target subdomain:** `aureus.auranode.xyz` (configurable).

---

## 1. DNS — set A record

In the auranode.xyz DNS panel (Cloudflare / etc):

```
Type: A
Name: aureus
Content: <VPS-public-IPv4>
Proxy: DNS only (gray cloud) for first cert issuance — can flip to proxied after
TTL:  Auto / 300
```

Verify:

```bash
dig +short aureus.auranode.xyz
# should print the VPS IP
```

Wait until propagation completes before requesting a cert.

---

## 2. Pull the repo on the VPS

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/hidayahhtaufik/aureus.git
sudo chown -R $USER:$USER aureus
cd aureus
```

---

## 3. Configure the wallet (.env on the server)

```bash
cd /var/www/aureus/facilitator
cp .env.example .env
nano .env
```

Set, at minimum:

```bash
PORT=8402
ARC_RPC_URL=https://rpc.testnet.arc.network
FACILITATOR_PRIVATE_KEY=0x<your-fresh-testnet-wallet-pk>
```

> ⚠️ Use a **fresh wallet** dedicated to the public facilitator. Fund it
> with testnet USDC at https://faucet.circle.com (Arc Testnet). Never reuse
> your personal main wallet's private key.

---

## 4. Build + run the container

From the repo root:

```bash
cd /var/www/aureus
sudo docker compose up -d --build
```

Verify:

```bash
sudo docker ps | grep aureus-facilitator
sudo docker logs aureus-facilitator | tail -30
curl -s http://127.0.0.1:8402/health
curl -s http://127.0.0.1:8402/supported | head -c 500
```

Expected: `{"ok":true,"timestamp":...}` from `/health`.

---

## 5. Add the Nginx server block

```bash
# Copy the config
sudo cp /var/www/aureus/deploy/aureus.auranode.xyz.conf \
        /etc/nginx/sites-available/aureus.auranode.xyz

# Enable
sudo ln -sf /etc/nginx/sites-available/aureus.auranode.xyz \
            /etc/nginx/sites-enabled/aureus.auranode.xyz

# Test config syntax
sudo nginx -t
```

> The shipped config references SSL paths under
> `/etc/letsencrypt/live/aureus.auranode.xyz/...` which don't exist yet.
> `sudo nginx -t` will fail at this stage — that's expected.
> Either temporarily comment those lines, OR run certbot first
> (it can issue + install in one step):

```bash
# Option A (recommended): let certbot issue + auto-edit the config
# Temporarily delete the symlink, re-run with HTTP-only first, then certbot.

# Quickest path:
sudo rm /etc/nginx/sites-enabled/aureus.auranode.xyz
sudo certbot certonly --nginx -d aureus.auranode.xyz \
    --non-interactive --agree-tos -m hello@auranode.xyz

# Now the cert exists. Re-enable the site config.
sudo ln -sf /etc/nginx/sites-available/aureus.auranode.xyz \
            /etc/nginx/sites-enabled/aureus.auranode.xyz
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Smoke test from the public internet

```bash
curl -i https://aureus.auranode.xyz/
curl -s https://aureus.auranode.xyz/supported | jq
curl -s https://aureus.auranode.xyz/health | jq
```

Expected:
- `GET /` returns project info JSON
- `GET /supported` returns `{ kinds: [{ scheme: "exact", network: "eip155:5042002", ... }] }`
- `GET /health` returns `{ ok: true, ... }`

---

## 7. Live end-to-end test

From your laptop:

```bash
cd ~/Desktop/Project/Arc/aureus/facilitator

# Point the test at the public facilitator
FACILITATOR_URL=https://aureus.auranode.xyz npm run send
```

A new on-chain `transferWithAuthorization` should land on Arc Testnet.
Open `https://testnet.arcscan.app/tx/<hash>` to verify.

---

## 8. Updating later

```bash
cd /var/www/aureus
git pull origin master
sudo docker compose up -d --build
sudo docker logs -f aureus-facilitator
```

---

## 9. Monitoring (optional)

Watch logs:

```bash
sudo docker logs -f aureus-facilitator
sudo tail -f /var/log/nginx/aureus.access.log
```

Container resource usage:

```bash
sudo docker stats aureus-facilitator
```

Wallet balance (the public facilitator pays gas in USDC):

```bash
# Replace with your facilitator wallet address
cast call 0x3600000000000000000000000000000000000000 \
  "balanceOf(address)(uint256)" 0xYourFacilitatorAddress \
  --rpc-url https://rpc.testnet.arc.network
```

Top up at https://faucet.circle.com when running low.

---

## 10. Cert auto-renewal

Already handled by certbot's systemd timer (same as your existing certs):

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

Renewal is automatic; no further action needed for `aureus.auranode.xyz`.
