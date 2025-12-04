<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from "vue";
import { toPng, toBlob } from "html-to-image";

// Result data structure
interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  answeredCount: number;
  totalCount: number;
}

interface ResultData {
  ideaName: string;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "F";
  headline: string;
  categoryScores: Record<string, CategoryScore>;
}

// Reactive state for results
var resultData = reactive<ResultData>({
  ideaName: "",
  percentage: 0,
  grade: "C",
  headline: "Complete the validation to see your results",
  categoryScores: {},
});

var hasResults = ref(false);

// Refs
var previewRef = ref<HTMLElement | null>(null);
var isGenerating = ref(false);
var copySuccess = ref(false);

// Listen for results from the validator
function handleResultsReady(event: Event) {
  var customEvent = event as CustomEvent<ResultData>;
  updateResults(customEvent.detail);
}

onMounted(function onComponentMounted() {
  window.addEventListener("idea-validator:results-ready", handleResultsReady);
});

onUnmounted(function onComponentUnmounted() {
  window.removeEventListener(
    "idea-validator:results-ready",
    handleResultsReady
  );
});

function updateResults(data: ResultData) {
  resultData.ideaName = data.ideaName || "";
  resultData.percentage = data.percentage;
  resultData.grade = data.grade;
  resultData.headline = data.headline;
  resultData.categoryScores = data.categoryScores;
  hasResults.value = true;
}

// Category colors and names
const categoryMeta: Record<string, { name: string; color: string }> = {
  market: { name: "Market", color: "#8b5cf6" },
  problem: { name: "Problem", color: "#f59e0b" },
  solution: { name: "Solution", color: "#10b981" },
  distribution: { name: "Distribution", color: "#3b82f6" },
  founder: { name: "Founder Fit", color: "#ec4899" },
};

// Computed grade color
const gradeColor = computed(() => {
  switch (resultData.grade) {
    case "A":
      return "#10b981";
    case "B":
      return "#3b82f6";
    case "C":
      return "#f59e0b";
    case "D":
      return "#f97316";
    case "F":
      return "#ef4444";
    default:
      return "#6b7280";
  }
});

// Score emoji
const scoreEmoji = computed(() => {
  if (resultData.percentage >= 85) return "🚀";
  if (resultData.percentage >= 70) return "💪";
  if (resultData.percentage >= 55) return "🎯";
  if (resultData.percentage >= 40) return "🔍";
  return "⚠️";
});

/**
 * Generates a PNG image data URL of the preview element for sharing.
 *
 * Clones the preview DOM element, renders it at a fixed size using html-to-image,
 * and returns a data URL of the generated PNG image.
 *
 * @returns {Promise<string>} A promise that resolves to a PNG image data URL.
 * @throws {Error} If the preview element is not found, or if image generation fails.
 */
function waitForRender(element: HTMLElement, maxAttempts = 10): Promise<void> {
  return new Promise(function resolveRender(resolve, reject) {
    var attempts = 0;

    function checkReady() {
      attempts++;

      var rect = element.getBoundingClientRect();
      var hasValidDimensions = rect.width > 0 && rect.height > 0;

      if (hasValidDimensions) {
        requestAnimationFrame(function doubleRaf() {
          requestAnimationFrame(function afterDoubleRaf() {
            resolve();
          });
        });
      } else if (attempts < maxAttempts) {
        setTimeout(checkReady, 50 * attempts);
      } else {
        reject(new Error("Element failed to render with valid dimensions"));
      }
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(checkReady).catch(function onFontError() {
        checkReady();
      });
    } else {
      checkReady();
    }
  });
}

async function generateImage(): Promise<string> {
  if (!previewRef.value) throw new Error("Preview element not found");

  // Create a clone for rendering at full size
  const clone = previewRef.value.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.position = "fixed";
  clone.style.left = "-9999px";
  clone.style.top = "-9999px";
  document.body.appendChild(clone);

  try {
    await waitForRender(clone);

    const dataUrl = await toPng(clone, {
      width: 1200,
      height: 630,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#0a0a0a",
    });

    return dataUrl;
  } finally {
    document.body.removeChild(clone);
  }
}

