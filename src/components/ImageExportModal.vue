<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { toPng, toBlob } from 'html-to-image';
import {
  categories,
  getGradeColor,
  getScoreEmoji,
  type ValidationResult,
} from '@/utils/idea-validator';

interface Props {
  isOpen: boolean;
  result: ValidationResult | null;
  ideaName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

type Scope = 'minimal' | 'medium' | 'detailed';

const currentScope = ref<Scope>('minimal');
const isDownloading = ref(false);
const downloadSuccess = ref(false);
const isCopying = ref(false);
const copySuccess = ref(false);
const previewRef = ref<HTMLDivElement | null>(null);

const scopeOptions = [
  { id: 'minimal' as Scope, icon: '📊', name: 'Minimal', desc: 'Score & Grade' },
  { id: 'medium' as Scope, icon: '📈', name: 'Medium', desc: '+ Category Bars' },
  { id: 'detailed' as Scope, icon: '📋', name: 'Detailed', desc: '+ Insights' },
];

const displayName = computed(() => props.ideaName || 'Your SaaS Idea');
const gradeColor = computed(() => props.result ? getGradeColor(props.result.grade) : '#6a6a6a');
const scoreEmoji = computed(() => props.result ? getScoreEmoji(props.result.percentage) : '');

const strokeDashoffset = computed(() => {
  if (!props.result) return 2 * Math.PI * 120;
  return 2 * Math.PI * 120 * (1 - props.result.percentage / 100);
});

const categoryBars = computed(() => {
  if (!props.result) return [];
  return categories.map(cat => {
    const catScore = props.result!.categoryScores[cat.id];
    const barColor = catScore.percentage >= 70 ? '#10b981' : catScore.percentage >= 50 ? '#f59e0b' : '#ef4444';
    return { ...cat, score: catScore, barColor };
  });
});

const topStrengths = computed(() => props.result?.strengths.slice(0, 2) || []);
const topWeaknesses = computed(() => props.result?.weaknesses.slice(0, 2) || []);

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function generateMinimalImageHTML(): string {
  if (!props.result) return '';
  const color = gradeColor.value;
  const emoji = scoreEmoji.value;
  const name = escapeHtml(displayName.value);
  const result = props.result;

  return `<div style="width:1200px;height:630px;background:#0a0a0a;position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow:hidden;">
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#0a0a0a 0%,#151515 50%,#0a0a0a 100%);"></div>
    <div style="position:absolute;top:-100px;right:-100px;width:400px;height:400px;background:radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%);border-radius:50%;"></div>
    <div style="position:absolute;bottom:-100px;left:-100px;width:300px;height:300px;background:radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%);border-radius:50%;"></div>
    <div style="position:absolute;left:0;top:0;width:6px;height:100%;background:linear-gradient(180deg,#3b82f6 0%,#8b5cf6 100%);"></div>
    <div style="position:absolute;left:80px;top:80px;right:80px;bottom:80px;display:flex;align-items:center;">
      <div style="flex-shrink:0;width:280px;height:280px;position:relative;">
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r="120" fill="none" stroke="#2a2a2a" stroke-width="12"/>
          <circle cx="140" cy="140" r="120" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="${2 * Math.PI * 120}" stroke-dashoffset="${strokeDashoffset.value}"
            transform="rotate(-90 140 140)"/>
        </svg>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
          <div style="font-size:72px;font-weight:700;color:${color};font-family:'SF Mono',Monaco,Consolas,monospace;line-height:1;">${result.percentage}</div>
          <div style="font-size:20px;color:#6a6a6a;margin-top:4px;">/ 100</div>
        </div>
        <div style="position:absolute;top:20px;right:20px;width:56px;height:56px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
          ${result.grade}
        </div>
      </div>
      <div style="flex:1;padding-left:60px;">
        <div style="display:inline-block;padding:8px 20px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:6px;color:#60a5fa;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:20px;">
          Idea Validation Score
        </div>
        <h1 style="font-size:48px;font-weight:700;color:#f5f5f5;margin:0 0 16px 0;letter-spacing:-0.02em;line-height:1.15;">
          ${name}
        </h1>
        <p style="font-size:22px;color:#a0a0a0;margin:0;line-height:1.5;max-width:500px;">
          ${escapeHtml(result.headline)}
        </p>
      </div>
    </div>
    <div style="position:absolute;left:80px;right:80px;bottom:40px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:12px;">
        <svg width="32" height="32" viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" fill="none" stroke="#3b82f6" stroke-width="3"/><text x="100" y="135" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="110" font-weight="700" fill="#3b82f6" text-anchor="middle">M</text></svg>
        <span style="font-size:16px;color:#6a6a6a;">meysam.io/tools/saas-idea-validator</span>
      </div>
      <div style="font-size:14px;color:#6a6a6a;">${emoji} Validated with SaaS Idea Validator</div>
    </div>
  </div>`;
}

function generateMediumImageHTML(): string {
  if (!props.result) return '';
  const color = gradeColor.value;
  const name = escapeHtml(displayName.value);
  const result = props.result;

  const categoryBarsHTML = categoryBars.value.map(cat =>
    `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <div style="width:100px;font-size:14px;color:#a0a0a0;text-align:right;">${escapeHtml(cat.name)}</div>
      <div style="flex:1;height:24px;background:#1a1a1a;border-radius:4px;overflow:hidden;position:relative;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:${cat.score.percentage}%;background:${cat.barColor};border-radius:4px;"></div>
      </div>
      <div style="width:50px;font-size:16px;font-weight:600;color:#f5f5f5;font-family:'SF Mono',Monaco,Consolas,monospace;">${cat.score.percentage}%</div>
    </div>`
  ).join('');

  return `<div style="width:1200px;height:630px;background:#0a0a0a;position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow:hidden;">
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#0a0a0a 0%,#151515 50%,#0a0a0a 100%);"></div>
    <div style="position:absolute;top:-80px;right:-80px;width:350px;height:350px;background:radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%);border-radius:50%;"></div>
    <div style="position:absolute;left:0;top:0;width:6px;height:100%;background:linear-gradient(180deg,#3b82f6 0%,#8b5cf6 100%);"></div>
    <div style="position:absolute;left:60px;top:50px;right:60px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div>
          <div style="display:inline-block;padding:6px 16px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:6px;color:#60a5fa;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">
            Idea Validation Score
          </div>
          <h1 style="font-size:36px;font-weight:700;color:#f5f5f5;margin:0;letter-spacing:-0.02em;line-height:1.15;">
            ${name}
          </h1>
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="text-align:right;">
            <div style="font-size:56px;font-weight:700;color:${color};font-family:'SF Mono',Monaco,Consolas,monospace;line-height:1;">${result.percentage}</div>
            <div style="font-size:14px;color:#6a6a6a;">out of 100</div>
          </div>
          <div style="width:64px;height:64px;background:${color};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
            ${result.grade}
          </div>
        </div>
      </div>
    </div>
    <div style="position:absolute;left:60px;top:180px;right:60px;">
      <div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6a6a6a;margin-bottom:16px;">Category Breakdown</div>
      ${categoryBarsHTML}
    </div>
    <div style="position:absolute;left:60px;bottom:90px;right:60px;">
      <p style="font-size:18px;color:#a0a0a0;margin:0;line-height:1.5;max-width:700px;">
        ${escapeHtml(result.headline)}
      </p>
    </div>
    <div style="position:absolute;left:60px;right:60px;bottom:40px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:12px;">
        <svg width="28" height="28" viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" fill="none" stroke="#3b82f6" stroke-width="3"/><text x="100" y="135" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="110" font-weight="700" fill="#3b82f6" text-anchor="middle">M</text></svg>
        <span style="font-size:14px;color:#6a6a6a;">meysam.io/tools/saas-idea-validator</span>
      </div>
    </div>
  </div>`;
}

function generateDetailedImageHTML(): string {
  if (!props.result) return '';
  const color = gradeColor.value;
  const name = escapeHtml(displayName.value);
  const result = props.result;

  const categoryDotsHTML = categoryBars.value.map(cat =>
    `<div style="display:flex;align-items:center;gap:8px;">
      <div style="width:10px;height:10px;background:${cat.barColor};border-radius:50%;"></div>
      <span style="font-size:13px;color:#a0a0a0;">${escapeHtml(cat.name)}</span>
      <span style="font-size:13px;font-weight:600;color:#f5f5f5;font-family:'SF Mono',Monaco,Consolas,monospace;">${cat.score.percentage}%</span>
    </div>`
  ).join('');

  const strengthsHTML = topStrengths.value.map(s =>
    `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
      <span style="color:#10b981;font-size:14px;">✓</span>
      <span style="font-size:14px;color:#d0d0d0;line-height:1.4;">${escapeHtml(s)}</span>
    </div>`
  ).join('');

  const weaknessesHTML = topWeaknesses.value.map(w =>
    `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
      <span style="color:#f59e0b;font-size:14px;">!</span>
      <span style="font-size:14px;color:#d0d0d0;line-height:1.4;">${escapeHtml(w)}</span>
    </div>`
  ).join('');

  return `<div style="width:1200px;height:630px;background:#0a0a0a;position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow:hidden;">
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#0a0a0a 0%,#151515 50%,#0a0a0a 100%);"></div>
    <div style="position:absolute;top:-60px;right:-60px;width:300px;height:300px;background:radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%);border-radius:50%;"></div>
    <div style="position:absolute;left:0;top:0;width:6px;height:100%;background:linear-gradient(180deg,#3b82f6 0%,#8b5cf6 100%);"></div>
    <div style="position:absolute;left:50px;top:45px;width:400px;">
      <div style="display:inline-block;padding:6px 14px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:6px;color:#60a5fa;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">
        Idea Validation
      </div>
      <h1 style="font-size:32px;font-weight:700;color:#f5f5f5;margin:0 0 16px 0;letter-spacing:-0.02em;line-height:1.15;">
        ${name}
      </h1>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
        <div style="font-size:52px;font-weight:700;color:${color};font-family:'SF Mono',Monaco,Consolas,monospace;line-height:1;">${result.percentage}</div>
        <div>
          <div style="width:52px;height:52px;background:${color};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:white;">
            ${result.grade}
          </div>
        </div>
      </div>
      <p style="font-size:15px;color:#a0a0a0;margin:0 0 20px 0;line-height:1.5;">
        ${escapeHtml(result.headline)}
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:12px 20px;">
        ${categoryDotsHTML}
      </div>
    </div>
    <div style="position:absolute;right:50px;top:45px;width:420px;">
      ${topStrengths.value.length > 0 ? `
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#10b981;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
          <span>✓</span> Strengths
        </div>
        ${strengthsHTML || '<div style="font-size:14px;color:#6a6a6a;font-style:italic;">Keep validating</div>'}
      </div>
      ` : ''}
      ${topWeaknesses.value.length > 0 ? `
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#f59e0b;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
          <span>!</span> Focus Areas
        </div>
        ${weaknessesHTML || '<div style="font-size:14px;color:#6a6a6a;font-style:italic;">Looking good</div>'}
      </div>
      ` : ''}
    </div>
    <div style="position:absolute;left:50px;right:50px;bottom:35px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:10px;">
        <svg width="26" height="26" viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" fill="none" stroke="#3b82f6" stroke-width="3"/><text x="100" y="135" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="110" font-weight="700" fill="#3b82f6" text-anchor="middle">M</text></svg>
        <span style="font-size:13px;color:#6a6a6a;">meysam.io/tools/saas-idea-validator</span>
      </div>
      <div style="font-size:12px;color:#6a6a6a;">Validate your idea at meysam.io</div>
    </div>
  </div>`;
}

const previewHTML = computed(() => {
  switch (currentScope.value) {
    case 'minimal': return generateMinimalImageHTML();
    case 'medium': return generateMediumImageHTML();
    case 'detailed': return generateDetailedImageHTML();
    default: return generateMinimalImageHTML();
  }
});

function close() {
  emit('close');
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    close();
  }
}

