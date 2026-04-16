import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from "react";

/** Hook: measure an element's size via ResizeObserver */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}
import { JsonTab } from "./components/JsonTab";
import { DiffTab } from "./components/DiffTab";
import { SaveOutputTab } from "./components/SaveOutputTab";
import { TopToggleList, MiddleContent, BottomActionBar, ViewRendererProvider, CreateViewMeta, PhoneMockup, AppPwaPreview } from "view-renderer";
import { fetchTenantConfig, fetchGlobalConfigs } from "view-renderer";
import type { ViewMeta, TenantConfig, GlobalFeatureConfig, DraftMap, TenantConfigMap, GlobalConfigMap, AppTypeKey, AppPwaPreviewHandle, PwaStatus } from "view-renderer";

type TabKey = "viewMeta" | "tenantConfig" | "globalSchema" | "draftState" | "saveOutput" | "createView";

function safeParse<T>(json: string): { data: T | null; error: string | null } {
  try {
    return { data: JSON.parse(json), error: null };
  } catch (e: unknown) {
    return { data: null, error: (e as Error).message };
  }
}

const emptyViewMeta: ViewMeta = {
  view_id: "",
  app_type: "",
  nodes: [],
};

const emptyTenantConfig: TenantConfig = {
  tenant_id: "",
  tenant_name: "",
  brand: {},
  features: {},
  strategies: {},
  extra: {},
};

// ── Styles ──
const S = {
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, system-ui, sans-serif",
    overflow: "hidden",
  } as CSSProperties,
  main: {
    display: "flex",
    flex: 1,
    minHeight: 0,
  } as CSSProperties,
  leftPanel: (collapsed: boolean, otherCollapsed: boolean): CSSProperties => ({
    width: collapsed ? 0 : otherCollapsed ? undefined : "40%",
    minWidth: collapsed ? 0 : otherCollapsed ? undefined : 320,
    flex: collapsed ? "0 0 0px" : otherCollapsed ? 1 : undefined,
    display: "flex",
    flexDirection: "column",
    borderRight: collapsed ? "none" : "1px solid #e5e7eb",
    overflow: "hidden",
    transition: "width 0.25s ease, min-width 0.25s ease, flex 0.25s ease",
  }),
  tabStrip: {
    display: "flex",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
    flexShrink: 0,
    overflowX: "auto",
    overflowY: "hidden",
  } as CSSProperties,
  tab: (active: boolean): CSSProperties => ({
    padding: "10px 16px",
    fontSize: 13,
    border: "none",
    borderBottom: active ? "2px solid #0d9488" : "2px solid transparent",
    background: "transparent",
    color: active ? "#0f766e" : "#6b7280",
    fontWeight: active ? 500 : 400,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
  }),
  dot: (color: string): CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  tabContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as CSSProperties,
  fetchControls: {
    padding: 12,
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flexShrink: 0,
  } as CSSProperties,
  fetchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  } as CSSProperties,
  label: {
    fontSize: 11,
    color: "#6b7280",
    width: 50,
    flexShrink: 0,
  } as CSSProperties,
  input: {
    fontSize: 13,
    border: "1px solid #d1d5db",
    borderRadius: 4,
    padding: "4px 8px",
    flex: 1,
    minWidth: 100,
    outline: "none",
  } as CSSProperties,
  inputShort: {
    fontSize: 13,
    border: "1px solid #d1d5db",
    borderRadius: 4,
    padding: "4px 8px",
    width: 80,
    outline: "none",
  } as CSSProperties,
  select: {
    fontSize: 13,
    border: "1px solid #d1d5db",
    borderRadius: 4,
    padding: "4px 8px",
    width: 90,
    outline: "none",
  } as CSSProperties,
  fetchBtn: (disabled: boolean): CSSProperties => ({
    fontSize: 13,
    padding: "5px 16px",
    background: disabled ? "#9ca3af" : "#0d9488",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
  }),
  collapseBtn: {
    width: 20,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    border: "none",
    borderRight: "1px solid #e5e7eb",
    cursor: "pointer",
    padding: 0,
  } as CSSProperties,
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
    background: "#fff",
  } as CSSProperties,
  rightContent: {
    display: "flex",
    flex: 1,
    minHeight: 0,
    width: "100%",
    gap: 16,
    overflow: "hidden",
  } as CSSProperties,
  rightContentLeft: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    padding: "0 16px",
    overflow: "auto",
  } as CSSProperties,
  rightContentRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    padding: "12px 16px 12px 0",
    gap: 8,
    overflow: "auto",
    minHeight: 0,
  } as CSSProperties,
  previewBtn: (status: string): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 32px",
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    background: status === "applying" ? "#6b7280" : "#0d9488",
    border: "none",
    borderRadius: 8,
    cursor: status === "loading" || status === "applying" ? "not-allowed" : "pointer",
    opacity: status === "loading" ? 0.5 : 1,
    transition: "all 0.15s ease",
    minWidth: 120,
  }),
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  } as CSSProperties,
  previewErrorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    maxWidth: "100%",
    textAlign: "center",
  } as CSSProperties,
  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#9ca3af",
    fontSize: 14,
  } as CSSProperties,
  errorText: {
    color: "#ef4444",
    fontWeight: 500,
    textAlign: "center",
  } as CSSProperties,
} as const;

