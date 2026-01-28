<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useChromeAI } from "@/composables/useChromeAI";
import { useAIInference } from "@/composables/useAIInference";
import { useRemoteAI } from "@/composables/useRemoteAI";
import { usePirsch } from "@/composables/usePirsch";
import AILoadingBar from "@/components/vue/ui/AILoadingBar.vue";
import AIPrivacyNotice from "@/components/vue/ui/AIPrivacyNotice.vue";

// Tier 1: Chrome Built-in AI (zero download, instant)
var chromeAI = useChromeAI();

// Tier 2: Local SmolLM2 model (75-140MB download)
var localAI = useAIInference();

// Tier 3: Remote API (with user consent)
var remoteAI = useRemoteAI();

var { trackEvent, trackAIModelLoaded, trackAIQuery, trackAIError } =
  usePirsch();

var isOpen = ref(false);
var isProcessing = ref(false);
var summary = ref<string | null>(null);
var error = ref<string | null>(null);
var showTierOptions = ref(false);
var estimatedModelSize = ref(75);
var postContent = ref("");

// Tier detection state
var currentTier = ref<"chrome" | "local" | "remote" | null>(null);
var tierStatus = ref<string>("");
var chromeAvailable = ref<boolean | null>(null);

// Computed states
var isLocalLoading = computed(function computeLocalLoading() {
  return localAI.isLoading.value;
});

var isLocalReady = computed(function computeLocalReady() {
  return localAI.isReady.value;
});

onMounted(async function init() {
  // Extract text content from the article
  var article = document.querySelector("article.prose, .post-content");
  if (article) {
    postContent.value = article.textContent?.trim().slice(0, 4000) || "";
  }

  // Pre-check Chrome AI availability
  chromeAvailable.value = await chromeAI.checkAvailability();
});

async function handleClick() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && !summary.value) {
    // Check available tiers
    if (chromeAvailable.value) {
      // Chrome AI available - can summarize instantly
      tierStatus.value = "Chrome AI ready (instant)";
    } else if (localAI.isReady.value) {
      // Local model already loaded
      tierStatus.value = "Local AI ready";
    } else {
      // Show tier options
      var backendInfo = await localAI.checkBackendSupport();
      estimatedModelSize.value = backendInfo.estimatedSizeMB;
      showTierOptions.value = true;
    }
  }
  trackEvent("blog_summarize_clicked");
}

async function generateSummary() {
  isProcessing.value = true;
  error.value = null;

  var text = postContent.value;
  if (!text) {
    error.value = "No content to summarize";
    isProcessing.value = false;
    return;
  }

  try {
    // Tier 1: Try Chrome AI first (zero download)
    if (await chromeAI.checkAvailability()) {
      currentTier.value = "chrome";
      tierStatus.value = "Using Chrome AI (instant)";
      var chromeResult = await chromeAI.summarize(text, {
        type: "key-points",
        length: "medium",
      });
      summary.value = chromeResult;
      trackAIQuery("blog-summarize-chrome");
      return;
    }

    // Tier 2: Try local model
    if (localAI.isReady.value) {
      currentTier.value = "local";
      tierStatus.value = "Using local AI";
      var localPrompt = `Summarize this blog post in 3-5 bullet points. Be concise and capture the key takeaways.

Article:
${text.slice(0, 3000)}

Summary (bullet points):`;
      var localResult = await localAI.generate(localPrompt, {
        maxTokens: 200,
        temperature: 0.3,
      });
      var cleanLocalResult = localResult.replace(localPrompt, "").trim();
      if (cleanLocalResult.startsWith("Summary")) {
        cleanLocalResult = cleanLocalResult
          .replace(/^Summary[^:]*:?\s*/i, "")
          .trim();
      }
      summary.value = cleanLocalResult || "Could not generate summary.";
      trackAIQuery("blog-summarize-local");
      return;
    }

    // Tier 3: Remote (needs consent)
    if (remoteAI.hasConsent()) {
      currentTier.value = "remote";
      tierStatus.value = "Using remote AI";
      var remotePrompt = `Summarize this blog post in 3-5 bullet points. Be concise:\n\n${text.slice(0, 2000)}`;
      var remoteResult = await remoteAI.generate(remotePrompt, {
        maxTokens: 200,
      });
      summary.value = remoteResult;
      trackAIQuery("blog-summarize-remote");
      return;
    }

    // No tier available without user action
    error.value = "Please select an AI option to generate summary";
    showTierOptions.value = true;
  } catch (e) {
    error.value = "Failed to generate summary. Please try again.";
    trackAIError("blog-summarize", e instanceof Error ? e.message : "unknown");
  } finally {
    isProcessing.value = false;
  }
}

