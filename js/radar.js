/**
 * Radar
 *
 * Class to generate Layout for Radar diagram
 */
export class Radar {
  constructor(options, { elements, rings, segments }) {
    this.rings = rings;
    this.segments = segments;
    this.elements = elements;

    // Extend options
    const defaultOptions = {
      totalAngle: Math.PI * 2,
      baseDimension: 1000,
      padding: 20,
      minPlotRadius: 120,
    };

    this.options = { ...defaultOptions, ...options };
    this.maxPlotRadius = this.options.baseDimension / 2 - this.options.padding;

    // Calculate metadata
    this.metaData = this.getMetaData();

    // Calculate Axes placement
    this.segmentAxes = this.getSegmentAxes();
    this.ringAxes = this.getRingAxes();

    // Calculate dot placement
    this.dots = this.getDots();
  }

  getSegmentAxes() {
    return this.segments.map((seg, idx) => {
      // starting angle
      const i = (idx * this.options.totalAngle) / this.segments.length;
      // upper extreme of axis
      const upperCoord = this.polarToCartesian(this.maxPlotRadius, i);
      const j = ((idx + 1) * this.options.totalAngle) / this.segments.length;
      const upperCoordJ = this.polarToCartesian(this.maxPlotRadius, j);
      return {
        ...seg,
        i,
        j,
        axis: {
          x1: this.options.baseDimension / 2,
          y1: this.options.baseDimension / 2,
          x2: upperCoord.x,
          y2: upperCoord.y,
          labelPath: `M ${upperCoordJ.x},${upperCoordJ.y} A${this.maxPlotRadius},${this.maxPlotRadius} 0 0,1 ${upperCoord.x},${upperCoord.y}`,
        },
      };
    });
  }

  getRingAxes() {
    return this.rings.map((ring, idx) => {
      // start
      const i =
        this.options.minPlotRadius +
        (idx * (this.maxPlotRadius - this.options.minPlotRadius)) /
          this.rings.length;
      const j =
        this.options.minPlotRadius +
        ((idx + 1) * (this.maxPlotRadius - this.options.minPlotRadius)) /
          this.rings.length;
      return {
        ...ring,
        i,
        j,
      };
    });
  }

  getMetaData() {
    const segmentCounts = {};
    const ringCounts = {};
    const countMatrix = {};
    this.elements.forEach((element) => {
      segmentCounts[element.segment] = segmentCounts[element.segment]
        ? segmentCounts[element.segment] + 1
        : 1;
      ringCounts[element.ring] = ringCounts[element.ring]
        ? ringCounts[element.ring] + 1
        : 1;
      const slice = `${element.segment}.${element.ring}`;
      countMatrix[slice] = countMatrix[slice] ? countMatrix[slice] + 1 : 1;
    });
    return { segmentCounts, ringCounts, countMatrix };
  }

  getDots() {
    const idx = {};
    return this.elements.map((el) => {
      const ring = this.ringAxes.filter((r) => r.slug === el.ring)[0];
      const segment = this.segmentAxes.filter((s) => s.slug === el.segment)[0];
      const slice = `${el.segment}.${el.ring}`;
      idx[slice] = idx[slice] ? idx[slice] + 1 : 1;
      const radialCoord = this.layoutDot(
        ring,
        segment,
        idx[slice],
        this.metaData.countMatrix[slice]
      );

      const coords = this.polarToCartesian(radialCoord.r, radialCoord.angle);
      return { ...el, ...coords, r: 5, color: segment.color };
    });
  }

  /**
   *
   * @param {Ring} ring Ring Entry
   * @param {Segment} segment Segment Entry
   * @param {Number} idx Dot's index in the slice / cell
   * @param {Number} total Total dots in the slice / cell
   * @returns
   */
  layoutDot(ring, segment, idx, total) {
    const elemPerRow = Math.floor(ring.i / 30) + 2;
    // relIdx -> relative index
    // rel index repeats from 1 for every row after max per row reaches
    const relIdx = ((idx - 1) % elemPerRow) + 1;
    const relIdxRing = Math.ceil(idx / elemPerRow);

    // Number of rows in the cell (Slice)
    const ringRows = Math.ceil(total / elemPerRow);

    // relTotal total per row  == elemPerRow or total if total below max elemPerRow
    const relTotal = Math.min(total + 1, elemPerRow + 1);

    // Origin------Bound.i------idx1--------idx2--------Bound.j [Section formula]
    return {
      r: ((ring.j - ring.i) * relIdxRing) / (ringRows + 1) + ring.i,
      angle: ((segment.j - segment.i) * relIdx) / relTotal + segment.i,
    };
  }

  cartesianToPolar(x, y) {
    return {
      r: Math.sqrt(Math.pow(x, 2), Math.pow(y, 2)),
      angle: Math.atan(y / x),
    };
  }

  /**
   * Polar to Cartesian conversion
   * @param {Number} r Radius / Distance from origin
   * @param {Number} angle Angle in radian
   * @returns
   */
  polarToCartesian(r, angle) {
    // translate origin to center -> (+ this.options.baseDimension / 2)
    //  y -ve because css/svg y is inverse of normal geometry
    return {
      x: r * Math.cos(angle) + this.options.baseDimension / 2,
      y: -r * Math.sin(angle) + this.options.baseDimension / 2,
    };
  }
}
