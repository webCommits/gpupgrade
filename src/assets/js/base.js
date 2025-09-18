// ===== GLOBAL VARIABLES =====
console.log('GPU Data loaded:', window.gpuData);

// ===== MOBILE NAVIGATION =====
document.addEventListener('DOMContentLoaded', function() {
  const mobileToggle = document.querySelector('.nav-mobile-toggle');
  const mobileMenu = document.querySelector('.nav-mobile-menu');
  
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function() {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('show');
      
      // Animate hamburger icon
      const icon = mobileToggle.querySelector('.nav-mobile-icon');
      if (icon) {
        icon.style.transform = isExpanded ? 'none' : 'rotate(45deg)';
      }
    });
  }
});

// ===== UPGRADE CALCULATOR =====
function upgradeCalculator() {
  return {
    searchQuery: '',
    selectedGPU: null,
    showDropdown: false,
    filteredGPUs: [],
    minImprovement: 30,
    maxAllowedImprovement: 100,
    results: [],
    calculatorRun: false,
    isCalculating: false,

    init() {
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('[x-data*="upgradeCalculator"]')) {
          this.showDropdown = false;
        }
      });

      // Load selected GPU from localStorage if available
      const savedGPU = localStorage.getItem('selectedGPU');
      if (savedGPU) {
        try {
          const gpu = JSON.parse(savedGPU);
          this.selectGPU(gpu);
          localStorage.removeItem('selectedGPU');
        } catch (e) {
          console.warn('Could not load saved GPU:', e);
        }
      }
    },

    searchGPUs() {
      if (!window.gpuData?.gpus || this.searchQuery.length < 2) {
        this.filteredGPUs = [];
        return;
      }

      const gpuList = Object.entries(window.gpuData.gpus).map(([slug, gpu]) => ({
        slug,
        ...gpu
      }));

      this.filteredGPUs = gpuList.filter(gpu =>
        gpu.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      ).slice(0, 10); // Limit to 10 results for performance
    },

    selectGPU(gpu) {
      this.selectedGPU = gpu;
      this.searchQuery = gpu.name;
      this.showDropdown = false;
      this.results = [];
      this.calculatorRun = false;

      // Calculate maximum possible improvement
      try {
        const current = this.selectedGPU.score;
        const allScores = Object.values(window.gpuData.gpus).map(g => g.score || 0);
        const maxScore = Math.max(...allScores);
        const maxImp = ((maxScore / current) - 1) * 100;
        this.maxAllowedImprovement = Math.max(Math.ceil(maxImp), 100);
        
        if (this.minImprovement > this.maxAllowedImprovement) {
          this.minImprovement = Math.min(this.maxAllowedImprovement, 30);
        }
      } catch (e) {
        console.warn('Could not compute maxAllowedImprovement:', e);
        this.maxAllowedImprovement = 100;
      }

      // Add subtle success feedback
      this.showNotification('GPU selected successfully', 'success');
    },

    clearSelection() {
      this.selectedGPU = null;
      this.searchQuery = '';
      this.filteredGPUs = [];
      this.results = [];
      this.calculatorRun = false;
      this.maxAllowedImprovement = 100;
    },

    async calculateUpgrades() {
      if (!this.selectedGPU || !window.gpuData?.gpus) {
        this.showNotification('Please select a GPU first', 'error');
        return;
      }

      this.isCalculating = true;
      
      // Simulate calculation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const baseScore = this.selectedGPU.score;
      if (!baseScore || baseScore <= 0) {
        this.showNotification('Invalid GPU score', 'error');
        this.isCalculating = false;
        return;
      }

      this.results = Object.entries(window.gpuData.gpus)
        .map(([slug, gpu]) => {
          const gpuScore = gpu.score;
          if (!gpuScore || gpuScore <= 0 || gpuScore <= baseScore) return null;

          const improvement = ((gpuScore / baseScore) - 1) * 100;

          return {
            slug,
            name: gpu.name,
            gpu,
            currentScore: baseScore,
            newScore: gpuScore,
            improvement: improvement
          };
        })
        .filter(result => result && result.improvement >= this.minImprovement)
        .sort((a, b) => a.improvement - b.improvement);

      this.calculatorRun = true;
      this.isCalculating = false;

      // Show notification based on results
      if (this.results.length > 0) {
        this.showNotification(`Found ${this.results.length} upgrade options`, 'success');
      } else {
        this.showNotification(`No upgrades found with ${this.minImprovement}% improvement`, 'info');
      }
    },

    showNotification(message, type = 'info') {
      // Simple notification system
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'};
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };
}

