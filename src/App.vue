<template>
  <div class="min-h-screen font-sans transition-colors duration-300" :class="{ 'dark': isDarkMode }">
    <header class="bg-gray-100 dark:bg-gray-900 py-8 shadow-md">
      <div class="container mx-auto px-6 flex justify-between items-center">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white">{{ candidate.name }}</h1>
          <p class="text-lg text-gray-600 dark:text-gray-300">{{ candidate.title }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <button v-if="showInstallPrompt" @click="installPWA"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            📱 Install App
          </button>
          <button @click="toggleDarkMode"
            class="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>
    </header>
    <main class="container mx-auto px-6 py-12 grid gap-12 md:grid-cols-[1fr_2fr]">
      <aside class="space-y-8">
        <section class="space-y-4">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-3">
            Contact</h2>
          <div class="space-y-3">
            <p class="text-gray-700 dark:text-gray-300">
              <a :href="'mailto:' + candidate.contact.email" class="text-blue-600 dark:text-blue-400 hover:underline">
                {{ candidate.contact.email }}
              </a>
            </p>
            <p class="text-gray-700 dark:text-gray-300">{{ candidate.contact.location }}</p>
            <div class="space-y-2">
              <div><a :href="'https://' + candidate.contact.blog" target="_blank"
                  class="text-blue-600 dark:text-blue-400 hover:underline">{{ candidate.contact.blog }}</a></div>
              <div><a :href="'https://' + candidate.contact.linkedin" target="_blank"
                  class="text-blue-600 dark:text-blue-400 hover:underline">LinkedIn</a></div>
              <div><a :href="'https://' + candidate.contact.github" target="_blank"
                  class="text-blue-600 dark:text-blue-400 hover:underline">GitHub</a></div>
            </div>
          </div>
        </section>
        <section class="space-y-4">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-3">
            Technical Stack</h2>
          <div class="flex flex-wrap gap-2">
            <span v-for="badge in candidate.badges" :key="badge"
              class="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
              {{ badge }}
            </span>
          </div>
        </section>
        <section class="space-y-4">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-3">
            Core Competencies</h2>
          <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
            <li v-for="skill in candidate.competencies" :key="skill">{{ skill }}</li>
          </ul>
        </section>
        <section class="space-y-4">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-3">
            Certifications</h2>
          <div class="space-y-3">
            <div v-for="cert in candidate.certifications" :key="cert"
              class="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span class="text-green-600 dark:text-green-400 text-sm mt-0.5 flex-shrink-0">✓</span>
              <span class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{{ cert }}</span>
            </div>
          </div>
        </section>
      </aside>
      <div class="space-y-10">
        <section class="space-y-4">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-3">
            Professional Summary</h2>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">{{ candidate.summary }}</p>
        </section>
        <section class="space-y-6">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-3">
            Professional Experience</h2>
          <div v-for="job in candidate.experience" :key="job.role"
            class="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ job.role }}</h3>
              <p class="text-gray-600 dark:text-gray-400 font-medium">{{ job.company }} • {{ job.location }}</p>
              <p class="text-gray-500 dark:text-gray-500 text-sm">{{ job.dates }}</p>
            </div>
            <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li v-for="achievement in job.achievements" :key="achievement" class="leading-relaxed">{{ achievement }}
              </li>
            </ul>
          </div>
        </section>
        <section class="space-y-4">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-3">
            Education</h2>
          <div v-for="edu in candidate.education" :key="edu.degree" class="space-y-1 pb-4 last:pb-0">
            <p class="text-gray-700 dark:text-gray-300 font-medium">{{ edu.degree }}</p>
            <p class="text-gray-600 dark:text-gray-400">{{ edu.institution }} • {{ edu.dates }}</p>
          </div>
        </section>
        <section class="space-y-4">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-3">
            Publications/Blogging</h2>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li v-for="pub in candidate.publications" :key="pub" class="leading-relaxed">{{ pub }}</li>
          </ul>
        </section>
      </div>
    </main>
    <footer
      class="bg-gray-100 dark:bg-gray-900 py-6 mt-16 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
      <p>&copy; {{ currentYear }} Meysam Azad. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, defineComponent } from 'vue'
import { candidateData } from './data/candidate.js'
import log from 'loglevel';

export default defineComponent({
  name: 'App',
  setup: function setup() {
    var isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
    var candidate = ref(candidateData)
    var deferredPrompt = ref(null)
    var showInstallPrompt = ref(false)

    var currentYear = computed(function computeCurrentYear() {
      return new Date().getFullYear()
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
    })

    return {
      isDarkMode,
      candidate,
      currentYear,
      showInstallPrompt,
      toggleDarkMode,
      installPWA
    }
  }
})
</script>