// Download as PNG
async function downloadImage() {
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    const dataUrl = await generateImage();
    const link = document.createElement("a");
    const filename = resultData.ideaName
      ? `idea-validator-${resultData.ideaName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30)}.png`
      : "idea-validator-results.png";
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Failed to generate image:", error);
    alert(
      "Failed to generate image. " +
        (error && (error as Error).message
          ? (error as Error).message
          : "Please try again.")
    );
  } finally {
    isGenerating.value = false;
  }
}

// Copy to clipboard
async function copyToClipboard() {
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    if (!previewRef.value) throw new Error("Preview element not found");

    // Create a clone for rendering at full size
    var clone = previewRef.value.cloneNode(true) as HTMLElement;
    clone.style.transform = "none";
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "-9999px";
    document.body.appendChild(clone);

    try {
      await waitForRender(clone);

      var blob = await toBlob(clone, {
        width: 1200,
        height: 630,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0a0a0a",
      });

      if (!blob) throw new Error("Failed to generate blob");

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      copySuccess.value = true;
      setTimeout(function clearSuccess() {
        copySuccess.value = false;
      }, 2000);
    } finally {
      document.body.removeChild(clone);
    }
  } catch (error) {
    console.error("Failed to copy image:", error);
    alert(
      "Failed to copy image to clipboard. Your browser doesn't support copying images to clipboard. Please use the Download PNG button instead."
    );
  } finally {
    isGenerating.value = false;
  }
}
</script>

<template>
  <div class="share-image-container">
    <h3 class="share-title">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      Share Your Results
    </h3>

    <!-- Preview (scaled down) -->
    <div class="preview-wrapper">
      <div class="preview-scale">
        <div ref="previewRef" class="share-preview">
          <!-- Background -->
          <div class="preview-bg">
            <div class="preview-grid"></div>
            <div class="preview-glow"></div>
          </div>

          <!-- Left accent bar -->
          <div class="preview-accent"></div>

          <!-- Content -->
          <div class="preview-content">
            <!-- Header with emoji and idea name -->
            <div class="preview-header">
              <span class="preview-emoji">{{ scoreEmoji }}</span>
              <span v-if="resultData.ideaName" class="preview-idea-name"
                >"{{ resultData.ideaName }}"</span
              >
              <span v-else class="preview-idea-name">SaaS Idea Validation</span>
            </div>

            <!-- Score section -->
            <div class="preview-score-section">
              <div
                class="preview-score-circle"
                :style="{ borderColor: gradeColor }"
              >
                <span
                  class="preview-score-number"
                  :style="{ color: gradeColor }"
                  >{{ resultData.percentage }}</span
                >
                <span class="preview-score-label">/100</span>
              </div>
              <div
                class="preview-grade"
                :style="{ backgroundColor: gradeColor }"
              >
                {{ resultData.grade }}
              </div>
            </div>

            <!-- Headline -->
            <p class="preview-headline">{{ resultData.headline }}</p>

            <!-- Category bars -->
            <div class="preview-categories">
              <div
                v-for="(score, catId) in resultData.categoryScores"
                :key="catId"
                class="preview-category"
              >
                <div class="preview-cat-header">
                  <span
                    class="preview-cat-dot"
                    :style="{
                      backgroundColor: categoryMeta[catId]?.color || '#6b7280',
                    }"
                  ></span>
                  <span class="preview-cat-name">{{
                    categoryMeta[catId]?.name || catId
                  }}</span>
                  <span class="preview-cat-score">{{ score.percentage }}%</span>
                </div>
                <div class="preview-cat-bar">
                  <div
                    class="preview-cat-fill"
                    :style="{
                      width: score.percentage + '%',
                      backgroundColor: categoryMeta[catId]?.color || '#6b7280',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="preview-footer">
            <div class="preview-brand">
              <svg
                class="preview-logo"
                width="32"
                height="32"
                viewBox="0 0 200 200"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="url(#logoGrad)"
                  stroke-width="3"
                />
                <text
                  x="100"
                  y="135"
                  font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                  font-size="110"
                  font-weight="700"
                  fill="url(#logoGrad)"
                  text-anchor="middle"
                >
                  M
                </text>
                <defs>
                  <linearGradient
                    id="logoGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" style="stop-color: #3b82f6" />
                    <stop offset="100%" style="stop-color: #60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
              <span class="preview-author">Meysam Azad</span>
            </div>
            <span class="preview-url">meysam.io/tools/saas-idea-validator</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="share-actions">
      <button
        type="button"
        class="share-btn share-btn-primary"
        :disabled="isGenerating"
        @click="downloadImage"
      >
        <svg
          v-if="!isGenerating"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <svg
          v-else
          class="spin"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span>Download PNG</span>
      </button>

      <button
        type="button"
        class="share-btn share-btn-secondary"
        :disabled="isGenerating"
        @click="copyToClipboard"
      >
        <svg
          v-if="!copySuccess"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{ copySuccess ? "Copied!" : "Copy to Clipboard" }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.share-image-container {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--color-bg-elevated, #1a1a1a);
  border: 1px solid var(--color-border, #2a2a2a);
  border-radius: 12px;
}

.share-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #f5f5f5);
  margin: 0 0 1rem 0;
}