// ===== GPU LIST =====
function gpuList() {
  return {
    allGPUs: [],
    filteredGPUs: [],
    searchQuery: '',
    brandFilter: 'all',
    sortBy: 'score',
    sortDescending: true,
    selectedForComparison: [],
    maxPerformance: 0,
    visibleCount: 20,
    viewMode: 'grid',

    init() {
      if (window.gpuData?.gpus) {
        this.allGPUs = Object.entries(window.gpuData.gpus).map(([slug, gpu]) => ({
          slug,
          name: gpu.name,
          score: gpu.score || 0
        }));
        
        this.maxPerformance = Math.max(...this.allGPUs.map(gpu => gpu.score));
        this.filteredGPUs = [...this.allGPUs];
        this.sortGPUs();
      }

      // Load comparison GPUs from localStorage
      const savedComparison = localStorage.getItem('comparisonGPUs');
      if (savedComparison) {
        try {
          this.selectedForComparison = JSON.parse(savedComparison);
        } catch (e) {
          console.warn('Could not load saved comparison GPUs:', e);
        }
      }
    },

    filterGPUs() {
      let filtered = [...this.allGPUs];

      // Text search
      if (this.searchQuery.length >= 1) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(gpu =>
          gpu.name.toLowerCase().includes(query)
        );
      }

      // Brand filter
      if (this.brandFilter === 'nvidia') {
        filtered = filtered.filter(gpu => {
          const name = gpu.name.toLowerCase();
          return name.includes('rtx') || name.includes('gtx') || 
                 name.includes('geforce') || name.includes('titan');
        });
      } else if (this.brandFilter === 'amd') {
        filtered = filtered.filter(gpu => {
          const name = gpu.name.toLowerCase();
          return name.includes('rx') || name.includes('radeon') ||
                 name.includes('vega') || name.includes('fury');
        });
      }

      this.filteredGPUs = filtered;
      this.visibleCount = 20; // Reset visible count when filtering
      this.sortGPUs();
    },

    sortGPUs() {
      this.filteredGPUs.sort((a, b) => {
        let aVal = a[this.sortBy];
        let bVal = b[this.sortBy];

        if (typeof aVal === 'string') {
          return this.sortDescending ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }

        aVal = aVal || 0;
        bVal = bVal || 0;
        return this.sortDescending ? bVal - aVal : aVal - bVal;
      });
    },

    showMore() {
      this.visibleCount = Math.min(this.visibleCount + 20, this.filteredGPUs.length);
    },

    getBrand(name) {
      const nameLower = name.toLowerCase();
      if (nameLower.includes('rtx') || nameLower.includes('gtx') || nameLower.includes('geforce')) {
        return 'NVIDIA';
      } else if (nameLower.includes('rx') || nameLower.includes('radeon')) {
        return 'AMD';
      } else if (nameLower.includes('intel') || nameLower.includes('arc')) {
        return 'Intel';
      }
      return 'Other';
    },

    isSelected(gpu) {
      return this.selectedForComparison.some(selected => selected.slug === gpu.slug);
    },

    selectForComparison(gpu) {
      const index = this.selectedForComparison.findIndex(selected => selected.slug === gpu.slug);

      if (index === -1) {
        if (this.selectedForComparison.length < 4) {
          this.selectedForComparison.push(gpu);
          this.saveComparisonToStorage();
        } else {
          alert('You can compare up to 4 GPUs at once.');
        }
      } else {
        this.selectedForComparison.splice(index, 1);
        this.saveComparisonToStorage();
      }
    },

    useInCalculator(gpu) {
      localStorage.setItem('selectedGPU', JSON.stringify(gpu));
      window.location.href = '/';
    },

    goToComparison() {
      if (this.selectedForComparison.length < 2) {
        alert('Please select at least 2 GPUs to compare.');
        return;
      }

      // For now, just take the first two GPUs for comparison
      const gpu1 = this.selectedForComparison[0];
      const gpu2 = this.selectedForComparison[1];
      
      localStorage.setItem('comparisonGPU1', JSON.stringify(gpu1));
      localStorage.setItem('comparisonGPU2', JSON.stringify(gpu2));
      window.location.href = '/gpu/compare/';
    },

    clearComparison() {
      this.selectedForComparison = [];
      localStorage.removeItem('comparisonGPUs');
    },

    clearFilters() {
      this.searchQuery = '';
      this.brandFilter = 'all';
      this.filterGPUs();
    },

    saveComparisonToStorage() {
      localStorage.setItem('comparisonGPUs', JSON.stringify(this.selectedForComparison));
    }
  };
}

