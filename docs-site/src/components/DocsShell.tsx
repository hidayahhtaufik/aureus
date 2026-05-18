"use client";

/// GitBook-style docs layout: left sidebar nav + main content area.
/// Scroll-spy highlights the active section via IntersectionObserver
/// on h2-level anchors in the main content. Mobile gets a slide-up
/// nav drawer triggered by a floating "DOCS" button.
///
/// Self-contained: no external icon deps, no Tailwind-token dependency,
/// just hex colors + inline SVG. Drop it into any Next.js app.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type NavItem = {
  id: string;
  label: string;
  badge?: string;
  children?: NavItem[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const C = {
  bg: "#F5F1E8",
  surface: "#FBF7EE",
  border: "#E1DACB",
  ink: "#0E3A3A",
  inkDim: "#3F5F5F",
  inkFaint: "#7E9999",
  gold: "#D58A2C",
  goldSoft: "#F2DCB4",
  red: "#E36049",
} as const;

function Caret({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M5 3l5 5-5 5V3z" />
    </svg>
  );
}
function ListIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="2" y="3" width="12" height="2" rx="1" />
      <rect x="2" y="7" width="12" height="2" rx="1" />
      <rect x="2" y="11" width="12" height="2" rx="1" />
    </svg>
  );
}
function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.3 3.7 8 7.4l3.7-3.7 1.4 1.4L9.4 8.8l3.7 3.7-1.4 1.4L8 10.2l-3.7 3.7-1.4-1.4 3.7-3.7L2.9 5.1z" />
    </svg>
  );
}
function BookIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 2.5A1.5 1.5 0 0 1 3.5 1H7v13H3.5A1.5 1.5 0 0 1 2 12.5v-10ZM9 1h3.5A1.5 1.5 0 0 1 14 2.5v10A1.5 1.5 0 0 1 12.5 14H9V1Z" />
    </svg>
  );
}

export function DocsShell({
  groups,
  children,
}: {
  groups: NavGroup[];
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const allItems = useMemo(() => {
    const out: NavItem[] = [];
    for (const g of groups) {
      for (const i of g.items) {
        out.push(i);
        if (i.children) out.push(...i.children);
      }
    }
    return out;
  }, [groups]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0 && visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const it of allItems) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [allItems]);

  return (
    <div
      className="docs-shell"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(220px, 260px) minmax(0, 1fr)",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "clamp(20px, 3vw, 32px) clamp(20px, 4vw, 56px) clamp(48px, 5vw, 80px)",
        gap: "clamp(24px, 4vw, 56px)",
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={() => setMobileOpen((s) => !s)}
        aria-label="Toggle docs nav"
        className="docs-mobile-toggle"
        style={{
          display: "none",
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 30,
          padding: "12px 16px",
          borderRadius: 999,
          border: `1.5px solid ${C.gold}`,
          background: C.gold,
          color: "#fff",
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: "0.08em",
          alignItems: "center",
          gap: 6,
          boxShadow: `0 6px 20px ${C.gold}55`,
        }}
      >
        {mobileOpen ? <XIcon /> : <ListIcon />}
        {mobileOpen ? "CLOSE" : "DOCS"}
      </button>

      <aside
        className={mobileOpen ? "docs-sidebar docs-sidebar-open" : "docs-sidebar"}
        style={{
          position: "sticky",
          top: 96,
          alignSelf: "start",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          paddingRight: 8,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.inkFaint,
            paddingBottom: 16,
            borderBottom: `1px solid ${C.border}`,
            width: "100%",
          }}
        >
          <span style={{ color: C.gold }}>
            <BookIcon />
          </span>
          Aureus Docs
        </div>

        <nav style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 22 }}>
          {groups.map((g) => (
            <div key={g.label}>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: C.inkDim,
                  marginBottom: 8,
                }}
              >
                {g.label}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                {g.items.map((item) => (
                  <SidebarItem key={item.id} item={item} activeId={activeId} onNavigate={() => setMobileOpen(false)} />
                ))}
              </ul>
            </div>
          ))}

          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px dashed ${C.border}`,
              background: `${C.gold}10`,
              fontSize: 11,
              color: C.inkDim,
              lineHeight: 1.5,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            <strong style={{ color: C.ink, display: "block", marginBottom: 4 }}>Found a gap?</strong>
            Open a PR against{" "}
            <a
              href="https://github.com/hidayahhtaufik/aureus/tree/master/docs"
              target="_blank"
              rel="noreferrer"
              style={{ color: C.gold }}
            >
              aureus/docs
            </a>
            .
          </div>

          <div
            style={{
              fontSize: 11,
              color: C.inkFaint,
              borderTop: `1px solid ${C.border}`,
              paddingTop: 12,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            <Link href="/" style={{ color: C.inkDim, textDecoration: "none" }}>
              ← aureus.auranode.xyz
            </Link>
          </div>
        </nav>
      </aside>

      <article style={{ minWidth: 0, maxWidth: 760 }}>{children}</article>

      <style>{`
        @media (max-width: 900px) {
          .docs-shell { grid-template-columns: 1fr !important; }
          .docs-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 25;
            padding: 24px 20px !important;
            background: ${C.bg};
            border-right: none;
            transform: translateY(110%);
            transition: transform 220ms ease;
            max-height: none !important;
          }
          .docs-sidebar-open { transform: translateY(0) !important; }
          .docs-mobile-toggle { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}

function SidebarItem({
  item,
  activeId,
  onNavigate,
}: {
  item: NavItem;
  activeId: string | null;
  onNavigate: () => void;
}) {
  const isActive = activeId === item.id;
  return (
    <li>
      <a
        href={`#${item.id}`}
        onClick={onNavigate}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 6,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          color: isActive ? C.gold : C.inkDim,
          background: isActive ? `${C.gold}15` : "transparent",
          textDecoration: "none",
          fontWeight: isActive ? 600 : 400,
          transition: "background 120ms ease, color 120ms ease",
          borderLeft: isActive ? `2px solid ${C.gold}` : "2px solid transparent",
        }}
      >
        {isActive && (
          <span style={{ color: C.gold }}>
            <Caret />
          </span>
        )}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.label}
        </span>
        {item.badge && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 5px",
              borderRadius: 999,
              background: `${C.gold}25`,
              color: C.gold,
              letterSpacing: "0.04em",
            }}
          >
            {item.badge}
          </span>
        )}
      </a>
      {item.children && item.children.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "2px 0 0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {item.children.map((c) => (
            <SidebarItem key={c.id} item={c} activeId={activeId} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}
