<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import {
  questions,
  categories,
  calculateResults,
  saveProgress,
  loadProgress,
  clearProgress,
  generateShareText,
  generateShareUrl,
  parseShareUrl,
  getGradeColor,
  type Answer,
  type ValidationResult,
  type CategoryId,
} from "@/utils/idea-validator";
import { useClipboard } from "@/composables/useClipboard";
import { useToolState } from "@/composables/useToolState";
import { useToast } from "@/composables/useToast";

type Screen = "start" | "questions" | "results";

var { copy, copied } = useClipboard();
var { logger } = useToolState({ name: "IdeaValidatorTool" });

// State
var currentScreen = ref<Screen>("start");
var ideaName = ref("");
var answers = ref<Record<string, Answer>>({});
var currentQuestionIndex = ref(0);
var showTooltip = ref(false);
var showFeedback = ref(false);
var result = ref<ValidationResult | null>(null);
var hasSavedProgress = ref(false);
var { visible: showShareToast, show: triggerShareToast } = useToast(3000);
var confettiCanvas = ref<HTMLCanvasElement | null>(null);

// Computed
var currentQuestion = computed(function getCurrentQuestion() {
  return questions[currentQuestionIndex.value];
});

var progressPercentage = computed(function getProgressPercentage() {
  var answered = Object.values(answers.value).filter(function answered(a) {
    return a !== null;
  }).length;
  return Math.round((answered / questions.length) * 100);
});

var categoryProgress = computed(function getCategoryProgress() {
  var progress: Record<CategoryId, { answered: number; total: number }> =
    {} as Record<CategoryId, { answered: number; total: number }>;
  for (var cat of categories) {
    var catQuestions = questions.filter(function catQuestions(q) {
      return q.category === cat.id;
    });
    var answeredCount = catQuestions.filter(function answeredCount(q) {
      return answers.value[q.id] !== undefined && answers.value[q.id] !== null;
    }).length;
    progress[cat.id] = { answered: answeredCount, total: catQuestions.length };
  }
  return progress;
});

var currentCategory = computed(function getCurrentCategory() {
  return categories.find(function currentCategory(c) {
    return c.id === currentQuestion.value?.category;
  });
});

var canGoBack = computed(function canGoBack() {
  return currentQuestionIndex.value > 0;
});

var isLastQuestion = computed(function isLastQuestion() {
  return currentQuestionIndex.value === questions.length - 1;
});

// Methods
function startValidation(): void {
  currentScreen.value = "questions";
  currentQuestionIndex.value = 0;
  showTooltip.value = false;
  showFeedback.value = false;
}

function resumeProgress(): void {
  var saved = loadProgress();
  if (saved) {
    ideaName.value = saved.ideaName;
    answers.value = saved.answers;
    currentScreen.value = "questions";
    var firstUnanswered = questions.findIndex(function firstUnanswered(q) {
      return !answers.value[q.id];
    });
    currentQuestionIndex.value = firstUnanswered >= 0 ? firstUnanswered : 0;
  }
}

function startFresh(): void {
  clearProgress();
  answers.value = {};
  ideaName.value = "";
  hasSavedProgress.value = false;
  startValidation();
}

function answerQuestion(answer: Answer): void {
  var questionId = currentQuestion.value.id;
  answers.value[questionId] = answer;
  showFeedback.value = true;
  saveProgress(ideaName.value, answers.value);

  setTimeout(function () {
    showFeedback.value = false;
    if (isLastQuestion.value) {
      showResults();
    } else {
      goToNext();
    }
  }, 800);
}

function skipQuestion(): void {
  answerQuestion("skip");
}

function goToNext(): void {
  if (!isLastQuestion.value) {
    currentQuestionIndex.value++;
    showTooltip.value = false;
    showFeedback.value = false;
  }
}

function goToPrevious(): void {
  if (canGoBack.value) {
    currentQuestionIndex.value--;
    showTooltip.value = false;
    showFeedback.value = false;
  }
}

function goToCategory(categoryId: CategoryId): void {
  var index = questions.findIndex(function index(q) {
    return q.category === categoryId;
  });
  if (index >= 0) {
    currentQuestionIndex.value = index;
    showTooltip.value = false;
    showFeedback.value = false;
  }
}

function showResults(): void {
  result.value = calculateResults(answers.value);
  currentScreen.value = "results";
  clearProgress();

  nextTick(function () {
    if (result.value && result.value.percentage >= 70) {
      triggerConfetti();
    }
    animateScore();
  });
}

