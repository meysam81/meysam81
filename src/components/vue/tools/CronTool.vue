<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import cronstrue from "cronstrue";
import { CronExpressionParser } from "cron-parser";
import { englishToCron, validateCron } from "@/utils/cron";
import { useClipboard } from "@/composables/useClipboard";
import { useToolState } from "@/composables/useToolState";
import { useDebounceFn } from "@/composables/useDebounce";
import { useToast } from "@/composables/useToast";
import { useAIInference } from "@/composables/useAIInference";
import { usePirsch } from "@/composables/usePirsch";
import AIToggle from "@/components/vue/ui/AIToggle.vue";
import AILoadingBar from "@/components/vue/ui/AILoadingBar.vue";
import AIPrivacyNotice from "@/components/vue/ui/AIPrivacyNotice.vue";

interface Props {
  presets: Array<{ label: string; expression: string }>;
  examplePhrases: Array<{ phrase: string; expression: string }>;
}

var props = defineProps<Props>();

var { copied, copy } = useClipboard();
var { error, setError, clearMessages } = useToolState({ name: "CronTool" });

var mode = ref<"english" | "expression">("english");
var englishInput = ref("");
var expressionInput = ref("");
var currentExpression = ref("* * * * *");
var showAllExamples = ref(false);
var runsExpanded = ref(true);
var { visible: shareToastVisible, show: showShareToast } = useToast();

// AI Mode state
var aiModeEnabled = ref(false);
var aiIsProcessing = ref(false);
var aiError = ref<string | null>(null);
var showAIDownloadPrompt = ref(false);
var aiBackendInfo = ref<{
  webgpu: boolean;
  wasm: boolean;
  recommended: string;
} | null>(null);

var {
  loadModel,
  generate,
  checkBackendSupport,
  progress,
  status,
  isLoading,
  isReady,
  downloadedMB,
  totalMB,
  backend,
} = useAIInference();
var { trackAIToggleOn, trackAIModelLoaded, trackAIQuery, trackAIError } =
  usePirsch();

var humanReadable = computed(function computeHumanReadable() {
  try {
    return cronstrue.toString(currentExpression.value, { verbose: true });
  } catch {
    return "Unable to describe expression";
  }
});

var nextRuns = computed(function computeNextRuns() {
  try {
    var expr = currentExpression.value;

    // Handle special strings
    if (expr.startsWith("@")) {
      var specialMap: Record<string, string> = {
        "@yearly": "0 0 1 1 *",
        "@annually": "0 0 1 1 *",
        "@monthly": "0 0 1 * *",
        "@weekly": "0 0 * * 0",
        "@daily": "0 0 * * *",
        "@midnight": "0 0 * * *",
        "@hourly": "0 * * * *",
      };
      expr = specialMap[expr.toLowerCase()] || expr;
    }

    if (expr === "@reboot") {
      return [{ date: "Runs once at system startup", relative: "" }];
    }

    var interval = CronExpressionParser.parse(expr);
    var runs: Array<{ date: string; relative: string }> = [];

    for (var i = 0; i < 10; i++) {
      var next = interval.next();
      var date = next.toDate();
      runs.push({
        date: formatDate(date),
        relative: getRelativeTime(date),
      });
    }

    return runs;
  } catch {
    return [{ date: "Unable to calculate next runs", relative: "" }];
  }
});

var displayedExamples = computed(function computeDisplayedExamples() {
  return showAllExamples.value
    ? props.examplePhrases
    : props.examplePhrases.slice(0, 24);
});

function formatDate(date: Date): string {
  var options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleDateString("en-US", options);
}

function getRelativeTime(date: Date): string {
  var now = new Date();
  var diff = date.getTime() - now.getTime();
  var minutes = Math.floor(diff / 60000);
  var hours = Math.floor(diff / 3600000);
  var days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return "now";
  }
  if (minutes < 60) {
    return "in " + minutes + " min";
  }
  if (hours < 24) {
    return "in " + hours + " hour" + (hours > 1 ? "s" : "");
  }
  if (days === 1) {
    return "tomorrow";
  }
  return "in " + days + " days";
}

function updateOutput(expression: string): void {
  var validation = validateCron(expression);

  if (!validation.valid) {
    setError(validation.error || "Invalid expression");
    return;
  }

  clearMessages();
  currentExpression.value = expression;
}

