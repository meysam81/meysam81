<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useLogger } from "@/composables/useLogger";

/**
 * NewsletterForm - Reusable newsletter subscription form component
 *
 * Features:
 * - Altcha captcha integration
 * - Honeypot bot detection
 * - Loading states and error handling
 * - Success message display
 * - Pirsch analytics integration
 * - Fully customizable content via props and slots
 */

interface Benefit {
  text: string;
}

interface Props {
  /** Variant name for analytics tracking */
  variant?: string;
  /** Page URL for analytics (defaults to current path) */
  pageUrl?: string;
  /** Title displayed above the form */
  title?: string;
  /** Description text below the title */
  description?: string;
  /** List of benefit bullet points */
  benefits?: Benefit[];
  /** Submit button text */
  buttonText?: string;
  /** Success message title */
  successTitle?: string;
  /** Success message body */
  successMessage?: string;
  /** Note text below the form */
  formNote?: string;
  /** Whether to show benefits list */
  showBenefits?: boolean;
  /** Additional CSS class for the container */
  containerClass?: string;
}

var props = withDefaults(defineProps<Props>(), {
  variant: "default",
  pageUrl: "",
  title: "Subscribe to the Newsletter",
  description: "Get weekly insights delivered to your inbox.",
  benefits: function getDefaultBenefits() {
    return [];
  },
  buttonText: "Subscribe",
  successTitle: "You're in!",
  successMessage: "Check your email to confirm your subscription.",
  formNote: "No spam. Unsubscribe anytime.",
  showBenefits: true,
  containerClass: "",
});

var logger = useLogger("NewsletterForm");

// Form state
var isSubmitting = ref(false);
var isSuccess = ref(false);
var errorMessage = ref("");
var scrollPercentage = ref(0);

// Form refs
var formRef = ref<HTMLFormElement | null>(null);
var emailRef = ref<HTMLInputElement | null>(null);

// Honeypot fields
var honeypotName = ref("");
var honeypotCompany = ref("");
var honeypotWebsite = ref("");

// Computed
var currentPageUrl = computed(function computePageUrl() {
  if (props.pageUrl) {
    return props.pageUrl;
  }
  if (typeof window !== "undefined") {
    return window.location.pathname;
  }
  return "/";
});

var hasBenefits = computed(function computeHasBenefits() {
  return props.showBenefits && props.benefits && props.benefits.length > 0;
});

// Methods
function calculateScrollPercentage(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  var windowHeight = window.innerHeight;
  var documentHeight = document.documentElement.scrollHeight;
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  var scrollableHeight = documentHeight - windowHeight;

  if (scrollableHeight <= 0) {
    return 0;
  }

  return Math.round((scrollTop / scrollableHeight) * 100);
}

function updateScrollPercentage(): void {
  scrollPercentage.value = calculateScrollPercentage();
}

function isBot(): boolean {
  return (
    honeypotName.value !== "" ||
    honeypotCompany.value !== "" ||
    honeypotWebsite.value !== ""
  );
}

function resetForm(): void {
  isSuccess.value = false;
  errorMessage.value = "";
  isSubmitting.value = false;
  honeypotName.value = "";
  honeypotCompany.value = "";
  honeypotWebsite.value = "";

  // Reset altcha widget
  var altchaWidget = document.querySelector("altcha-widget") as any;
  if (altchaWidget && typeof altchaWidget.reset === "function") {
    altchaWidget.reset();
  }

  // Focus email input after a short delay
  setTimeout(function focusEmail() {
    if (emailRef.value) {
      emailRef.value.focus();
    }
  }, 100);
}

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  // Check honeypot
  if (isBot()) {
    logger.warn("Bot detected via honeypot");
    errorMessage.value = "Unable to subscribe. Please try again.";
    return;
  }

  // Clear previous error
  errorMessage.value = "";
  isSubmitting.value = true;

  // Update scroll percentage for analytics
  updateScrollPercentage();

  try {
    var form = formRef.value;
    if (!form) {
      throw new Error("Form not found");
    }

    var formData = new FormData(form);
    var response = await fetch(form.action, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      logger.info("Subscription successful");
      isSuccess.value = true;
    } else {
      throw new Error("Subscription failed with status " + response.status);
    }
  } catch (err) {
    logger.error("Subscription error:", err);
    errorMessage.value = "Unable to subscribe. Please try again.";
    isSubmitting.value = false;
  }
}

// Lifecycle
onMounted(async function onMountedHandler() {
  // Import altcha only on client side (uses customElements browser API)
  await import("altcha");

  updateScrollPercentage();

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", updateScrollPercentage, {
      passive: true,
    });
  }
});
</script>

