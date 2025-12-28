<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
// Import js-yaml for YAML 1.2 compliance
import * as jsyaml from "js-yaml";
import { useClipboard } from "@/composables/useClipboard";
import { useDownload } from "@/composables/useDownload";
import { useToolState } from "@/composables/useToolState";
import { useDebounceFn } from "@/composables/useDebounce";

interface ParseError {
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

interface DocumentStats {
  lines: number;
  characters: number;
  keys: number;
  maxDepth: number;
}

// Sample content
var SAMPLE_YAML = `# Kubernetes Deployment Example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    spec:
      containers:
        - name: my-app
          image: my-app:1.0.0
          ports:
            - containerPort: 8080`;

var SAMPLE_JSON = `{
  "apiVersion": "v1",
  "kind": "ConfigMap",
  "metadata": {
    "name": "app-config",
    "namespace": "default"
  },
  "data": {
    "database.host": "db.example.com",
    "cache.enabled": "true"
  }
}`;

var ERROR_SUGGESTIONS: Record<string, string> = {
  tab: "YAML requires spaces for indentation, not tabs.",
  indent: "Check that all items at the same level have identical indentation.",
  colon: "Keys must be followed by a colon and a space.",
  duplicate: "Each key must be unique within its parent mapping.",
};

var { copied, copy } = useClipboard();
var { download } = useDownload();
var { error, setError, clearMessages, logger } = useToolState({ name: "YamlJsonTool" });

var inputText = ref("");
var outputText = ref("");
var currentFormat = ref<"yaml" | "json" | null>(null);
var outputFormat = ref<"yaml" | "json" | null>(null);
var currentData = ref<unknown>(null);
var optionMinify = ref(false);
var optionIndent = ref(2);
var optionSortKeys = ref(false);
var errorLine = ref<number | null>(null);

var stats = computed<DocumentStats | null>(function computeStats() {
  if (!currentData.value || !inputText.value) return null;
  return calculateStats(inputText.value, currentData.value);
});

var inputLineNumbers = computed(function computeInputLines() {
  var count = inputText.value.split("\n").length || 1;
  return Array.from({ length: count }, function (_, i) { return i + 1; });
});

var outputLineNumbers = computed(function computeOutputLines() {
  var count = outputText.value.split("\n").length || 1;
  return Array.from({ length: count }, function (_, i) { return i + 1; });
});

var convertButtonText = computed(function computeConvertText() {
  if (currentFormat.value === "yaml") return "Convert to JSON";
  if (currentFormat.value === "json") return "Convert to YAML";
  return "Convert";
});

var formatYamlButtonText = computed(function computeFormatYamlText() {
  return currentFormat.value === "json" ? "Convert to YAML" : "Format YAML";
});

var formatJsonButtonText = computed(function computeFormatJsonText() {
  return currentFormat.value === "yaml" ? "Convert to JSON" : "Format JSON";
});

function detectFormat(text: string): "yaml" | "json" | null {
  var trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      if (hasYamlIndicators(trimmed)) return "yaml";
      return "json";
    }
  }

  if (hasYamlIndicators(trimmed)) return "yaml";
  if (trimmed.startsWith("---") || trimmed.startsWith("%YAML")) return "yaml";
  if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(trimmed)) return "yaml";

  return "yaml";
}

function hasYamlIndicators(text: string): boolean {
  if (text.includes("#")) return true;
  if (/[|>][-+]?\s*$/m.test(text)) return true;
  if (/[&*][a-zA-Z]/.test(text)) return true;
  if (text.includes("---") || text.includes("...")) return true;
  return false;
}

function parseYaml(text: string): { valid: boolean; data?: unknown; error?: ParseError } {
  var trimmed = text.trim();
  if (!trimmed) return { valid: false, error: { message: "Input is empty" } };

  try {
    if (text.includes("\t")) {
      var tabLine = text.split("\n").findIndex(function (line) { return line.includes("\t"); }) + 1;
      return {
        valid: false,
        error: {
          message: "YAML does not allow tab characters for indentation",
          line: tabLine,
          suggestion: ERROR_SUGGESTIONS["tab"],
        },
      };
    }

    var data = jsyaml.load(text, { schema: jsyaml.DEFAULT_SCHEMA });
    return { valid: true, data: data };
  } catch (e: unknown) {
    var err = e as Error & { mark?: { line?: number; column?: number }; reason?: string };
    var parseError: ParseError = { message: err.message || "Invalid YAML syntax" };

    if (err.mark) {
      parseError.line = (err.mark.line ?? 0) + 1;
      parseError.column = (err.mark.column ?? 0) + 1;
    }

    parseError.suggestion = getSuggestionForError(err.message);
    return { valid: false, error: parseError };
  }
}

