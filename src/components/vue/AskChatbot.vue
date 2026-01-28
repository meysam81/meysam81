<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from "vue";
import { useAIInference } from "@/composables/useAIInference";
import { usePirsch } from "@/composables/usePirsch";
import AILoadingBar from "@/components/vue/ui/AILoadingBar.vue";
import AIPrivacyNotice from "@/components/vue/ui/AIPrivacyNotice.vue";

interface Source {
  title: string;
  url: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface PagefindResult {
  meta?: { title?: string };
  url: string;
  excerpt?: string;
  content?: string;
}

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

var messages = ref<Message[]>([]);
var inputText = ref("");
var isProcessing = ref(false);
var error = ref<string | null>(null);
var showDownloadPrompt = ref(false);
var pagefindLoaded = ref(false);
var pagefindError = ref<string | null>(null);
var messagesContainer = ref<HTMLElement | null>(null);
var messageIdCounter = ref(0);

var isPagefindReady = computed(function computePagefindReady() {
  return pagefindLoaded.value && !pagefindError.value;
});

onMounted(async function initPagefind() {
  trackEvent("site_ask_opened");
  await loadPagefind();
});

async function loadPagefind() {
  if (typeof window === "undefined") {
    return;
  }

  var isProduction = import.meta.env.PROD;
  var pagefindPath = isProduction
    ? "/pagefind/pagefind.js"
    : "/dist/pagefind/pagefind.js";

  try {
    var pagefind = await import(/* @vite-ignore */ pagefindPath);
    await pagefind.init();
    (window as any).pagefind = pagefind;
    pagefindLoaded.value = true;
  } catch (e) {
    pagefindError.value = isProduction
      ? "Search is currently unavailable"
      : "Search unavailable in development. Run build first.";
  }
}

async function searchWithPagefind(query: string): Promise<Source[]> {
  if (!(window as any).pagefind) {
    return [];
  }

  try {
    var search = await (window as any).pagefind.search(query);
    var topResults: PagefindResult[] = await Promise.all(
      search.results.slice(0, 3).map(function getData(r: any) {
        return r.data();
      }),
    );

    return topResults.map(function mapResult(r) {
      return {
        title: r.meta?.title || "Untitled",
        url: r.url,
        excerpt: r.excerpt || r.content?.slice(0, 500) || "",
      };
    });
  } catch (e) {
    return [];
  }
}

function scrollToBottom() {
  nextTick(function doScroll() {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

async function handleDownloadModel() {
  showDownloadPrompt.value = false;
  try {
    await loadModel();
    trackAIModelLoaded();
  } catch (e) {
    error.value = "Failed to load AI model. Please try again.";
    trackAIError("site-ask", e instanceof Error ? e.message : "unknown");
  }
}

function clearChat() {
  messages.value = [];
  error.value = null;
}

async function askQuestion(question: string) {
  inputText.value = question;
  await sendMessage();
}

async function sendMessage() {
  var userMessage = inputText.value.trim();
  if (!userMessage || isProcessing.value) {
    return;
  }

  // Check if model is ready
  if (status.value === "idle") {
    showDownloadPrompt.value = true;
    return;
  }

  if (!isReady.value) {
    return;
  }

  // Add user message
  messageIdCounter.value += 1;
  messages.value.push({
    id: messageIdCounter.value,
    role: "user",
    content: userMessage,
  });
  inputText.value = "";
  error.value = null;
  isProcessing.value = true;
  scrollToBottom();

  trackEvent("site_ask_query", { query: userMessage.slice(0, 100) });

  try {
    // Search for relevant content using Pagefind
    var searchResults = await searchWithPagefind(userMessage);

    // Build context from search results
    var contextParts = searchResults.map(function formatContext(result) {
      return `---
Title: ${result.title}
URL: ${result.url}
Content: ${(result as any).excerpt || ""}
---`;
    });

    var context =
      contextParts.length > 0
        ? contextParts.join("\n\n")
        : "No relevant articles found in the blog.";

    // Build conversation context from last 4 messages
    var conversationContext = messages.value
      .slice(-5, -1)
      .map(function formatMessage(msg) {
        return msg.role === "user"
          ? `User: ${msg.content}`
          : `Assistant: ${msg.content}`;
      })
      .join("\n");

    var prompt = `You are a helpful assistant for meysam.io, a blog about indie hacking, solopreneurship, and DevOps.

Based on these relevant articles from the blog:

${context}

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ""}User question: ${userMessage}

Provide a helpful answer based on the blog content above. If citing specific articles, mention them by title. Be concise (3-4 sentences). If you can't find relevant information, say so honestly.

Answer:`;

    var result = await generate(prompt, { maxTokens: 250, temperature: 0.3 });

    // Clean up the result - remove the prompt and extract answer
    var cleanResult = result.replace(prompt, "").trim();
    if (cleanResult.startsWith("Answer:")) {
      cleanResult = cleanResult.replace(/^Answer:\s*/i, "").trim();
    }

    // Add assistant message with sources
    messageIdCounter.value += 1;
    messages.value.push({
      id: messageIdCounter.value,
      role: "assistant",
      content:
        cleanResult || "I couldn't generate a response. Please try again.",
      sources:
        searchResults.length > 0
          ? searchResults.map(function mapSource(r) {
              return { title: r.title, url: r.url };
            })
          : undefined,
    });

    trackAIQuery("site-ask");
  } catch (e) {
    error.value = "Failed to generate response. Please try again.";
    trackAIError("site-ask", e instanceof Error ? e.message : "unknown");
  } finally {
    isProcessing.value = false;
    scrollToBottom();
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}
</script>

<template>
  <div class="chatbot-container">
    <!-- Header -->
    <div class="chatbot-header">
      <h1 class="chatbot-title">
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
        Ask About This Blog
      </h1>
      <p class="chatbot-subtitle">
        AI-powered search across all articles. Runs locally in your browser.
      </p>
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <AIPrivacyNotice />
      <span v-if="isReady" class="model-ready">
        <svg
          class="status-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        AI Ready
      </span>
      <button
        v-if="messages.length > 0"
        @click="clearChat"
        class="clear-btn"
        type="button"
      >
        Clear Chat
      </button>
    </div>

    <!-- Pagefind error -->
    <div v-if="pagefindError" class="pagefind-error">
      {{ pagefindError }}
    </div>

    <!-- Download prompt -->
    <div v-if="showDownloadPrompt" class="download-section">
      <p>Download AI model (~300MB) to start chatting?</p>
      <p class="download-note">Runs 100% locally in your browser.</p>
      <button class="download-btn" @click="handleDownloadModel" type="button">
        Download Model
      </button>
    </div>

    <!-- Loading bar -->
    <AILoadingBar
      v-if="isLoading"
      :progress="progress"
      :downloadedMB="downloadedMB"
      :totalMB="totalMB"
    />

    <!-- Messages -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="!messages.length && isReady" class="empty-state">
        <p>Ask me anything about the blog posts!</p>
        <div class="suggested-questions">
          <button
            @click="askQuestion('What topics does this blog cover?')"
            type="button"
          >
            What topics does this blog cover?
          </button>
          <button
            @click="askQuestion(`What is the author's background?`)"
            type="button"
          >
            What is the author's background?
          </button>
          <button
            @click="askQuestion('Any tips for indie hackers?')"
            type="button"
          >
            Any tips for indie hackers?
          </button>
        </div>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message"
        :class="msg.role"
      >
        <div class="message-content">{{ msg.content }}</div>
        <div v-if="msg.sources?.length" class="sources">
          <span class="sources-label">Sources:</span>
          <a
            v-for="src in msg.sources"
            :key="src.url"
            :href="src.url"
            class="source-link"
          >
            {{ src.title }}
          </a>
        </div>
      </div>

      <div v-if="isProcessing" class="message assistant processing">
        <div class="message-content">
          <span class="spinner"></span>
          Searching and thinking...
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <!-- Input -->
    <div class="input-container">
      <input
        v-model="inputText"
        @keydown="handleKeyDown"
        placeholder="Ask a question..."
        :disabled="isProcessing || isLoading || !isPagefindReady"
        type="text"
        class="chat-input"
      />
      <button
        @click="sendMessage"
        :disabled="!inputText.trim() || isProcessing || !isPagefindReady"
        class="send-btn"
        type="button"
        aria-label="Send message"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chatbot-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - var(--size-header) - 150px);
}

.chatbot-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.chatbot-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-size: var(--text-3xl);
  margin-bottom: var(--space-xs);
}

.sparkles-icon {
  width: 32px;
  height: 32px;
  color: var(--color-accent);
}

.chatbot-subtitle {
  color: var(--color-text-muted);
  font-size: var(--text-md);
  margin: 0;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
}

.model-ready {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--text-xs);
  color: var(--color-success);
  padding: var(--space-xxs) var(--space-xs);
  background: var(--color-success-bg-subtle);
  border: 1px solid var(--color-success-border);
  border-radius: var(--radius-sm);
}

.status-icon {
  width: 14px;
  height: 14px;
}

.clear-btn {
  margin-left: auto;
  padding: var(--space-xxs) var(--space-sm);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  color: var(--color-text);
  border-color: var(--color-text-dim);
}

.pagefind-error {
  padding: var(--space-sm);
  background: var(--color-warning-bg-subtle);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-sm);
  color: var(--color-warning);
  font-size: var(--text-sm);
  margin-bottom: var(--space-md);
}

