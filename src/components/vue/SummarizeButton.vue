<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAIInference } from "@/composables/useAIInference";
import { usePirsch } from "@/composables/usePirsch";
import AILoadingBar from "@/components/vue/ui/AILoadingBar.vue";
import AIPrivacyNotice from "@/components/vue/ui/AIPrivacyNotice.vue";

var {
  loadModel,
  generate,
  progress,
  status,
  isLoading,
  isReady,
  downloadedMB,
  totalMB,
} = useAIInference();
var { trackEvent, trackAIModelLoaded, trackAIQuery, trackAIError } =
  usePirsch();

var isOpen = ref(false);
var isProcessing = ref(false);
var summary = ref<string | null>(null);
var error = ref<string | null>(null);
var showDownloadPrompt = ref(false);
var postContent = ref("");

onMounted(function extractContent() {
  // Extract text content from the article
  var article = document.querySelector("article.prose, .post-content");
  if (article) {
    postContent.value = article.textContent?.trim().slice(0, 4000) || "";
  }
});

function handleClick() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && status.value === "idle" && !summary.value) {
    showDownloadPrompt.value = true;
  }
  trackEvent("blog_summarize_clicked");
}

async function handleDownloadModel() {
  showDownloadPrompt.value = false;
  try {
    await loadModel();
    trackAIModelLoaded();
    await generateSummary();
  } catch (e) {
    error.value = "Failed to load AI model. Please try again.";
    trackAIError("blog-summarize", e instanceof Error ? e.message : "unknown");
  }
}

async function generateSummary() {
  if (!isReady.value || !postContent.value) {
    return;
  }

  isProcessing.value = true;
  error.value = null;

  try {
    var prompt = `Summarize this blog post in 3-5 bullet points. Be concise and capture the key takeaways.

Article:
${postContent.value}

Summary (bullet points):`;

    var result = await generate(prompt, { maxTokens: 200, temperature: 0.3 });

    // Clean up the result
    var cleanResult = result.replace(prompt, "").trim();
    if (cleanResult.startsWith("Summary")) {
      cleanResult = cleanResult.replace(/^Summary[^:]*:?\s*/i, "").trim();
    }

    summary.value = cleanResult || "Could not generate summary.";
    trackAIQuery("blog-summarize");
  } catch (e) {
    error.value = "Failed to generate summary. Please try again.";
    trackAIError("blog-summarize", e instanceof Error ? e.message : "unknown");
  } finally {
    isProcessing.value = false;
  }
}

async function handleGenerateClick() {
  if (status.value === "idle") {
    showDownloadPrompt.value = true;
  } else if (isReady.value) {
    await generateSummary();
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

      <!-- Download prompt -->
      <div v-if="showDownloadPrompt" class="download-prompt">
        <p>Download AI model (~300MB) to generate summary?</p>
        <p class="download-note">Runs 100% locally in your browser.</p>
        <button class="download-btn" @click="handleDownloadModel">
          Download &amp; Summarize
        </button>
      </div>

      <!-- Loading bar -->
      <AILoadingBar
        v-if="isLoading"
        :progress="progress"
        :downloadedMB="downloadedMB"
        :totalMB="totalMB"
      />

      <!-- Processing -->
      <div v-if="isProcessing" class="processing">
        <span class="spinner"></span>
        Generating summary...
      </div>

      <!-- Summary result -->
      <div v-if="summary && !isProcessing" class="summary-result">
        <div class="summary-content" v-html="formatSummary(summary)"></div>
        <button
          class="regenerate-btn"
          @click="handleGenerateClick"
          :disabled="isProcessing || isLoading"
        >
          Regenerate
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="error">
        {{ error }}
      </div>

      <!-- Generate button when model ready but no summary yet -->
      <div
        v-if="isReady && !summary && !isProcessing && !showDownloadPrompt"
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

.download-prompt {
  text-align: center;
  padding: var(--space-md);
}

.download-prompt p {
  margin: 0 0 var(--space-xs) 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.download-note {
  font-size: var(--text-xs) !important;
  opacity: 0.7;
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