async function handleChromeAI() {
  showTierOptions.value = false;
  await generateSummary();
}

async function handleDownloadLocal() {
  showTierOptions.value = false;
  try {
    await localAI.loadModel();
    trackAIModelLoaded();
    await generateSummary();
  } catch (e) {
    error.value = "Failed to load AI model. Please try again.";
    trackAIError(
      "blog-summarize-local",
      e instanceof Error ? e.message : "unknown",
    );
  }
}

async function handleRemoteAI() {
  remoteAI.setConsent("once");
  showTierOptions.value = false;
  await generateSummary();
}

function handleEnableRemoteAlways() {
  remoteAI.setConsent("always");
  showTierOptions.value = false;
  generateSummary();
}

async function handleGenerateClick() {
  if (chromeAvailable.value || localAI.isReady.value || remoteAI.hasConsent()) {
    await generateSummary();
  } else {
    showTierOptions.value = true;
  }
}

function formatSummary(text: string): string {
  // Convert bullet points to HTML list
  var lines = text.split("\n").filter(function filterEmpty(line) {
    return line.trim().length > 0;
  });

  var hasBullets = lines.some(function checkBullet(line) {
    return line.trim().match(/^[-•*]\s/);
  });

  if (hasBullets) {
    var items = lines
      .map(function formatLine(line) {
        return "<li>" + line.trim().replace(/^[-•*]\s*/, "") + "</li>";
      })
      .join("");
    return "<ul>" + items + "</ul>";
  }

  return (
    "<p>" + text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") + "</p>"
  );
}

function getTierBadgeClass(tier: string): string {
  switch (tier) {
    case "chrome":
      return "tier-badge tier-chrome";
    case "local":
      return "tier-badge tier-local";
    case "remote":
      return "tier-badge tier-remote";
    default:
      return "tier-badge";
  }
}

function getTierLabel(tier: string): string {
  switch (tier) {
    case "chrome":
      return "Chrome AI";
    case "local":
      return "Local AI";
    case "remote":
      return "Remote AI";
    default:
      return "";
  }
}
</script>

<template>
  <div class="summarize-wrapper">
    <button
      class="summarize-btn"
      :class="{ 'is-open': isOpen }"
      @click="handleClick"
      :aria-expanded="isOpen"
    >
      <svg
        class="sparkles-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
        />
      </svg>
      <span>TL;DR</span>
      <svg
        class="chevron-icon"
        :class="{ 'is-open': isOpen }"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div v-if="isOpen" class="summarize-panel">
      <AIPrivacyNotice />

      <!-- Tier options prompt -->
      <div v-if="showTierOptions" class="tier-options">
        <p class="tier-heading">Choose how to generate summary:</p>

        <!-- Tier 1: Chrome AI (if available) -->
        <button
          v-if="chromeAvailable"
          class="tier-btn tier-chrome-btn"
          @click="handleChromeAI"
        >
          <span class="tier-icon">⚡</span>
          <span class="tier-info">
            <strong>Instant Summary</strong>
            <small>Chrome AI (no download)</small>
          </span>
        </button>

        <!-- Tier 2: Local AI -->
        <button class="tier-btn tier-local-btn" @click="handleDownloadLocal">
          <span class="tier-icon">💻</span>
          <span class="tier-info">
            <strong>Download AI (~{{ estimatedModelSize }}MB)</strong>
            <small>Runs 100% locally in browser</small>
          </span>
        </button>

        <!-- Tier 3: Remote AI -->
        <button class="tier-btn tier-remote-btn" @click="handleRemoteAI">
          <span class="tier-icon">☁️</span>
          <span class="tier-info">
            <strong>Use Remote AI (once)</strong>
            <small>Sends text to HuggingFace API</small>
          </span>
        </button>

        <button
          class="tier-btn tier-remote-always-btn"
          @click="handleEnableRemoteAlways"
        >
          <span class="tier-icon">🔄</span>
          <span class="tier-info">
            <strong>Enable Remote AI (always)</strong>
            <small>Remember my preference</small>
          </span>
        </button>
      </div>

      <!-- Loading bar for local model -->
      <AILoadingBar
        v-if="isLocalLoading"
        :progress="localAI.progress.value"
        :downloadedMB="localAI.downloadedMB.value"
        :totalMB="localAI.totalMB.value"
      />

      <!-- Processing -->
      <div v-if="isProcessing" class="processing">
        <span class="spinner"></span>
        <span>
          Generating summary...
          <span v-if="currentTier" class="tier-status">({{ tierStatus }})</span>
        </span>
      </div>

      <!-- Summary result -->
      <div v-if="summary && !isProcessing" class="summary-result">
        <div class="summary-header">
          <span v-if="currentTier" :class="getTierBadgeClass(currentTier)">
            {{ getTierLabel(currentTier) }}
          </span>
        </div>
        <div class="summary-content" v-html="formatSummary(summary)"></div>
        <button
          class="regenerate-btn"
          @click="handleGenerateClick"
          :disabled="isProcessing || isLocalLoading"
        >
          Regenerate
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="error">
        {{ error }}
      </div>

      <!-- Generate button when ready but no summary yet -->
      <div
        v-if="
          (chromeAvailable || isLocalReady || remoteAI.hasConsent()) &&
          !summary &&
          !isProcessing &&
          !showTierOptions
        "
        class="ready-state"
      >
        <button class="generate-btn" @click="generateSummary">
          Generate Summary
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summarize-wrapper {
  margin: var(--space-lg) 0;
}

