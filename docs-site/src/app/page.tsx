import { DocsShell, type NavGroup } from "@/components/DocsShell";

export const dynamic = "force-static";

const NAV: NavGroup[] = [
  {
    label: "Getting started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "quickstart", label: "Quickstart" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "api", label: "API endpoints", badge: "v1" },
      { id: "sdk", label: "SDK (@auranode/x402-arc)", badge: "TS" },
      { id: "x402-spec", label: "x402 spec compliance" },
    ],
  },
  {
    label: "Operate",
    items: [
      { id: "deploy", label: "Deploy your own" },
      { id: "demo", label: "Live demo & tweet guide" },
    ],
  },
  {
    label: "Project",
    items: [
      { id: "roadmap", label: "Roadmap" },
      { id: "contributing", label: "Contributing" },
      { id: "resources", label: "Resources" },
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <Hero />
      <DocsShell groups={NAV}>
        <Overview />
        <Quickstart />
        <Api />
        <Sdk />
        <SpecCompliance />
        <Deploy />
        <Demo />
        <Roadmap />
        <Contributing />
        <Resources />
      </DocsShell>
    </>
  );
}

function Hero() {
  return (
    <section
      style={{
        padding: "clamp(48px, 6vw, 80px) clamp(20px, 4vw, 56px) clamp(24px, 3vw, 40px)",
        borderBottom: "1px solid var(--c-border)",
        background:
          "linear-gradient(180deg, #FBF7EE 0%, var(--c-bg) 100%)",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--c-ink-dim)",
            marginBottom: 12,
          }}
        >
          🜚 Aureus Docs · x402 on Arc · Open Protocol
        </div>
        <h1>Build agent-paid HTTP APIs on Arc Network</h1>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: "clamp(15px, 1.5vw, 18px)",
            color: "var(--c-ink-dim)",
            maxWidth: "62ch",
            lineHeight: 1.6,
          }}
        >
          <strong>x402</strong> is HTTP <code>402 Payment Required</code> revived for
          the agentic-internet era — every API call carries a signed micropayment in
          its headers. <strong>TalosFacilitator</strong> is the first community x402
          facilitator for Arc Network, signing + settling EIP-3009 USDC transfers
          with sub-second BFT finality.
        </p>
        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Badge label="Public facilitator" value="aureus.auranode.xyz" href="https://aureus.auranode.xyz" />
          <Badge label="Network" value="Arc Testnet 5042002" href="https://docs.arc.network" />
          <Badge label="License" value="MIT" />
          <Badge label="Status" value="Live" tone="success" />
        </div>
      </div>
    </section>
  );
}

function Badge({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: string;
  href?: string;
  tone?: "success";
}) {
  const body = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 999,
        border: "1px solid var(--c-border)",
        background: tone === "success" ? "#dff5e9" : "var(--c-surface)",
        color: tone === "success" ? "#1f7a4d" : "var(--c-ink-dim)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.05em",
      }}
    >
      <span style={{ color: "var(--c-ink-faint)" }}>{label}</span>
      <span style={{ color: "var(--c-ink)" }}>{value}</span>
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
      {body}
    </a>
  ) : (
    body
  );
}

function Overview() {
  return (
    <section id="overview" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>1. Overview</SectionLabel>
      <p>
        Aureus implements the <a href="https://github.com/x402-foundation/x402" target="_blank" rel="noreferrer">x402 protocol</a>{" "}
        on Circle's Arc Network. The repo ships three pieces:
      </p>
      <ul>
        <li><strong>TalosFacilitator</strong> — Hono server with <code>/verify</code>, <code>/settle</code>, <code>/supported</code></li>
        <li><strong>@auranode/x402-arc</strong> — shared SDK (EIP-712 + EIP-3009 + payment envelope codec)</li>
        <li><strong>Buyer + seller examples</strong> — Node agent + Express server demonstrating the full HTTP-402 loop</li>
      </ul>
      <h3>Why x402 on Arc?</h3>
      <p>
        Arc's stablecoin-native gas (USDC), sub-second Malachite BFT finality, and
        ~$0.002 average tx fee make it the first L1 where <em>per-API-call</em>
        micropayments are economically viable at machine speed.
      </p>
    </section>
  );
}