function restart(): void {
  answers.value = {};
  ideaName.value = "";
  currentQuestionIndex.value = 0;
  result.value = null;
  currentScreen.value = "start";
  hasSavedProgress.value = false;
}

async function shareResults(): Promise<void> {
  if (!result.value) {
    return;
  }
  var shareText = generateShareText(ideaName.value, result.value);

  if (navigator.share) {
    try {
      await navigator.share({ text: shareText });
    } catch {
      await copy(shareText);
      triggerShareToast("Copied!");
    }
  } else {
    await copy(shareText);
    triggerShareToast("Copied!");
  }
}

async function copyShareLink(): Promise<void> {
  var shareUrl = generateShareUrl(answers.value, ideaName.value);
  await copy(shareUrl);
  triggerShareToast("Copied!");
}

function handleKeydown(e: KeyboardEvent): void {
  if (currentScreen.value !== "questions") {
    return;
  }
  if (showFeedback.value) {
    return;
  }

  var key = e.key.toLowerCase();
  if (key === "y") {
    e.preventDefault();
    answerQuestion("yes");
  } else if (key === "n") {
    e.preventDefault();
    answerQuestion("no");
  } else if (key === "s") {
    e.preventDefault();
    skipQuestion();
  } else if (key === "arrowleft") {
    e.preventDefault();
    goToPrevious();
  } else if (key === "arrowright") {
    e.preventDefault();
    if (!isLastQuestion.value) {
      goToNext();
    }
  }
}

function triggerConfetti(): void {
  if (!confettiCanvas.value) {
    return;
  }
  var canvas = confettiCanvas.value;
  var ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  var particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
  }> = [];
  var colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

  for (var i = 0; i < 100; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      life: 100,
    });
  }

  function animate() {
    if (!ctx || !canvas) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var alive = false;
    for (var p of particles) {
      if (p.life <= 0) {
        continue;
      }
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= 2;
      ctx.globalAlpha = p.life / 100;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    if (alive) {
      requestAnimationFrame(animate);
    }
  }
  animate();
}