// ===== GPU COMPARER =====
function gpuComparer() {
  return {
    gpu1Query: '',
    gpu2Query: '',
    gpu1: null,
    gpu2: null,
    showDropdown1: false,
    showDropdown2: false,
    filteredGPUs1: [],
    filteredGPUs2: [],
    comparison: null,
    isComparing: false,

    init() {
      // Close dropdowns when clicking outside
      document.addEventListener('click', e => {
        if (!e.target.closest('[x-data*="gpuComparer"]')) {
          this.showDropdown1 = false;
          this.showDropdown2 = false;
        }
      });

      // Load GPUs from localStorage if available
      this.loadSavedGPUs();
    },

    loadSavedGPUs() {
      const savedGPU1 = localStorage.getItem('comparisonGPU1');
      const savedGPU2 = localStorage.getItem('comparisonGPU2');
      
      if (savedGPU1) {
        try {
          const gpu = JSON.parse(savedGPU1);
          this.selectGPU(gpu, 'gpu1');
          localStorage.removeItem('comparisonGPU1');
        } catch (e) {
          console.warn('Could not load saved GPU1:', e);
        }
      }
      
      if (savedGPU2) {
        try {
          const gpu = JSON.parse(savedGPU2);
          this.selectGPU(gpu, 'gpu2');
          localStorage.removeItem('comparisonGPU2');
        } catch (e) {
          console.warn('Could not load saved GPU2:', e);
        }
      }

      // If both GPUs loaded, automatically calculate comparison
      if (this.gpu1 && this.gpu2) {
        setTimeout(() => this.calculateComparison(), 500);
      }
    },

    searchGPUs(target) {
      if (!window.gpuData?.gpus) return;
      
      const query = target === 'gpu1' ? this.gpu1Query : this.gpu2Query;
      if (query.length < 2) {
        if (target === 'gpu1') this.filteredGPUs1 = [];
        else this.filteredGPUs2 = [];
        return;
      }

      const gpuList = Object.entries(window.gpuData.gpus).map(([slug, gpu]) => ({
        slug, 
        ...gpu
      }));
      
      const filtered = gpuList.filter(gpu => 
        gpu.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      
      if (target === 'gpu1') this.filteredGPUs1 = filtered;
      else this.filteredGPUs2 = filtered;
    },

    selectGPU(gpu, target) {
      if (target === 'gpu1') {
        this.gpu1 = gpu;
        this.gpu1Query = gpu.name;
        this.showDropdown1 = false;
        this.filteredGPUs1 = [];
      } else {
        this.gpu2 = gpu;
        this.gpu2Query = gpu.name;
        this.showDropdown2 = false;
        this.filteredGPUs2 = [];
      }
      this.comparison = null;
    },

    clearGPU(target) {
      if (target === 'gpu1') {
        this.gpu1 = null;
        this.gpu1Query = '';
        this.filteredGPUs1 = [];
      } else {
        this.gpu2 = null;
        this.gpu2Query = '';
        this.filteredGPUs2 = [];
      }
      this.comparison = null;
    },

    async calculateComparison() {
      if (!this.gpu1 || !this.gpu2) return;

      this.isComparing = true;
      
      // Simulate comparison delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      const improvement = ((this.gpu2.score / this.gpu1.score) - 1) * 100;

      this.comparison = {
        gpu1: this.gpu1,
        gpu2: this.gpu2,
        improvement: improvement
      };

      this.isComparing = false;
    },

    swapGPUs() {
      const tempGPU = this.gpu1;
      const tempQuery = this.gpu1Query;
      
      this.gpu1 = this.gpu2;
      this.gpu1Query = this.gpu2Query;
      
      this.gpu2 = tempGPU;
      this.gpu2Query = tempQuery;
      
      if (this.comparison) {
        this.calculateComparison();
      }
    },

    useWorseInCalculator() {
      if (!this.comparison) return;
      
      const worseGPU = this.comparison.improvement > 0 ? this.comparison.gpu1 : this.comparison.gpu2;
      localStorage.setItem('selectedGPU', JSON.stringify(worseGPU));
      window.location.href = '/';
    }
  };
}

// ===== UTILITY FUNCTIONS =====

// Smooth scroll to element
function scrollToElement(selector, offset = 0) {
  const element = document.querySelector(selector);
  if (element) {
    const elementTop = element.offsetTop - offset;
    window.scrollTo({
      top: elementTop,
      behavior: 'smooth'
    });
  }
}

// Format number with commas
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Debounce function for search inputs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add keyboard navigation for dropdowns
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    // Close all dropdowns on escape
    const dropdowns = document.querySelectorAll('[x-show*="showDropdown"]');
    dropdowns.forEach(dropdown => {
      // Trigger Alpine.js to close dropdowns
      const component = dropdown.closest('[x-data]');
      if (component && component._x_dataStack) {
        const data = component._x_dataStack[0];
        if (data.showDropdown !== undefined) data.showDropdown = false;
        if (data.showDropdown1 !== undefined) data.showDropdown1 = false;
        if (data.showDropdown2 !== undefined) data.showDropdown2 = false;
      }
    });
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .notification {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;
document.head.appendChild(style);

// Initialize page-specific functionality based on URL
document.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname;
  
  if (path.includes('/gpu/') && !path.includes('/compare/')) {
    console.log('GPU List page initialized');
  } else if (path.includes('/compare/')) {
    console.log('GPU Compare page initialized');
  } else {
    console.log('GPU Calculator page initialized');
  }
});

// Performance monitoring
if (window.performance) {
  window.addEventListener('load', function() {
    setTimeout(function() {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      console.log(`Page load time: ${loadTime}ms`);
    }, 0);
  });
}