function Quickstart() {
  return (
    <section id="quickstart" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>2. Quickstart</SectionLabel>
      <p>Run the whole stack locally in 90 seconds. Requires Node ≥ 20 + Arc Testnet USDC.</p>
      <h3>Install</h3>
      <pre><code>{`git clone https://github.com/hidayahhtaufik/aureus.git
cd aureus
npm install`}</code></pre>
      <h3>Boot the facilitator</h3>
      <pre><code>{`cd facilitator
cp .env.example .env
# Edit .env: set FACILITATOR_PRIVATE_KEY
npm run dev    # → http://localhost:8402`}</code></pre>
      <h3>Verify it's live</h3>
      <pre><code>{`curl -s http://localhost:8402/health           # {"ok":true,...}
curl -s http://localhost:8402/supported | jq   # supported networks list`}</code></pre>
      <h3>Boot the seller (in another terminal)</h3>
      <pre><code>{`cd examples/seller
cp .env.example .env
# Set SELLER_ADDRESS to your payout wallet
npm run dev    # → http://localhost:8403`}</code></pre>
      <h3>Run the buyer (in a third terminal)</h3>
      <pre><code>{`cd examples/buyer
cp .env.example .env
# Set BUYER_PRIVATE_KEY to a wallet with Arc Testnet USDC
npm run buy`}</code></pre>
      <p>
        You'll see the full loop: GET → 402 → sign → retry → 200 + tx hash on Arc.
        Tx confirms in &lt; 1 second.
      </p>
    </section>
  );
}

function Api() {
  return (
    <section id="api" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>3. API endpoints</SectionLabel>
      <p>The facilitator exposes four endpoints per the x402 reference shape.</p>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>GET</code></td><td><code>/</code></td><td>Service info JSON</td></tr>
          <tr><td><code>GET</code></td><td><code>/health</code></td><td>Liveness probe</td></tr>
          <tr><td><code>GET</code></td><td><code>/supported</code></td><td>CAIP-2 networks + asset metadata</td></tr>
          <tr><td><code>POST</code></td><td><code>/verify</code></td><td>10-step verification of a payment payload (signature, balance, nonce, time, amount, domain, …)</td></tr>
          <tr><td><code>POST</code></td><td><code>/settle</code></td><td>Verify + broadcast <code>USDC.transferWithAuthorization</code> on Arc</td></tr>
        </tbody>
      </table>
      <h3>Sample <code>/supported</code> response</h3>
      <pre><code>{`{
  "kinds": [
    {
      "x402Version": 1,
      "scheme": "exact",
      "network": "eip155:5042002",
      "extra": {
        "name": "Arc Testnet",
        "asset": {
          "address": "0x3600000000000000000000000000000000000000",
          "decimals": 6,
          "symbol": "USDC",
          "eip712": { "name": "USDC", "version": "2" }
        }
      }
    }
  ]
}`}</code></pre>
    </section>
  );
}

function Sdk() {
  return (
    <section id="sdk" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>3.1 SDK · @auranode/x402-arc</SectionLabel>
      <p>
        Shared primitives used by the facilitator, seller middleware, and buyer
        client. Tree-shakeable, zero Forum/Aureus-specific imports — drop into any
        Node project. Available on npm post-v0.1 release.
      </p>
      <pre><code>{`// Buyer
import { signPayment } from "@auranode/x402-arc/client";

const payment = await signPayment({
  privateKey,
  network: "eip155:5042002",
  asset: ARC_USDC,
  payTo,
  value: "10000",            // 0.01 USDC base units
  validBefore: Date.now()/1000 + 600,
});

const res = await fetch(sellerUrl, {
  headers: { "X-PAYMENT": btoa(JSON.stringify(payment)) },
});`}</code></pre>
      <pre><code>{`// Seller (Express)
import { x402 } from "@auranode/x402-arc/server";

app.get("/api/weather", x402({
  facilitatorUrl: "https://aureus.auranode.xyz",
  priceUsdc: "0.01",
  payTo: process.env.SELLER_ADDRESS!,
}), (req, res) => {
  res.json({ city: "Jakarta", temp: 31 });
});`}</code></pre>
    </section>
  );
}

