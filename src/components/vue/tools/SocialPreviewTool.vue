<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { toPng, toBlob } from "html-to-image";
import { useClipboard } from "@/composables/useClipboard";
import { useToolState } from "@/composables/useToolState";
import { useDebounceFn } from "@/composables/useDebounce";

interface PreviewData {
  title: string;
  subtitle: string;
  category: string;
  url: string;
  features: string[];
  icon: string;
  demoInput: string;
  demoOutput: string;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  gradient: string;
  bgGlow: string;
  bgSubtle: string;
  borderSubtle: string;
}

var ICONS: Record<string, string> = {
  clock: '<circle cx="60" cy="60" r="50" stroke="currentColor" stroke-width="4" fill="none"/><line x1="60" y1="60" x2="60" y2="32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><line x1="60" y1="60" x2="82" y2="72" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="60" r="5" fill="currentColor"/>',
  code: '<polyline points="35 40 15 60 35 80" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><polyline points="85 40 105 60 85 80" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="68" y1="28" x2="52" y2="92" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  chart: '<rect x="15" y="55" width="22" height="45" rx="4" fill="currentColor" opacity="0.5"/><rect x="49" y="35" width="22" height="65" rx="4" fill="currentColor" opacity="0.7"/><rect x="83" y="15" width="22" height="85" rx="4" fill="currentColor"/>',
  lightbulb: '<path d="M60 10 L60 0" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M28 28 L20 20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M92 28 L100 20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="50" r="28" stroke="currentColor" stroke-width="4" fill="none"/><path d="M46 78 L46 88 C46 94 52 100 60 100 C68 100 74 94 74 88 L74 78" stroke="currentColor" stroke-width="4" fill="none"/>',
  rocket: '<path d="M60 95 L60 70" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M42 95 L60 70 L78 95" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><ellipse cx="60" cy="42" rx="18" ry="32" stroke="currentColor" stroke-width="4" fill="none"/><circle cx="60" cy="38" r="7" fill="currentColor"/>',
  tool: '<circle cx="60" cy="60" r="48" stroke="currentColor" stroke-width="4" fill="none"/><path d="M45 45 L55 55 M75 75 L55 55 M55 55 L55 75 L75 75" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  none: "",
};

