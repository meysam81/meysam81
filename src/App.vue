<template>
  <div class="min-h-screen transition-all duration-300" :class="{ 'dark': isDarkMode }">
    <!-- Floating Navigation -->
    <nav class="floating-nav">
      <div class="nav-dot" :class="{ active: activeSection === 'hero' }" @click="scrollToSection('hero')"></div>
      <div class="nav-dot" :class="{ active: activeSection === 'about' }" @click="scrollToSection('about')"></div>
      <div class="nav-dot" :class="{ active: activeSection === 'experience' }" @click="scrollToSection('experience')"></div>
      <div class="nav-dot" :class="{ active: activeSection === 'contact' }" @click="scrollToSection('contact')"></div>
    </nav>

    <!-- Hero Header -->
    <header id="hero" class="hero-header py-16 lg:py-24">
      <div class="hero-content container mx-auto px-6">
        <div class="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div class="flex-1 text-center lg:text-left animate-fade-in">
            <div class="space-y-6">
              <div class="space-y-2">
                <h1 class="text-white font-bold">{{ candidate.name }}</h1>
                <div class="text-gradient text-xl lg:text-2xl font-semibold">{{ candidate.title }}</div>
              </div>
              <p class="text-gray-200 text-lg lg:text-xl max-w-2xl leading-relaxed">
                {{ candidate.summary.split('.')[0] }}.
              </p>
              <div class="flex flex-wrap gap-3 justify-center lg:justify-start">
                <button v-if="showInstallPrompt" @click="installPWA" class="btn-primary animate-float">
                  📱 Install App
                </button>
                <a :href="'mailto:' + candidate.contact.email" class="btn-primary">
                  📧 Get In Touch
                </a>
              </div>
            </div>
          </div>
          <div class="flex-shrink-0 animate-slide-up">
            <button @click="toggleDarkMode" class="theme-toggle">
              {{ isDarkMode ? '☀️' : '🌙' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative">
      <!-- Professional Summary -->
      <section id="about" class="py-16 lg:py-20">
        <div class="container mx-auto px-6">
          <div class="max-w-4xl mx-auto">
            <h2 class="section-header text-center mb-12">Professional Overview</h2>
            <div class="glass-card p-8 lg:p-12 text-center animate-fade-in">
              <p class="text-lg lg:text-xl leading-relaxed mb-8">{{ candidate.summary }}</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="professional-card text-center">
                  <div class="text-3xl font-bold text-gradient mb-2">{{ experienceYears }}+</div>
                  <div class="text-sm font-medium text-tertiary">Years Experience</div>
                </div>
                <div class="professional-card text-center">
                  <div class="text-3xl font-bold text-gradient mb-2">{{ candidate.certifications.length }}</div>
                  <div class="text-sm font-medium text-tertiary">Certifications</div>
                </div>
                <div class="professional-card text-center">
                  <div class="text-3xl font-bold text-gradient mb-2">{{ candidate.badges.length }}+</div>
                  <div class="text-sm font-medium text-tertiary">Technologies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Grid Layout -->
      <section class="py-8 lg:py-12">
        <div class="container mx-auto px-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <!-- Sidebar -->
            <aside class="lg:col-span-1 space-y-8 animate-slide-up">
              <!-- Contact Information -->
              <div class="glass-card p-6">
                <h3 class="section-header mb-6">Contact</h3>
                <div class="space-y-4">
                  <a :href="'mailto:' + candidate.contact.email" class="contact-link">
                    <span>📧</span>
                    <span>{{ candidate.contact.email }}</span>
                  </a>
                  <div class="contact-link">
                    <span>📍</span>
                    <span>{{ candidate.contact.location }}</span>
                  </div>
                  <a :href="'https://' + candidate.contact.blog" target="_blank" class="contact-link">
                    <span>📝</span>
                    <span>Blog</span>
                  </a>
                  <a :href="'https://' + candidate.contact.linkedin" target="_blank" class="contact-link">
                    <span>💼</span>
                    <span>LinkedIn</span>
                  </a>
                  <a :href="'https://' + candidate.contact.github" target="_blank" class="contact-link">
                    <span>🐙</span>
                    <span>GitHub</span>
                  </a>
                </div>
              </div>

              <!-- Technical Stack -->
              <div class="glass-card p-6">
                <h3 class="section-header mb-6">Technical Expertise</h3>
                <div class="flex flex-wrap gap-2">
                  <span v-for="badge in candidate.badges" :key="badge" class="skill-badge">
                    {{ badge }}
                  </span>
                </div>
              </div>

              <!-- Certifications -->
              <div class="glass-card p-6">
                <h3 class="section-header mb-6">Certifications</h3>
                <div class="space-y-3">
                  <div v-for="cert in candidate.certifications" :key="cert" class="certification-badge">
                    <div class="font-medium text-sm">{{ cert }}</div>
                  </div>
                </div>
              </div>
            </aside>

            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-12 animate-fade-in">
              <!-- Experience -->
              <section id="experience">
                <h2 class="section-header mb-8">Professional Experience</h2>
                <div class="space-y-6">
                  <article v-for="job in candidate.experience" :key="job.role" class="experience-card">
                    <div class="mb-6">
                      <h3 class="text-xl font-semibold mb-2">{{ job.role }}</h3>
                      <div class="text-gradient font-medium mb-1">{{ job.company }}</div>
                      <div class="flex flex-wrap gap-4 text-sm text-tertiary">
                        <span>📍 {{ job.location }}</span>
                        <span>📅 {{ job.dates }}</span>
                      </div>
                    </div>
                    <ul class="space-y-3">
                      <li v-for="achievement in job.achievements" :key="achievement"
                          class="flex items-start gap-3">
                        <span class="text-accent-emerald mt-1 flex-shrink-0">▸</span>
                        <span class="leading-relaxed">{{ achievement }}</span>
                      </li>
                    </ul>
                  </article>
                </div>
              </section>

              <!-- Core Competencies -->
              <section>
                <h2 class="section-header mb-8">Core Competencies</h2>
                <div class="professional-card">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="skill in candidate.competencies" :key="skill"
                         class="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                      <span class="text-accent-blue">✓</span>
                      <span class="font-medium">{{ skill }}</span>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Education -->
              <section>
                <h2 class="section-header mb-8">Education</h2>
                <div class="space-y-4">
                  <div v-for="edu in candidate.education" :key="edu.degree" class="professional-card">
                    <h3 class="font-semibold mb-2">{{ edu.degree }}</h3>
                    <div class="text-gradient font-medium mb-1">{{ edu.institution }}</div>
                    <div class="text-sm text-tertiary">{{ edu.dates }}</div>
                  </div>
                </div>
              </section>

              <!-- Publications -->
              <section>
                <h2 class="section-header mb-8">Publications & Thought Leadership</h2>
                <div class="professional-card">
                  <ul class="space-y-3">
                    <li v-for="pub in candidate.publications" :key="pub"
                        class="flex items-start gap-3">
                      <span class="text-accent-purple mt-1">📚</span>
                      <span class="leading-relaxed">{{ pub }}</span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer id="contact" class="bg-gradient-primary py-12 mt-20">
      <div class="container mx-auto px-6 text-center">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-white mb-4">Let's Build Something Amazing Together</h2>
          <p class="text-gray-200 mb-6">Ready to scale your infrastructure? Let's connect and discuss opportunities.</p>
          <a :href="'mailto:' + candidate.contact.email" class="btn-primary bg-white text-gray-900 hover:bg-gray-100">
            Start a Conversation
          </a>
        </div>
        <div class="text-gray-300 text-sm">
          <p>&copy; {{ currentYear }} {{ candidate.name }}. Crafted with precision and passion.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, defineComponent } from 'vue'
import { candidateData } from './data/candidate.js'
import config from '@/data/config.js'
import log from 'loglevel';

export default defineComponent({
  name: 'App',
  setup: function setup() {
    var isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
    var candidate = ref(candidateData)
    var deferredPrompt = ref(null)
    var showInstallPrompt = ref(false)
    var activeSection = ref('hero')

    var currentYear = computed(function computeCurrentYear() {
      return new Date().getFullYear()
    })

    var experienceYears = computed(function computeExperienceYears() {
      return currentYear.value - config.CAREER_START_YEAR
    })

    function toggleDarkMode() {
      isDarkMode.value = !isDarkMode.value
      document.documentElement.classList.toggle('dark', isDarkMode.value)
    }

    function installPWA() {
      if (deferredPrompt.value) {
        deferredPrompt.value.prompt()
        deferredPrompt.value.userChoice.then(function handleChoice(choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            log.info('User accepted the install prompt')
          }
          deferredPrompt.value = null
          showInstallPrompt.value = false
        })
      }
    }

    function scrollToSection(sectionId) {
      var element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }

    function handleScroll() {
      var sections = ['hero', 'about', 'experience', 'contact']
      var scrollPosition = window.scrollY + 100

      for (var i = 0; i < sections.length; i++) {
        var section = document.getElementById(sections[i])
        if (section) {
          var sectionTop = section.offsetTop
          var sectionHeight = section.offsetHeight

          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            activeSection.value = sections[i]
            break
          }
        }
      }
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault()
      deferredPrompt.value = e
      showInstallPrompt.value = true
    }

    function handleAppInstalled() {
      log.info('PWA was installed')
      showInstallPrompt.value = false
      deferredPrompt.value = null
    }

    onMounted(function onMountedHook() {
      document.documentElement.classList.toggle('dark', isDarkMode.value)

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
      window.addEventListener('scroll', handleScroll)

      handleScroll()
    })

    onUnmounted(function onUnmountedHook() {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      isDarkMode,
      candidate,
      currentYear,
      experienceYears,
      showInstallPrompt,
      activeSection,
      toggleDarkMode,
      installPWA,
      scrollToSection
    }
  }
})
</script>