function animateScore(): void {
  if (!result.value) {
    return;
  }
  var target = result.value.percentage;
  var current = 0;
  var duration = 1500;
  var start = performance.now();

  function update() {
    var elapsed = performance.now() - start;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(eased * target);
    var scoreEl = document.getElementById("score-number");
    if (scoreEl) {
      scoreEl.textContent = String(current);
    }
    var ringEl = document.getElementById(
      "score-ring-progress",
    ) as SVGCircleElement | null;
    if (ringEl) {
      var circumference = 2 * Math.PI * 54;
      var offset = circumference - (current / 100) * circumference;
      ringEl.style.strokeDasharray = String(circumference);
      ringEl.style.strokeDashoffset = String(offset);
    }
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  update();
}

function getFeedbackText(): string {
  var answer = answers.value[currentQuestion.value.id];
  if (answer === "yes") {
    return currentQuestion.value.yesFollowUp || "Great!";
  }
  if (answer === "no") {
    return currentQuestion.value.noFollowUp || "Something to work on.";
  }
  return "Skipped — we'll give partial credit.";
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#f59e0b";
    case "low":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}

// Lifecycle
onMounted(function () {
  document.addEventListener("keydown", handleKeydown);

  var saved = loadProgress();
  if (saved && Object.keys(saved.answers).length > 0) {
    hasSavedProgress.value = true;
  }

  var params = new URLSearchParams(window.location.search);
  var encoded = params.get("r");
  if (encoded) {
    var parsed = parseShareUrl(encoded);
    if (parsed) {
      ideaName.value = parsed.ideaName;
      answers.value = parsed.answers;
      showResults();
    }
  }
});

onUnmounted(function () {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="idea-validator-tool">
    <!-- Start Screen -->
    <div v-if="currentScreen === 'start'" class="tool-card start-screen">
      <div class="start-content">
        <div class="start-icon">
          <svg
            class="text-center mx-auto"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"
            ></path>
          </svg>
        </div>
        <h2>Ready to Validate Your Idea?</h2>
        <p>
          Answer 20 questions across 5 categories. Takes about 5 minutes. Your
          answers are never sent anywhere — everything stays in your browser.
        </p>

        <div class="idea-name-input">
          <label for="idea-name"
            >What's your idea called?
            <span class="optional">(optional)</span></label
          >
          <input
            v-model="ideaName"
            type="text"
            id="idea-name"
            placeholder="e.g., Analytics Dashboard for SaaS"
            maxlength="100"
            autocomplete="off"
          />
        </div>

        <button
          type="button"
          class="btn btn-primary w-56"
          @click="startValidation"
        >
          <span>Start Validation</span>
          <svg
            class="inline mb-0.5"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7"></path>
          </svg>
        </button>

        <div v-if="hasSavedProgress" class="saved-progress">
          <div class="saved-progress-content">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span
              >You have saved progress.
              <button type="button" class="link-btn" @click="resumeProgress">
                Resume
              </button>
              or
              <button type="button" class="link-btn" @click="startFresh">
                start fresh
              </button></span
            >
          </div>
        </div>

        <div class="categories-preview">
          <h3>What you'll be evaluated on:</h3>
          <div class="category-pills">
            <span
              v-for="cat in categories"
              :key="cat.id"
              class="category-pill"
              :style="{ '--cat-color': cat.color }"
              >{{ cat.name }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Question Screen -->
    <div
      v-else-if="currentScreen === 'questions'"
      class="tool-card question-screen"
    >
      <div class="progress-header">
        <div class="progress-info">
          <span class="progress-text"
            >Question {{ currentQuestionIndex + 1 }} of
            {{ questions.length }}</span
          >
          <span class="progress-percentage">{{ progressPercentage }}%</span>
        </div>
        <div class="progress-bar-container">
          <div
            class="progress-bar"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
        <div class="category-indicators">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="category-indicator"
            :class="{ active: currentCategory?.id === cat.id }"
            :style="{ '--cat-color': cat.color }"
            :title="cat.name"
            @click="goToCategory(cat.id)"
          >
            <span class="cat-progress"
              >{{ categoryProgress[cat.id].answered }}/{{
                categoryProgress[cat.id].total
              }}</span
            >
            <span class="cat-name">{{ cat.name }}</span>
          </button>
        </div>
      </div>

      <div class="question-container">
        <div class="question-card">
          <div
            class="question-category"
            :style="{ '--cat-color': currentCategory?.color }"
          >
            <span class="category-dot"></span>
            <span class="category-label">{{ currentCategory?.name }}</span>
          </div>

          <h2 class="question-text">{{ currentQuestion.text }}</h2>

          <button
            type="button"
            class="tooltip-trigger"
            @click="showTooltip = !showTooltip"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Why this matters</span>
          </button>

          <div v-if="showTooltip" class="tooltip-content">
            <p>{{ currentQuestion.tooltip }}</p>
          </div>

          <div class="answer-buttons">
            <button
              type="button"
              class="answer-btn answer-yes"
              :class="{ selected: answers[currentQuestion.id] === 'yes' }"
              :disabled="showFeedback"
              @click="answerQuestion('yes')"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Yes</span>
              <kbd>Y</kbd>
            </button>
            <button
              type="button"
              class="answer-btn answer-no"
              :class="{ selected: answers[currentQuestion.id] === 'no' }"
              :disabled="showFeedback"
              @click="answerQuestion('no')"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>No</span>
              <kbd>N</kbd>
            </button>
          </div>

          <button
            type="button"
            class="skip-btn"
            :disabled="showFeedback"
            @click="skipQuestion"
          >
            Skip this question <kbd>S</kbd>
          </button>

          <div v-if="showFeedback" class="answer-feedback">
            <p>{{ getFeedbackText() }}</p>
          </div>
        </div>

        <div class="question-nav">
          <button
            type="button"
            class="nav-btn"
            :disabled="!canGoBack"
            @click="goToPrevious"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            <span>Previous</span>
          </button>
          <button
            v-if="!isLastQuestion"
            type="button"
            class="nav-btn nav-next"
            @click="goToNext"
          >
            <span>Next</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </button>
          <button
            v-else
            type="button"
            class="nav-btn nav-next btn-primary"
            @click="showResults"
          >
            <span>See Results</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="keyboard-hint">
        <span><kbd>Y</kbd> Yes</span>
        <span><kbd>N</kbd> No</span>
        <span><kbd>S</kbd> Skip</span>
        <span><kbd>←</kbd><kbd>→</kbd> Navigate</span>
      </div>
    </div>

    <!-- Results Screen -->
    <div
      v-else-if="currentScreen === 'results' && result"
      class="tool-card results-screen"
    >
      <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>

      <div class="results-header">
        <div v-if="ideaName" class="idea-name-display">{{ ideaName }}</div>
        <div class="score-display">
          <div class="score-circle">
            <svg class="score-ring" viewBox="0 0 120 120">
              <circle class="score-ring-bg" cx="60" cy="60" r="54"></circle>
              <circle
                class="score-ring-progress"
                id="score-ring-progress"
                cx="60"
                cy="60"
                r="54"
                :style="{ stroke: getGradeColor(result.grade) }"
              ></circle>
            </svg>
            <div class="score-content">
              <span class="score-number" id="score-number">0</span>
              <span class="score-label">/ 100</span>
            </div>
          </div>
          <div
            class="grade-badge"
            :style="{ background: getGradeColor(result.grade) }"
          >
            {{ result.grade }}
          </div>
        </div>
        <h2 class="results-headline">{{ result.headline }}</h2>
      </div>

      <div class="category-breakdown">
        <h3>Category Breakdown</h3>
        <div class="category-cards">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="category-card"
            :style="{ '--cat-color': cat.color }"
          >
            <div class="category-card-header">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path :d="cat.icon" />
              </svg>
              <span class="category-card-name">{{ cat.name }}</span>
            </div>
            <div class="category-card-score">
              <span class="category-percentage"
                >{{ result.categoryScores[cat.id].percentage }}%</span
              >
            </div>
            <div class="category-bar">
              <div
                class="category-bar-fill"
                :style="{
                  width: result.categoryScores[cat.id].percentage + '%',
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="result.strengths.length || result.weaknesses.length"
        class="strengths-weaknesses"
      >
        <div v-if="result.strengths.length" class="sw-column strengths">
          <h4>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Strengths
          </h4>
          <ul>
            <li v-for="s in result.strengths" :key="s">{{ s }}</li>
          </ul>
        </div>
        <div v-if="result.weaknesses.length" class="sw-column weaknesses">
          <h4>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Areas to Improve
          </h4>
          <ul>
            <li v-for="w in result.weaknesses" :key="w">{{ w }}</li>
          </ul>
        </div>
      </div>

      <div v-if="result.recommendations.length" class="recommendations">
        <h3>Your Action Plan</h3>
        <div class="recommendations-list">
          <div
            v-for="(rec, i) in result.recommendations"
            :key="i"
            class="recommendation-item"
          >
            <div class="rec-header">
              <span
                class="rec-priority"
                :style="{ background: getPriorityColor(rec.priority) }"
                >{{ rec.priority }}</span
              >
              <span class="rec-text">{{ rec.text }}</span>
            </div>
            <p class="rec-action">{{ rec.action }}</p>
          </div>
        </div>
      </div>

      <div class="results-actions">
        <button type="button" class="btn btn-primary" @click="shareResults">
          <svg
            class="inline"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Share Results
        </button>
        <button type="button" class="btn btn-secondary" @click="copyShareLink">
          <svg
            v-if="!copied"
            class="inline mr-1"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            ></path>
          </svg>
          <svg
            v-else
            class="inline"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ copied ? "Copied!" : "Copy Link" }}</span>
        </button>
        <button type="button" class="btn btn-secondary" @click="restart">
          <svg
            class="inline"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Start Over
        </button>
      </div>

      <div v-if="showShareToast" class="share-toast">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Link copied to clipboard!</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Start Screen */
.start-screen {
  text-align: center;
}
.start-content {
  max-width: 600px;
  margin: 0 auto;
}
.start-icon {
  margin-bottom: var(--space-lg);
  color: var(--color-accent);
}
.start-content h2 {
  font-size: 1.75rem;
  margin-bottom: var(--space-sm);
}
.start-content > p {
  color: var(--color-text-muted);
  margin-bottom: var(--space-xl);
}
.idea-name-input {
  margin-bottom: var(--space-lg);
  text-align: left;
}
.idea-name-input label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: var(--space-xs);
  color: var(--color-text-muted);
}
.idea-name-input .optional {
  color: var(--color-text-dim);
  font-weight: 400;
}
.idea-name-input input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-text);
  font-size: 1rem;
}
.btn-large {
  padding: 1rem 2rem;
  font-size: 1.0625rem;
  gap: var(--space-sm);
}
.saved-progress {
  margin-top: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}