.download-section {
  text-align: center;
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: var(--space-md);
}

.download-section p {
  margin: 0 0 var(--space-xs) 0;
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.download-note {
  font-size: var(--text-sm) !important;
  opacity: 0.7;
}

.download-btn {
  margin-top: var(--space-sm);
  background: var(--color-accent);
  color: var(--color-bg);
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: var(--text-md);
  transition: opacity var(--transition-fast);
}

.download-btn:hover {
  opacity: 0.9;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: var(--space-md);
  min-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  text-align: center;
}

.empty-state p {
  color: var(--color-text-muted);
  font-size: var(--text-md);
  margin-bottom: var(--space-md);
}

.suggested-questions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.suggested-questions button {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.suggested-questions button:hover {
  border-color: var(--color-accent);
  color: var(--color-text);
}

.message {
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-content {
  max-width: 85%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  line-height: 1.6;
}

.message.user .message-content {
  background: var(--color-accent);
  color: var(--color-bg);
  border-bottom-right-radius: var(--radius-xs);
}

.message.assistant .message-content {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: var(--radius-xs);
}

.message.processing .message-content {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text-muted);
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

.sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  max-width: 85%;
}

.sources-label {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
}

.source-link {
  font-size: var(--text-xs);
  color: var(--color-accent-light);
  padding: var(--space-xxxs) var(--space-xs);
  background: var(--color-accent-bg-subtle);
  border-radius: var(--radius-xs);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.source-link:hover {
  background: var(--color-accent-bg);
  color: var(--color-accent);
}

.error {
  padding: var(--space-sm);
  background: var(--color-error-bg-subtle);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-sm);
  color: var(--color-error);
  font-size: var(--text-sm);
  margin-bottom: var(--space-md);
}

.input-container {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.chat-input {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: var(--text-md);
  outline: none;
  transition: border-color var(--transition-fast);
}

.chat-input:focus {
  border-color: var(--color-accent);
}

.chat-input::placeholder {
  color: var(--color-text-dim);
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-bg);
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity var(--transition-fast);
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 640px) {
  .chatbot-title {
    font-size: var(--text-2xl);
  }

  .sparkles-icon {
    width: 24px;
    height: 24px;
  }

  .message-content {
    max-width: 90%;
  }

  .sources {
    max-width: 90%;
  }

  .suggested-questions {
    width: 100%;
  }

  .suggested-questions button {
    width: 100%;
  }
}
</style>