var THEMES: Record<string, ThemeColors> = {
  blue: { primary: "#3b82f6", secondary: "#60a5fa", gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)", bgGlow: "rgba(59, 130, 246, 0.15)", bgSubtle: "rgba(59, 130, 246, 0.03)", borderSubtle: "rgba(59, 130, 246, 0.3)" },
  green: { primary: "#10b981", secondary: "#34d399", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", bgGlow: "rgba(16, 185, 129, 0.15)", bgSubtle: "rgba(16, 185, 129, 0.03)", borderSubtle: "rgba(16, 185, 129, 0.3)" },
  purple: { primary: "#8b5cf6", secondary: "#a78bfa", gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)", bgGlow: "rgba(139, 92, 246, 0.15)", bgSubtle: "rgba(139, 92, 246, 0.03)", borderSubtle: "rgba(139, 92, 246, 0.3)" },
  orange: { primary: "#f97316", secondary: "#fb923c", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", bgGlow: "rgba(249, 115, 22, 0.15)", bgSubtle: "rgba(249, 115, 22, 0.03)", borderSubtle: "rgba(249, 115, 22, 0.3)" },
  pink: { primary: "#ec4899", secondary: "#f472b6", gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)", bgGlow: "rgba(236, 72, 153, 0.15)", bgSubtle: "rgba(236, 72, 153, 0.03)", borderSubtle: "rgba(236, 72, 153, 0.3)" },
};

var TEMPLATES: Record<string, { title: string; subtitle: string; category: string; features: string[]; icon: string; theme: string; demoInput: string; demoOutput: string }> = {
  devtool: { title: "AI-Powered Code Reviews", subtitle: "Ship 10x faster with intelligent PR analysis and suggestions", category: "Developer Tool", features: ["Free Trial", "GitHub Integration", "Slack Alerts"], icon: "tool", theme: "blue", demoInput: "PR #1247", demoOutput: "3 issues found, 12 improvements suggested" },
  blog: { title: "Why We Migrated to Edge Computing", subtitle: "How we reduced latency by 73% and saved $40k monthly", category: "Case Study", features: ["8 min read", "Engineering", "Performance"], icon: "lightbulb", theme: "purple", demoInput: "", demoOutput: "" },
  saas: { title: "DataSync Pro", subtitle: "Real-time data synchronization across your entire stack", category: "SaaS Platform", features: ["14-day Trial", "SOC2 Type II", "99.99% Uptime"], icon: "rocket", theme: "green", demoInput: "", demoOutput: "" },
  opensource: { title: "NextAuth v5", subtitle: "Authentication for Next.js 14 with App Router support", category: "Open Source", features: ["MIT License", "TypeScript", "20+ Providers"], icon: "code", theme: "orange", demoInput: "", demoOutput: "" },
  course: { title: "SaaS Metrics Masterclass", subtitle: "Master ARR, churn, CAC, and LTV for product-led growth", category: "Online Course", features: ["6-week program", "Real examples", "Certificate"], icon: "chart", theme: "pink", demoInput: "", demoOutput: "" },
};

var { copied, copy } = useClipboard();
var { logger } = useToolState({ name: "SocialPreviewTool" });

var titleInput = ref("CloudFlow Analytics");
var subtitleInput = ref("Real-time insights for modern SaaS teams");
var categoryInput = ref("SaaS Platform");
var urlInput = ref("cloudflow.io");
var featuresInput = ref("14-day trial, No credit card, Cancel anytime");
var iconSelect = ref("chart");
var demoInput = ref("Monthly ARR");
var demoOutput = ref("$847K (+23% MoM)");
var selectedTheme = ref("blue");
var selectedTemplate = ref("");
var activePlatform = ref("twitter");
var copyingVariant = ref<string | null>(null);
var downloadingVariant = ref<string | null>(null);
var linkCopied = ref(false);

var minimalCanvas = ref<HTMLElement | null>(null);
var gradientCanvas = ref<HTMLElement | null>(null);
var splitCanvas = ref<HTMLElement | null>(null);

var currentTheme = computed(function getTheme(): ThemeColors {
  return THEMES[selectedTheme.value] || THEMES.blue;
});

var currentData = computed(function getData(): PreviewData {
  return {
    title: titleInput.value || "Your Title Here",
    subtitle: subtitleInput.value,
    category: categoryInput.value,
    url: urlInput.value || "meysam.io",
    features: featuresInput.value.split(",").map(function (f) { return f.trim(); }).filter(Boolean),
    icon: iconSelect.value,
    demoInput: demoInput.value,
    demoOutput: demoOutput.value,
  };
});

function escapeHtml(text: string): string {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function generateMinimalHTML(data: PreviewData, theme: ThemeColors): string {
  var featuresHTML = data.features.length > 0
    ? '<div style="display:flex;flex-wrap:wrap;gap:24px;margin-top:48px;">' +
      data.features.map(function (f, i) {
        return '<span style="display:flex;align-items:center;gap:8px;color:#a0a0a0;font-size:18px;"><span style="width:8px;height:8px;background:#10b981;border-radius:50%;"></span>' + escapeHtml(f) + (i < data.features.length - 1 ? '<span style="width:4px;height:4px;background:#6a6a6a;border-radius:50%;margin-left:16px;"></span>' : '') + '</span>';
      }).join("") + '</div>'
    : "";

  var categoryHTML = data.category
    ? '<div style="display:inline-block;padding:8px 20px;background:' + theme.bgSubtle + ';border:1px solid ' + theme.borderSubtle + ';border-radius:6px;color:' + theme.secondary + ';font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">' + escapeHtml(data.category) + '</div>'
    : "";

  return '<div style="width:1200px;height:630px;background:#0a0a0a;position:relative;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;overflow:hidden;">' +
    '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(' + theme.bgSubtle + ' 1px,transparent 1px),linear-gradient(90deg,' + theme.bgSubtle + ' 1px,transparent 1px);background-size:60px 60px;"></div>' +
    '<div style="position:absolute;left:0;top:0;width:8px;height:100%;background:' + theme.gradient + ';"></div>' +
    '<div style="position:absolute;left:100px;top:140px;right:100px;">' +
    categoryHTML +
    '<h1 style="font-size:64px;font-weight:700;color:#f5f5f5;margin:0 0 16px 0;letter-spacing:-0.02em;line-height:1.1;max-width:900px;">' + escapeHtml(data.title) + '</h1>' +
    '<div style="width:120px;height:4px;background:' + theme.gradient + ';border-radius:2px;margin-bottom:24px;"></div>' +
    (data.subtitle ? '<p style="font-size:26px;color:#a0a0a0;margin:0;max-width:700px;line-height:1.4;">' + escapeHtml(data.subtitle) + '</p>' : '') +
    featuresHTML +
    '</div>' +
    '<div style="position:absolute;left:100px;right:100px;bottom:60px;display:flex;justify-content:space-between;align-items:center;">' +
    '<svg width="40" height="40" viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" fill="none" stroke="url(#mg1)" stroke-width="3"/><text x="100" y="135" font-family="-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif" font-size="110" font-weight="700" fill="url(#mg1)" text-anchor="middle">M</text><defs><linearGradient id="mg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:' + theme.primary + '"/><stop offset="100%" style="stop-color:' + theme.secondary + '"/></linearGradient></defs></svg>' +
    '<span style="font-size:20px;color:#6a6a6a;letter-spacing:0.02em;">' + escapeHtml(data.url) + '</span>' +
    '</div></div>';
}

function generateGradientHTML(data: PreviewData, theme: ThemeColors): string {
  var iconHTML = data.icon !== "none" && ICONS[data.icon]
    ? '<div style="position:absolute;left:80px;top:120px;"><svg width="120" height="120" viewBox="0 0 120 120" style="color:' + theme.primary + ';">' + ICONS[data.icon] + '</svg></div>'
    : "";
  var contentLeft = data.icon !== "none" ? "240px" : "80px";

  var featuresHTML = data.features.length > 0
    ? '<div style="display:flex;gap:16px;flex-wrap:wrap;">' +
      data.features.slice(0, 3).map(function (f) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:12px 20px;background:rgba(26,26,26,0.8);border:1px solid #2a2a2a;border-radius:8px;color:#f5f5f5;font-size:16px;font-weight:500;"><span style="color:' + theme.primary + ';font-weight:bold;">&#10003;</span>' + escapeHtml(f) + '</div>';
      }).join("") + '</div>'
    : "";

  var categoryHTML = data.category
    ? '<div style="display:inline-block;padding:6px 16px;background:' + theme.bgGlow + ';border:1px solid ' + theme.borderSubtle + ';border-radius:20px;color:' + theme.secondary + ';font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:20px;">' + escapeHtml(data.category) + '</div>'
    : "";

  return '<div style="width:1200px;height:630px;background:#0a0a0a;position:relative;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;overflow:hidden;">' +
    '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#0a0a0a 0%,#151515 50%,#0a0a0a 100%);"></div>' +
    '<div style="position:absolute;top:-150px;right:-150px;width:500px;height:500px;background:radial-gradient(circle,' + theme.bgGlow + ' 0%,transparent 70%);border-radius:50%;"></div>' +
    '<div style="position:absolute;top:1px;left:1px;right:1px;bottom:1px;border:2px solid #2a2a2a;"></div>' +
    iconHTML +
    '<div style="position:absolute;left:' + contentLeft + ';top:120px;right:80px;max-width:900px;">' +
    categoryHTML +
    '<h1 style="font-size:56px;font-weight:700;color:#f5f5f5;margin:0 0 20px 0;letter-spacing:-0.02em;line-height:1.15;text-shadow:0 2px 20px rgba(0,0,0,0.5);">' + escapeHtml(data.title) + '</h1>' +
    (data.subtitle ? '<p style="font-size:24px;color:#a0a0a0;margin:0 0 36px 0;line-height:1.5;max-width:650px;">' + escapeHtml(data.subtitle) + '</p>' : '') +
    featuresHTML +
    '</div>' +
    '<div style="position:absolute;left:80px;right:80px;bottom:50px;display:flex;justify-content:space-between;align-items:center;">' +
    '<div style="display:flex;align-items:center;gap:12px;">' +
    '<svg width="32" height="32" viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" fill="none" stroke="' + theme.primary + '" stroke-width="3"/><text x="100" y="135" font-family="-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif" font-size="110" font-weight="700" fill="' + theme.primary + '" text-anchor="middle">M</text></svg>' +
    '<span style="color:#6a6a6a;">|</span><span style="font-size:18px;color:#6a6a6a;">' + escapeHtml(data.url) + '</span></div>' +
    '<div style="display:flex;gap:12px;"><span style="padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#10b981;">Free</span>' +
    '<span style="padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:' + theme.bgGlow + ';border:1px solid ' + theme.borderSubtle + ';color:' + theme.secondary + ';">No Signup</span></div>' +
    '</div></div>';
}

function generateSplitHTML(data: PreviewData, theme: ThemeColors): string {
  var featuresHTML = data.features.length > 0
    ? '<div style="display:flex;flex-direction:column;gap:14px;">' +
      data.features.slice(0, 3).map(function (f) {
        return '<div style="display:flex;align-items:center;gap:12px;color:#d0d0d0;font-size:17px;"><span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;background:' + theme.bgGlow + ';border:1px solid ' + theme.borderSubtle + ';border-radius:50%;color:' + theme.primary + ';font-size:12px;font-weight:bold;">&#10003;</span><span>' + escapeHtml(f) + '</span></div>';
      }).join("") + '</div>'
    : "";

  var categoryHTML = data.category
    ? '<div style="display:inline-block;padding:8px 18px;background:' + theme.bgSubtle + ';border:1px solid ' + theme.borderSubtle + ';border-radius:6px;color:' + theme.secondary + ';font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:28px;">' + escapeHtml(data.category) + '</div>'
    : "";

  var demoCardHTML = data.demoInput || data.demoOutput
    ? '<div style="position:absolute;right:80px;top:100px;width:420px;height:380px;background:#1a1a1a;border:2px solid #2a2a2a;border-radius:16px;padding:32px;display:flex;flex-direction:column;">' +
      '<div style="display:flex;flex-direction:column;gap:24px;height:100%;justify-content:center;">' +
      (data.demoInput ? '<div style="display:flex;flex-direction:column;gap:10px;"><span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6a6a6a;">Input</span><div style="padding:16px 20px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:10px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:20px;color:' + theme.secondary + ';letter-spacing:0.05em;">' + escapeHtml(data.demoInput) + '</div></div>' : '') +
      (data.demoInput && data.demoOutput ? '<div style="display:flex;justify-content:center;color:#6a6a6a;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg></div>' : '') +
      (data.demoOutput ? '<div style="display:flex;flex-direction:column;gap:10px;"><span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6a6a6a;">Output</span><div style="padding:16px 20px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:10px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:20px;color:#f5f5f5;">' + escapeHtml(data.demoOutput) + '</div></div>' : '') +
      '</div></div>'
    : "";

  return '<div style="width:1200px;height:630px;background:#0a0a0a;position:relative;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;overflow:hidden;">' +
    '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,' + theme.bgSubtle + ' 0%,transparent 50%);"></div>' +
    '<div style="position:absolute;left:80px;top:100px;width:520px;">' +
    categoryHTML +
    '<h1 style="font-size:52px;font-weight:700;color:#f5f5f5;margin:0 0 20px 0;letter-spacing:-0.025em;line-height:1.1;">' + escapeHtml(data.title) + '</h1>' +
    (data.subtitle ? '<p style="font-size:22px;color:#a0a0a0;margin:0 0 32px 0;line-height:1.5;">' + escapeHtml(data.subtitle) + '</p>' : '') +
    featuresHTML +
    '</div>' +
    demoCardHTML +
    '<div style="position:absolute;left:80px;right:80px;bottom:50px;display:flex;align-items:center;gap:32px;">' +
    '<div style="display:flex;align-items:center;gap:10px;"><svg width="36" height="36" viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" fill="none" stroke="url(#sg1)" stroke-width="3"/><text x="100" y="135" font-family="-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif" font-size="110" font-weight="700" fill="url(#sg1)" text-anchor="middle">M</text><defs><linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:' + theme.primary + '"/><stop offset="100%" style="stop-color:' + theme.secondary + '"/></linearGradient></defs></svg>' +
    '<span style="color:#6a6a6a;">|</span><span style="font-size:18px;color:#6a6a6a;">' + escapeHtml(data.url) + '</span></div>' +
    '<div style="display:flex;gap:12px;"><span style="padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#10b981;">Free</span>' +
    '<span style="padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:' + theme.bgGlow + ';border:1px solid ' + theme.borderSubtle + ';color:' + theme.secondary + ';">No Signup</span></div>' +
    '</div></div>';
}

var minimalPreviewHtml = computed(function getMinimal() {
  return generateMinimalHTML(currentData.value, currentTheme.value);
});

var gradientPreviewHtml = computed(function getGradient() {
  return generateGradientHTML(currentData.value, currentTheme.value);
});

var splitPreviewHtml = computed(function getSplit() {
  return generateSplitHTML(currentData.value, currentTheme.value);
});

function selectTemplate(templateId: string): void {
  if (!templateId || !TEMPLATES[templateId]) return;
  var template = TEMPLATES[templateId];
  titleInput.value = template.title;
  subtitleInput.value = template.subtitle;
  categoryInput.value = template.category;
  featuresInput.value = template.features.join(", ");
  iconSelect.value = template.icon;
  selectedTheme.value = template.theme;
  demoInput.value = template.demoInput;
  demoOutput.value = template.demoOutput;
}

function selectTheme(theme: string): void {
  selectedTheme.value = theme;
}

async function downloadVariant(variant: string): Promise<void> {
  downloadingVariant.value = variant;
  try {
    var tempContainer = document.createElement("div");
    tempContainer.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    if (variant === "minimal") {
      tempContainer.innerHTML = minimalPreviewHtml.value;
    } else if (variant === "gradient") {
      tempContainer.innerHTML = gradientPreviewHtml.value;
    } else if (variant === "split") {
      tempContainer.innerHTML = splitPreviewHtml.value;
    }
    document.body.appendChild(tempContainer);
    var renderTarget = tempContainer.firstElementChild as HTMLElement;
    await new Promise(function (resolve) { requestAnimationFrame(resolve); });
    var dataUrl = await toPng(renderTarget, { width: 1200, height: 630, pixelRatio: 2, cacheBust: true, backgroundColor: "#0a0a0a" });
    document.body.removeChild(tempContainer);
    var link = document.createElement("a");
    link.download = "og-" + variant + "-" + (currentData.value.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) || "preview") + ".png";
    link.href = dataUrl;
    link.click();
  } catch (err) {
    logger.error("Failed to generate image:", err);
    alert("Failed to generate image. Please try again.");
  } finally {
    downloadingVariant.value = null;
  }
}

async function copyVariantToClipboard(variant: string): Promise<void> {
  copyingVariant.value = variant;
  try {
    var tempContainer = document.createElement("div");
    tempContainer.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    if (variant === "minimal") {
      tempContainer.innerHTML = minimalPreviewHtml.value;
    } else if (variant === "gradient") {
      tempContainer.innerHTML = gradientPreviewHtml.value;
    } else if (variant === "split") {
      tempContainer.innerHTML = splitPreviewHtml.value;
    }
    document.body.appendChild(tempContainer);
    var renderTarget = tempContainer.firstElementChild as HTMLElement;
    await new Promise(function (resolve) { requestAnimationFrame(resolve); });
    var blob = await toBlob(renderTarget, { width: 1200, height: 630, pixelRatio: 2, cacheBust: true, backgroundColor: "#0a0a0a" });
    document.body.removeChild(tempContainer);
    if (!blob) throw new Error("Failed to generate image blob");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  } catch (err) {
    logger.error("Failed to copy image:", err);
    alert("Failed to copy to clipboard. Try using the Download button instead.");
  } finally {
    setTimeout(function () { copyingVariant.value = null; }, 2000);
  }
}

async function copyShareLink(): Promise<void> {
  var params = new URLSearchParams();
  params.set("title", titleInput.value);
  params.set("subtitle", subtitleInput.value);
  params.set("category", categoryInput.value);
  params.set("url", urlInput.value);
  params.set("features", featuresInput.value);
  params.set("icon", iconSelect.value);
  params.set("theme", selectedTheme.value);
  params.set("demoInput", demoInput.value);
  params.set("demoOutput", demoOutput.value);
  var shareUrl = window.location.origin + window.location.pathname + "?" + params.toString();
  await copy(shareUrl);
  linkCopied.value = true;
  setTimeout(function () { linkCopied.value = false; }, 2000);
}

watch(selectedTemplate, function onTemplateChange(newTemplate) {
  if (newTemplate) selectTemplate(newTemplate);
});

onMounted(function () {
  var params = new URLSearchParams(window.location.search);
  if (params.has("title")) titleInput.value = params.get("title") || "";
  if (params.has("subtitle")) subtitleInput.value = params.get("subtitle") || "";
  if (params.has("category")) categoryInput.value = params.get("category") || "";
  if (params.has("url")) urlInput.value = params.get("url") || "";
  if (params.has("features")) featuresInput.value = params.get("features") || "";
  if (params.has("icon")) iconSelect.value = params.get("icon") || "none";
  if (params.has("theme")) selectedTheme.value = params.get("theme") || "blue";
  if (params.has("demoInput")) demoInput.value = params.get("demoInput") || "";
  if (params.has("demoOutput")) demoOutput.value = params.get("demoOutput") || "";
});
</script>

<template>
  <div class="social-preview-tool">
    <!-- Input Form -->
    <div class="tool-card input-section">
      <div class="section-header input-header">
        <h2>Create Your Preview</h2>
        <div class="template-selector">
          <span class="template-label">Quick start:</span>
          <select v-model="selectedTemplate" class="template-dropdown">
            <option value="">Choose a template...</option>
            <option value="devtool">Developer Tool</option>
            <option value="blog">Blog Post</option>
            <option value="saas">SaaS Product</option>
            <option value="opensource">Open Source Project</option>
            <option value="course">Online Course</option>
          </select>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group full-width">
          <label>Title <span class="required">*</span></label>
          <input v-model="titleInput" type="text" placeholder="e.g., AI-Powered Code Reviews" maxlength="60" />
          <span class="char-count">{{ titleInput.length }}/60</span>
        </div>
        <div class="form-group full-width">
          <label>Subtitle / Description</label>
          <input v-model="subtitleInput" type="text" placeholder="e.g., Ship 10x faster with intelligent PR analysis" maxlength="120" />
          <span class="char-count">{{ subtitleInput.length }}/120</span>
        </div>
        <div class="form-group">
          <label>Category / Badge</label>
          <input v-model="categoryInput" type="text" placeholder="e.g., Developer Tool" maxlength="20" />
        </div>
        <div class="form-group">
          <label>URL</label>
          <input v-model="urlInput" type="text" placeholder="your-site.com" maxlength="40" />
        </div>
        <div class="form-group full-width">
          <label>Features (comma-separated)</label>
          <input v-model="featuresInput" type="text" placeholder="e.g., Free Trial, GitHub Integration, Slack Alerts" />
        </div>
        <div class="form-group">
          <label>Icon (Gradient variant)</label>
          <select v-model="iconSelect">
            <option value="none">No Icon</option>
            <option value="clock">Clock / Schedule</option>
            <option value="code">Code / Developer</option>
            <option value="chart">Chart / Analytics</option>
            <option value="lightbulb">Lightbulb / Ideas</option>
            <option value="rocket">Rocket / Launch</option>
            <option value="tool">Tool / Utility</option>
          </select>
        </div>
        <div class="form-group">
          <label>Color Theme</label>
          <div class="theme-options">
            <button v-for="(theme, key) in THEMES" :key="key" type="button" class="theme-btn" :class="{ active: selectedTheme === key }" :title="key" @click="selectTheme(key)">
              <span class="theme-swatch" :style="{ background: theme.gradient }"></span>
            </button>
          </div>
        </div>
        <div class="form-group full-width">
          <label>Demo (Split variant)</label>
          <div class="demo-inputs">
            <input v-model="demoInput" type="text" placeholder="Input: PR #1247" maxlength="30" />
            <input v-model="demoOutput" type="text" placeholder="Output: 3 issues found" maxlength="40" />
          </div>
        </div>
      </div>
    </div>

    <!-- Previews Section -->
    <div class="tool-card previews-section">
      <div class="section-header">
        <div>
          <h2>Preview & Download</h2>
          <p class="section-note">Click any variant to download as PNG (1200x630)</p>
        </div>
        <button type="button" class="share-link-btn" :class="{ copied: linkCopied }" @click="copyShareLink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <span class="btn-text">{{ linkCopied ? 'Copied!' : 'Share Link' }}</span>
        </button>
      </div>

      <div class="variants-grid">
        <div v-for="variant in ['minimal', 'gradient', 'split']" :key="variant" class="variant-wrapper">
          <div class="variant-header">
            <h3>{{ variant === 'minimal' ? 'Minimal Pro' : variant === 'gradient' ? 'Gradient Glow' : 'Split Card' }}</h3>
            <div class="variant-actions">
              <button type="button" class="copy-btn" :class="{ copied: copyingVariant === variant }" @click="copyVariantToClipboard(variant)">
                <svg v-if="copyingVariant !== variant" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span class="btn-text">{{ copyingVariant === variant ? 'Copied!' : 'Copy' }}</span>
              </button>
              <button type="button" class="download-btn" :disabled="downloadingVariant === variant" @click="downloadVariant(variant)">
                <svg v-if="downloadingVariant !== variant" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <span class="btn-text">{{ downloadingVariant === variant ? 'Generating...' : 'Download' }}</span>
              </button>
            </div>
          </div>
          <div class="variant-preview">
            <div class="preview-scale-wrapper">
              <div class="preview-canvas" v-html="variant === 'minimal' ? minimalPreviewHtml : variant === 'gradient' ? gradientPreviewHtml : splitPreviewHtml"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform Tabs -->
    <div class="tool-card platform-section">
      <h2>See How It Looks</h2>
      <p class="section-note">Preview your image on popular platforms</p>
      <div class="platform-tabs">
        <button v-for="platform in ['twitter', 'linkedin', 'slack']" :key="platform" type="button" class="platform-tab" :class="{ active: activePlatform === platform }" @click="activePlatform = platform">
          <template v-if="platform === 'twitter'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
            X / Twitter
          </template>
          <template v-else-if="platform === 'linkedin'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path></svg>
            LinkedIn
          </template>
          <template v-else>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"></path></svg>
            Slack
          </template>
        </button>
      </div>

      <!-- Twitter Mockup -->
      <div v-if="activePlatform === 'twitter'" class="platform-mockup twitter-mockup">
        <div class="tweet-container">
          <div class="tweet-header">
            <div class="tweet-avatar"></div>
            <div class="tweet-user">
              <span class="tweet-name">Your Name</span>
              <span class="tweet-handle">@yourhandle</span>
            </div>
          </div>
          <p class="tweet-text">Check out this awesome tool I just found! 🚀</p>
          <div class="tweet-card">
            <div class="tweet-card-image" v-html="minimalPreviewHtml"></div>
            <div class="tweet-card-content">
              <span class="tweet-card-url">{{ currentData.url }}</span>
              <span class="tweet-card-title">{{ currentData.title }}</span>
              <span class="tweet-card-desc">{{ currentData.subtitle }}</span>
            </div>
          </div>
          <div class="tweet-actions"><span>💬 12</span><span>🔄 48</span><span>❤️ 256</span><span>📊 1.2K</span></div>
        </div>
      </div>

      <!-- LinkedIn Mockup -->
      <div v-else-if="activePlatform === 'linkedin'" class="platform-mockup linkedin-mockup">
        <div class="linkedin-post">
          <div class="linkedin-header">
            <div class="linkedin-avatar"></div>
            <div class="linkedin-user">
              <span class="linkedin-name">Your Name</span>
              <span class="linkedin-meta">Developer • 2h</span>
            </div>
          </div>
          <p class="linkedin-text">Excited to share this tool with my network! Perfect for anyone building a personal brand online.</p>
          <div class="linkedin-card">
            <div class="linkedin-card-image" v-html="minimalPreviewHtml"></div>
            <div class="linkedin-card-content">
              <span class="linkedin-card-title">{{ currentData.title }}</span>
              <span class="linkedin-card-url">{{ currentData.url }}</span>
            </div>
          </div>
          <div class="linkedin-actions"><span>👍 128</span><span>💬 24</span><span>🔄 18</span></div>
        </div>
      </div>

      <!-- Slack Mockup -->
      <div v-else class="platform-mockup slack-mockup">
        <div class="slack-message">
          <div class="slack-avatar"></div>
          <div class="slack-content">
            <div class="slack-header">
              <span class="slack-name">teammate</span>
              <span class="slack-time">10:32 AM</span>
            </div>
            <p class="slack-text">Hey check this out! 👀</p>
            <div class="slack-unfurl">
              <div class="slack-unfurl-bar"></div>
              <div class="slack-unfurl-content">
                <span class="slack-site">{{ currentData.url }}</span>
                <span class="slack-title">{{ currentData.title }}</span>
                <span class="slack-desc">{{ currentData.subtitle }}</span>
                <div class="slack-image" v-html="minimalPreviewHtml"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Form Section */
.input-section { margin-bottom: var(--space-lg); }
.section-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-md); margin-bottom: var(--space-lg); }
.section-header h2 { font-size: 1.25rem; margin: 0; }
.input-header { margin-bottom: var(--space-lg); }
.template-selector { display: flex; align-items: center; gap: var(--space-sm); }
.template-label { font-size: 0.875rem; color: var(--color-text-dim); }
.template-dropdown { padding: 0.5rem 1rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); color: var(--color-text); font-size: 0.875rem; cursor: pointer; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.form-group { display: flex; flex-direction: column; gap: var(--space-xs); }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-muted); }
.form-group .required { color: var(--color-error); }
.form-group input, .form-group select { padding: 0.75rem 1rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); color: var(--color-text); font-size: 0.9375rem; }
.form-group input:focus, .form-group select:focus { outline: none; border-color: var(--color-accent); }
.char-count { font-size: 0.75rem; color: var(--color-text-dim); text-align: right; }
.theme-options { display: flex; gap: var(--space-xs); }
.theme-btn { width: 32px; height: 32px; padding: 3px; background: transparent; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all var(--transition-fast); }
.theme-btn:hover { border-color: var(--color-border); }
.theme-btn.active { border-color: var(--color-accent); }
.theme-swatch { display: block; width: 100%; height: 100%; border-radius: 4px; }
.demo-inputs { display: flex; gap: var(--space-sm); }
.demo-inputs input { flex: 1; }