.saved-progress-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}
.link-btn {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
  padding: 0;
}
.categories-preview {
  margin-top: var(--space-xl);
}
.categories-preview h3 {
  font-size: 0.9375rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-md);
}
.category-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-sm);
}
.category-pill {
  padding: 0.5rem 1rem;
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  border-left: 3px solid var(--cat-color);
  color: var(--color-text-muted);
}

/* Question Screen */
.progress-header {
  margin-bottom: var(--space-xl);
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.progress-percentage {
  font-weight: 600;
  color: var(--color-accent);
}
.progress-bar-container {
  height: 6px;
  background: var(--color-bg);
  border-radius: 3px;
  margin-bottom: var(--space-md);
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: var(--color-accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.category-indicators {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}
.category-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 70px;
}
.category-indicator:hover,
.category-indicator.active {
  border-color: var(--cat-color);
  background: var(--color-bg-elevated);
}
.cat-progress {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--cat-color);
}
.cat-name {
  font-size: 0.6875rem;
  color: var(--color-text-dim);
}

.question-container {
  max-width: 700px;
  margin: 0 auto;
}
.question-card {
  padding: var(--space-xl);
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-lg);
}
.question-category {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}
.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--cat-color);
}
.category-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cat-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.question-text {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: var(--space-lg);
  color: var(--color-text);
}
.tooltip-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: none;
  border: none;
  color: var(--color-text-dim);
  font-size: 0.875rem;
  cursor: pointer;
  margin-bottom: var(--space-md);
}
.tooltip-trigger:hover {
  color: var(--color-text-muted);
}
.tooltip-content {
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-lg);
}
.tooltip-content p {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0;
}