// ── PWA URL builder ──

/** Build PWA URL with tenant/auth query params for iframe embedding. */
function getPwaUrl(
  baseUrl: string,
  params: { tenant: string; token?: string; playground?: boolean },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("tenant", params.tenant);
  if (params.token) url.searchParams.set("token", params.token);
  if (params.playground) {
    url.searchParams.set("playground", "true");
    url.searchParams.set("origin", window.location.origin);
  }
  return url.toString();
}

// ── Multi-config helpers ──

function getPortalTenantConfig(): TenantConfig {
  // TODO: fetch from portal endpoint
  return {
    tenant_id: "",
    tenant_name: "",
    brand: {},
    features: {},
    strategies: {},
    extra: {},
  };
}

function getPortalGlobalConfigs(): GlobalFeatureConfig[] {
  // TODO: fetch from portal global endpoint
  return [];
}

function getTenantConfigMap(appConfig: TenantConfig | null): TenantConfigMap | null {
  if (!appConfig) return null;
  return {
    app: appConfig,
    portal: getPortalTenantConfig(),
  };
}

function getGlobalConfigMap(appGlobals: GlobalFeatureConfig[] | null): GlobalConfigMap {
  return {
    app: appGlobals ?? [],
    portal: getPortalGlobalConfigs(),
  };
}