.summarize-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-surface-elevated, var(--color-bg-card));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, var(--radius-sm));
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--text-sm);
  transition:
    border-color 0.2s,
    background 0.2s;
}

.summarize-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-surface, var(--color-bg));
}

.summarize-btn.is-open {
  border-color: var(--color-accent);
}

.sparkles-icon {
  width: 18px;
  height: 18px;
  color: var(--color-accent);
}

.chevron-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.chevron-icon.is-open {
  transform: rotate(180deg);
}

.summarize-panel {
  margin-top: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-surface-elevated, var(--color-bg-card));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg, var(--radius));
}

/* Tier options */
.tier-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.tier-heading {
  margin: 0 0 var(--space-xs) 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.tier-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface, var(--color-bg));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, var(--radius-sm));
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.tier-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-surface-elevated, var(--color-bg-card));
}

.tier-icon {
  font-size: var(--text-lg);
}

.tier-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tier-info strong {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.tier-info small {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.tier-chrome-btn {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
}

.tier-remote-always-btn {
  opacity: 0.8;
}

/* Tier badges */
.tier-badge {
  display: inline-block;
  padding: 2px var(--space-xs);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm, 4px);
  font-weight: 500;
}

.tier-chrome {
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
  color: var(--color-accent);
}

.tier-local {
  background: color-mix(in srgb, #10b981 20%, transparent);
  color: #10b981;
}

.tier-remote {
  background: color-mix(in srgb, #f59e0b 20%, transparent);
  color: #f59e0b;
}

.summary-header {
  margin-bottom: var(--space-sm);
}

.tier-status {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.download-btn,
.generate-btn {
  margin-top: var(--space-sm);
  background: var(--color-accent);
  color: var(--color-bg);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md, var(--radius-sm));
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: var(--text-sm);
}

.download-btn:hover,
.generate-btn:hover {
  opacity: 0.9;
}

.processing {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.summary-result {
  padding: var(--space-sm) 0;
}

.summary-content {
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text);
}

.summary-content :deep(ul) {
  margin: 0;
  padding-left: var(--space-lg);
  list-style-type: disc;
}

.summary-content :deep(li) {
  margin-bottom: var(--space-xs);
}

.summary-content :deep(p) {
  margin: 0 0 var(--space-sm) 0;
}

.regenerate-btn {
  margin-top: var(--space-md);
  padding: var(--space-xs) var(--space-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, var(--radius-sm));
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--text-xs);
}

.regenerate-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-text);
}

.regenerate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ready-state {
  text-align: center;
  padding: var(--space-sm);
}

.error {
  padding: var(--space-sm);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md, var(--radius-sm));
  color: #ef4444;
  font-size: var(--text-sm);
}
</style>