<template>
  <div :class="['newsletter-form-container', containerClass]">
    <!-- Success State -->
    <div v-if="isSuccess" class="success-message">
      <div class="success-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <slot name="success">
        <h3 class="success-title">{{ successTitle }}</h3>
        <p class="success-description">{{ successMessage }}</p>
      </slot>
      <button type="button" class="resend-link" @click="resetForm">
        Subscribe another email
      </button>
    </div>

    <!-- Form State -->
    <template v-else>
      <!-- Title -->
      <slot name="title">
        <h2 v-if="title" class="form-title">{{ title }}</h2>
      </slot>

      <!-- Description -->
      <slot name="description">
        <p v-if="description" class="form-description">{{ description }}</p>
      </slot>

      <!-- Benefits List -->
      <div v-if="hasBenefits" class="benefits-list">
        <slot name="benefits">
          <div
            v-for="(benefit, index) in benefits"
            :key="index"
            class="benefit-item"
          >
            <svg
              class="benefit-icon"
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
            <span>{{ benefit.text }}</span>
          </div>
        </slot>
      </div>

      <!-- Form -->
      <form
        ref="formRef"
        class="newsletter-form"
        action="https://newsletter.meysam.io/subscription/form"
        method="post"
        :data-pirsch-event="'subscribe'"
        :data-pirsch-meta-page_url="currentPageUrl"
        :data-pirsch-meta-variant="variant"
        :data-pirsch-meta-scroll="String(scrollPercentage)"
        data-pirsch-non-interactive
        @submit="handleSubmit"
      >
        <!-- Hidden fields -->
        <input type="hidden" name="nonce" />
        <input
          type="hidden"
          name="l"
          value="00a2c2b8-467a-4d74-9c76-9c6472c91d06"
        />

        <!-- Honeypot fields (hidden from users, trap bots) -->
        <input
          v-model="honeypotName"
          type="text"
          name="name"
          class="honeypot-field"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
        />
        <input
          v-model="honeypotCompany"
          type="text"
          name="company"
          class="honeypot-field"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
        />
        <input
          v-model="honeypotWebsite"
          type="text"
          name="website"
          class="honeypot-field"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
        />

        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Email input -->
        <div class="form-row">
          <input
            ref="emailRef"
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            aria-label="Email address"
            class="email-input"
            :disabled="isSubmitting"
          />

          <!-- Altcha widget (hidden, auto-verifies on focus) -->
          <altcha-widget
            class="altcha-widget"
            challengeurl="https://newsletter.meysam.io/api/public/captcha/altcha"
            auto="onfocus"
          ></altcha-widget>

          <!-- Submit button -->
          <button
            type="submit"
            class="btn btn-primary submit-button"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="button-loader">
              <svg
                class="spinner"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              Subscribing...
            </span>
            <slot v-else name="button">
              {{ buttonText }}
            </slot>
          </button>
        </div>

        <!-- Form note -->
        <p class="form-note">{{ formNote }}</p>
      </form>
    </template>
  </div>
</template>

<style scoped>
.newsletter-form-container {
  width: 100%;
}

.form-title {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-sm);
  color: var(--color-text);
}

.form-description {
  color: var(--color-text-muted);
  margin-bottom: var(--space-lg);
  font-size: var(--text-lg);
  line-height: 1.6;
}

.benefits-list {
  display: grid;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.benefit-icon {
  color: var(--color-success);
  flex-shrink: 0;
  margin-top: 2px;
}

.benefit-item span {
  color: var(--color-text-muted);
  font-size: var(--text-base);
  line-height: 1.6;
}

.newsletter-form {
  max-width: 600px;
}

.form-row {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.email-input {
  flex: 1;
  padding: 0.875rem 1rem;
  font-size: var(--text-base);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  transition: all var(--transition-fast);
}

.email-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
}

.email-input::placeholder {
  color: var(--color-text-dim);
}

.email-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.altcha-widget {
  display: none;
}

.submit-button {
  white-space: nowrap;
  min-width: 140px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: var(--text-base);
  font-weight: 500;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.submit-button:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-loader {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.form-note {
  font-size: var(--text-sm);
  color: var(--color-text-dim);
  margin: 0;
}

.error-message {
  background: var(--color-error-bg-subtle);
  border: 1px solid var(--color-error-border);
  color: var(--color-error-light);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
  font-size: var(--text-sm);
}

.success-message {
  text-align: center;
  padding: var(--space-xl);
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-md);
  color: var(--color-success);
}

.success-icon svg {
  width: 100%;
  height: 100%;
}

.success-title {
  font-size: var(--text-3xl);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.success-description {
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
  line-height: 1.6;
}

.resend-link {
  background: none;
  border: none;
  color: var(--color-accent-light);
  text-decoration: underline;
  cursor: pointer;
  font-size: var(--text-sm);
  padding: 0;
}

.resend-link:hover {
  color: var(--color-accent);
}

.honeypot-field {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }

  .submit-button {
    width: 100%;
  }

  .success-title {
    font-size: var(--text-2xl);
  }

  .success-description {
    font-size: var(--text-base);
  }
}
</style>