.share-title svg {
  color: var(--color-accent-light, #60a5fa);
}

/* Preview wrapper and scaling */
.preview-wrapper {
  background: #0a0a0a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.preview-scale {
  transform: scale(0.5);
  transform-origin: top left;
  width: 200%;
  height: 0;
  padding-bottom: 26.25%; /* (630/1200) * 50% */
}

/* The actual preview (1200x630) */
.share-preview {
  width: 1200px;
  height: 630px;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  background: #0a0a0a;
}

.preview-bg {
  position: absolute;
  inset: 0;
}

.preview-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      rgba(59, 130, 246, 0.03) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

.preview-glow {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.12) 0%,
    transparent 70%
  );
  border-radius: 50%;
}

.preview-accent {
  position: absolute;
  left: 0;
  top: 0;
  width: 8px;
  height: 100%;
  background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%);
}

.preview-content {
  position: absolute;
  left: 80px;
  top: 60px;
  right: 80px;
  bottom: 80px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.preview-emoji {
  font-size: 48px;
  line-height: 1;
}

.preview-idea-name {
  font-size: 28px;
  font-weight: 600;
  color: #a0a0a0;
  font-style: italic;
}

.preview-score-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}

.preview-score-circle {
  width: 140px;
  height: 140px;
  border: 6px solid #3b82f6;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 10, 0.8);
}

.preview-score-number {
  font-size: 56px;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
}

.preview-score-label {
  font-size: 18px;
  color: #6a6a6a;
  margin-top: 4px;
}

.preview-grade {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.preview-headline {
  font-size: 26px;
  color: #d0d0d0;
  margin: 0 0 28px 0;
  line-height: 1.4;
  max-width: 700px;
}

.preview-categories {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.preview-category {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.preview-cat-name {
  font-size: 14px;
  color: #a0a0a0;
  flex: 1;
}

.preview-cat-score {
  font-size: 16px;
  font-weight: 600;
  color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
}

.preview-cat-bar {
  height: 8px;
  background: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
}

.preview-cat-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.preview-footer {
  position: absolute;
  left: 80px;
  right: 80px;
  bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-logo {
  width: 32px;
  height: 32px;
}

.preview-author {
  font-size: 18px;
  font-weight: 600;
  color: #f5f5f5;
}

.preview-url {
  font-size: 18px;
  color: #6a6a6a;
  letter-spacing: 0.02em;
}

/* Action buttons */
.share-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  border: none;
}

.share-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.share-btn-primary {
  background: var(--color-accent, #3b82f6);
  color: white;
}

.share-btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #2563eb);
  transform: translateY(-1px);
}

.share-btn-secondary {
  background: var(--color-bg, #0a0a0a);
  border: 1px solid var(--color-border, #2a2a2a);
  color: var(--color-text-muted, #a0a0a0);
}

.share-btn-secondary:hover:not(:disabled) {
  border-color: var(--color-accent, #3b82f6);
  color: var(--color-text, #f5f5f5);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .preview-scale {
    transform: scale(0.3);
    padding-bottom: 15.75%; /* (630/1200) * 30% */
  }

  .share-actions {
    flex-direction: column;
  }

  .share-btn {
    justify-content: center;
  }
}
</style>