function parseJson(text: string): { valid: boolean; data?: unknown; error?: ParseError } {
  var trimmed = text.trim();
  if (!trimmed) return { valid: false, error: { message: "Input is empty" } };

  try {
    var data = JSON.parse(trimmed);
    return { valid: true, data: data };
  } catch (e: unknown) {
    var err = e as SyntaxError;
    var parseError: ParseError = { message: err.message || "Invalid JSON syntax" };

    var posMatch = err.message.match(/position\s+(\d+)/i);
    if (posMatch) {
      var position = parseInt(posMatch[1], 10);
      var lineInfo = getLineFromPosition(trimmed, position);
      parseError.line = lineInfo.line;
      parseError.column = lineInfo.column;
    }

    parseError.suggestion = getSuggestionForJsonError(trimmed);
    return { valid: false, error: parseError };
  }
}

function getLineFromPosition(text: string, position: number): { line: number; column: number } {
  var lines = text.substring(0, position).split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function getSuggestionForError(message: string): string {
  var lowerMessage = message.toLowerCase();
  for (var [pattern, suggestion] of Object.entries(ERROR_SUGGESTIONS)) {
    if (lowerMessage.includes(pattern)) return suggestion;
  }
  return "Check the YAML syntax reference for correct formatting.";
}

function getSuggestionForJsonError(text: string): string {
  if (text.includes("'")) return "JSON requires double quotes (\") for strings, not single quotes (').";
  if (/,\s*[}\]]/.test(text)) return "Trailing commas are not allowed in JSON.";
  if (text.includes("//") || text.includes("/*")) return "JSON does not support comments.";
  return "Check for missing commas, quotes, or brackets.";
}

function toYaml(data: unknown): string {
  if (optionMinify.value) {
    return jsyaml.dump(data, { flowLevel: 0, sortKeys: optionSortKeys.value, lineWidth: -1 });
  }
  return jsyaml.dump(data, {
    indent: optionIndent.value,
    lineWidth: 120,
    sortKeys: optionSortKeys.value,
    quotingType: '"',
    forceQuotes: false,
  });
}

function toJson(data: unknown): string {
  var indent = optionMinify.value ? 0 : optionIndent.value;
  var processedData = optionSortKeys.value ? sortObjectKeys(data) : data;
  return JSON.stringify(processedData, null, indent);
}

