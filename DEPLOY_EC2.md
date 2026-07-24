# Deploying the ContextMesh backend to EC2

Coming from Railway, the mental shift is this: Railway gave you a build, a TLS
certificate, a hostname, restarts, and log retention. On EC2 you get a bare
Linux box. Everything else is yours to wire up. That is the point of doing it.

You need a domain name pointed at this instance before TLS will work. You cannot
get a certificate for a raw IP address, and TLS is not optional here — the CLI
sends its auth token as a bearer header on every request, so over plain HTTP
every user's JWT crosses the network in cleartext.

---

## 1. Launch the instance

AWS Console → EC2 → **Launch instance**.

| Setting | Value | Why |
|---|---|---|
| Name | `contextmesh-api` | |
| AMI | **Ubuntu Server 24.04 LTS** | Docker's apt repo targets it directly |
| Instance type | **t3.micro** | Free tier eligible for 12 months |
| Key pair | Create new, RSA, `.pem` | Downloads once — losing it means losing SSH access |
| Storage | 20 GB gp3 | Free tier allows up to 30 GB |

### Security group

Create a new one with exactly three inbound rules:

| Type | Port | Source | Why |
|---|---|---|---|
| SSH | 22 | **My IP** | Not `0.0.0.0/0`, or you invite every bot on the internet |
| HTTP | 80 | `0.0.0.0/0` | certbot's validation challenge, plus the redirect to HTTPS |
| HTTPS | 443 | `0.0.0.0/0` | Actual traffic |

**Do not open 8000.** The container will only listen on localhost, and nginx
will be the sole thing that talks to it. Opening 8000 would let people bypass
nginx and reach the app over unencrypted HTTP.

Launch it, then note the **Public IPv4 address**.

> The public IP changes on stop/start. Allocate an **Elastic IP** and associate
> it if you want it stable, which you do if DNS points at it.

---

## 2. Connect from Windows

`chmod` does not exist on Windows, so the usual `chmod 400 key.pem` advice
fails. SSH will refuse a key that other users can read, so fix the ACL instead:

```powershell
icacls "$HOME\Downloads\contextmesh-api.pem" /inheritance:r
icacls "$HOME\Downloads\contextmesh-api.pem" /grant:r "$($env:USERNAME):(R)"
```

Then connect:

```powershell
ssh -i "$HOME\Downloads\contextmesh-api.pem" ubuntu@YOUR_IP
```

Everything from here runs on the server.

---

## 3. Add swap before anything else

t3.micro has 1 GB of RAM. `pip install` on this dependency set can exhaust it
and get killed by the OOM reaper mid-build, which surfaces as a confusing
`Killed` with no explanation. Two GB of swap avoids it:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

The `fstab` line is what makes it survive a reboot.

---

## 4. Install Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
```

Let your user run Docker without `sudo`:

```bash
sudo usermod -aG docker ubuntu
newgrp docker
docker run --rm hello-world
```

---

## 5. Get the code

```bash
cd ~
git clone https://github.com/aryaniscoding/contextmesh.git
cd contextmesh/contextmesh-backend
```

---

## 6. Create the .env on the server

`.env` is gitignored, so it is deliberately not in the clone. Recreate it here.
Never commit it — the repo is public.

```bash
nano .env
```

These are the keys the app reads. Copy the values from your local
`contextmesh-backend/.env`:

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_JWT_SECRET=
GEMINI_API_KEY=
SECRET_KEY=
MASTER_CONTEXT_INTERVAL=1800
```

Two notes:

- **Leave `DEBUG` out.** It defaults to off, which is what production wants.
- **Skip `REDIS_URL`.** There is no Redis on this box. The app catches the
  connection failure and runs without caching, so this is a deliberate
  omission, not a mistake. Every master-context read will hit Postgres.

Lock it down so only your user can read it:

```bash
chmod 600 .env
```

---

## 7. Build and run

```bash
docker build -t contextmesh-backend .
```

The `.dockerignore` keeps the 228 MB local `venv/` and your `.env` out of the
image. Secrets get injected at runtime instead, so they never end up in an
image layer.

```bash
docker run -d \
  --name contextmesh \
  --restart unless-stopped \
  --env-file .env \
  -p 127.0.0.1:8000:8000 \
  contextmesh-backend
```

Two flags worth understanding:

- `--restart unless-stopped` is what replaces Railway's automatic restarts. It
  covers both crashes and instance reboots.
- `-p 127.0.0.1:8000:8000` binds to loopback only. Plain `-p 8000:8000` would
  publish the port on every interface, and Docker writes iptables rules that
  bypass your security group, so the app would be publicly reachable over HTTP
  even with 8000 closed in AWS. This is the single most common way people
  accidentally expose a container.

Confirm it works locally on the box:

```bash
curl localhost:8000/health          # -> {"status":"ok"}
docker ps                           # STATUS should reach (healthy)
docker logs contextmesh --tail 20
```

`(healthy)` comes from the `HEALTHCHECK` in the Dockerfile. If it says
`(unhealthy)`, the app is up but failing its own probe — check the logs.

---

## 8. Point DNS at the instance

At your registrar, create an **A record** for the subdomain you want, e.g.
`api.yourdomain.com`, pointing at the instance's public IP (the Elastic IP if
you allocated one).

Verify it resolves before continuing, or certbot will fail:

```bash
dig +short api.yourdomain.com
```

---

## 9. nginx in front

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/contextmesh
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # save_context does an embedding call plus LLM synthesis and can take
        # 30-60s. nginx defaults to a 60s read timeout, which would cut off
        # exactly the slowest real requests. The CLI itself waits 60s.
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }
}
```

Enable it and drop the default site, or the default will keep answering:

```bash
sudo ln -s /etc/nginx/sites-available/contextmesh /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10. TLS with certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Choose the redirect option so HTTP forwards to HTTPS. certbot rewrites the
nginx config, adds the certificate, and installs a systemd timer for renewal.

Check renewal is armed:

```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

Then verify from your own machine:

```powershell
curl https://api.yourdomain.com/health
```

---

## 11. What comes next

With the URL live, the three things that were blocked on it:

1. **CORS** — replace `allow_origins=["*"]` in `main.py` with the frontend
   origin. The wildcard is currently combined with `allow_credentials=True`,
   which browsers reject outright, so this is a correctness fix as well as a
   security one.
2. **CLI** — `backendUrl` is hardcoded to `http://localhost:8000` in
   `commands/_default.js`, with the same fallback in `mcp/api.js` and
   `utils/api.js`. Point them at the new URL and publish 1.0.5.
3. **Frontend** — build with `VITE_CONTEXTMESH_API=https://api.yourdomain.com`.
   Vite inlines it at build time, so it needs a rebuild, not just a restart.

---

## Redeploying

```bash
cd ~/contextmesh
git pull
cd contextmesh-backend
docker build -t contextmesh-backend .
docker stop contextmesh && docker rm contextmesh
docker run -d --name contextmesh --restart unless-stopped \
  --env-file .env -p 127.0.0.1:8000:8000 contextmesh-backend
```

There will be a few seconds of downtime between stop and run. That is the
tradeoff you accepted by leaving Railway. Once this is routine, that sequence
is the thing worth turning into a GitHub Actions workflow.

## Useful commands

```bash
docker logs -f contextmesh           # follow logs
docker stats contextmesh             # memory, useful on a 1GB box
docker exec -it contextmesh sh       # shell inside the container
sudo tail -f /var/log/nginx/error.log
free -h                              # confirm swap is active
```
