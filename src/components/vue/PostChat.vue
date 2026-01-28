<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useAIInference } from "@/composables/useAIInference";
import { usePirsch } from "@/composables/usePirsch";
import AILoadingBar from "@/components/vue/ui/AILoadingBar.vue";
import AIPrivacyNotice from "@/components/vue/ui/AIPrivacyNotice.vue";

interface Message {
  role: "user" | "assistant";
  content: string;
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

var isOpen = ref(false);
var isProcessing = ref(false);
var messages = ref<Message[]>([]);
var inputText = ref("");
var error = ref<string | null>(null);
var showDownloadPrompt = ref(false);
var postContent = ref("");
var postTitle = ref("");
var messagesContainer = ref<HTMLElement | null>(null);

onMounted(function extractContent() {
  // Extract text content from the article
  var article = document.querySelector(".post-content");
  if (article) {
    postContent.value = article.textContent?.trim().slice(0, 3000) || "";
  }

  // Extract title from h1
  var h1 = document.querySelector("h1");
  if (h1) {
    postTitle.value = h1.textContent?.trim() || "";
  }
});

function handleToggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && status.value === "idle" && messages.value.length === 0) {
    showDownloadPrompt.value = true;
  }
  trackEvent("blog_ask_opened");
}

async function handleDownloadModel() {
  showDownloadPrompt.value = false;
  try {
    await loadModel();
    trackAIModelLoaded();
  } catch (e) {
    error.value = "Failed to load AI model. Please try again.";
    trackAIError("blog-ask", e instanceof Error ? e.message : "unknown");
  }
}

function scrollToBottom() {
  nextTick(function doScroll() {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
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
  messages.value.push({
    role: "user",
    content: userMessage,
  });
  inputText.value = "";
  error.value = null;
  isProcessing.value = true;
  scrollToBottom();

  trackEvent("blog_ask_query");

  try {
    // Build context from last 4 messages
    var contextMessages = messages.value.slice(-4);
    var conversationContext = contextMessages
      .map(function formatMessage(msg) {
        return msg.role === "user"
          ? `User: ${msg.content}`
          : `Assistant: ${msg.content}`;
      })
      .join("\n");

    var prompt = `You are a helpful assistant answering questions about a blog post titled "${postTitle.value}".

Article content (excerpt):
${postContent.value}

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ""}User question: ${userMessage}

Provide a helpful, concise answer (2-3 sentences) based on the article content. If the question is not related to the article, politely say you can only answer questions about this specific post.

Answer:`;

    var result = await generate(prompt, { maxTokens: 200, temperature: 0.3 });

    // Clean up the result - remove the prompt and extract answer
    var cleanResult = result.replace(prompt, "").trim();
    if (cleanResult.startsWith("Answer:")) {
      cleanResult = cleanResult.replace(/^Answer:\s*/i, "").trim();
    }

    messages.value.push({
      role: "assistant",
      content:
        cleanResult || "I couldn't generate a response. Please try again.",
    });

    trackAIQuery("blog-ask");
  } catch (e) {
    error.value = "Failed to generate response. Please try again.";
    trackAIError("blog-ask", e instanceof Error ? e.message : "unknown");
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
  <div class="post-chat-wrapper">
    <button
      class="chat-toggle-btn"
      :class="{ 'is-open': isOpen }"
      @click="handleToggle"
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
      <span>Ask about this post</span>
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

    <div v-if="isOpen" class="chat-panel">
      <AIPrivacyNotice />

      <!-- Download prompt -->
      <div v-if="showDownloadPrompt" class="download-prompt">
        <p>Download AI model (~300MB) to chat about this post?</p>
        <p class="download-note">Runs 100% locally in your browser.</p>
        <button class="download-btn" @click="handleDownloadModel">
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

      <!-- Messages area -->
      <div
        v-if="messages.length > 0 || (isReady && !showDownloadPrompt)"
        ref="messagesContainer"
        class="messages-container"
      >
        <div v-if="messages.length === 0" class="empty-state">
          <p>Ask a question about this post!</p>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="message.role"
        >
          <div class="message-bubble">
            {{ message.content }}
          </div>
        </div>

        <!-- Processing indicator -->
        <div v-if="isProcessing" class="message assistant">
          <div class="message-bubble processing-bubble">
            <span class="spinner"></span>
            Thinking...
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="error">
        {{ error }}
      </div>

      <!-- Input area -->
      <div v-if="isReady && !showDownloadPrompt" class="input-area">
        <input
          v-model="inputText"
          type="text"
          class="chat-input"
          placeholder="Type your question..."
          @keydown="handleKeyDown"
          :disabled="isProcessing"
        />
        <button
          class="send-btn"
          @click="sendMessage"
          :disabled="isProcessing || !inputText.trim()"
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
  </div>
</template>

<style scoped>
.post-chat-wrapper {
  margin: var(--space-lg) 0;
}

.chat-toggle-btn {
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

.chat-toggle-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-surface, var(--color-bg));
}

.chat-toggle-btn.is-open {
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

.chat-panel {
  margin-top: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-surface-elevated, var(--color-bg-card));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg, var(--radius));
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
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

.download-btn {
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

.download-btn:hover {
  opacity: 0.9;
}

.messages-container {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-lg);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.empty-state p {
  margin: 0;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 85%;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md, var(--radius-sm));
  font-size: var(--text-sm);
  line-height: 1.5;
}

.message.user .message-bubble {
  background: var(--color-accent);
  color: var(--color-bg);
  border-bottom-right-radius: var(--radius-xs);
}

.message.assistant .message-bubble {
  background: var(--color-surface, var(--color-bg));
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: var(--radius-xs);
}

.processing-bubble {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text-muted);
}

.spinner {
  width: 14px;
  height: 14px;
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

.input-area {
  display: flex;
  gap: var(--space-xs);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
}

.chat-input {
  flex: 1;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-surface, var(--color-bg));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, var(--radius-sm));
  color: var(--color-text);
  font-size: var(--text-sm);
  outline: none;
  transition: border-color 0.2s;
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
  width: 36px;
  height: 36px;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-md, var(--radius-sm));
  color: var(--color-bg);
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

.error {
  padding: var(--space-sm);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md, var(--radius-sm));
  color: #ef4444;
  font-size: var(--text-sm);
}

@media (max-width: 480px) {
  .message-bubble {
    max-width: 90%;
  }

  .messages-container {
    max-height: 250px;
  }
}
</style>