async function saveAppConfig(
  draft: TenantConfig,
  params: { tenant: string; env: string; appVersion?: string; role?: string },
): Promise<void> {
  const body: Record<string, unknown> = {
    tenant: params.tenant,
    env: params.env,
    config: draft,
    appType: "sfa",
  };
  if (params.appVersion) body.appVersion = params.appVersion;
  if (params.role) body.role = params.role;

  const res = await fetch("http://localhost:3000/tenant-config/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}

function savePortalConfig(_draft: TenantConfig): void {
  alert("Portal save pressed");
}


export default function TestHarness() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [draftViewMode, setDraftViewMode] = useState<"edit" | "diff">("edit");

  // JSON state
  const [viewMetaJson, setViewMetaJson] = useState(JSON.stringify(emptyViewMeta, null, 2));
  const [tenantConfigJson, setTenantConfigJson] = useState(JSON.stringify(emptyTenantConfig, null, 2));
  const [globalSchemaJson, setGlobalSchemaJson] = useState("[]");

  const [activeTab, setActiveTab] = useState<TabKey>("viewMeta");

  // Parse results
  const [vmParsed, setVmParsed] = useState(safeParse<ViewMeta>(viewMetaJson));
  const [tcParsed, setTcParsed] = useState(safeParse<TenantConfig>(tenantConfigJson));
  const [gsParsed, setGsParsed] = useState(safeParse<GlobalFeatureConfig[]>(globalSchemaJson));

  // Memoized config maps — stable references so provider useEffect doesn't reset draft
  const memoTenantConfigMap = useMemo(() => getTenantConfigMap(tcParsed.data), [tcParsed.data]);
  const memoGlobalConfigMap = useMemo(() => getGlobalConfigMap(gsParsed.data), [gsParsed.data]);

  // Save output
  const [saveOutput, setSaveOutput] = useState<{ timestamp: string; payload: unknown } | null>(null);

  // Fetch params
  const [fetchTenant, setFetchTenant] = useState("hfcoeuat");
  const [fetchEnv, setFetchEnv] = useState("dev");
  const [fetchAppVersion, setFetchAppVersion] = useState("10000.1.0");
  const [fetchRole, setFetchRole] = useState("");
  const [fetchAppType, setFetchAppType] = useState("sfa");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showFetchParams, setShowFetchParams] = useState(false);
  const [viewMongoId, setViewMongoId] = useState("");
  const [viewList, setViewList] = useState<Array<{ _id: string; viewId: string; name: string; appType: string; updatedAt: string }>>([]);
  const [createViewJson, setCreateViewJson] = useState("{\n  \"viewId\": \"\",\n  \"name\": \"\",\n  \"appType\": \"sfa\",\n  \"nodes\": []\n}");
  const [createViewStatus, setCreateViewStatus] = useState<string | null>(null);

  // Draft observation from provider (for debug panel)
  const [draftForDebug, setDraftForDebug] = useState<DraftMap | null>(null);

  // PWA Preview settings (passed to ViewRendererProvider)
  const [pwaBaseUrl, setPwaBaseUrl] = useState("http://localhost:8080");
  const [pwaToken, setPwaToken] = useState("");

  // Build full PWA URL with tenant query params
  const pwaUrl = useMemo(
    () => {
      if (!pwaBaseUrl) return "";
      try {
        return getPwaUrl(pwaBaseUrl, {
          tenant: fetchTenant,
          token: pwaToken || undefined,
          playground: true,
        });
      } catch {
        return pwaBaseUrl; // fallback if URL is invalid
      }
    },
    [pwaBaseUrl, fetchTenant, pwaToken],
  );
  const [livePreview, setLivePreview] = useState(false);
  const previewRef = useRef<AppPwaPreviewHandle>(null);
  const [previewStatus, setPreviewStatus] = useState<PwaStatus>('loading');
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Save status from provider callbacks
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Dynamic phone sizing — measure the right-side container and fit the phone
  const { ref: phoneContainerRef, size: phoneContainerSize } = useElementSize<HTMLDivElement>();
  const PHONE_ASPECT = 375 / 720; // width / height (screen only)
  const BEZEL_EXTRA_H = 12 * 2 + 24 + 4 + 8; // bezel top+bottom + notch + home + gap
  const BEZEL_EXTRA_W = 12 * 2; // bezel left+right
  const BUTTON_AREA = 64; // preview button + toggle + error banner space
  const SCALE = 0.85; // shrink phone to avoid overflow
  const phoneDims = useMemo(() => {
    const availH = phoneContainerSize.height - BUTTON_AREA;
    if (availH <= 0) return { w: 320, h: 600 };
    const screenH = Math.round((availH - BEZEL_EXTRA_H) * SCALE);
    const screenW = Math.round(screenH * PHONE_ASPECT);
    return { w: Math.max(screenW, 180), h: Math.max(screenH, 340) };
  }, [phoneContainerSize.height]);

  const CONFIG_BASE_URL = "http://localhost:3000";

  // GET /tenant-config
  const handleFetchConfig = useCallback(async () => {
    if (!fetchTenant || !fetchEnv) {
      setFetchError("Tenant and Env are required");
      return;
    }
    setIsFetching(true);
    setFetchError(null);
    try {
      const config = await fetchTenantConfig(CONFIG_BASE_URL, {
        tenant: fetchTenant,
        env: fetchEnv,
        appVersion: fetchAppVersion || undefined,
        role: fetchRole || undefined,
        appType: fetchAppType || undefined,
      });
      const json = JSON.stringify(config, null, 2);
      setTenantConfigJson(json);
      // Immediately parse so draft resets without waiting for the 800ms debounce
      setTcParsed(safeParse<TenantConfig>(json));
    } catch (err: unknown) {
      setFetchError((err as Error).message || "Failed to fetch");
    } finally {
      setIsFetching(false);
    }
  }, [fetchTenant, fetchEnv, fetchAppVersion, fetchRole, fetchAppType]);

  // GET /app/resolved_config
  const handleFetchResolvedConfig = useCallback(async () => {
    try {
      const configs = await fetchGlobalConfigs(CONFIG_BASE_URL);
      setGlobalSchemaJson(JSON.stringify(configs, null, 2));
    } catch (err: unknown) {
      setGlobalSchemaJson(JSON.stringify({ error: (err as Error).message }, null, 2));
    }
  }, []);

  // Fetch view-meta from API by MongoDB _id (falls back to static JSON)
  const handleFetchViewMeta = useCallback(async () => {
    try {
      if (viewMongoId) {
        const res = await fetch(`${CONFIG_BASE_URL}/view/public/${viewMongoId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setViewMetaJson(JSON.stringify(data, null, 2));
      } else {
        const res = await fetch("/working-view-meta.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setViewMetaJson(JSON.stringify(data, null, 2));
      }
    } catch (err: unknown) {
      setViewMetaJson(JSON.stringify({ error: (err as Error).message }, null, 2));
    }
  }, [viewMongoId]);

  // Fetch list of all views from API
  const handleFetchViewList = useCallback(async () => {
    try {
      const res = await fetch(`${CONFIG_BASE_URL}/view/public`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setViewList(data);
    } catch {
      setViewList([]);
    }
  }, []);

  // Save view JSON to backend via POST /view/public
  const handleSaveView = useCallback(async () => {
    setCreateViewStatus(null);
    try {
      const body = JSON.parse(createViewJson);
      const res = await fetch(`${CONFIG_BASE_URL}/view/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setCreateViewStatus(`Saved! _id: ${data._id}`);
      handleFetchViewList();
    } catch (err: unknown) {
      setCreateViewStatus(`Error: ${(err as Error).message}`);
    }
  }, [createViewJson, handleFetchViewList]);

  // Auto-fetch on mount
  useEffect(() => {
    handleFetchViewMeta();
    handleFetchConfig();
    handleFetchResolvedConfig();
    handleFetchViewList();
  }, []);

  // Re-parse JSON whenever editors change
  useEffect(() => {
    const t = setTimeout(() => {
      setVmParsed(safeParse<ViewMeta>(viewMetaJson));
      setTcParsed(safeParse<TenantConfig>(tenantConfigJson));
      setGsParsed(safeParse<GlobalFeatureConfig[]>(globalSchemaJson));
    }, 800);
    return () => clearTimeout(t);
  }, [viewMetaJson, tenantConfigJson, globalSchemaJson]);

  // Also parse immediately on mount
  useEffect(() => {
    setVmParsed(safeParse<ViewMeta>(viewMetaJson));
    setTcParsed(safeParse<TenantConfig>(tenantConfigJson));
    setGsParsed(safeParse<GlobalFeatureConfig[]>(globalSchemaJson));
  }, []);

  const tenantConfigMapJson = memoTenantConfigMap ? JSON.stringify(memoTenantConfigMap, null, 2) : "{}";
  const draftJson = draftForDebug ? JSON.stringify(draftForDebug, null, 2) : "{}";
  const hasDraftChanges = tenantConfigMapJson !== draftJson;

  const tabs: Array<{ key: TabKey; label: string; status: { data: unknown; error: string | null } | null }> = [
    { key: "viewMeta", label: "View Meta", status: vmParsed },
    { key: "tenantConfig", label: "Tenant Config", status: { data: memoTenantConfigMap, error: null } },
    { key: "draftState", label: "Draft", status: { data: draftForDebug, error: hasDraftChanges ? "modified" : null } },
    { key: "globalSchema", label: "Global Schema", status: gsParsed },
    { key: "saveOutput", label: "Save Output", status: null },
    { key: "createView", label: "Create View", status: null },
  ];

  return (
    <div style={S.root}>
      <div style={S.main}>
        {/* ── Left Panel ── */}
        <div style={S.leftPanel(leftCollapsed, rightCollapsed)}>
          {/* Tab strip */}
          <div style={S.tabStrip}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={S.tab(activeTab === tab.key)}>
                {tab.status && (
                  <span style={S.dot(
                    tab.key === "draftState"
                      ? (hasDraftChanges ? "#fbbf24" : "#22c55e")
                      : (tab.status.error ? "#ef4444" : tab.status.data ? "#22c55e" : "#d1d5db")
                  )} />
                )}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={S.tabContent}>
            {activeTab === "viewMeta" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ ...S.fetchControls, gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}>Saved Views</label>
                    <select
                      style={{ ...S.select, flex: 1, width: "auto" }}
                      value={viewMongoId}
                      onChange={(e) => {
                        setViewMongoId(e.target.value);
                      }}
                    >
                      <option value="">— static JSON —</option>
                      {viewList.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({v.viewId}) — {v.appType}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleFetchViewList} style={{ ...S.fetchBtn(false), padding: "5px 10px", fontSize: 11 }}>↻</button>
                    <button onClick={handleFetchViewMeta} style={S.fetchBtn(false)}>Load</button>
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <JsonTab value={viewMetaJson} onChange={setViewMetaJson} parseResult={vmParsed} />
                </div>
              </div>
            )}

            {activeTab === "tenantConfig" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={S.fetchControls}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>
                      {fetchTenant}/{fetchEnv} v{fetchAppVersion} ({fetchAppType || "any"})
                    </span>
                    <button
                      onClick={() => setShowFetchParams((v) => !v)}
                      style={{ fontSize: 11, background: "none", border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 8px", cursor: "pointer", color: "#6b7280" }}
                    >
                      {showFetchParams ? "Hide" : "Edit"}
                    </button>
                    <button onClick={handleFetchConfig} disabled={isFetching} style={S.fetchBtn(isFetching)}>
                      {isFetching ? "Fetching..." : "Fetch"}
                    </button>
                  </div>
                  {fetchError && <span style={{ fontSize: 11, color: "#ef4444" }}>{fetchError}</span>}
                  {showFetchParams && (
                    <>
                      <div style={S.fetchRow}>
                        <label style={S.label}>Tenant</label>
                        <input style={S.input} value={fetchTenant} onChange={(e) => setFetchTenant(e.target.value)} />
                        <label style={{ ...S.label, width: 35 }}>Env</label>
                        <input style={S.inputShort} value={fetchEnv} onChange={(e) => setFetchEnv(e.target.value)} />
                      </div>
                      <div style={S.fetchRow}>
                        <label style={S.label}>Version</label>
                        <input style={S.input} value={fetchAppVersion} onChange={(e) => setFetchAppVersion(e.target.value)} />
                        <label style={{ ...S.label, width: 35 }}>Role</label>
                        <input style={S.inputShort} value={fetchRole} onChange={(e) => setFetchRole(e.target.value)} />
                        <label style={{ ...S.label, width: 55 }}>AppType</label>
                        <select style={S.select} value={fetchAppType} onChange={(e) => setFetchAppType(e.target.value)}>
                          <option value="">Any</option>
                          <option value="mobile">mobile</option>
                          <option value="web">web</option>
                          <option value="sfa">sfa</option>
                        </select>
                      </div>
                      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 6, marginTop: 2 }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>PWA Preview</div>
                        <div style={S.fetchRow}>
                          <label style={S.label}>URL</label>
                          <input style={S.input} value={pwaBaseUrl} onChange={(e) => setPwaBaseUrl(e.target.value)} placeholder="http://localhost:8080" />
                          <label style={{ ...S.label, width: 40 }}>Token</label>
                          <input style={S.input} value={pwaToken} onChange={(e) => setPwaToken(e.target.value)} placeholder="JWT (optional)" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <JsonTab value={tenantConfigMapJson} onChange={() => {}} parseResult={{ data: memoTenantConfigMap, error: null }} />
                </div>
              </div>
            )}

            {activeTab === "draftState" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={S.fetchControls}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>
                      Draft state (read-only) — {fetchTenant}/{fetchEnv}
                    </span>
                    <button
                      onClick={() => setDraftViewMode((m) => m === "edit" ? "diff" : "edit")}
                      style={{ fontSize: 11, background: "none", border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 8px", cursor: "pointer", color: "#6b7280" }}
                    >
                      {draftViewMode === "edit" ? "Diff" : "JSON"}
                    </button>
                  </div>
                  {updateError && <span style={{ fontSize: 11, color: "#ef4444" }}>{updateError}</span>}
                  {updateSuccess && <span style={{ fontSize: 11, color: "#4ade80" }}>{updateSuccess}</span>}
                </div>
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  {draftViewMode === "edit" ? (
                    <JsonTab
                      value={draftJson}
                      onChange={() => {}}
                      parseResult={{ data: draftForDebug, error: null }}
                    />
                  ) : (
                    <DiffTab original={tenantConfigMapJson} modified={draftJson} />
                  )}
                </div>
              </div>
            )}

            {activeTab === "globalSchema" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ ...S.fetchControls, flexDirection: "row", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>GET /app/resolved_config</span>
                  <button onClick={handleFetchResolvedConfig} style={S.fetchBtn(false)}>Fetch</button>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <JsonTab value={globalSchemaJson} onChange={setGlobalSchemaJson} parseResult={gsParsed} />
                </div>
              </div>
            )}

            {activeTab === "saveOutput" && (
              <SaveOutputTab output={saveOutput} />
            )}

            {activeTab === "createView" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ ...S.fetchControls, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>Paste view JSON → Save to DB</span>
                  <button onClick={handleSaveView} style={S.fetchBtn(false)}>Save View</button>
                </div>
                {createViewStatus && (
                  <div style={{ padding: "6px 12px", fontSize: 12, color: createViewStatus.startsWith("Error") ? "#ef4444" : "#22c55e", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    {createViewStatus}
                  </div>
                )}
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <JsonTab
                    value={createViewJson}
                    onChange={setCreateViewJson}
                    parseResult={safeParse(createViewJson)}
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Collapse toggle ── */}
        <button onClick={() => setLeftCollapsed((c) => !c)} style={S.collapseBtn} title={leftCollapsed ? "Expand panel" : "Collapse panel"}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: leftCollapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* ── Right collapse toggle ── */}
        <button onClick={() => setRightCollapsed((c) => !c)} style={S.collapseBtn} title={rightCollapsed ? "Expand panel" : "Collapse panel"}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: rightCollapsed ? "none" : "rotate(180deg)", transition: "transform 0.2s" }}
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* ── Right Panel ── */}
        <div style={{
          ...S.rightPanel,
          width: rightCollapsed ? 0 : undefined,
          minWidth: rightCollapsed ? 0 : undefined,
          overflow: "hidden",
          flex: rightCollapsed ? "0 0 0px" : 1,
          transition: "flex 0.25s ease, width 0.25s ease",
        }}>
          {vmParsed.data && tcParsed.data ? (
            <ViewRendererProvider
              initialTenantConfigMap={memoTenantConfigMap}
              initialGlobalConfigMap={memoGlobalConfigMap}
              initialViewMeta={vmParsed.data}
              onSave={async (configKey: AppTypeKey, draft: TenantConfig) => {
                if (configKey === "portal") {
                  savePortalConfig(draft);
                  return;
                }

                if (configKey === "app") {
                  await saveAppConfig(draft, {
                    tenant: fetchTenant,
                    env: fetchEnv,
                    appVersion: fetchAppVersion || undefined,
                    role: fetchRole || undefined,
                  });
                  setUpdateError(null);
                  setUpdateSuccess(`Saved ${configKey} at ${new Date().toLocaleTimeString()}`);
                  setSaveOutput({
                    timestamp: new Date().toISOString(),
                    payload: { configKey, draft },
                  });
                  return;
                }

                console.warn(`[TestHarness] No save handler for configKey: "${configKey}"`);
              }}
              onDraftChange={setDraftForDebug}
              pwaUrl={pwaUrl || undefined}
              pwaToken={pwaToken || undefined}
            >
              <div style={S.rightContent}>
                <div style={S.rightContentLeft}>
                  <TopToggleList />
                  <MiddleContent />
                  <BottomActionBar />
                </div>
                {pwaUrl && (
                  <div ref={phoneContainerRef} style={S.rightContentRight}>
                    {/* Live Preview toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
                      <span style={{ fontWeight: 500, letterSpacing: '0.02em' }}>Live Preview</span>
                      <div
                        onClick={() => setLivePreview((v) => !v)}
                        style={{
                          width: 32,
                          height: 18,
                          borderRadius: 9,
                          background: livePreview ? '#0d9488' : '#d1d5db',
                          position: 'relative',
                          transition: 'background 0.2s',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 2,
                          left: livePreview ? 16 : 2,
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                        }} />
                      </div>
                    </label>
                    <PhoneMockup width={phoneDims.w} height={phoneDims.h}>
                      <AppPwaPreview
                        ref={previewRef}
                        pwaUrl={pwaUrl}
                        token={pwaToken || undefined}
                        manualMode={!livePreview}
                        onStatusChange={setPreviewStatus}
                        onError={(msg) => setPreviewError(msg)}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </PhoneMockup>
                    {!livePreview && (
                      <button
                        style={{ ...S.previewBtn(previewStatus), padding: '6px 24px', fontSize: 12 }}
                        disabled={previewStatus === 'loading' || previewStatus === 'applying'}
                        onClick={() => {
                          setPreviewError(null);
                          previewRef.current?.sendConfig();
                        }}
                      >
                        {previewStatus === 'applying' && (
                          <span style={S.spinner} />
                        )}
                        {previewStatus === 'applying' ? 'Applying…' : 'Preview'}
                      </button>
                    )}
                    {previewError && (
                      <div style={S.previewErrorBanner}>
                        {previewError}
                        <span style={{ cursor: 'pointer', marginLeft: 8, fontWeight: 600 }} onClick={() => setPreviewError(null)}>×</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ViewRendererProvider>
          ) : (
            <div style={S.placeholder}>
              {vmParsed.error || tcParsed.error ? (
                <div>
                  <p style={S.errorText}>JSON Parse Error</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>{vmParsed.error || tcParsed.error}</p>
                </div>
              ) : (
                "No node selected"
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
