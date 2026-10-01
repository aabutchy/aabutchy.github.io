// Chest-pain triage simulator.
// A cohort of patients with chest pain takes one diagnostic test. The test's
// sensitivity and specificity, together with disease prevalence, decide how
// many go to the cath lab versus home, and how many of those decisions are
// wrong. Rendered as a Sankey diagram with d3 + d3-sankey.

(function () {
  "use strict";

  const ICON = "../img/triage/";
  const NODES = [
    { id: "chest", name: "Chest pain", icon: "ChestPain.png" },
    { id: "test", name: "Diagnostic test", icon: "StrECG.png" },
    { id: "cath", name: "Cath lab", icon: "Cath.png" },
    { id: "home", name: "Discharged", icon: "discharge.png" },
    { id: "cad", name: "Obstructive CAD", icon: "cadYes.png", status: "sick" },
    { id: "nocad", name: "No obstructive CAD", icon: "cadNo.png", status: "well" },
  ];

  const inputs = {
    n: document.getElementById("inN"),
    prev: document.getElementById("inPrev"),
    sens: document.getElementById("inSens"),
    spec: document.getElementById("inSpec"),
  };
  const outputs = {
    prev: document.getElementById("outPrev"),
    sens: document.getElementById("outSens"),
    spec: document.getElementById("outSpec"),
  };

  function readParams() {
    return {
      n: +inputs.n.value,
      prev: +inputs.prev.value / 100,
      sens: +inputs.sens.value / 100,
      spec: +inputs.spec.value / 100,
    };
  }

  // Expected counts (not rounded) so the diagram always balances.
  function simulate(p) {
    const sick = p.n * p.prev;
    const well = p.n - sick;
    const TP = sick * p.sens;
    const FN = sick - TP;
    const TN = well * p.spec;
    const FP = well - TN;
    return { TP, FN, TN, FP, cath: TP + FP, home: TN + FN, sick, well };
  }

  function fmt(x) {
    if (x >= 100) return d3.format(",.0f")(x);
    if (x >= 10) return d3.format(".1f")(x).replace(/\.0$/, "");
    return d3.format(".1f")(x).replace(/\.0$/, "");
  }

  function pct(x) {
    return isFinite(x) ? d3.format(".0%")(x) : "n/a";
  }

  // ---- Sankey -------------------------------------------------------------
  // Every ribbon is split by what is actually true about the patient: red for
  // obstructive CAD (sick), green for no obstructive CAD (healthy). A perfect
  // test would send all of the red up to the cath lab and all of the green
  // home, so any green reaching the cath lab or red going home is an error.
  const W = 960;
  const H = 440;
  const R = 50; // node icon radius
  const FLOW = 100; // thickness, in px, of a ribbon carrying the whole cohort
  const PAD = 150; // vertical gap between stacked nodes; leaves room for icon + label
  const M = { top: R + 22, right: 90, bottom: 2 * R + 18, left: 70 };

  const svg = d3
    .select("#sankey")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("role", "img")
    .attr("aria-labelledby", "sankeyTitle");
  svg.append("title").attr("id", "sankeyTitle").text("Patient flow through the triage pathway");

  const gLinks = svg.append("g").attr("class", "links").attr("fill", "none");
  const gNodes = svg.append("g").attr("class", "nodes");
  const defs = svg.append("defs");

  // Fix the flow band to FLOW + PAD so ribbon thickness does not depend on
  // how many nodes share a column.
  const sankey = d3
    .sankey()
    .nodeId((d) => d.id)
    .nodeWidth(10)
    .nodePadding(PAD)
    .nodeAlign(d3.sankeyJustify)
    .nodeSort(null)
    .linkSort(null)
    .extent([
      [M.left, M.top],
      [W - M.right, M.top + FLOW + PAD],
    ]);

  const LINKS = [
    { key: "chest-test-sick", source: "chest", target: "test", status: "sick", value: (r) => r.sick, label: (r) => `${fmt(r.sick)} patients with obstructive CAD are tested` },
    { key: "chest-test-well", source: "chest", target: "test", status: "well", value: (r) => r.well, label: (r) => `${fmt(r.well)} patients without obstructive CAD are tested` },
    { key: "test-cath-sick", source: "test", target: "cath", status: "sick", value: (r) => r.TP, label: (r) => `Positive test, has CAD: ${fmt(r.TP)} sent to the cath lab (true positives)` },
    { key: "test-cath-well", source: "test", target: "cath", status: "well", value: (r) => r.FP, label: (r) => `Positive test, no CAD: ${fmt(r.FP)} sent to the cath lab (false positives)` },
    { key: "test-home-sick", source: "test", target: "home", status: "sick", value: (r) => r.FN, label: (r) => `Negative test, has CAD: ${fmt(r.FN)} discharged (false negatives)` },
    { key: "test-home-well", source: "test", target: "home", status: "well", value: (r) => r.TN, label: (r) => `Negative test, no CAD: ${fmt(r.TN)} discharged (true negatives)` },
    { key: "cath-cad", source: "cath", target: "cad", status: "sick", value: (r) => r.TP, label: (r) => `True positives: ${fmt(r.TP)} had disease and were caught` },
    { key: "cath-nocad", source: "cath", target: "nocad", status: "well", value: (r) => r.FP, label: (r) => `False positives: ${fmt(r.FP)} had an unnecessary catheterization` },
    { key: "home-cad", source: "home", target: "cad", status: "sick", value: (r) => r.FN, label: (r) => `False negatives: ${fmt(r.FN)} sent home with disease` },
    { key: "home-nocad", source: "home", target: "nocad", status: "well", value: (r) => r.TN, label: (r) => `True negatives: ${fmt(r.TN)} correctly sent home` },
  ];
  const LINK_BY_KEY = Object.fromEntries(LINKS.map((l) => [l.key, l]));

  const EPS = 1e-6;

  function buildGraph(r) {
    const links = LINKS.map((l) => {
      const real = l.value(r);
      return { key: l.key, source: l.source, target: l.target, real, value: Math.max(real, EPS) };
    });
    return { nodes: NODES.map((d) => ({ ...d })), links };
  }

  const t = () => d3.transition().duration(450).ease(d3.easeCubicOut);

  function render(r) {
    const graph = sankey(buildGraph(r));

    const link = gLinks.selectAll("path").data(graph.links, (d) => d.key);
    link
      .enter()
      .append("path")
      .attr("class", (d) => "link " + LINK_BY_KEY[d.key].status)
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", (d) => Math.max(0.5, d.width))
      .each(function () {
        d3.select(this).append("title");
      })
      .merge(link)
      .call((sel) => sel.select("title").text((d) => LINK_BY_KEY[d.key].label(r)))
      .transition(t())
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", (d) => (d.real <= 0 ? 0 : Math.max(0.75, d.width)));

    const node = gNodes.selectAll("g.node").data(graph.nodes, (d) => d.id);
    const enter = node
      .enter()
      .append("g")
      .attr("class", (d) => "node" + (d.status ? " " + d.status : ""));

    enter.each(function (d) {
      defs
        .append("clipPath")
        .attr("id", "clip-" + d.id)
        .append("circle")
        .attr("r", R - 3);
    });
    enter.append("circle").attr("class", "halo").attr("r", R);
    enter
      .append("image")
      .attr("href", (d) => ICON + d.icon)
      .attr("x", -(R - 10))
      .attr("y", -(R - 10))
      .attr("width", 2 * (R - 10))
      .attr("height", 2 * (R - 10))
      .attr("clip-path", (d) => `url(#clip-${d.id})`);
    enter
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("y", R + 20)
      .text((d) => d.name);
    enter.append("text").attr("class", "count").attr("text-anchor", "middle").attr("y", R + 38);
    enter.append("title");

    const all = enter.merge(node);
    all
      .transition(t())
      .attr("transform", (d) => `translate(${(d.x0 + d.x1) / 2},${(d.y0 + d.y1) / 2})`);
    all.select("text.count").text((d) => fmt(nodeValue(d, r)) + (d.id === "chest" ? " patients" : ""));
    all.select("title").text((d) => `${d.name}: ${fmt(nodeValue(d, r))} patients`);
  }

  function nodeValue(d, r) {
    switch (d.id) {
      case "chest":
      case "test":
        return r.cath + r.home;
      case "cath":
        return r.cath;
      case "home":
        return r.home;
      case "cad":
        return r.sick;
      case "nocad":
        return r.well;
    }
    return 0;
  }

  // ---- Summary tiles -------------------------------------------------------
  const tiles = {
    cath: document.getElementById("tCath"),
    fp: document.getElementById("tFP"),
    home: document.getElementById("tHome"),
    fn: document.getElementById("tFN"),
    ppv: document.getElementById("tPPV"),
    npv: document.getElementById("tNPV"),
    sentence: document.getElementById("tSentence"),
  };

  function renderSummary(p, r) {
    tiles.cath.textContent = fmt(r.cath);
    tiles.fp.textContent = fmt(r.FP);
    tiles.home.textContent = fmt(r.home);
    tiles.fn.textContent = fmt(r.FN);
    tiles.ppv.textContent = pct(r.cath > 0 ? r.TP / r.cath : NaN);
    tiles.npv.textContent = pct(r.home > 0 ? r.TN / r.home : NaN);
    tiles.sentence.textContent =
      `With ${pct(p.prev)} prevalence, a test that is ${pct(p.sens)} sensitive and ${pct(p.spec)} specific ` +
      `sends ${fmt(r.cath)} of ${fmt(p.n)} patients to the cath lab, and ${fmt(r.FP)} of them ` +
      `(${pct(r.cath > 0 ? r.FP / r.cath : NaN)}) turn out not to have obstructive disease. ` +
      `Of the ${fmt(r.home)} sent home, ${fmt(r.FN)} actually have it.`;
  }

  function update() {
    const p = readParams();
    outputs.prev.textContent = Math.round(p.prev * 100) + "%";
    outputs.sens.textContent = Math.round(p.sens * 100) + "%";
    outputs.spec.textContent = Math.round(p.spec * 100) + "%";
    const r = simulate(p);
    render(r);
    renderSummary(p, r);
  }

  Object.values(inputs).forEach((el) => el.addEventListener("input", update));
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [prev, sens, spec] = btn.dataset.preset.split(",").map(Number);
      inputs.prev.value = prev;
      inputs.sens.value = sens;
      inputs.spec.value = spec;
      update();
    });
  });

  update();
  window.triageSimulator = { simulate, readParams };
})();
