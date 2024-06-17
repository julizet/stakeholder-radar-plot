import { elements } from './public/dots.js';
import { rings } from './public/rings.js';
import { segments } from './public/segments.js';
import { Radar } from './js/radar.js';
var xmlns = 'http://www.w3.org/2000/svg';

const options = {
  totalAngle: Math.PI,
  padding: 0,
  minPlotRadius: 150,
};

const radar = new Radar(options, { elements, rings, segments });
const radarDiagram = document.getElementById('radar-plot');
const radarContainer = document.getElementById('radar-container');

if (radar.options.totalAngle === Math.PI) {
  radarDiagram.setAttribute('viewBox', '-50 -50 1100 550');
  radarContainer.style.height = '50vw';
} else if (radar.options.totalAngle === Math.PI / 2) {
  radarDiagram.setAttribute('viewBox', '500 -50 550 550');
  radarContainer.style.height = '95vw';
}

radar.ringAxes.forEach((segAxis) => {
  const axis = document.createElementNS(xmlns, 'circle');
  axis.setAttribute('cx', 500);
  axis.setAttribute('cy', 500);
  axis.setAttribute('r', segAxis.j);
  axis.setAttribute('stroke', '#aaa');
  axis.setAttribute('stroke-width', 1);
  axis.setAttribute('fill', '#fff');
  axis.setAttribute('fill-opacity', 0.3);
  radarDiagram.appendChild(axis);
});

radar.segmentAxes.forEach((segAxis) => {
  const axis = document.createElementNS(xmlns, 'line');
  axis.setAttribute('x1', segAxis.axis.x1);
  axis.setAttribute('x2', segAxis.axis.x2);
  axis.setAttribute('y1', segAxis.axis.y1);
  axis.setAttribute('y2', segAxis.axis.y2);
  axis.setAttribute('stroke', '#aaa');
  axis.setAttribute('stroke-width', 1);

  const labelPath = document.createElementNS(xmlns, 'path');
  labelPath.id = 'label-path-' + segAxis.slug;
  labelPath.setAttribute('d', segAxis.axis.labelPath);
  labelPath.setAttribute('fill', 'none');
  labelPath.setAttribute('stroke', segAxis.color);
  labelPath.setAttribute('stroke-width', 30);

  const label = document.createElementNS(xmlns, 'text');
  const labelTextPath = document.createElementNS(xmlns, 'textPath');
  labelTextPath.setAttribute('href', `#label-path-${segAxis.slug}`);
  labelTextPath.innerHTML = segAxis.label;
  labelTextPath.setAttribute('font-weight', '300');
  labelTextPath.setAttribute(
    'font-size',
    `${radar.options.totalAngle / 4 + 0.2}em`
  );
  labelTextPath.setAttribute('font-family', 'Sans-serif');

  labelTextPath.setAttribute('startOffset', '50%');
  labelTextPath.setAttribute('text-anchor', 'middle');
  label.appendChild(labelTextPath);
  radarDiagram.appendChild(labelPath);
  radarDiagram.appendChild(label);
  radarDiagram.appendChild(axis);
});

console.log(radar.dots);

// collect unique tags
const uniqueTags = new Set();
elements.forEach(dot => dot.tags.forEach(tag => uniqueTags.add(tag)));

// display in tag-container
const tagContainer = document.querySelector('.tag-container');
uniqueTags.forEach(tag => {
  const tagElement = document.createElement('span');
  tagElement.classList.add('tag');
  tagElement.textContent = tag;
  tagElement.addEventListener('click', () => filterDotsByTag(tag));
  tagContainer.appendChild(tagElement);
});

function filterDotsByTag(tag) {
  const dots = document.querySelectorAll('.dot-circle');
  dots.forEach(dot => {
    const dotTags = dot.dataset.tags.split(',');
    dot.style.opacity = dotTags.includes(tag) ? 1 : 0.2;
    if (dotTags.includes(tag)) {
      dot.classList.add('highlighted');
    } else {
      dot.classList.remove('highlighted');
    }
  });
}

function resetFilter() {
  const dots = document.querySelectorAll('.dot-circle');
  dots.forEach(dot => {
    dot.style.opacity = 1;
  });
}

document.addEventListener('click', (event) => {
  if (!event.target.classList.contains('tag')) {
    resetFilter();
  }
});

radar.dots.forEach((dot) => {
  const dotEl = document.createElementNS(xmlns, 'g');
  dotEl.setAttribute('style', `transform: translate(${dot.x}px, ${dot.y}px)`);

  radarDiagram.appendChild(dotEl);
  const circle = document.createElementNS(xmlns, 'circle');
  circle.setAttribute('r', dot.r * 2);
  circle.setAttribute('stroke', '#aaa');
  circle.setAttribute('stroke-width', 1);
  circle.setAttribute('fill', dot.color);
  circle.classList.add('dot-circle'); // Add a unique class to dots
  circle.dataset.tags = dot.tags.join(',');

  const label = document.createElementNS(xmlns, 'text');
  label.innerHTML = dot.label.substr(0, 1);
  label.setAttribute('font-size', '.5em');
  label.setAttribute('font-family', 'Sans-serif');

  label.style.fill = '#fff';
  label.style.transform = `translate(-3px, 3px)`;

  dotEl.appendChild(circle);
  dotEl.appendChild(label);

  let tooltip = document.getElementById('tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = `s<strong>${dot.label}</strong><br><br>`;

  // Add hover effect
  circle.addEventListener('mouseenter', () => {
    tooltip.style.display = 'block';
    tooltip.innerHTML = dot.label;
    circle.classList.add('hovered');
  });

  circle.addEventListener('mousemove', (event) => {
    tooltip.style.left = event.pageX + 20 + 'px';
    tooltip.style.top = event.pageY + 20 + 'px';
  });
  

  circle.addEventListener('mouseleave', () => {
    circle.classList.remove('hovered');
  });

  dotEl.addEventListener('click', () => {
    // Remove focus from any previously focused circle
    const previouslyFocused = document.querySelector('circle.focused');
    if (previouslyFocused) {
      previouslyFocused.classList.remove('focused');
    }
    circle.classList.add('focused');

    let infobox = document.getElementById('infobox');
    if (!infobox) {
      infobox = document.createElement('div');
      infobox.id = 'infobox';
      document.body.appendChild(infobox);
    }
    
    const tagsHtml = dot.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ');

    infobox.innerHTML = `
    <strong>${dot.label}</strong><br><br>
    <div class="infobox-p">
    <a href="${dot.website}" target="_blank">${dot.website}</a><br><br>
    ${tagsHtml}
    </div>
  `;
    infobox.style.display = 'block';
  });
});