function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  if (obj && typeof obj === "object" && obj !== null) {
    var sorted: Record<string, unknown> = {};
    var keys = Object.keys(obj as Record<string, unknown>).sort();
    for (var key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

function calculateStats(text: string, data: unknown): DocumentStats {
  return {
    lines: text.split("\n").length,
    characters: text.length,
    keys: countKeys(data),
    maxDepth: calculateMaxDepth(data),
  };
}

function countKeys(data: unknown): number {
  if (data === null || data === undefined || typeof data !== "object") return 0;
  var count = 0;
  if (Array.isArray(data)) {
    for (var item of data) count += countKeys(item);
  } else {
    var keys = Object.keys(data);
    count = keys.length;
    for (var key of keys) count += countKeys((data as Record<string, unknown>)[key]);
  }
  return count;
}

function calculateMaxDepth(data: unknown, currentDepth: number = 0): number {
  if (data === null || data === undefined || typeof data !== "object") return currentDepth;
  var maxChildDepth = currentDepth;
  if (Array.isArray(data)) {
    for (var item of data) {
      maxChildDepth = Math.max(maxChildDepth, calculateMaxDepth(item, currentDepth + 1));
    }
  } else {
    for (var key of Object.keys(data)) {
      maxChildDepth = Math.max(maxChildDepth, calculateMaxDepth((data as Record<string, unknown>)[key], currentDepth + 1));
    }
  }
  return maxChildDepth;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

var handleInputChange = useDebounceFn(function processInput(): void {
  var text = inputText.value;

  if (!text.trim()) {
    currentFormat.value = null;
    currentData.value = null;
    outputText.value = "";
    outputFormat.value = null;
    clearMessages();
    errorLine.value = null;
    return;
  }

  var format = detectFormat(text);
  currentFormat.value = format;

  var result = format === "json" ? parseJson(text) : parseYaml(text);

  if (result.valid) {
    currentData.value = result.data;
    clearMessages();
    errorLine.value = null;
  } else {
    currentData.value = null;
    if (result.error) {
      setError(result.error.message + (result.error.suggestion ? " " + result.error.suggestion : ""));
      errorLine.value = result.error.line || null;
    }
  }
}, 300);

function handleConvert(): void {
  if (!currentData.value || !currentFormat.value) return;

  if (currentFormat.value === "yaml") {
    outputText.value = toJson(currentData.value);
    outputFormat.value = "json";
  } else {
    outputText.value = toYaml(currentData.value);
    outputFormat.value = "yaml";
  }
}

function handleFormatYaml(): void {
  if (!currentData.value) return;
  outputText.value = toYaml(currentData.value);
  outputFormat.value = "yaml";
}

function handleFormatJson(): void {
  if (!currentData.value) return;
  outputText.value = toJson(currentData.value);
  outputFormat.value = "json";
}

async function handleCopy(): Promise<void> {
  if (!outputText.value) return;
  await copy(outputText.value);
}

function handleDownload(): void {
  if (!outputText.value || !outputFormat.value) return;
  var extension = outputFormat.value === "yaml" ? "yaml" : "json";
  var mimeType = outputFormat.value === "yaml" ? "text/yaml" : "application/json";
  download(outputText.value, { filename: "converted." + extension, mimeType: mimeType });
}

function handleClear(): void {
  inputText.value = "";
  outputText.value = "";
  currentFormat.value = null;
  currentData.value = null;
  outputFormat.value = null;
  clearMessages();
  errorLine.value = null;
}

async function handlePaste(): Promise<void> {
  try {
    var text = await navigator.clipboard.readText();
    inputText.value = text;
    handleInputChange();
  } catch (err) {
    logger.error("Failed to read clipboard:", err);
  }
}

function loadSampleYaml(): void {
  inputText.value = SAMPLE_YAML;
  handleInputChange();
}

function loadSampleJson(): void {
  inputText.value = SAMPLE_JSON;
  handleInputChange();
}

watch(inputText, handleInputChange);
watch([optionMinify, optionIndent, optionSortKeys], function handleOptionChange() {
  if (outputText.value && currentData.value) {
    handleConvert();
  }
});

onMounted(function handleMount() {
  var params = new URLSearchParams(window.location.search);
  var inputParam = params.get("input");
  if (inputParam) {
    try {
      inputText.value = atob(inputParam);
      handleInputChange();
    } catch {
      // Ignore invalid URL params
    }
  }
});
</script>

<template>
  <div class="yaml-json-tool">
    <!-- Format Detection Banner -->
    <div class="format-banner">
      <span class="format-indicator" :class="currentFormat || ''">
        <span class="format-icon" :class="currentFormat || ''">
          {{ currentFormat === 'yaml' ? 'Y' : currentFormat === 'json' ? 'J' : '?' }}
        </span>
        <span class="format-text">
          {{ currentFormat ? 'Detected: ' + currentFormat.toUpperCase() : 'Paste content to detect format' }}
        </span>
      </span>
    </div>

    <!-- Editor Section -->
    <div class="editor-section">
      <!-- Input Editor -->
      <div class="editor-pane input-pane">
        <div class="editor-header">
          <label class="editor-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Input
          </label>
          <div class="editor-actions">
            <button type="button" class="icon-btn" title="Paste from clipboard" @click="handlePaste">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </button>
            <button type="button" class="icon-btn" title="Clear input" @click="handleClear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div class="btn-divider"></div>
            <button type="button" class="icon-btn text-btn" title="Load sample YAML" @click="loadSampleYaml">YAML</button>
            <button type="button" class="icon-btn text-btn" title="Load sample JSON" @click="loadSampleJson">JSON</button>
          </div>
        </div>
        <div class="editor-wrapper">
          <div class="line-numbers">
            <span v-for="num in inputLineNumbers" :key="num" :class="{ 'error-line': num === errorLine }">{{ num }}</span>
          </div>
          <textarea
            v-model="inputText"
            class="editor-textarea"
            placeholder="Paste your YAML or JSON here..."
            spellcheck="false"
            autocomplete="off"
          ></textarea>
        </div>
        <!-- Error/Success Messages -->
        <div v-if="error" class="error-message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ error.message }}</span>
        </div>
        <div v-else-if="currentData" class="success-message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Valid {{ currentFormat?.toUpperCase() }}</span>
        </div>
      </div>

      <!-- Output Editor -->
      <div class="editor-pane output-pane">
        <div class="editor-header">
          <label class="editor-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Output
            <span v-if="outputFormat" class="output-format-badge" :class="outputFormat">
              {{ outputFormat.toUpperCase() }}
            </span>
          </label>
          <div class="editor-actions">
            <button
              type="button"
              class="icon-btn"
              :class="{ copied }"
              title="Copy to clipboard"
              :disabled="!outputText"
              @click="handleCopy"
            >
              <svg v-if="!copied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              type="button"
              class="icon-btn"
              title="Download file"
              :disabled="!outputText"
              @click="handleDownload"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        </div>
        <div class="editor-wrapper output">
          <div class="line-numbers">
            <span v-for="num in outputLineNumbers" :key="num">{{ num }}</span>
          </div>
          <textarea
            v-model="outputText"
            class="editor-textarea"
            placeholder="Converted output will appear here..."
            readonly
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Conversion Action Buttons -->
    <div class="conversion-actions">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="!currentData"
        @click="handleFormatYaml"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
        {{ formatYamlButtonText }}
      </button>
      <button
        type="button"
        class="btn btn-primary btn-convert"
        :disabled="!currentData"
        @click="handleConvert"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        {{ convertButtonText }}
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="!currentData"
        @click="handleFormatJson"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
          <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
        </svg>
        {{ formatJsonButtonText }}
      </button>
    </div>

    <!-- Options Section -->
    <div class="options-section">
      <div class="option-group">
        <label class="option-label">
          <input v-model="optionMinify" type="checkbox" />
          <span>Minify output</span>
        </label>
        <label class="option-label">
          <input v-model.number="optionIndent" type="number" min="1" max="8" />
          <span>Indent spaces</span>
        </label>
        <label class="option-label">
          <input v-model="optionSortKeys" type="checkbox" />
          <span>Sort keys alphabetically</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Statistics Card -->
  <div v-if="stats" class="tool-card stats-card">
    <h2>Document Statistics</h2>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{{ stats.lines }}</span>
        <span class="stat-label">Lines</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ formatNumber(stats.characters) }}</span>
        <span class="stat-label">Characters</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.keys }}</span>
        <span class="stat-label">Keys</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.maxDepth }}</span>
        <span class="stat-label">Max Depth</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Format Banner */
