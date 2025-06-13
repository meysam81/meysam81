<template>
  <div class="min-h-screen font-sans transition-colors duration-300" :class="{'dark': isDarkMode}">
    <header class="bg-gray-100 dark:bg-gray-900 py-6 shadow-md">
      <div class="container mx-auto px-4 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white">{{ candidate.name }}</h1>
          <p class="text-lg text-gray-600 dark:text-gray-300">{{ candidate.title }}</p>
        </div>
        <button @click="toggleDarkMode" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>
    <main class="container mx-auto px-4 py-8 grid gap-8 md:grid-cols-[1fr_2fr]">
      <aside class="space-y-6">
        <section>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 pb-2">Contact</h2>
          <p class="text-gray-700 dark:text-gray-300">{{ candidate.contact.email }}</p>
          <p class="text-gray-700 dark:text-gray-300">{{ candidate.contact.location }}</p>
          <a :href="'https://' + candidate.contact.blog" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">{{ candidate.contact.blog }}</a>
          <p><a :href="'https://' + candidate.contact.linkedin" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">LinkedIn</a></p>
          <p><a :href="'https://' + candidate.contact.github" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">GitHub</a></p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 pb-2">Technical Stack</h2>
          <div class="flex flex-wrap gap-1 mt-2">
            <span v-for="badge in candidate.badges" :key="badge"
                  class="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
              {{ badge }}
            </span>
          </div>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 pb-2">Core Competencies</h2>
          <ul class="list-disc pl-5 text-gray-700 dark:text-gray-300">
            <li v-for="skill in candidate.competencies" :key="skill">{{ skill }}</li>
          </ul>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 pb-2">Certifications</h2>
          <div class="space-y-2">
            <div v-for="cert in candidate.certifications" :key="cert"
                 class="flex items-center space-x-2 p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span class="text-green-600 dark:text-green-400 text-sm">✓</span>
              <span class="text-gray-700 dark:text-gray-300 text-sm">{{ cert }}</span>
            </div>
          </div>
        </section>
      </aside>
      <div class="space-y-8">
        <section>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 pb-2">Professional Summary</h2>
          <p class="text-gray-700 dark:text-gray-300">{{ candidate.summary }}</p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 pb-2">Professional Experience</h2>
          <div v-for="job in candidate.experience" :key="job.role" class="mb-6">
            <h3 class="text-lg font-medium text-gray-800 dark:text-white">{{ job.role }}</h3>
            <p class="text-gray-600 dark:text-gray-400">{{ job.company }} • {{ job.location }}</p>
            <p class="text-gray-600 dark:text-gray-400">{{ job.dates }}</p>
            <ul class="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300">
              <li v-for="achievement in job.achievements" :key="achievement">{{ achievement }}</li>
            </ul>
          </div>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 pb-2">Education</h2>
          <div v-for="edu in candidate.education" :key="edu.degree" class="mb-4">
            <p class="text-gray-700 dark:text-gray-300">{{ edu.degree }}</p>
            <p class="text-gray-600 dark:text-gray-400">{{ edu.institution }} • {{ edu.dates }}</p>
          </div>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white border-b-2 pb-2">Publications/Blogging</h2>
          <ul class="list-disc pl-5 text-gray-700 dark:text-gray-300">
            <li v-for="pub in candidate.publications" :key="pub">{{ pub }}</li>
          </ul>
        </section>
      </div>
    </main>
    <footer class="bg-gray-100 dark:bg-gray-900 py-4 text-center text-gray-600 dark:text-gray-400">
      <p>&copy; {{ currentYear }} Meysam Azad. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, defineComponent } from 'vue'
import { candidateData } from './data/candidate.js'

export default defineComponent({
  name: 'App',
  setup: function setup() {
    var isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
    var candidate = ref(candidateData)

    var currentYear = computed(function computeCurrentYear() {
      return new Date().getFullYear()
    })

    function toggleDarkMode() {
      isDarkMode.value = !isDarkMode.value
      document.documentElement.classList.toggle('dark', isDarkMode.value)
    }

    onMounted(function onMountedHook() {
      document.documentElement.classList.toggle('dark', isDarkMode.value)
    })

    return {
      isDarkMode,
      candidate,
      currentYear,
      toggleDarkMode
    }
  }
})
</script>