/* Previews Section */
.section-note { font-size: 0.875rem; color: var(--color-text-dim); margin-top: var(--space-xs); }
.share-link-btn { display: flex; align-items: center; gap: var(--space-xs); padding: 0.5rem 1rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); color: var(--color-text-muted); font-size: 0.875rem; cursor: pointer; transition: all var(--transition-fast); }
.share-link-btn:hover { border-color: var(--color-accent); color: var(--color-text); }
.share-link-btn.copied { border-color: var(--color-success); color: var(--color-success); }
.variants-grid { display: grid; gap: var(--space-xl); }
.variant-wrapper { display: flex; flex-direction: column; gap: var(--space-sm); }
.variant-header { display: flex; justify-content: space-between; align-items: center; }
.variant-header h3 { font-size: 1rem; margin: 0; }
.variant-actions { display: flex; gap: var(--space-xs); }
.copy-btn, .download-btn { display: flex; align-items: center; gap: var(--space-xs); padding: 0.5rem 0.75rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); color: var(--color-text-muted); font-size: 0.8125rem; cursor: pointer; transition: all var(--transition-fast); }
.copy-btn:hover, .download-btn:hover { border-color: var(--color-accent); color: var(--color-text); }
.copy-btn.copied { border-color: var(--color-success); color: var(--color-success); }
.variant-preview { position: relative; width: 100%; aspect-ratio: 1200 / 630; background: #0a0a0a; border-radius: var(--border-radius-md); overflow: hidden; }
.preview-scale-wrapper { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.preview-canvas { width: 1200px; height: 630px; transform-origin: center; transform: scale(var(--preview-scale, 0.3)); }
.variant-preview { container-type: inline-size; }
@container (min-width: 600px) { .preview-canvas { --preview-scale: 0.5; } }
@container (max-width: 599px) { .preview-canvas { --preview-scale: 0.28; } }

/* Platform Section */
.platform-section h2 { font-size: 1.25rem; margin-bottom: var(--space-xs); }
.platform-tabs { display: flex; gap: var(--space-xs); margin-bottom: var(--space-lg); }
.platform-tab { display: flex; align-items: center; gap: var(--space-xs); padding: 0.75rem 1rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); color: var(--color-text-muted); font-size: 0.875rem; cursor: pointer; transition: all var(--transition-fast); }
.platform-tab:hover { border-color: var(--color-border-hover); }
.platform-tab.active { background: var(--color-bg-elevated); border-color: var(--color-accent); color: var(--color-text); }
.platform-mockup { padding: var(--space-lg); background: var(--color-bg); border-radius: var(--border-radius-md); }

/* Twitter Mockup */
.tweet-container { max-width: 600px; }
.tweet-header { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-sm); }
.tweet-avatar { width: 48px; height: 48px; background: var(--color-bg-elevated); border-radius: 50%; }
.tweet-user { display: flex; flex-direction: column; }
.tweet-name { font-weight: 600; color: var(--color-text); }
.tweet-handle { font-size: 0.875rem; color: var(--color-text-dim); }
.tweet-text { margin-bottom: var(--space-md); color: var(--color-text); }
.tweet-card { border: 1px solid var(--color-border); border-radius: var(--border-radius-md); overflow: hidden; margin-bottom: var(--space-md); }
.tweet-card-image { width: 100%; aspect-ratio: 1200 / 630; overflow: hidden; }
.tweet-card-image :deep(> div) { transform: scale(0.5); transform-origin: top left; width: 200%; height: 200%; }
.tweet-card-content { padding: var(--space-sm); background: var(--color-bg-elevated); }
.tweet-card-url { display: block; font-size: 0.75rem; color: var(--color-text-dim); margin-bottom: 2px; }
.tweet-card-title { display: block; font-weight: 500; color: var(--color-text); margin-bottom: 2px; }
.tweet-card-desc { display: block; font-size: 0.875rem; color: var(--color-text-muted); }
.tweet-actions { display: flex; gap: var(--space-lg); font-size: 0.875rem; color: var(--color-text-dim); }