.format-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.format-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

.format-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-bg-elevated);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-dim);
}

.format-icon.yaml {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.format-icon.json {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

/* Editor Section */
.editor-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

@media (max-width: 1024px) {
  .editor-section {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }
}

.editor-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
  padding: 0 var(--space-xs);
}

.editor-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.output-format-badge {
  padding: 0.1875rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  background: var(--color-bg-elevated);
  color: var(--color-text-dim);
  margin-left: var(--space-xs);
}

.output-format-badge.yaml {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.output-format-badge.json {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.btn-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 var(--space-xs);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 var(--space-sm);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  color: var(--color-text-dim);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
}

.icon-btn:hover:not(:disabled) {
  border-color: var(--color-border);
  color: var(--color-text);
  background: var(--color-bg-elevated);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn.copied {
  color: var(--color-success);
}

.editor-wrapper {
  display: flex;
  position: relative;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.editor-wrapper.output {
  background: var(--color-bg-elevated);
}

.editor-wrapper:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.line-numbers {
  display: flex;
  flex-direction: column;
  padding: var(--space-md) var(--space-sm);
  background: var(--color-bg-elevated);
  border-right: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.625;
  color: var(--color-text-dim);
  text-align: right;
  user-select: none;
  min-width: 48px;
  overflow: hidden;
}

.line-numbers span {
  padding: 0 var(--space-xs);
  height: 1.625em;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.line-numbers span.error-line {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border-radius: 2px;
}

.editor-textarea {
  flex: 1;
  height: 100%;
  min-height: 400px;
  max-height: 60vh;
  padding: var(--space-md);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.625;
  background: transparent;
  border: none;
  color: var(--color-text);
  resize: none;
  overflow: auto;
}

@media (max-width: 1024px) {
  .editor-textarea {
    min-height: 300px;
    max-height: 50vh;
  }
}

.editor-textarea:focus {
  outline: none;
}

.editor-textarea::placeholder {
  color: var(--color-text-dim);
  opacity: 0.7;
}

/* Messages */
.error-message,
.success-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-sm);
  font-size: 0.875rem;
  margin-top: var(--space-sm);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

/* Conversion Actions */
.conversion-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) 0;
  margin-bottom: var(--space-md);
}

.conversion-actions .btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  white-space: nowrap;
  padding: 0.75rem 1.25rem;
}

.conversion-actions .btn-convert {
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
}

.conversion-actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .conversion-actions {
    flex-direction: column;
    gap: var(--space-xs);
  }

  .conversion-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Options Section */
.options-section {
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  justify-content: center;
}

.option-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  cursor: pointer;
}

.option-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-accent);
}

.option-label input[type="number"] {
  width: 56px;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  text-align: center;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-text);
}

/* Stats Card */
.tool-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--space-xl);
  margin-top: var(--space-lg);
}

.stats-card h2 {
  font-size: 1.125rem;
  margin-bottom: var(--space-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-accent-light);
  font-family: var(--font-mono);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