<style>
.floating-nav {
  position: fixed;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 50;
}

.nav-dot {
  width: 0.75rem;
  height: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s;
}

.nav-dot.active {
  background: #3b82f6;
}

.hero-header {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  font-weight: 600;
  transition: background 0.3s, transform 0.3s;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

.theme-toggle {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.3s;
}

.theme-toggle:hover {
  transform: scale(1.1);
}

.section-header {
  font-size: 1.5rem;
  font-weight: 600;
  position: relative;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.section-header:after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -4px;
  left: 0;
  background: linear-gradient(135deg, #3b82f6, #9333ea);
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s;
}

.glass-card:hover {
  transform: translateY(-2px);
}

.professional-card {
  background: #1e3a8a;
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: transform 0.3s;
}

.professional-card:hover {
  transform: translateY(-2px);
}

.text-gradient {
  background: linear-gradient(135deg, #3b82f6, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  transition: background 0.3s;
}

.contact-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.skill-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.375rem 0.75rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.3s;
}

.skill-badge:hover {
  background: rgba(255, 255, 255, 0.2);
}

.certification-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.3s;
}

.certification-badge:hover {
  background: rgba(255, 255, 255, 0.2);
}

.text-accent-blue {
  color: #3b82f6;
}

.text-accent-emerald {
  color: #10b981;
}

.text-accent-purple {
  color: #9333ea;
}

.text-tertiary {
  color: rgba(255, 255, 255, 0.7);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
}
</style>