/* LinkedIn Mockup */
.linkedin-post { max-width: 600px; }
.linkedin-header { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-sm); }
.linkedin-avatar { width: 48px; height: 48px; background: var(--color-bg-elevated); border-radius: 50%; }
.linkedin-user { display: flex; flex-direction: column; }
.linkedin-name { font-weight: 600; color: var(--color-text); }
.linkedin-meta { font-size: 0.75rem; color: var(--color-text-dim); }
.linkedin-text { margin-bottom: var(--space-md); color: var(--color-text); }
.linkedin-card { border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); overflow: hidden; margin-bottom: var(--space-md); }
.linkedin-card-image { width: 100%; aspect-ratio: 1200 / 630; overflow: hidden; }
.linkedin-card-image :deep(> div) { transform: scale(0.5); transform-origin: top left; width: 200%; height: 200%; }
.linkedin-card-content { padding: var(--space-sm); background: var(--color-bg-elevated); }
.linkedin-card-title { display: block; font-weight: 500; color: var(--color-text); margin-bottom: 2px; }
.linkedin-card-url { display: block; font-size: 0.75rem; color: var(--color-text-dim); }
.linkedin-actions { display: flex; gap: var(--space-lg); font-size: 0.875rem; color: var(--color-text-dim); }

/* Slack Mockup */
.slack-message { display: flex; gap: var(--space-sm); max-width: 700px; }
.slack-avatar { width: 36px; height: 36px; background: var(--color-bg-elevated); border-radius: 4px; flex-shrink: 0; }
.slack-content { flex: 1; }
.slack-header { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: 4px; }
.slack-name { font-weight: 600; color: var(--color-text); }
.slack-time { font-size: 0.75rem; color: var(--color-text-dim); }
.slack-text { margin-bottom: var(--space-sm); color: var(--color-text); }
.slack-unfurl { display: flex; gap: var(--space-sm); }
.slack-unfurl-bar { width: 4px; background: var(--color-border); border-radius: 2px; flex-shrink: 0; }
.slack-unfurl-content { display: flex; flex-direction: column; gap: 4px; }
.slack-site { font-size: 0.75rem; color: var(--color-text-dim); }
.slack-title { font-weight: 500; color: var(--color-accent); }
.slack-desc { font-size: 0.875rem; color: var(--color-text-muted); }
.slack-image { width: 360px; aspect-ratio: 1200 / 630; border-radius: var(--border-radius-sm); overflow: hidden; margin-top: var(--space-sm); }
.slack-image :deep(> div) { transform: scale(0.3); transform-origin: top left; width: 333%; height: 333%; }

/* Responsive */
@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .template-selector { width: 100%; }
  .template-dropdown { flex: 1; }
  .demo-inputs { flex-direction: column; }
  .platform-tabs { flex-wrap: wrap; }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
