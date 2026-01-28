<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useScrollLock } from "@/composables/useScrollLock";
import { useLogger } from "@/composables/useLogger";

interface NavItem {
  label: string;
  href: string;
  isButton?: boolean;
  isAI?: boolean;
}

defineProps<{
  items: NavItem[];
}>();

var isOpen = ref(false);
var { lock, unlock } = useScrollLock();
var logger = useLogger("MobileMenu");

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    lock();
  } else {
    unlock();
  }
  logger.debug("Menu " + (isOpen.value ? "opened" : "closed"));
}

function close() {
  isOpen.value = false;
  unlock();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isOpen.value) {
    close();
  }
}

onMounted(function handleMount() {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(function handleUnmount() {
  document.removeEventListener("keydown", handleKeydown);
  unlock();
});
</script>

<template>
  <div class="mobile-menu-container">
    <!-- Hamburger button -->
    <button
      @click="toggle"
      :aria-expanded="isOpen"
      aria-controls="mobile-nav"
      aria-label="Toggle navigation menu"
      class="hamburger"
      :class="{ active: isOpen }"
    >
      <span class="hamburger-line" />
      <span class="hamburger-line" />
      <span class="hamburger-line" />
    </button>

    <!-- Mobile nav panel -->
    <Transition name="slide">
      <div v-if="isOpen" class="nav-links active">
        <a
          v-for="item in items"
          :key="item.href"
          :href="item.href"
          :class="[
            item.isButton ? 'btn btn-primary btn-sm' : 'nav-link',
            item.isAI ? 'ai-link' : '',
          ]"
          @click="close"
        >
          <svg
            v-if="item.isAI"
            class="nav-icon"
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
          {{ item.label }}
        </a>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mobile-menu-container {
  display: none;
}

@media (max-width: 768px) {
  .mobile-menu-container {
    display: block;
  }
}

.hamburger {
  --hamburger-gap: 5px;
  --hamburger-line-height: 2px;
  display: flex;
  flex-direction: column;
  gap: var(--hamburger-gap);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
  z-index: 101;
  transition: all var(--transition-base);
}

.hamburger-line {
  width: var(--size-icon);
  height: var(--hamburger-line-height);
  background: var(--color-text);
  border-radius: var(--radius-xs);
  transition: all var(--transition-base);
}

.hamburger.active .hamburger-line:nth-child(1) {
  transform: translateY(
      calc(var(--hamburger-gap) + var(--hamburger-line-height))
    )
    rotate(45deg);
}

.hamburger.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger.active .hamburger-line:nth-child(3) {
  transform: translateY(
      calc(-1 * (var(--hamburger-gap) + var(--hamburger-line-height)))
    )
    rotate(-45deg);
}

.hamburger:hover .hamburger-line {
  background: var(--color-accent-light);
}

.nav-links {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  background: var(--color-bg-glass-solid);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-md) 0;
}

.nav-link {
  display: block;
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-muted);
  font-size: var(--text-md);
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-bg-elevated);
  padding-left: calc(var(--space-md) + 0.5rem);
}

/* AI Link */
.ai-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.nav-icon {
  width: 16px;
  height: 16px;
  color: var(--color-accent);
  flex-shrink: 0;
}

.btn-sm {
  margin: var(--space-sm) var(--space-md) 0;
  text-align: center;
  border-radius: var(--radius-sm);
}

.btn-sm:hover {
  transform: none;
  box-shadow: var(--shadow-accent);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition:
    max-height var(--transition-base),
    opacity var(--transition-base),
    padding var(--transition-base);
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding: 0;
  overflow: hidden;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 100vh;
  opacity: 1;
  padding: var(--space-md) 0;
}
</style>
