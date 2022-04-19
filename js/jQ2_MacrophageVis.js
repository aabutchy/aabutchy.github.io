console.log("Successful Loading of jQ1_MacrophageVis");

const MARGIN = { LEFT: 100, RIGHT: 10, TOP: 30, BOTTOM: 100 };
const WIDTH = 900 - MARGIN.LEFT - MARGIN.RIGHT;
const HEIGHT = 600 - MARGIN.TOP - MARGIN.BOTTOM;

const svg = d3
  .select("#chart-area")
  .append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM);

const g = svg
  .append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);

// Scales
const x = d3.scaleLinear().range([0, WIDTH]).domain([0, 100]);
const y = d3.scaleLinear().range([HEIGHT, 0]).domain([0, 100]);

// Labels
const xLabel = g
  .append("text")
  .attr("y", HEIGHT + 50)
  .attr("x", WIDTH / 2)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .text("Relative Position");
const yLabel = g
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", MARGIN.LEFT / -2)
  .attr("x", HEIGHT / -2)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .text("Relative Position");

// X Axis
const xAxisCall = d3
  .axisBottom(x)
  .tickValues([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
g.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${HEIGHT})`)
  .call(xAxisCall);

// Y Axis
const yAxisCall = d3.axisLeft(y);
g.append("g").attr("class", "y axis").call(yAxisCall);
