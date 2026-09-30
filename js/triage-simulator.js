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
    { id: "cad", name: "Obstructive CAD", icon: "cadYes.png" },
    { id: "nocad", name: "No obstructive CAD", icon: "cadNo.png" },
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
  const W = 960;
  const H = 430;
  // The flow band is deliberately shorter than the drawing so ribbons stay
  // slim and there is room for labels under the bottom row of icons.
  const M = { top: 70, right: 150, bottom: 130, left: 50 };
  const R = 34; // node icon radius

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

  const sankey = d3
    .sankey()
    .nodeId((d) => d.id)
    .nodeWidth(10)
    .nodePadding(90)
    .nodeAlign(d3.sankeyJustify)
    .nodeSort(null)
    .linkSort(null)
    .extent([
      [M.left, M.top],
      [W - M.right, H - M.bottom],
    ]);

  const LINK_KIND = {
    "chest-test": { kind: "flow", label: () => "Everyone is tested" },
    "test-cath": { kind: "flow", label: (r) => `Positive test: ${fmt(r.cath)} sent to the cath lab` },
    "test-home": { kind: "flow", label: (r) => `Negative test: ${fmt(r.home)} discharged` },
    "cath-cad": { kind: "good", label: (r) => `True positives: ${fmt(r.TP)} had disease and were caught` },
    "cath-nocad": { kind: "bad", label: (r) => `False positives: ${fmt(r.FP)} had an unnecessary catheterization` },
    "home-nocad": { kind: "good", label: (r) => `True negatives: ${fmt(r.TN)} correctly sent home` },
    "home-cad": { kind: "bad", label: (r) => `False negatives: ${fmt(r.FN)} sent home with disease` },
  };

  const EPS = 1e-6;

  function buildGraph(r) {
    const links = [
      { source: "chest", target: "test", value: r.cath + r.home },
      { source: "test", target: "cath", value: r.cath },
      { source: "test", target: "home", value: r.home },
      { source: "cath", target: "cad", value: r.TP },
      { source: "cath", target: "nocad", value: r.FP },
      { source: "home", target: "cad", value: r.FN },
      { source: "home", target: "nocad", value: r.TN },
    ].map((l) => ({ ...l, real: l.value, value: Math.max(l.value, EPS), key: l.source + "-" + l.target }));
    return { nodes: NODES.map((d) => ({ ...d })), links };
  }

  const t = () => d3.transition().duration(450).ease(d3.easeCubicOut);

  function render(r) {
    const graph = sankey(buildGraph(r));

    const link = gLinks.selectAll("path").data(graph.links, (d) => d.key);
    link
      .enter()
      .append("path")
      .attr("class", (d) => "link " + LINK_KIND[d.key].kind)
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", (d) => Math.max(0.5, d.width))
      .each(function () {
        d3.select(this).append("title");
      })
      .merge(link)
      .call((sel) => sel.select("title").text((d) => LINK_KIND[d.key].label(r)))
      .transition(t())
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", (d) => (d.real <= 0 ? 0 : Math.max(0.75, d.width)));

    const node = gNodes.selectAll("g.node").data(graph.nodes, (d) => d.id);
    const enter = node.enter().append("g").attr("class", "node");

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
      .attr("x", -(R - 8))
      .attr("y", -(R - 8))
      .attr("width", 2 * (R - 8))
      .attr("height", 2 * (R - 8))
      .attr("clip-path", (d) => `url(#clip-${d.id})`);
    enter
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("y", R + 18)
      .text((d) => d.name);
    enter.append("text").attr("class", "count").attr("text-anchor", "middle").attr("y", R + 36);
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