var handleEnglishInput = useDebounceFn(function handleEnglish(): void {
  var text = englishInput.value.trim();
  if (!text) {
    clearMessages();
    aiError.value = null;
    return;
  }

  // Use AI if enabled and ready
  if (aiModeEnabled.value && isReady.value) {
    generateWithAI(text);
    return;
  }

  var result = englishToCron(text);
  if (result && result.expression) {
    updateOutput(result.expression);
  } else {
    setError('Could not parse. Try: "every 5 minutes", "daily at 9am"');
  }
}, 300);

async function handleAIToggle(enabled: boolean) {
  aiModeEnabled.value = enabled;
  aiError.value = null;
  if (enabled) {
    trackAIToggleOn("cron");
    if (status.value === "idle") {
      // Check backend support before showing download prompt
      aiBackendInfo.value = await checkBackendSupport();
      showAIDownloadPrompt.value = true;
    }
  } else {
    showAIDownloadPrompt.value = false;
  }
}

async function handleDownloadAIModel() {
  showAIDownloadPrompt.value = false;
  try {
    await loadModel();
    trackAIModelLoaded();
  } catch (e) {
    aiError.value = "Failed to load AI model. Please try again.";
    trackAIError("cron", e instanceof Error ? e.message : "unknown");
  }
}

async function generateWithAI(input: string) {
  if (!isReady.value) {
    return;
  }

  aiIsProcessing.value = true;
  aiError.value = null;
  clearMessages();

  try {
    var prompt = `Convert this natural language schedule to a cron expression. Only output the cron expression, nothing else.

Input: "${input}"
Cron expression:`;

    var result = await generate(prompt, { maxTokens: 50, temperature: 0.1 });

    // Extract cron expression from result (handle model output format)
    var cronMatch = result.match(
      /(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)/,
    );

    if (cronMatch) {
      var extractedCron = cronMatch[0].trim();

      // Validate with cron-parser before using
      var validation = validateCron(extractedCron);
      if (validation.valid) {
        currentExpression.value = extractedCron;
        trackAIQuery("cron");
      } else {
        aiError.value =
          "AI generated an invalid cron expression. Try being more specific.";
      }
    } else {
      aiError.value =
        "Could not parse AI response. Try rephrasing your schedule.";
    }
  } catch (e) {
    aiError.value = "AI generation failed. Please try again.";
    trackAIError("cron", e instanceof Error ? e.message : "unknown");
  } finally {
    aiIsProcessing.value = false;
  }
}

var handleExpressionInput = useDebounceFn(function handleExpression(): void {
  var expr = expressionInput.value.trim();
  if (!expr) {
    clearMessages();
    return;
  }
  updateOutput(expr);
}, 300);

function setMode(newMode: "english" | "expression"): void {
  mode.value = newMode;
}

function applyPreset(expression: string): void {
  expressionInput.value = expression;
  setMode("expression");
  updateOutput(expression);
}

function applyExample(phrase: string): void {
  englishInput.value = phrase;
  setMode("english");
  var result = englishToCron(phrase);
  if (result && result.expression) {
    updateOutput(result.expression);
  }
}

async function copyExpression(): Promise<void> {
  await copy(currentExpression.value);
}

async function shareLink(): Promise<void> {
  var url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("expr", btoa(currentExpression.value));
  await copy(url.toString());
  showShareToast("Link copied!");
}

function toggleRuns(): void {
  runsExpanded.value = !runsExpanded.value;
}

watch(englishInput, handleEnglishInput);
watch(expressionInput, handleExpressionInput);

onMounted(function handleMount() {
  // Check URL for shared expression
  var params = new URLSearchParams(window.location.search);
  var expr = params.get("expr");
  if (expr) {
    try {
      var decoded = atob(expr);
      currentExpression.value = decoded;
      expressionInput.value = decoded;
      setMode("expression");
    } catch {
      // Ignore invalid URL params
    }
  }
});
</script>

