<template>
  <nav class="floating-nav" aria-label="Section navigation">
    <div
      v-for="section in sections"
      :key="section.id"
      class="nav-dot"
      :class="{ active: activeSection === section.id }"
      @click="scrollToSection(section.id)"
      :aria-label="`Navigate to ${section.label}`"
      role="button"
      tabindex="0"
      @keydown.enter="scrollToSection(section.id)"
    ></div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const sections = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' }
];

const activeSection = ref('hero');

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleScroll() {
  const scrollPosition = window.scrollY + 100;

  for (const section of sections) {
    const element = document.getElementById(section.id);
    if (element) {
      const sectionTop = element.offsetTop;
      const sectionHeight = element.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        activeSection.value = section.id;
        break;
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>
