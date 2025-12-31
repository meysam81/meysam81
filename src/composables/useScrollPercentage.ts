import { ref, onMounted, onUnmounted } from "vue";

export function useScrollPercentage() {
  var scrollPercentage = ref(0);

  function calculateScrollPercentage() {
    var windowHeight = window.innerHeight;
    var documentHeight = document.documentElement.scrollHeight;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var scrollableHeight = documentHeight - windowHeight;

    if (scrollableHeight <= 0) {
      return 0;
    }

    var percentage = (scrollTop / scrollableHeight) * 100;
    return Math.round(percentage);
  }

  function updateScrollPercentage() {
    scrollPercentage.value = calculateScrollPercentage();
  }

  onMounted(function handleMount() {
    updateScrollPercentage();
    window.addEventListener("scroll", updateScrollPercentage);
  });

  onUnmounted(function handleUnmount() {
    window.removeEventListener("scroll", updateScrollPercentage);
  });

  return {
    scrollPercentage,
    updateScrollPercentage,
  };
}
