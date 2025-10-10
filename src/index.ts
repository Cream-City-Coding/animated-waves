class AnimatedWaves extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return [
      'wave-color',
      'background-color', 
      'height',
      'speed',
      'opacity-range',
      'wave-count',
      'animation-style',
      'position',
      'wave-height',
      'content-padding',
      'content-background-color',
      'responsive'
    ];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.render();
    }
  }

  get waveColor() {
    return this.getAttribute('wave-color') || '#1A237E';
  }

  get backgroundColor() {
    return this.getAttribute('background-color') || 'transparent';
  }

  get height() {
    return this.getAttribute('height') || '';
  }

  get speed() {
    return parseFloat(this.getAttribute('speed') || '1');
  }

  get opacityRange() {
    const range = this.getAttribute('opacity-range') || '0.3,0.9';
    return range.split(',').map(v => parseFloat(v.trim()));
  }

  get waveCount() {
    return parseInt(this.getAttribute('wave-count') || '4');
  }

  get animationStyle() {
    return this.getAttribute('animation-style') || 'smooth';
  }

  get position() {
    return this.getAttribute('position') || 'top'; // 'top', 'bottom', or 'both'
  }

  get waveHeight() {
    return this.getAttribute('wave-height') || '100px';
  }

  get contentPadding() {
    return this.getAttribute('content-padding') || '20px';
  }

  get contentBackgroundColor() {
    return this.getAttribute('content-background-color') || this.waveColor;
  }

  get responsive() {
    return this.getAttribute('responsive') !== 'false';
  }

  getResponsiveWaveHeight() {
    if (!this.responsive) {
      return this.waveHeight;
    }
    
    // Parse the base wave height to get a numeric value
    const baseHeight = parseFloat(this.waveHeight);
    const unit = this.waveHeight.replace(/[0-9.]/g, '');
    
    return {
      base: this.waveHeight,
      mobile: `${Math.max(baseHeight * 0.6, 40)}${unit}`, // 60% of base, minimum 40px
      tablet: `${Math.max(baseHeight * 0.8, 60)}${unit}`, // 80% of base, minimum 60px
      desktop: this.waveHeight
    };
  }

  getAnimationDurations() {
    const baseSpeed = this.speed;
    const count = this.waveCount;
    
    // Generate more random durations with variation
    const durations = [];
    for (let i = 0; i < count; i++) {
      const baseDuration = 15 + i * 8; // 15s, 23s, 31s, 39s base
      const randomVariation = (Math.random() - 0.5) * 10; // ±5s random variation
      const finalDuration = (baseDuration + randomVariation) / baseSpeed;
      durations.push(Math.max(10 / baseSpeed, finalDuration)); // Minimum 10s
    }
    return durations;
  }

  getAnimationDelays() {
    const count = this.waveCount;
    const delays = [];
    
    // Generate truly random delays for each wave
    for (let i = 0; i < count; i++) {
      const randomDelay = -(Math.random() * 30); // Random delay between 0 and -30s
      delays.push(randomDelay);
    }
    return delays;
  }

  getOpacities() {
    const [minOpacity, maxOpacity] = this.opacityRange;
    const count = this.waveCount;
    const step = (maxOpacity - minOpacity) / (count - 1);
    
    const opacities = [];
    for (let i = 0; i < count; i++) {
      opacities.push(minOpacity + (step * i));
    }
    return opacities;
  }

  getEasing() {
    const styles = {
      'smooth': 'cubic-bezier(.4,0,.2,1)',
      'linear': 'linear',
      'ease-in-out': 'ease-in-out',
      'bouncy': 'cubic-bezier(.68,-0.55,.265,1.55)',
      'gentle': 'cubic-bezier(.25,.46,.45,.94)'
    };
    return styles[this.animationStyle as keyof typeof styles] || styles.smooth;
  }

  createWaveSection(isBottom = false) {
    const durations = this.getAnimationDurations();
    const delays = this.getAnimationDelays();
    const opacities = this.getOpacities();
    const transformRotation = isBottom ? 'transform: rotate(180deg);' : '';

    const waveElements = Array.from({ length: this.waveCount }, (_, i) => {
      const randomX = 48 + (Math.random() - 0.5) * 20;
      const randomY = i * 2 + (Math.random() - 0.5) * 4;
      return `<use xlink:href="#gentle-wave" x="${randomX}" y="${randomY}" />`;
    }).join('');

    const waveStyles = Array.from({ length: this.waveCount }, (_, i) => {
      const animationName = `wave-animation-${(i % 4) + 1}`;
      const sectionClass = isBottom ? 'bottom-waves' : 'top-waves';
      return `
        .${sectionClass} .parallax use:nth-child(${i + 1}) {
          fill: ${this.waveColor};
          opacity: ${opacities[i]};
          animation: ${animationName} ${durations[i]}s ${this.getEasing()} infinite;
          animation-delay: ${delays[i]}s;
        }
      `;
    }).join('');

    return {
      html: `
        <div class="wave-section ${isBottom ? 'bottom-waves' : 'top-waves'}">
          <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28" preserveAspectRatio="none" style="${transformRotation}">
            <defs>
              <path id="gentle-wave" d="M-320 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-704z" />
            </defs>
            <g class="parallax">
              ${waveElements}
            </g>
          </svg>
        </div>
      `,
      styles: waveStyles
    };
  }

  render() {
    const position = this.position;
    let topWaves = { html: '', styles: '' };
    let bottomWaves = { html: '', styles: '' };
    let contentSection = '';

    // Create wave sections based on position
    if (position === 'top' || position === 'both') {
      topWaves = this.createWaveSection(false);
    }
    
    if (position === 'bottom' || position === 'both') {
      bottomWaves = this.createWaveSection(true);
    }

    // Create content section for 'both' position
    if (position === 'both') {
      contentSection = `
        <div class="content-section">
          <slot></slot>
        </div>
      `;
    }

    // For backwards compatibility, if position is 'top' or 'bottom', use full height
    const containerHeight = position === 'both' ? 'auto' : this.height;
    
    // Get responsive wave heights
    const responsiveHeights = this.getResponsiveWaveHeight();

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .container {
          background: ${this.backgroundColor};
          width: 100%;
          height: ${containerHeight};
          min-height: ${position === 'both' ? 'auto' : '100px'};
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .wave-section {
          width: 100%;
          height: ${typeof responsiveHeights === 'string' ? responsiveHeights : responsiveHeights.desktop};
          overflow: hidden;
          flex-shrink: 0;
        }

        .content-section {
          flex: 1;
          padding: ${this.contentPadding};
          background: ${this.contentBackgroundColor};
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 0;
        }

        .waves {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          transform: translateZ(0);
          will-change: transform;
        }

        @keyframes wave-animation-1 {
          0% { transform: translateX(-90px) translateZ(0); }
          100% { transform: translateX(85px) translateZ(0); }
        }
        @keyframes wave-animation-2 {
          0% { transform: translateX(-85px) translateZ(0); }
          100% { transform: translateX(90px) translateZ(0); }
        }
        @keyframes wave-animation-3 {
          0% { transform: translateX(-100px) translateZ(0); }
          100% { transform: translateX(75px) translateZ(0); }
        }
        @keyframes wave-animation-4 {
          0% { transform: translateX(-80px) translateZ(0); }
          100% { transform: translateX(95px) translateZ(0); }
        }

        .parallax use {
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        ${this.responsive && typeof responsiveHeights === 'object' ? `
          /* Mobile styles */
          @media (max-width: 768px) {
            .wave-section {
              height: ${responsiveHeights.mobile};
            }
            
            .content-section {
              padding: ${this.contentPadding.replace(/(\d+)/g, (match) => Math.max(parseInt(match) * 0.7, 10).toString())};
            }
          }
          
          /* Tablet styles */
          @media (min-width: 769px) and (max-width: 1024px) {
            .wave-section {
              height: ${responsiveHeights.tablet};
            }
          }
          
          /* Small mobile styles */
          @media (max-width: 480px) {
            .wave-section {
              height: ${responsiveHeights.mobile};
            }
            
            .content-section {
              padding: ${this.contentPadding.replace(/(\d+)/g, (match) => Math.max(parseInt(match) * 0.5, 8).toString())};
            }
          }
        ` : ''}

        ${topWaves.styles}
        ${bottomWaves.styles}
      </style>
      
      <div class="container">
        ${topWaves.html}
        ${contentSection}
        ${bottomWaves.html}
      </div>
    `;
  }
}

// Register the custom element
customElements.define('animated-waves', AnimatedWaves);