async function handleDownload() {
  if (!props.result || isDownloading.value) return;

  isDownloading.value = true;
  downloadSuccess.value = false;

  try {
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    tempContainer.innerHTML = previewHTML.value;
    document.body.appendChild(tempContainer);

    const renderTarget = tempContainer.firstElementChild as HTMLElement;
    await new Promise(resolve => requestAnimationFrame(resolve));

    const dataUrl = await toPng(renderTarget, {
      width: 1200,
      height: 630,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#0a0a0a',
    });

    document.body.removeChild(tempContainer);

    const link = document.createElement('a');
    const safeName = (props.ideaName || 'saas-idea').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    link.download = `${safeName}-validation-${currentScope.value}.png`;
    link.href = dataUrl;
    link.click();

    downloadSuccess.value = true;
    setTimeout(() => {
      downloadSuccess.value = false;
    }, 1500);
  } catch (error) {
    console.error('Failed to generate image:', error);
    alert('Failed to generate image. Please try again.');
  } finally {
    isDownloading.value = false;
  }
}

async function handleCopy() {
  if (!props.result || isCopying.value) return;

  isCopying.value = true;
  copySuccess.value = false;

  try {
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    tempContainer.innerHTML = previewHTML.value;
    document.body.appendChild(tempContainer);

    const renderTarget = tempContainer.firstElementChild as HTMLElement;
    await new Promise(resolve => requestAnimationFrame(resolve));

    const blob = await toBlob(renderTarget, {
      width: 1200,
      height: 630,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#0a0a0a',
    });

    document.body.removeChild(tempContainer);

    if (!blob) {
      throw new Error('Failed to generate image blob');
    }

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);

    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy image:', error);
    alert('Failed to copy image. Try downloading instead.');
  } finally {
    isCopying.value = false;
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    currentScope.value = 'minimal';
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="image-modal-overlay"
      @click="handleOverlayClick"
    >
      <div
        class="image-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="image-modal-header">
          <h3 id="modal-title">Download Share Image</h3>
          <button
            type="button"
            class="modal-close-btn"
            aria-label="Close modal"
            @click="close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="image-modal-content">
          <div class="scope-selector">
            <label class="scope-label">Content Detail:</label>
            <div class="scope-options">
              <button
                v-for="option in scopeOptions"
                :key="option.id"
                type="button"
                class="scope-btn"
                :class="{ active: currentScope === option.id }"
                @click="currentScope = option.id"
              >
                <span class="scope-icon">{{ option.icon }}</span>
                <span class="scope-name">{{ option.name }}</span>
                <span class="scope-desc">{{ option.desc }}</span>
              </button>
            </div>
          </div>

          <div class="image-preview-container">
            <div class="image-preview-wrapper">
              <div
                ref="previewRef"
                class="share-image-canvas"
                v-html="previewHTML"
              />
            </div>
          </div>

          <div class="image-modal-actions">
            <button
              type="button"
              class="btn btn-primary btn-download-image"
              :disabled="isDownloading"
              @click="handleDownload"
            >
              <svg v-if="isDownloading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <svg v-else-if="downloadSuccess" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span class="btn-text">
                {{ isDownloading ? 'Generating...' : downloadSuccess ? 'Downloaded!' : 'Download PNG' }}
              </span>
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              :disabled="isCopying"
              @click="handleCopy"
            >
              <svg v-if="copySuccess" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span class="btn-text">
                {{ isCopying ? 'Copying...' : copySuccess ? 'Copied!' : 'Copy to Clipboard' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: var(--space-md, 1rem);
  animation: fadeIn 0.2s ease;
}

.image-modal {
  background: var(--color-bg-elevated, #1a1a1a);
  border: 1px solid var(--color-border, #2a2a2a);
  border-radius: var(--border-radius, 12px);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.image-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg, 1.5rem);
  border-bottom: 1px solid var(--color-border, #2a2a2a);
}

.image-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text, #f5f5f5);
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--color-border, #2a2a2a);
  border-radius: var(--border-radius-sm, 6px);
  color: var(--color-text-muted, #a0a0a0);
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: var(--color-bg, #0a0a0a);
  border-color: var(--color-text-dim, #6a6a6a);
  color: var(--color-text, #f5f5f5);
}

.image-modal-content {
  padding: var(--space-lg, 1.5rem);
}

.scope-selector {
  margin-bottom: var(--space-lg, 1.5rem);
}

.scope-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted, #a0a0a0);
  margin-bottom: var(--space-sm, 0.5rem);
}

.scope-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm, 0.5rem);
}

.scope-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-md, 1rem);
  background: var(--color-bg, #0a0a0a);
  border: 2px solid var(--color-border, #2a2a2a);
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.scope-btn:hover {
  border-color: var(--color-text-dim, #6a6a6a);
  background: var(--color-bg-elevated, #1a1a1a);
}

.scope-btn.active {
  border-color: var(--color-accent, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
}

.scope-icon {
  font-size: 1.5rem;
}

.scope-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text, #f5f5f5);
}

.scope-desc {
  font-size: 0.75rem;
  color: var(--color-text-dim, #6a6a6a);
}

.image-preview-container {
  background: #0a0a0a;
  border: 1px solid var(--color-border, #2a2a2a);
  border-radius: var(--border-radius-sm, 6px);
  overflow: hidden;
  margin-bottom: var(--space-lg, 1.5rem);
}

.image-preview-wrapper {
  transform-origin: top left;
  transform: scale(0.5);
  width: 200%;
  height: 0;
  padding-bottom: 26.25%;
}

.share-image-canvas {
  width: 1200px;
  height: 630px;
}

.image-modal-actions {
  display: flex;
  gap: var(--space-md, 1rem);
  justify-content: center;
}

.image-modal-actions .btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  min-width: 160px;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-primary {
  background: var(--color-accent, #3b82f6);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #2563eb);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border, #2a2a2a);
  color: var(--color-text, #f5f5f5);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg, #0a0a0a);
  border-color: var(--color-text-dim, #6a6a6a);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .scope-options {
    grid-template-columns: 1fr;
  }

  .scope-btn {
    flex-direction: row;
    justify-content: flex-start;
    gap: var(--space-md, 1rem);
  }

  .image-preview-wrapper {
    transform: scale(0.28);
    padding-bottom: 14.7%;
  }

  .image-modal-actions {
    flex-direction: column;
  }

  .image-modal-actions .btn {
    width: 100%;
  }
}
</style>