function SpecCompliance() {
  return (
    <section id="x402-spec" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>3.2 x402 spec compliance</SectionLabel>
      <p>Aureus targets the <a href="https://github.com/x402-foundation/x402" target="_blank" rel="noreferrer">x402-foundation/x402</a> reference spec v1.</p>
      <table>
        <thead>
          <tr><th>Capability</th><th>Status</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>HTTP 402 + paymentRequirements body</td><td>✅</td><td>seller middleware</td></tr>
          <tr><td><code>X-PAYMENT</code> header (base64 JSON)</td><td>✅</td><td>verifier + client</td></tr>
          <tr><td><code>X-PAYMENT-RESPONSE</code> on success</td><td>✅</td><td>tx hash + arcscan URL</td></tr>
          <tr><td>Scheme: <code>exact</code></td><td>✅</td><td>EIP-3009 path</td></tr>
          <tr><td>Network: CAIP-2 <code>eip155:&lt;chainId&gt;</code></td><td>✅</td><td><code>eip155:5042002</code></td></tr>
          <tr><td><code>GET /supported</code> kinds list</td><td>✅</td><td>Arc Testnet + USDC</td></tr>
          <tr><td><code>POST /verify</code></td><td>✅</td><td>10-step chain</td></tr>
          <tr><td><code>POST /settle</code></td><td>✅</td><td>simulate → broadcast → wait receipt</td></tr>
          <tr><td>Scheme: <code>upTo</code> (range pricing)</td><td>⏳</td><td>v0.2</td></tr>
          <tr><td>Multi-asset (EURC, USYC)</td><td>⏳</td><td>v0.2</td></tr>
          <tr><td>Mainnet Arc</td><td>⏳</td><td>blocked on Arc mainnet GA</td></tr>
        </tbody>
      </table>
      <p>
        Status reports the v0.1 shipped surface. v0.2 milestones land in the{" "}
        <a href="#roadmap">roadmap</a>.
      </p>
    </section>
  );
}

function Deploy() {
  return (
    <section id="deploy" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>4. Deploy your own facilitator</SectionLabel>
      <p>
        Full step-by-step runbook is at{" "}
        <a href="https://github.com/hidayahhtaufik/aureus/blob/master/deploy/DEPLOYMENT.md" target="_blank" rel="noreferrer">
          deploy/DEPLOYMENT.md
        </a>{" "}
        — Docker, Nginx, Let's Encrypt, certbot auto-renewal.
      </p>
      <h3>TL;DR on a Linux VPS</h3>
      <pre><code>{`# Pull the repo
sudo git clone https://github.com/hidayahhtaufik/aureus.git /var/www/aureus
cd /var/www/aureus/facilitator
cp .env.example .env
# Set FACILITATOR_PRIVATE_KEY (fund the wallet at faucet.circle.com)
cd ..
sudo docker compose up -d --build

# Then add the Nginx site + cert per the runbook
sudo certbot --nginx -d aureus.yourdomain.com`}</code></pre>
    </section>
  );
}

function Demo() {
  return (
    <section id="demo" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>5. Live demo & tweet guide</SectionLabel>
      <p>
        Full demo script + tweet thread template at{" "}
        <a href="https://github.com/hidayahhtaufik/aureus/blob/master/docs/DEMO.md" target="_blank" rel="noreferrer">
          docs/DEMO.md
        </a>.
      </p>
      <h3>30-second smoke against the public facilitator</h3>
      <pre><code>{`curl -i  https://aureus.auranode.xyz/
curl -s  https://aureus.auranode.xyz/health | jq
curl -s  https://aureus.auranode.xyz/supported | jq`}</code></pre>
      <h3>2-minute end-to-end</h3>
      <ol>
        <li>Start <code>examples/seller</code> with <code>FACILITATOR_URL=https://aureus.auranode.xyz</code>.</li>
        <li>Run <code>examples/buyer</code> against the seller.</li>
        <li>Open the printed <code>arcscan</code> URL — verify the on-chain settlement.</li>
        <li>Tweet the four screenshots from the template in DEMO.md.</li>
      </ol>
    </section>
  );
}

function Roadmap() {
  return (
    <section id="roadmap" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>6. Roadmap</SectionLabel>
      <h3>v0.1 — shipped ✅</h3>
      <ul>
        <li>TalosFacilitator service + 36 unit tests</li>
        <li>Foundry probes verifying EIP-3009 on Arc USDC</li>
        <li>Buyer + seller examples</li>
        <li>Production deploy: <a href="https://aureus.auranode.xyz" target="_blank" rel="noreferrer">aureus.auranode.xyz</a></li>
        <li>Docker + Nginx + certbot runbook</li>
      </ul>
      <h3>v0.2 — Circle Grant scope</h3>
      <ul>
        <li><strong>Tessera</strong> — programmable USDC spending policies (per-call cap, daily budget, allowlist)</li>
        <li><strong>Honos</strong> — decaying-bond agent reputation, pledgeable + slashable</li>
        <li><strong>Acta</strong> — semantic action receipts: <code>intent → outcome</code> chain</li>
      </ul>
      <h3>v0.3 — ecosystem</h3>
      <ul>
        <li><code>@auranode/x402-arc</code> SDK on npm</li>
        <li>Upstream PR to <code>x402-foundation/x402</code> adding Arc</li>
        <li>Express/Fastify/Hono/Bun middleware libraries</li>
        <li>Buyer <code>fetch</code> wrapper that auto-pays 402s</li>
      </ul>
    </section>
  );
}