.answer-buttons {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}
.answer-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-lg);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.answer-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.answer-btn span {
  font-size: 1.125rem;
  font-weight: 600;
}
.answer-btn kbd {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  background: var(--color-bg-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}
.answer-yes:hover:not(:disabled),
.answer-yes.selected {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
.answer-no:hover:not(:disabled),
.answer-no.selected {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.skip-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm);
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  font-size: 0.875rem;
  cursor: pointer;
}
.skip-btn:hover:not(:disabled) {
  color: var(--color-text-muted);
}
.skip-btn kbd {
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}
.answer-feedback {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-accent);
}
.answer-feedback p {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  margin: 0;
}

.question-nav {
  display: flex;
  justify-content: space-between;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0.75rem 1.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-text);
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.keyboard-hint {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-lg);
  font-size: 0.8125rem;
  color: var(--color-text-dim);
}
.keyboard-hint kbd {
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 4px;
}

/* Results Screen */
.results-screen {
  position: relative;
}
.confetti-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300px;
  pointer-events: none;
}
.results-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}
.idea-name-display {
  font-size: 0.9375rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}
.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
.score-circle {
  position: relative;
  width: 160px;
  height: 160px;
}
.score-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.score-ring-bg {
  fill: none;
  stroke: var(--color-bg);
  stroke-width: 8;
}
.score-ring-progress {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 339.292;
  stroke-dashoffset: 339.292;
  transition: stroke-dashoffset 0.3s ease;
}
.score-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.score-number {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-text);
}
.score-label {
  font-size: 1rem;
  color: var(--color-text-dim);
}
.grade-badge {
  padding: 0.5rem 1.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  border-radius: var(--border-radius-sm);
}
.results-headline {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  max-width: 500px;
  margin: 0 auto;
}

.category-breakdown {
  margin-bottom: var(--space-xl);
}
.category-breakdown h3 {
  font-size: 1.125rem;
  margin-bottom: var(--space-lg);
}
.category-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-md);
}
.category-card {
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--cat-color);
}
.category-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  color: var(--color-text-muted);
}
.category-card-name {
  font-weight: 500;
}
.category-card-score {
  margin-bottom: var(--space-sm);
}
.category-percentage {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cat-color);
}
.category-bar {
  height: 6px;
  background: var(--color-bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}
.category-bar-fill {
  height: 100%;
  background: var(--cat-color);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.strengths-weaknesses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}
.sw-column {
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
}
.sw-column h4 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 1rem;
  margin-bottom: var(--space-md);
}
.strengths h4 {
  color: #10b981;
}
.weaknesses h4 {
  color: #f59e0b;
}
.sw-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sw-column li {
  padding: var(--space-xs) 0;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  border-bottom: 1px solid var(--color-border);
}
.sw-column li:last-child {
  border-bottom: none;
}

.recommendations {
  margin-bottom: var(--space-xl);
}
.recommendations h3 {
  font-size: 1.125rem;
  margin-bottom: var(--space-lg);
}
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.recommendation-item {
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}
.rec-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}
.rec-priority {
  padding: 2px 8px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: white;
  border-radius: 4px;
}
.rec-text {
  font-weight: 500;
  color: var(--color-text);
}
.rec-action {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  margin: 0;
}

.results-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
}
.share-toast {
  position: fixed;
  bottom: var(--space-xl);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-success);
  color: white;
  border-radius: var(--border-radius-sm);
  font-size: 0.9375rem;
  z-index: 100;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .answer-buttons {
    flex-direction: column;
  }
  .category-indicators {
    justify-content: center;
  }
  .question-text {
    font-size: 1.25rem;
  }
}
</style>