<template>
  <div class="cron-tool">
    <!-- AI Mode Section -->
    <div class="ai-section">
      <AIToggle
        v-model="aiModeEnabled"
        :disabled="aiIsProcessing"
        @update:modelValue="handleAIToggle"
      />

      <AIPrivacyNotice v-if="aiModeEnabled" />

      <!-- Download prompt -->
      <div v-if="showAIDownloadPrompt" class="ai-download-prompt">
        <p>
          Download AI model (~400MB) for smarter natural language understanding?
        </p>
        <div v-if="aiBackendInfo" class="ai-backend-info">
          <span v-if="aiBackendInfo.webgpu" class="backend-badge webgpu">
            ⚡ WebGPU available (fast)
          </span>
          <span v-else class="backend-badge wasm">
            🔧 Using WASM (slower but works everywhere)
          </span>
        </div>
        <button class="ai-download-btn" @click="handleDownloadAIModel">
          Download AI Model
        </button>
      </div>

      <!-- Loading bar -->
      <AILoadingBar
        v-if="isLoading"
        :progress="progress"
        :downloadedMB="downloadedMB"
        :totalMB="totalMB"
      />

      <!-- AI error message -->
      <div v-if="aiError" class="ai-error">
        {{ aiError }}
      </div>

      <!-- AI processing indicator -->
      <div v-if="aiIsProcessing" class="ai-processing">
        <span class="spinner"></span> AI is thinking...
      </div>
    </div>

    <!-- Mode Toggle -->
    <div class="mode-toggle">
      <button
        type="button"
        class="mode-btn"
        :class="{ active: mode === 'english' }"
        @click="setMode('english')"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          />
        </svg>
        Plain English
      </button>
      <button
        type="button"
        class="mode-btn"
        :class="{ active: mode === 'expression' }"
        @click="setMode('expression')"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        Cron Expression
      </button>
    </div>

    <!-- English Input Mode -->
    <div v-if="mode === 'english'" class="input-section">
      <label for="english-input" class="input-label"
        >Describe your schedule</label
      >
      <input
        id="english-input"
        v-model="englishInput"
        type="text"
        class="main-input"
        placeholder="e.g., every weekday at 9am, every 5 minutes, first monday of month..."
        autocomplete="off"
        spellcheck="false"
      />
      <div class="input-hint">
        Try: "every 5 minutes", "daily at 9am", "every friday at 5pm", "first
        monday of month"
      </div>
    </div>

    <!-- Expression Input Mode -->
    <div v-else class="input-section">
      <label for="expression-input" class="input-label"
        >Enter cron expression</label
      >
      <input
        id="expression-input"
        v-model="expressionInput"
        type="text"
        class="main-input mono"
        placeholder="* * * * *"
        autocomplete="off"
        spellcheck="false"
      />
      <div class="cron-fields">
        <span>minute</span>
        <span>hour</span>
        <span>day</span>
        <span>month</span>
        <span>weekday</span>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error.message }}
    </div>

    <!-- Output Section -->
    <div class="output-section">
      <div class="output-row">
        <div class="output-label">Cron Expression</div>
        <div class="output-value">
          <code class="cron-expression">{{ currentExpression }}</code>
          <button
            type="button"
            class="copy-btn"
            :class="{ copied }"
            aria-label="Copy expression"
            @click="copyExpression"
          >
            <svg
              v-if="!copied"
              class="copy-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path
                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
              />
            </svg>
            <svg
              v-else
              class="check-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="output-row">
        <div class="output-label">Human Readable</div>
        <div class="output-value">
          <span class="human-text">{{ humanReadable }}</span>
        </div>
      </div>

      <!-- Next Runs -->
      <div class="next-runs">
        <div class="next-runs-header">
          <span class="output-label">Next 10 Runs</span>
          <button
            type="button"
            class="toggle-runs"
            :class="{ collapsed: !runsExpanded }"
            :aria-expanded="runsExpanded"
            @click="toggleRuns"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        <div v-if="runsExpanded" class="next-runs-list">
          <div
            v-for="(run, index) in nextRuns"
            :key="index"
            class="next-run-item"
          >
            <span class="run-date">{{ run.date }}</span>
            <span v-if="run.relative" class="run-relative">{{
              run.relative
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Button -->
    <div class="share-section">
      <button type="button" class="btn btn-secondary" @click="shareLink">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share Link
      </button>
      <span v-if="shareToastVisible" class="share-toast">Link copied!</span>
    </div>
  </div>

  <!-- Presets Section -->
  <div class="tool-card presets-section">
    <h2>Common Schedules</h2>
    <div class="presets-grid">
      <button
        v-for="preset in presets"
        :key="preset.expression"
        type="button"
        class="preset-btn"
        @click="applyPreset(preset.expression)"
      >
        <span class="preset-label">{{ preset.label }}</span>
        <code class="preset-expression">{{ preset.expression }}</code>
      </button>
    </div>
  </div>

  <!-- Example Phrases -->
  <div class="tool-card examples-section">
    <h2>Example Phrases</h2>
    <p class="examples-intro">Click any phrase to try it:</p>
    <div class="examples-grid">
      <button
        v-for="example in displayedExamples"
        :key="example.phrase"
        type="button"
        class="example-btn"
        @click="applyExample(example.phrase)"
      >
        {{ example.phrase }}
      </button>
    </div>
    <button
      v-if="!showAllExamples && examplePhrases.length > 24"
      type="button"
      class="btn btn-secondary mt-lg"
      @click="showAllExamples = true"
    >
      Show More Examples
    </button>
  </div>
</template>

<style scoped>
/* AI Section */
.ai-section {
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.ai-download-prompt {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  text-align: center;
}

.ai-download-prompt p {
  margin-bottom: var(--space-sm);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.ai-download-btn {
  background: var(--color-accent);
  color: var(--color-bg);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
  font-family: inherit;
}

.ai-download-btn:hover {
  opacity: 0.9;
}

.ai-backend-info {
  margin-bottom: var(--space-sm);
}

.backend-badge {
  display: inline-block;
  padding: var(--space-xxs) var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.backend-badge.webgpu {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.backend-badge.wasm {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}

.ai-error {
  margin-top: var(--space-sm);
  padding: var(--space-sm);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: #ef4444;
  font-size: var(--text-sm);
}

.ai-processing {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.spinner {
  width: 16px;
  height: 16px;
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

/* Mode Toggle */
.mode-toggle {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
  background: var(--color-bg);
  padding: 4px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
}

.mode-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-elevated);
}

.mode-btn.active {
  background: var(--color-accent);
  color: white;
}

/* Input Section */
.input-section {
  margin-bottom: var(--space-lg);
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: var(--space-xs);
}

.main-input {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.125rem;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  transition: all var(--transition-fast);
}

.main-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.main-input.mono {
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.input-hint {
  margin-top: var(--space-xs);
  font-size: 0.8125rem;
  color: var(--color-text-dim);
}

.cron-fields {
  display: flex;
  justify-content: space-around;
  margin-top: var(--space-xs);
  font-size: 0.75rem;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
}

/* Error Message */
.error-message {
  padding: var(--space-sm) var(--space-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: #fca5a5;
  font-size: 0.875rem;
  margin-bottom: var(--space-lg);
}

/* Output Section */
.output-section {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-lg);
}

.output-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.output-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.output-value {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-align: right;
}

.cron-expression {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  color: var(--color-accent-light);
  background: var(--color-bg);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
}

.human-text {
  color: var(--color-text);
  font-size: 1rem;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.copy-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(59, 130, 246, 0.1);
}

.copy-btn.copied,
.copy-btn .check-icon {
  color: var(--color-success);
}

/* Next Runs */
.next-runs {
  padding-top: var(--space-md);
}

.next-runs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.toggle-runs {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-runs:hover {
  color: var(--color-text);
}

.toggle-runs.collapsed svg {
  transform: rotate(-90deg);
}

.next-runs-list {
  display: grid;
  gap: var(--space-xs);
}

.next-run-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.run-date {
  color: var(--color-text);
  font-family: var(--font-mono);
}

.run-relative {
  color: var(--color-text-dim);
}

/* Share Section */
.share-section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
}

.share-toast {
  color: var(--color-success);
  font-size: 0.875rem;
  animation: fadeIn 0.2s ease-out;
}

/* Presets Section */
.presets-section h2 {
  font-size: 1.25rem;
  margin-bottom: var(--space-lg);
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-sm);
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  font-family: inherit;
}

.preset-btn:hover {
  border-color: var(--color-accent);
  background: rgba(59, 130, 246, 0.05);
}

.preset-label {
  font-size: 0.875rem;
  color: var(--color-text);
}

.preset-expression {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

/* Examples Section */
.examples-section h2 {
  font-size: 1.25rem;
  margin-bottom: var(--space-sm);
}

.examples-intro {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  margin-bottom: var(--space-lg);
}

.examples-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.example-btn {
  padding: 0.5rem 0.875rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
}

.example-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent-light);
  background: rgba(59, 130, 246, 0.05);
}

/* NOTE: .tool-card is defined in theme.css as the single source of truth */

.mt-lg {
  margin-top: var(--space-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .mode-btn {
    font-size: 0.8125rem;
    padding: 0.625rem 0.75rem;
  }

  .mode-btn svg {
    display: none;
  }

  .main-input {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  .cron-expression {
    font-size: 1rem;
  }

  .output-row {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .output-value {
    width: 100%;
    justify-content: flex-start;
  }

  .presets-grid {
    grid-template-columns: 1fr;
  }

  .next-run-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