function Contributing() {
  return (
    <section id="contributing" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>7. Contributing</SectionLabel>
      <p>
        See <a href="https://github.com/hidayahhtaufik/aureus/blob/master/CONTRIBUTING.md" target="_blank" rel="noreferrer">CONTRIBUTING.md</a>{" "}
        for ground rules + setup. Good first PRs:
      </p>
      <ul>
        <li>Edge-case tests in <code>facilitator/test/verifier.test.ts</code></li>
        <li>Seller middleware for a new framework (Fastify, Hono, Bun)</li>
        <li>Documentation typos, missing context, broken commands</li>
      </ul>
      <p>
        Security disclosures: email <code>hello@auranode.xyz</code>. Don't open public issues for vulnerabilities.
      </p>
    </section>
  );
}

function Resources() {
  const resources = [
    {
      label: "GitHub",
      desc: "hidayahhtaufik/aureus — repo, issues, PRs, releases",
      kind: "REPO",
      href: "https://github.com/hidayahhtaufik/aureus",
    },
    {
      label: "README.md",
      desc: "Hero, badges, quickstart, deploy, roadmap",
      kind: "GUIDE",
      href: "https://github.com/hidayahhtaufik/aureus/blob/master/README.md",
    },
    {
      label: "DEPLOYMENT.md",
      desc: "Step-by-step VPS production runbook (Docker · Nginx · Let's Encrypt)",
      kind: "GUIDE",
      href: "https://github.com/hidayahhtaufik/aureus/blob/master/deploy/DEPLOYMENT.md",
    },
    {
      label: "ARCHITECTURE.md",
      desc: "Verifier + settler design, EIP-3009 path, threat model",
      kind: "GUIDE",
      href: "https://github.com/hidayahhtaufik/aureus/blob/master/docs/ARCHITECTURE.md",
    },
    {
      label: "DEMO.md",
      desc: "Live test script + tweet thread template",
      kind: "GUIDE",
      href: "https://github.com/hidayahhtaufik/aureus/blob/master/docs/DEMO.md",
    },
    {
      label: "X402_UPSTREAM_PR.md",
      desc: "How to open a PR on x402-foundation/x402 adding Arc as a network",
      kind: "GUIDE",
      href: "https://github.com/hidayahhtaufik/aureus/blob/master/docs/X402_UPSTREAM_PR.md",
    },
    {
      label: "Public facilitator",
      desc: "aureus.auranode.xyz — health · /supported · /verify · /settle",
      kind: "LIVE",
      href: "https://aureus.auranode.xyz",
    },
    {
      label: "x402 spec",
      desc: "x402-foundation/x402 — the protocol Aureus implements",
      kind: "EXTERNAL",
      href: "https://github.com/x402-foundation/x402",
    },
    {
      label: "Arc Network",
      desc: "Circle's stablecoin-native L1 — docs, RPC, faucet",
      kind: "EXTERNAL",
      href: "https://docs.arc.network",
    },
    {
      label: "Circle USDC faucet",
      desc: "Claim Arc Testnet USDC to fund your facilitator wallet",
      kind: "EXTERNAL",
      href: "https://faucet.circle.com",
    },
    {
      label: "Arcscan",
      desc: "Arc Testnet block explorer — verify every settled payment",
      kind: "EXTERNAL",
      href: "https://testnet.arcscan.app",
    },
    {
      label: "Circle Developer Grants",
      desc: "circle.com/grant — milestone-based USDC funding program",
      kind: "EXTERNAL",
      href: "https://www.circle.com/grant",
    },
  ];
  return (
    <section id="resources" style={{ scrollMarginTop: 96 }}>
      <SectionLabel>8. Resources</SectionLabel>
      <div
        style={{
          marginTop: 14,
          borderRadius: 14,
          border: "1px solid var(--c-border)",
          background: "var(--c-surface)",
          overflow: "hidden",
        }}
      >
        {resources.map((r, i) => (
          <a
            key={r.label}
            href={r.href}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr 100px 20px",
              gap: 16,
              alignItems: "center",
              padding: "14px 18px",
              borderTop: i === 0 ? "none" : "1px solid var(--c-border)",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "var(--c-ink)",
                fontSize: 15,
              }}
            >
              {r.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--c-ink-dim)",
                lineHeight: 1.55,
              }}
            >
              {r.desc}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--c-ink-faint)",
                textAlign: "right",
              }}
            >
              {r.kind}
            </div>
            <span style={{ color: "var(--c-ink-faint)", fontSize: 14 }}>↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--c-gold)",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}
